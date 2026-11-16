import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateElectricityEntry() {
  const updated = await prisma.overheadEntry.update({
    where: { id: '12c73f9f-24f0-4dc9-a33d-c124f260391d' },
    data: {
      quantity: 26737, // kWh units
      unit: 'kWh',
      customData: {
        remarks: 'Plant electricity bill - Main HT Meter',
        plantName: 'Jaypee Wish Town (KRH & GDI Combined)',
        billNumber: 'UPPCL-NOIDA-60921',
        provider: 'UPPCL Grid Power',
        powerType: 'Grid Power (HT Supply)',
        unitsKWh: 26737,
        costPerCuM: 22.89,
        monthYearStr: 'JUNE 2026',
        totalProductionCuM: 9549,
      }
    }
  });
  console.log('Updated electricity entry:', updated);
  await prisma.$disconnect();
}

updateElectricityEntry().catch(console.error);
