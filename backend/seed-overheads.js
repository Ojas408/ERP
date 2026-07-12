const { PrismaClient } = require('@prisma/client');
const XLSX = require('../frontend/node_modules/xlsx');

const prisma = new PrismaClient();
const tenantId = process.env.SEED_TENANT_ID || process.argv[2];
if (!tenantId) {
  console.error('Provide a tenant id via SEED_TENANT_ID env var or as the first CLI argument.');
  process.exit(1);
}

async function seedData(filePath, monthYearStr, plantName) {
  console.log(`Processing ${filePath} - ${plantName} - ${monthYearStr}`);
  const wb = XLSX.readFile(filePath);
  
  // Use the specific sheet or first sheet if missing
  const sheetName = wb.SheetNames.includes(plantName) ? plantName : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let currentCategory = '';
  const entries = [];
  
  // Date based on monthYearStr (e.g. MARCH 2026 -> 2026-03-01)
  const isApril = monthYearStr.toUpperCase().includes('APR');
  const date = isApril ? new Date('2026-04-01T00:00:00Z') : new Date('2026-03-01T00:00:00Z');

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstCol = String(row[0] || '').trim();

    // Check for category headers
    if (firstCol.includes('Machinery Overhead')) {
      currentCategory = 'Machinery';
      i++; // skip header row
      continue;
    } else if (firstCol.includes('Fuel and Lubricant Overheads') || firstCol.includes('Fuel & Lubricant Overheads')) {
      currentCategory = 'Fuel';
      i++;
      continue;
    } else if (firstCol.includes('Raw Material Overheads')) {
      currentCategory = 'Raw Material';
      i++;
      continue;
    } else if (firstCol.includes('Manpower Overhead')) {
      currentCategory = 'Manpower';
      i++;
      continue;
    } else if (firstCol.includes('Electricity and Power Overheads') || firstCol.includes('Electricity & Power Overheads')) {
      currentCategory = 'Electricity';
      i++;
      continue;
    } else if (firstCol.includes('Maintenance and Miscellaneous Overheads') || firstCol.includes('Maintenance & Miscellaneous Overheads')) {
      currentCategory = 'Maintenance';
      i++;
      continue;
    } else if (firstCol.includes('Overall Monthly Overheads Summary')) {
      currentCategory = 'Summary'; // we stop or skip
      continue;
    }

    if (!currentCategory || currentCategory === 'Summary') continue;
    
    // Skip subtotal rows
    if (firstCol.toLowerCase().startsWith('total')) continue;
    
    // Process based on category
    let description = firstCol;
    if (!description) continue; // empty row

    let quantity = null;
    let amount = 0;
    let customData = { plantName, monthYearStr };

    if (currentCategory === 'Machinery') {
      quantity = row[1] !== '' ? parseFloat(row[1]) : null;
      customData.rate = row[2];
      amount = parseFloat(row[3]) || 0;
      customData.remarks = row[4];
      if (row[5]) customData.remarks += ' ' + row[5]; // sometimes remarks are shifted
    } 
    else if (currentCategory === 'Fuel') {
      quantity = row[1] !== '' ? parseFloat(row[1]) : null; // Consumption Litres
      customData.totalProductionCuM = row[2];
      customData.avgFuelConsumption = row[3];
      customData.rate = row[4];
      amount = parseFloat(row[5]) || 0;
    }
    else if (currentCategory === 'Raw Material') {
      customData.rate = row[1]; // Avg Cost per MT
      quantity = row[2] !== '' ? parseFloat(row[2]) : null; // Monthly Quantity Consumed MT
      amount = parseFloat(row[3]) || 0;
      customData.costPerCuM = row[4];
      customData.remarks = row[5];
    }
    else if (currentCategory === 'Manpower') {
      quantity = row[2] !== '' ? parseFloat(row[2]) : null; // No. of Persons
      amount = parseFloat(row[3]) || 0;
      customData.personnelDetails = row[4];
      customData.costPerCuM = row[5];
    }
    else if (currentCategory === 'Electricity') {
      quantity = row[1] !== '' ? parseFloat(row[1]) : null; // Units Consumed
      customData.rate = row[2];
      amount = parseFloat(row[3]) || 0;
      customData.costPerCuM = row[4];
      customData.remarks = row[6] || row[5];
    }
    else if (currentCategory === 'Maintenance') {
      amount = parseFloat(row[3]) || 0;
      customData.costPerCuM = row[4];
      customData.remarks = row[5] || row[6];
    }

    if (amount > 0 || quantity > 0) {
      entries.push({
        tenantId,
        date,
        category: currentCategory,
        description,
        quantity,
        amount,
        customData
      });
    }
  }

  // Insert into DB
  console.log(`Prepared ${entries.length} entries for ${plantName}`);
  for (const entry of entries) {
    await prisma.overheadEntry.create({ data: entry });
  }
  console.log(`Inserted ${entries.length} entries for ${plantName}`);
}

async function main() {
  try {
    await seedData('../APR 2026.xlsx', 'APR 2026', 'Combined All Plant'); // Using default sheet
    await seedData('../March2026.xlsx', 'MARCH 2026', 'Combined All Plant');
    await seedData('../March2026.xlsx', 'MARCH 2026', 'KRH');
    await seedData('../March2026.xlsx', 'MARCH 2026', 'GDI PLANT');
    
    // Also create CustomColumn entries for the Overheads page so the dynamic columns show up
    const customCols = [
      { key: 'plantName', name: 'Plant Name', type: 'text' },
      { key: 'monthYearStr', name: 'Month/Year', type: 'text' },
      { key: 'rate', name: 'Rate / Avg Cost', type: 'text' },
      { key: 'remarks', name: 'Remarks', type: 'text' },
      { key: 'personnelDetails', name: 'Personnel Details', type: 'text' }
    ];

    for (const col of customCols) {
      // Check if exists
      const existing = await prisma.customColumn.findFirst({
        where: { tenantId, entity: 'Overhead', key: col.key }
      });
      if (!existing) {
        await prisma.customColumn.create({
          data: {
            tenantId,
            entity: 'Overhead',
            name: col.name,
            key: col.key,
            type: col.type
          }
        });
      }
    }
    console.log('Added custom column definitions for Overhead');

    console.log('Done seeding!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
