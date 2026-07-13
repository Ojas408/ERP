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

  // Clear June 2026 production for this tenant so CuM denominator is exact
  const juneStart = new Date('2026-06-01T00:00:00.000Z');
  const julyStart = new Date('2026-07-01T00:00:00.000Z');

  console.log('Deleting old June 2026 overhead entries for this tenant only...');
  const deletedOh = await prisma.overheadEntry.deleteMany({
    where: { tenantId, date: { gte: juneStart, lt: julyStart } },
  });
  console.log(`  Removed ${deletedOh.count} overhead rows`);

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
    { description: 'Batching Plant (Main Unit)', quantity: 2, rate: 0, amount: 0, remarks: 'Company Owned Plant' },
    { description: 'Transit Mixers (TMs)', quantity: 14, rate: 141600, amount: 1982400, remarks: 'Rented TMs- Shared Resources, used interchangeably at both plants. Final cost amount not yet confirmed as breakdown deduction to be confirmed from the billing dept.' },
    { description: 'JCB', quantity: 1, rate: 155760, amount: 155760, remarks: 'JCB deployed at GDI Plant on Rental basis' },
    { description: 'Loader', quantity: 1, rate: 153400, amount: 153400, remarks: 'Loader deployed at KRH Plant on Rental basis' },
    { description: 'Concrete Pumps (with pump labour & tractor trolley)', quantity: 1, rate: 287000, amount: 287000, remarks: 'Pump deployed on Rental basis' },
    { description: 'Water Tanker', quantity: 0, rate: 0, amount: 0, remarks: 'Deployed for sprinkling water' },
    { description: 'Spares & Additional Equipement deployed', quantity: 0, rate: 0, amount: 0, remarks: 'No major overhead observed for plant maintenance in April' },
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
  const fuelRate = 95.48;
  const fuelLines = [
    { description: 'Diesel - TMs (Shared Resources, used interchangeably at both plants)', litres: 14310, amount: 1701262.64 },
    { description: 'Diesel - JCB', litres: 1400 },
    { description: 'Diesel - LOADER', litres: 1160 },
    { description: 'CONCRETE PUMP', litres: 888 },
    { description: ' TRACTOR (deployed for the movement of pump)', litres: 40 },
    { description: 'Diesel - DG', litres: 20 },
  ];
  for (const f of fuelLines) {
    const amount = f.amount || 0;
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
    { description: 'Cement', mt: 2227.651, rate: 6619.99, amount: 14747027.34349 },
    { description: '20mm Aggregate', mt: 4272.685, rate: 1344, amount: 5742488.64 },
    { description: '10mm Aggregate', mt: 4612.488, rate: 1307.25, amount: 6029674.938 },
    { description: 'Fine Aggregate', mt: 7667.022, rate: 1296.75, amount: 9942210.7785 },
    { description: 'Fly Ash', mt: 1135.809, rate: 1438.5, amount: 1633861.2465 },
    { description: 'Admixtures', mt: 13.028, rate: 119000, amount: 1550332 },
    { description: 'Water/Ice for concrete', mt: 0, rate: 0, amount: 0 },
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
    { description: 'Maintenance & Electrical Team', persons: 2, amount: 52000, details: 'Rohit, Pramod' },
    { description: 'Quality Team', persons: 9, amount: 288400, details: 'Reetesh, Manoj, Joginder, Sonu, Akash, Shubham, Golu' },
    { description: 'Batching Plant Operator', persons: 4, amount: 166000, details: 'Bhola, Jitin, Sangat, Lovekush, Sushant' },
    { description: 'Production Supervision Team', persons: 2, amount: 60000, details: 'Suraj, Rajesh' },
    { description: 'Helper / Unskilled Labour', persons: 0, amount: 270000, details: 'Deployed on part of the labour contractor' },
    { description: 'JCB & Loader Operator', persons: 0, amount: 0, details: 'Deployed on part of the vendor' },
    { description: 'Housekeeping / Office Staff', persons: 0, amount: 0, details: 'Not deployed' },
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
    amount: 218619,
    customData: {
      ...plantMeta,
      costPerCuM: 218619 / TOTAL_PRODUCTION_CUM,
      remarks: 'Plant electricity bill',
    },
  });

  // ——— 6. Maintenance & Misc ———
  const maint = [
    { description: 'General Maintenance & Repairs', amount: 15000 },
    { description: 'Calibration of Plant & Other Equipment', amount: 0 },
    { description: 'Compliance & External Tests etc.', amount: 0 },
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
