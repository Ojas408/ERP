import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log(`Found ${tenants.length} tenants`);

  const standardMixDesigns = [
    {
      code: 'BOM-M20-STD',
      name: 'Standard M20 Structural Mix',
      gradeName: 'M20',
      targetSlump: '120-140 mm',
      density: 2400,
      items: [
        { materialName: 'OPC 53 Cement', materialCategory: 'Cementitious', standardQty: 300, unit: 'kg', wastagePercent: 1.0, standardRate: 6.5 },
        { materialName: 'Fly Ash (Class F)', materialCategory: 'Pozzolanic', standardQty: 70, unit: 'kg', wastagePercent: 1.0, standardRate: 2.2 },
        { materialName: '20mm Coarse Aggregate', materialCategory: 'Coarse Aggregate', standardQty: 700, unit: 'kg', wastagePercent: 1.5, standardRate: 0.85 },
        { materialName: '10mm Coarse Aggregate', materialCategory: 'Coarse Aggregate', standardQty: 450, unit: 'kg', wastagePercent: 1.5, standardRate: 0.88 },
        { materialName: 'Zone II River Sand', materialCategory: 'Fine Aggregate', standardQty: 760, unit: 'kg', wastagePercent: 2.0, standardRate: 0.95 },
        { materialName: 'Admixture (Superplasticizer)', materialCategory: 'Chemical Admixture', standardQty: 2.0, unit: 'L', wastagePercent: 0.5, standardRate: 65 },
        { materialName: 'Water', materialCategory: 'Water', standardQty: 165, unit: 'L', wastagePercent: 0, standardRate: 0.15 },
      ]
    },
    {
      code: 'BOM-M25-STD',
      name: 'Standard M25 Commercial Mix',
      gradeName: 'M25',
      targetSlump: '130-150 mm',
      density: 2420,
      items: [
        { materialName: 'OPC 53 Cement', materialCategory: 'Cementitious', standardQty: 340, unit: 'kg', wastagePercent: 1.0, standardRate: 6.5 },
        { materialName: 'Fly Ash (Class F)', materialCategory: 'Pozzolanic', standardQty: 80, unit: 'kg', wastagePercent: 1.0, standardRate: 2.2 },
        { materialName: '20mm Coarse Aggregate', materialCategory: 'Coarse Aggregate', standardQty: 680, unit: 'kg', wastagePercent: 1.5, standardRate: 0.85 },
        { materialName: '10mm Coarse Aggregate', materialCategory: 'Coarse Aggregate', standardQty: 450, unit: 'kg', wastagePercent: 1.5, standardRate: 0.88 },
        { materialName: 'Zone II River Sand', materialCategory: 'Fine Aggregate', standardQty: 740, unit: 'kg', wastagePercent: 2.0, standardRate: 0.95 },
        { materialName: 'Admixture (Superplasticizer)', materialCategory: 'Chemical Admixture', standardQty: 2.5, unit: 'L', wastagePercent: 0.5, standardRate: 65 },
        { materialName: 'Water', materialCategory: 'Water', standardQty: 160, unit: 'L', wastagePercent: 0, standardRate: 0.15 },
      ]
    },
    {
      code: 'BOM-M30-STD',
      name: 'High Strength M30 Column Mix',
      gradeName: 'M30',
      targetSlump: '140-160 mm',
      density: 2440,
      items: [
        { materialName: 'OPC 53 Cement', materialCategory: 'Cementitious', standardQty: 380, unit: 'kg', wastagePercent: 1.0, standardRate: 6.5 },
        { materialName: 'Fly Ash (Class F)', materialCategory: 'Pozzolanic', standardQty: 70, unit: 'kg', wastagePercent: 1.0, standardRate: 2.2 },
        { materialName: '20mm Coarse Aggregate', materialCategory: 'Coarse Aggregate', standardQty: 660, unit: 'kg', wastagePercent: 1.5, standardRate: 0.85 },
        { materialName: '10mm Coarse Aggregate', materialCategory: 'Coarse Aggregate', standardQty: 460, unit: 'kg', wastagePercent: 1.5, standardRate: 0.88 },
        { materialName: 'Zone II River Sand', materialCategory: 'Fine Aggregate', standardQty: 720, unit: 'kg', wastagePercent: 2.0, standardRate: 0.95 },
        { materialName: 'Admixture (Superplasticizer)', materialCategory: 'Chemical Admixture', standardQty: 3.0, unit: 'L', wastagePercent: 0.5, standardRate: 65 },
        { materialName: 'Water', materialCategory: 'Water', standardQty: 160, unit: 'L', wastagePercent: 0, standardRate: 0.15 },
      ]
    }
  ];

  for (const tenant of tenants) {
    const existing = await prisma.billOfMaterial.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
      console.log(`Tenant ${tenant.name} already has ${existing} BOMs. Skipping.`);
      continue;
    }

    console.log(`Seeding standard BOMs for tenant: ${tenant.name}`);
    for (const mix of standardMixDesigns) {
      const standardCostPerCuM = Math.round(
        mix.items.reduce((s, it) => s + (it.standardQty * (1 + it.wastagePercent / 100) * it.standardRate), 0) * 100
      ) / 100;

      await prisma.billOfMaterial.create({
        data: {
          code: mix.code,
          name: mix.name,
          gradeName: mix.gradeName,
          targetSlump: mix.targetSlump,
          density: mix.density,
          standardCostPerCuM,
          version: 1,
          status: 'approved',
          approvedBy: 'admin@example.com',
          approvedAt: new Date(),
          effectiveFrom: new Date(),
          tenantId: tenant.id,
          items: {
            create: mix.items.map(it => ({
              materialName: it.materialName,
              materialCategory: it.materialCategory,
              standardQty: it.standardQty,
              unit: it.unit,
              wastagePercent: it.wastagePercent,
              standardRate: it.standardRate,
              standardCost: Math.round(it.standardQty * (1 + it.wastagePercent / 100) * it.standardRate * 100) / 100,
              tenantId: tenant.id
            }))
          }
        }
      });
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
