import prisma from '../lib/prisma';
const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
const formatChartDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const getDashboardStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const [totalProduction, activeVehicles, totalExpenses, inventoryCount, productions, consumptions, expenses, pendingChallans, inventoryItems, maintenanceDue, attendanceToday, openExpensesCount,] = await Promise.all([
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
        ]);
        const lowStockMaterials = inventoryItems.filter(item => item.quantity < item.minThreshold).length;
        const productionTrend = Array.from(productions.reduce((byDate, item) => {
            const date = formatChartDate(item.date);
            byDate.set(date, (byDate.get(date) || 0) + item.amount);
            return byDate;
        }, new Map()), ([date, production]) => ({
            id: date,
            date,
            production,
            target: Math.max(400, Math.ceil(production * 1.1)),
        }));
        const consumptionStats = Array.from(consumptions.reduce((byMaterial, item) => {
            const current = byMaterial.get(item.material) || 0;
            byMaterial.set(item.material, current + item.amount);
            return byMaterial;
        }, new Map()), ([category, amount]) => ({
            id: category,
            category,
            amount,
            budget: Math.ceil(amount * 1.1),
        }));
        const expenseTotals = expenses.reduce((byCategory, item) => {
            const current = byCategory.get(item.category) || 0;
            byCategory.set(item.category, current + item.amount);
            return byCategory;
        }, new Map());
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
            maintenanceDue,
            attendanceToday,
            openExpensesCount,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};
