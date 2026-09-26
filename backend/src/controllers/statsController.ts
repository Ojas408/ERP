import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const formatChartDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const [
      totalProduction,
      activeVehicles,
      totalExpenses,
      inventoryCount,
      productions,
      consumptions,
      expenses,
      pendingChallans,
      inventoryItems,
      maintenanceDue,
      attendanceToday,
      openExpensesCount,
      maintenanceDueItems,
      pendingChallansItems,
      openExpensesItems,
    ] = await Promise.all([
      prisma.production.aggregate({ _sum: { amount: true }, where: { tenantId } }),
      prisma.vehicle.count({ where: { status: 'available', tenantId } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { tenantId } }),
      prisma.inventory.count({ where: { tenantId } }),
      prisma.production.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      prisma.consumption.findMany({ where: { tenantId } }),
      prisma.expense.findMany({ where: { tenantId } }),
      prisma.challan.count({ where: { status: { in: ['pending', 'draft', 'approved', 'dispatched'] }, tenantId } }),
      prisma.inventory.findMany({ where: { tenantId } }),
      prisma.maintenance.count({ where: { status: 'pending', tenantId } }),
      prisma.attendance.count({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          tenantId
        }
      }),
      prisma.expense.count({ where: { paymentStatus: 'pending', tenantId } }),
      prisma.maintenance.findMany({
        where: { status: 'pending', tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true },
      }),
      prisma.challan.findMany({
        where: { status: { in: ['pending', 'draft'] }, tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true },
      }),
      prisma.expense.findMany({
        where: { paymentStatus: 'pending', tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const lowStockItems = inventoryItems
      .filter(item => item.quantity < item.minThreshold)
      .map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        minThreshold: item.minThreshold,
        unit: item.unit,
        category: item.category,
      }));
    const lowStockMaterials = lowStockItems.length;

    // Build Centralized Notifications Array
    const stockNotifications = lowStockItems.map(item => ({
      id: `stock-${item.id}`,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${item.itemName} is below minimum level (${item.quantity} ${item.unit} remaining)`,
      module: 'inventory',
      severity: 'high',
      createdAt: new Date().toISOString(),
    }));

    const maintenanceNotifications = (maintenanceDueItems || []).map((m: any) => ({
      id: `maint-${m.id}`,
      type: 'maintenance',
      title: 'Maintenance Due',
      message: `Vehicle ${m.vehicle?.plateNumber || 'Fleet Unit'} requires ${m.type || 'repair'} service`,
      module: 'maintenance',
      severity: 'medium',
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    }));

    const challanNotifications = (pendingChallansItems || []).map((c: any) => ({
      id: `challan-${c.id}`,
      type: 'challan',
      title: 'Pending Challan',
      message: `Challan #${c.challanNumber} (${c.material}) is pending dispatch`,
      module: 'challan',
      severity: 'info',
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    }));

    const expenseNotifications = (openExpensesItems || []).map((e: any) => ({
      id: `expense-${e.id}`,
      type: 'expense',
      title: 'Expense Pending',
      message: `₹${Number(e.amount).toLocaleString()} (${e.category}) awaiting payout`,
      module: 'expense',
      severity: 'warning',
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    }));

    const allNotifications = [
      ...stockNotifications,
      ...maintenanceNotifications,
      ...challanNotifications,
      ...expenseNotifications,
    ];

    const productionTrend = Array.from(
      productions.reduce((byDate, item) => {
        const date = formatChartDate(item.date);
        byDate.set(date, (byDate.get(date) || 0) + item.amount);
        return byDate;
      }, new Map<string, number>()),
      ([date, production]) => ({
        id: date,
        date,
        production,
        target: Math.max(400, Math.ceil(production * 1.1)),
      })
    );

    const consumptionStats = Array.from(
      consumptions.reduce((byMaterial, item) => {
        const current = byMaterial.get(item.material) || 0;
        byMaterial.set(item.material, current + item.amount);
        return byMaterial;
      }, new Map<string, number>()),
      ([category, amount]) => ({
        id: category,
        category,
        amount,
        budget: Math.ceil(amount * 1.1),
      })
    );

    const expenseTotals = expenses.reduce((byCategory, item) => {
      const current = byCategory.get(item.category) || 0;
      byCategory.set(item.category, current + item.amount);
      return byCategory;
    }, new Map<string, number>());
    const expenseTotal = Array.from(expenseTotals.values()).reduce((sum, amount) => sum + amount, 0);
    const expenseStats = Array.from(expenseTotals, ([name, amount], index) => ({
      id: name,
      name,
      amount,
      value: expenseTotal > 0 ? Number(((amount / expenseTotal) * 100).toFixed(1)) : 0,
      color: chartColors[index % chartColors.length],
    }));

    res.json({
      totalProduction: totalProduction._sum.amount || 0,
      activeVehicles,
      totalExpenses: totalExpenses._sum.amount || 0,
      inventoryCount,
      productionTrend,
      consumptionStats,
      expenseStats,
      pendingChallans,
      lowStockMaterials,
      lowStockItems,
      maintenanceDue,
      attendanceToday,
      openExpensesCount,
      notifications: allNotifications,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
