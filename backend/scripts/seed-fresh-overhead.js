/**
 * Wipe old overhead sample rows and seed exact June plant overhead report
 * (Jaypee Wish Town style) with correct units:
 *   Machinery → nos + ₹/month
 *   Fuel → Litres + ₹/Litre
 *   Raw Material → MT + ₹/MT
 *   Manpower → persons
 *   Electricity / Maintenance → ₹ totals
 *
 * Also seeds Total Production = 9549 CuM for the same month.
 *
 * Run: node scripts/seed-fresh-overhead.js
 * (from backend folder: node ../backend/scripts/... or cd backend && node scripts/seed-fresh-overhead.js)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REPORT_DATE = new Date('2026-06-15T10:00:00.000Z');
const TOTAL_PRODUCTION_CUM = 9549;

const UNIT = {
  Machinery: 'nos',
  Fuel: 'Litres',
  'Raw Material': 'MT',
  Manpower: 'persons',
  Electricity: 'kWh',
  Maintenance: 'ls',
};

async function main() {
  const tenant =
    (await prisma.tenant.findFirst({ where: { name: 'Default Company' } })) ||
    (await prisma.tenant.findFirst());

  if (!tenant) {
    throw new Error('No tenant found. Run full prisma seed first.');
  }

  const tenantId = tenant.id;
  const site =
    (await prisma.site.findFirst({ where: { tenantId } })) ||
    (await prisma.site.create({
      data: { name: 'Jaypee Wish Town (Combined KRH & GDI)', location: 'Noida', tenantId },
    }));

  console.log('Deleting ALL old overhead entries...');
  const deletedOh = await prisma.overheadEntry.deleteMany({});
  console.log(`  Removed ${deletedOh.count} overhead rows`);

  // Clear June 2026 production for this tenant so CuM denominator is exact
  const juneStart = new Date('2026-06-01T00:00:00.000Z');
  const julyStart = new Date('2026-07-01T00:00:00.000Z');
  const deletedProd = await prisma.production.deleteMany({
    where: { tenantId, date: { gte: juneStart, lt: julyStart } },
  });
  console.log(`  Removed ${deletedProd.count} June 2026 production rows`);

  console.log('Seeding production 9549 CuM (June 2026)...');
  await prisma.production.create({
    data: {
      tenantId,
      siteId: site.id,
      date: REPORT_DATE,
      amount: TOTAL_PRODUCTION_CUM,
      unit: 'cum',
      grade: 'Mixed Grades',
      productionType: 'Transit Mixture',
      towerName: 'Jaypee Wish Town — All Plants (KRH & GDI)',
      notes: 'Total monthly concrete production for overhead Cost/CuM denominator',
      isRejected: false,
    },
  });

  const plantMeta = {
    plantName: 'Jaypee Wish Town (KRH & GDI Combined)',
    monthYearStr: 'JUNE 2026',
    totalProductionCuM: TOTAL_PRODUCTION_CUM,
  };

  /** @type {Array<{category:string,description:string,quantity:number|null,unit:string,amount:number,customData:any}>} */
  const rows = [];

  // ——— 1. Machinery (Qty = nos of equipment, Rate = ₹/month) ———
  const machinery = [
    { description: 'Batching Plant (Main Unit)', quantity: 2, rate: 0, amount: 0, remarks: 'Company Owned' },
    { description: 'Transit Mixers (TMs)', quantity: 14, rate: 141660, amount: 1983240, remarks: null },
    { description: 'JCB', quantity: 1, rate: 155760, amount: 155760, remarks: null },
    { description: 'Loader', quantity: 1, rate: 152400, amount: 152400, remarks: null },
    { description: 'Concrete Pumps (with pump labour & tractor trolley)', quantity: 1, rate: 287400, amount: 287400, remarks: null },
    { description: 'Water Tanker & Spares', quantity: 0, rate: 0, amount: 0, remarks: null },
  ];
  for (const m of machinery) {
    rows.push({
      category: 'Machinery',
      description: m.description,
      quantity: m.quantity,
      unit: UNIT.Machinery,
      amount: m.amount,
      customData: { ...plantMeta, rate: m.rate, remarks: m.remarks, costPerCuM: m.amount / TOTAL_PRODUCTION_CUM },
    });
  }

  // ——— 2. Fuel (Qty = Litres consumed, Rate = ₹/Litre) ———
  const fuelRate = 95.85;
  const fuelLines = [
    { description: 'Diesel - TMs', litres: 14420 },
    { description: 'Diesel - JCB', litres: 1400 },
    { description: 'Diesel - LOADER', litres: 1100 },
    { description: 'Diesel - CONCRETE PUMP', litres: 800 },
    { description: 'Diesel - TRACTOR', litres: 40 },
    { description: 'Diesel - DG', litres: 20 },
  ];
  for (const f of fuelLines) {
    const amount = Math.round(f.litres * fuelRate * 100) / 100;
    rows.push({
      category: 'Fuel',
      description: f.description,
      quantity: f.litres,
      unit: UNIT.Fuel,
      amount,
      customData: {
        ...plantMeta,
        rate: fuelRate,
        avgFuelConsumption: Math.round((f.litres / TOTAL_PRODUCTION_CUM) * 10000) / 10000,
        costPerCuM: amount / TOTAL_PRODUCTION_CUM,
        remarks: '₹/Litre incl. plant diesel rate',
      },
    });
  }

  // ——— 3. Raw Material (Qty = MT, Rate = ₹/MT incl GST) ———
  const materials = [
    { description: 'Cement', mt: 2227.653, rate: 6610.0, amount: 14724816.3 },
    { description: '20 mm Aggregate', mt: 6272.685, rate: 1440.0, amount: 9032666.4 },
    { description: '10 mm Aggregate', mt: 4311.435, rate: 1517.25, amount: 6541524.8 },
    { description: 'Fine Aggregate', mt: 7867.832, rate: 1266.25, amount: 9962642.3 },
    { description: 'Fly Ash', mt: 1135.845, rate: 3120.5, amount: 3544304.3 },
    { description: 'Admixture', mt: 13.018, rate: 119000.0, amount: 1549142.0 },
    { description: 'Water / Ice', mt: 0, rate: 0, amount: 0 },
  ];
  for (const m of materials) {
    rows.push({
      category: 'Raw Material',
      description: m.description,
      quantity: m.mt,
      unit: UNIT['Raw Material'],
      amount: m.amount,
      customData: {
        ...plantMeta,
        rate: m.rate,
        costPerCuM: m.amount / TOTAL_PRODUCTION_CUM,
        remarks: 'Avg cost per MT (incl. GST)',
      },
    });
  }

  // ——— 4. Manpower (Qty = persons) ———
  const manpower = [
    { description: 'Maintenance & Electrical', persons: 2, amount: 51000, details: '2 persons' },
    { description: 'Quality Team', persons: 9, amount: 233485, details: '9 persons' },
    { description: 'Batching Plant Operator', persons: 4, amount: 100000, details: '4 persons' },
    { description: 'Production Supervision', persons: 2, amount: 60000, details: '2 persons' },
    { description: 'Helper / Unskilled Labour', persons: 11, amount: 370400, details: '11 persons' },
    { description: 'JCB & Loader Operator', persons: 2, amount: 0, details: 'Cost included in vendor' },
    { description: 'Housekeeping', persons: 1, amount: 0, details: '1 person' },
  ];
  for (const m of manpower) {
    rows.push({
      category: 'Manpower',
      description: m.description,
      quantity: m.persons,
      unit: UNIT.Manpower,
      amount: m.amount,
      customData: {
        ...plantMeta,
        personnelDetails: m.details,
        costPerCuM: m.amount / TOTAL_PRODUCTION_CUM,
        remarks: m.details,
      },
    });
  }

  // ——— 5. Electricity ———
  rows.push({
    category: 'Electricity',
    description: 'Power consumption for overall Plant Operations',
    quantity: null,
    unit: UNIT.Electricity,
    amount: 218419,
    customData: {
      ...plantMeta,
      costPerCuM: 218419 / TOTAL_PRODUCTION_CUM,
      remarks: 'Plant electricity bill',
    },
  });

  // ——— 6. Maintenance & Misc ———
  const maint = [
    { description: 'General Maintenance & Repair', amount: 15000 },
    { description: 'Calibration of Plant', amount: 0 },
    { description: 'Compliance / External Tests', amount: 0 },
  ];
  for (const m of maint) {
    rows.push({
      category: 'Maintenance',
      description: m.description,
      quantity: null,
      unit: UNIT.Maintenance,
      amount: m.amount,
      customData: {
        ...plantMeta,
        costPerCuM: m.amount / TOTAL_PRODUCTION_CUM,
        remarks: null,
      },
    });
  }

  console.log(`Inserting ${rows.length} overhead entries with correct units...`);
  for (const row of rows) {
    await prisma.overheadEntry.create({
      data: {
        tenantId,
        siteId: site.id,
        date: REPORT_DATE,
        category: row.category,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        amount: row.amount,
        customData: row.customData,
      },
    });
  }

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  console.log('Done.');
  console.log(`  Production CuM: ${TOTAL_PRODUCTION_CUM}`);
  console.log(`  Total overhead ₹: ${total.toLocaleString('en-IN')}`);
  console.log(`  All-inclusive ₹/CuM: ${(total / TOTAL_PRODUCTION_CUM).toFixed(2)}`);
  console.log('  Open report → Month: June, Year: 2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
