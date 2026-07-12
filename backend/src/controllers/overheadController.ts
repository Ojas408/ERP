import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getOverheadEntries = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const entries = await prisma.overheadEntry.findMany({
      where: { tenantId },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overhead entries' });
  }
};

export const getOverheadSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const [entries, expenses, employees] = await Promise.all([
      prisma.overheadEntry.findMany({ where: { tenantId } }),
      prisma.expense.findMany({ where: { tenantId } }),
      prisma.employee.findMany({ where: { tenantId, status: 'active' } }),
    ]);

    const categoryTotals: Record<string, { quantity: number; amount: number; unit: string }> = {};

    entries.forEach((entry) => {
      const cat = entry.category;
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { quantity: 0, amount: 0, unit: entry.unit || '' };
      }
      categoryTotals[cat].quantity += entry.quantity || 0;
      categoryTotals[cat].amount += entry.amount || 0;
      if (entry.unit) categoryTotals[cat].unit = entry.unit;
    });

    const expenseByCategory = expenses.reduce((acc: Record<string, number>, exp) => {
      const cat = exp.category || 'Miscellaneous';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {});

    const totalSalaries = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

    const summary = Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      unit: data.unit,
      amount: data.amount,
    }));

    const grandTotal =
      summary.reduce((s, i) => s + i.amount, 0) +
      Object.values(expenseByCategory).reduce((s, v) => s + v, 0) +
      totalSalaries;

    res.json({
      entries: summary,
      expenses: expenseByCategory,
      totalSalaries,
      grandTotal,
      transitMixture: categoryTotals['Transit Mixture'] || { quantity: 0, amount: 0, unit: 'cum' },
      slabs: categoryTotals['Slabs'] || { quantity: 0, amount: 0, unit: 'sqm' },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error building overhead summary' });
  }
};

export const createOverheadEntry = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    const entry = await prisma.overheadEntry.create({
      data: {
        tenantId,
        category: data.category,
        description: data.description || null,
        quantity: data.quantity !== undefined ? parseFloat(data.quantity) : null,
        unit: data.unit || null,
        amount: parseFloat(data.amount) || 0,
        siteId: data.siteId || null,
        date: data.date ? new Date(data.date) : new Date(),
        customData: data.customData || undefined,
      },
      include: { site: true },
    });
    await logActivity(userId, email, tenantId, 'CREATE', 'OverheadEntry', `Created overhead: ${entry.category}`);
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating overhead entry' });
  }
};

export const updateOverheadEntry = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  const { category, description, quantity, unit, amount, siteId, date, customData } = req.body;
  try {
    await prisma.overheadEntry.updateMany({
      where: { id, tenantId },
      data: {
        category,
        description,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        siteId,
        date: date ? new Date(date) : undefined,
        customData: customData !== undefined ? customData : undefined,
      },
    });
    const entry = await prisma.overheadEntry.findFirst({ where: { id, tenantId }, include: { site: true } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'OverheadEntry', `Updated overhead ID: ${id}`);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating overhead entry' });
  }
};

export const deleteOverheadEntry = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  try {
    await prisma.overheadEntry.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'OverheadEntry', `Deleted overhead ID: ${id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting overhead entry' });
  }
};
