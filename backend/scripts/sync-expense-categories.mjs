import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const tenants = await prisma.tenant.findMany();
  console.log(`Found ${tenants.length} tenants`);

  for (const t of tenants) {
    const existing = await prisma.expenseCategory.findMany({ where: { tenantId: t.id } });
    console.log(`Tenant ${t.name} (${t.id}) categories:`, existing.map(c => c.name));

    const standardCategories = [
      'Electricity & Power',
      'Fuel & Diesel',
      'Labour Wages',
      'Equipment Maintenance',
      'Material Purchase',
      'Office Supplies',
      'Miscellaneous',
    ];

    for (const catName of standardCategories) {
      const found = existing.find(e => e.name.toLowerCase() === catName.toLowerCase());
      if (!found) {
        await prisma.expenseCategory.create({
          data: {
            name: catName,
            tenantId: t.id
          }
        });
        console.log(`+ Added category "${catName}" for tenant ${t.name}`);
      }
    }
  }

  // Also check if June 2026 electricity bill exists in Expense table
  const site = await prisma.site.findFirst({ where: { name: { contains: 'Jaypee' } } });
  
  for (const t of tenants) {
    const expCount = await prisma.expense.count({ where: { tenantId: t.id } });
    console.log(`Tenant ${t.name} expenses count: ${expCount}`);
    if (expCount === 0) {
      // Seed initial June 2026 electricity expense so it is visible in Expense Tracker!
      const created = await prisma.expense.create({
        data: {
          date: new Date('2026-06-15T10:00:00Z'),
          category: 'Electricity & Power',
          amount: 218619,
          description: 'Plant electricity bill - Main HT Meter (26,737 kWh @ ₹8.18/kWh)',
          paymentStatus: 'paid',
          siteId: site?.id || null,
          allocationType: 'plant_specific',
          allocationMethod: 'actual_usage',
          invoiceNumber: 'UPPCL-NOIDA-60921',
          vendorName: 'UPPCL State Power Grid',
          tenantId: t.id
        }
      });
      console.log(`+ Created June 2026 Electricity & Power expense for tenant ${t.name}`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
