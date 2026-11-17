import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const expenses = await prisma.expense.findMany();
  console.log('Total Expenses count:', expenses.length);
  const elecExpenses = expenses.filter(e => {
    const c = (e.category || '').toLowerCase();
    const d = (e.description || '').toLowerCase();
    return c.includes('elect') || c.includes('power') || d.includes('elect') || d.includes('power');
  });
  console.log('Electricity expenses:', JSON.stringify(elecExpenses, null, 2));

  const overheads = await prisma.overheadEntry.findMany();
  console.log('Total OverheadEntry count:', overheads.length);
  const elecOverhead = overheads.filter(o => {
    const c = (o.category || '').toLowerCase();
    const sc = (o.subCategory || '').toLowerCase();
    return c.includes('elect') || sc.includes('elect') || c.includes('power');
  });
  console.log('Electricity overhead entries:', JSON.stringify(elecOverhead, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
