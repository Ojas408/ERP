"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
const formatChartDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const getDashboardStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const [totalProduction, activeVehicles, totalExpenses, inventoryCount, productions, consumptions, expenses, pendingChallans, inventoryItems, maintenanceDue, attendanceToday, openExpensesCount, maintenanceDueItems, pendingChallansItems, openExpensesItems,] = await Promise.all([
            prisma_1.default.production.aggregate({ _sum: { amount: true }, where: { tenantId } }),
            prisma_1.default.vehicle.count({ where: { status: 'available', tenantId } }),
            prisma_1.default.expense.aggregate({ _sum: { amount: true }, where: { tenantId } }),
            prisma_1.default.inventory.count({ where: { tenantId } }),
            prisma_1.default.production.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
            prisma_1.default.consumption.findMany({ where: { tenantId } }),
            prisma_1.default.expense.findMany({ where: { tenantId } }),
            prisma_1.default.challan.count({ where: { status: { in: ['pending', 'draft', 'approved', 'dispatched'] }, tenantId } }),
            prisma_1.default.inventory.findMany({ where: { tenantId } }),
            prisma_1.default.maintenance.count({ where: { status: 'pending', tenantId } }),
            prisma_1.default.attendance.count({
                where: {
                    date: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                    tenantId
                }
            }),
            prisma_1.default.expense.count({ where: { paymentStatus: 'pending', tenantId } }),
            prisma_1.default.maintenance.findMany({
                where: { status: 'pending', tenantId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { vehicle: true },
            }),
            prisma_1.default.challan.findMany({
                where: { status: { in: ['pending', 'draft'] }, tenantId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { vehicle: true },
            }),
            prisma_1.default.expense.findMany({
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
        const maintenanceNotifications = (maintenanceDueItems || []).map((m) => ({
            id: `maint-${m.id}`,
            type: 'maintenance',
            title: 'Maintenance Due',
            message: `Vehicle ${m.vehicle?.plateNumber || 'Fleet Unit'} requires ${m.type || 'repair'} service`,
            module: 'maintenance',
            severity: 'medium',
            createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
        }));
        const challanNotifications = (pendingChallansItems || []).map((c) => ({
            id: `challan-${c.id}`,
            type: 'challan',
            title: 'Pending Challan',
            message: `Challan #${c.challanNumber} (${c.material}) is pending dispatch`,
            module: 'challan',
            severity: 'info',
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        }));
        const expenseNotifications = (openExpensesItems || []).map((e) => ({
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
            lowStockItems,
            maintenanceDue,
            attendanceToday,
            openExpensesCount,
            notifications: allNotifications,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
