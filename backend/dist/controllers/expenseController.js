"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenses = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getExpenses = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const expenses = await prisma_1.default.expense.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
        });
        res.json(expenses);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const expenses = await prisma_1.default.$transaction(data.map(item => prisma_1.default.expense.create({
                data: {
                    tenantId,
                    category: item.category || 'Miscellaneous',
                    amount: parseFloat(item.amount) || 0,
                    description: item.description || null,
                    paymentStatus: item.paymentStatus || 'pending',
                    date: item.date ? new Date(item.date) : new Date(),
                }
            })));
            await (0, audit_1.logActivity)(userId, email, tenantId, 'BULK_CREATE', 'Expense', `Imported ${expenses.length} expenses`);
            res.status(201).json(expenses);
        }
        else {
            const expense = await prisma_1.default.expense.create({
                data: {
                    tenantId,
                    category: data.category,
                    amount: parseFloat(data.amount),
                    description: data.description,
                    paymentStatus: data.paymentStatus || 'paid',
                    date: data.date ? new Date(data.date) : undefined,
                },
            });
            await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'Expense', `Created expense: ${expense.category} - ₹${expense.amount}`);
            res.status(201).json(expense);
        }
    }
    catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: 'Error creating expense' });
    }
};
exports.createExpense = createExpense;
const updateExpense = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { category, amount, description, date, paymentStatus } = req.body;
    try {
        await prisma_1.default.expense.updateMany({
            where: { id, tenantId },
            data: {
                category,
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                description,
                paymentStatus,
                date: date ? new Date(date) : undefined,
            },
        });
        const expense = await prisma_1.default.expense.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'Expense', `Updated expense ID: ${id}`);
        res.json(expense);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating expense' });
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.expense.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'Expense', `Deleted expense ID: ${id}`);
        res.json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting expense' });
    }
};
exports.deleteExpense = deleteExpense;
