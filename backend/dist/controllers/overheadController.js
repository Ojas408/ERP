"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOverheadEntry = exports.updateOverheadEntry = exports.createOverheadEntry = exports.getOverheadSummary = exports.getOverheadEntries = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getOverheadEntries = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const entries = await prisma_1.default.overheadEntry.findMany({
            where: { tenantId },
            include: { site: true },
            orderBy: { date: 'desc' },
        });
        res.json(entries);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching overhead entries' });
    }
};
exports.getOverheadEntries = getOverheadEntries;
const getOverheadSummary = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [entries, expenses, employees] = await Promise.all([
            prisma_1.default.overheadEntry.findMany({ where: { tenantId } }),
            prisma_1.default.expense.findMany({ where: { tenantId } }),
            prisma_1.default.employee.findMany({ where: { tenantId, status: 'active' } }),
        ]);
        const categoryTotals = {};
        entries.forEach((entry) => {
            const cat = entry.category;
            if (!categoryTotals[cat]) {
                categoryTotals[cat] = { quantity: 0, amount: 0, unit: entry.unit || '' };
            }
            categoryTotals[cat].quantity += entry.quantity || 0;
            categoryTotals[cat].amount += entry.amount || 0;
            if (entry.unit)
                categoryTotals[cat].unit = entry.unit;
        });
        const expenseByCategory = expenses.reduce((acc, exp) => {
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
        const grandTotal = summary.reduce((s, i) => s + i.amount, 0) +
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error building overhead summary' });
    }
};
exports.getOverheadSummary = getOverheadSummary;
const createOverheadEntry = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        const entry = await prisma_1.default.overheadEntry.create({
            data: {
                tenantId,
                category: data.category,
                description: data.description || null,
                quantity: data.quantity !== undefined ? parseFloat(data.quantity) : null,
                unit: data.unit || null,
                amount: parseFloat(data.amount) || 0,
                siteId: data.siteId || null,
                date: data.date ? new Date(data.date) : new Date(),
            },
            include: { site: true },
        });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'OverheadEntry', `Created overhead: ${entry.category}`);
        res.status(201).json(entry);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating overhead entry' });
    }
};
exports.createOverheadEntry = createOverheadEntry;
const updateOverheadEntry = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { category, description, quantity, unit, amount, siteId, date } = req.body;
    try {
        await prisma_1.default.overheadEntry.updateMany({
            where: { id, tenantId },
            data: {
                category,
                description,
                quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
                unit,
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                siteId,
                date: date ? new Date(date) : undefined,
            },
        });
        const entry = await prisma_1.default.overheadEntry.findFirst({ where: { id, tenantId }, include: { site: true } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'OverheadEntry', `Updated overhead ID: ${id}`);
        res.json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating overhead entry' });
    }
};
exports.updateOverheadEntry = updateOverheadEntry;
const deleteOverheadEntry = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.overheadEntry.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'OverheadEntry', `Deleted overhead ID: ${id}`);
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting overhead entry' });
    }
};
exports.deleteOverheadEntry = deleteOverheadEntry;
