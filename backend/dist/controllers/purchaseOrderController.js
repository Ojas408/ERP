"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePurchaseOrder = exports.updatePurchaseOrder = exports.createPurchaseOrder = exports.getPurchaseOrders = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getPurchaseOrders = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const orders = await prisma_1.default.purchaseOrder.findMany({
            where: { tenantId },
            include: { vendor: true },
            orderBy: { date: 'desc' },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching purchase orders' });
    }
};
exports.getPurchaseOrders = getPurchaseOrders;
const createPurchaseOrder = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { orderNumber, date, vendorId, totalAmount, status, items } = req.body;
    try {
        const order = await prisma_1.default.purchaseOrder.create({
            data: {
                tenantId,
                orderNumber,
                date: date ? new Date(date) : undefined,
                vendorId,
                totalAmount: parseFloat(totalAmount),
                status,
                items,
            },
        });
        res.status(201).json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating purchase order' });
    }
};
exports.createPurchaseOrder = createPurchaseOrder;
const updatePurchaseOrder = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const { orderNumber, date, vendorId, totalAmount, status, items } = req.body;
    try {
        await prisma_1.default.purchaseOrder.updateMany({
            where: { id, tenantId },
            data: {
                orderNumber,
                date: date ? new Date(date) : undefined,
                vendorId,
                totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
                status,
                items,
            },
        });
        const order = await prisma_1.default.purchaseOrder.findFirst({ where: { id, tenantId } });
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating purchase order' });
    }
};
exports.updatePurchaseOrder = updatePurchaseOrder;
const deletePurchaseOrder = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        await prisma_1.default.purchaseOrder.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Purchase order deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting purchase order' });
    }
};
exports.deletePurchaseOrder = deletePurchaseOrder;
