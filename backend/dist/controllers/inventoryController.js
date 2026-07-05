"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInventoryItem = exports.deleteInventoryItem = exports.createInventoryItem = exports.getInventory = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getInventory = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const inventory = await prisma_1.default.inventory.findMany({ where: { tenantId } });
        res.json(inventory);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching inventory' });
    }
};
exports.getInventory = getInventory;
const createInventoryItem = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const items = await prisma_1.default.$transaction(data.map(item => prisma_1.default.inventory.create({
                data: {
                    tenantId,
                    itemName: item.itemName,
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || 'pcs',
                    minThreshold: item.minThreshold ? parseFloat(item.minThreshold) : 0,
                    price: item.price ? parseFloat(item.price) : undefined,
                    category: item.category || 'General',
                }
            })));
            await (0, audit_1.logActivity)(userId, email, tenantId, 'BULK_CREATE', 'Inventory', `Imported ${items.length} inventory items`);
            res.status(201).json(items);
        }
        else {
            const item = await prisma_1.default.inventory.create({
                data: {
                    tenantId,
                    itemName: data.itemName,
                    quantity: parseFloat(data.quantity) || 0,
                    unit: data.unit,
                    minThreshold: data.minThreshold ? parseFloat(data.minThreshold) : 0,
                    price: data.price ? parseFloat(data.price) : undefined,
                    category: data.category,
                },
            });
            await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'Inventory', `Created inventory item: ${item.itemName}`);
            res.status(201).json(item);
        }
    }
    catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ message: 'Error creating inventory item' });
    }
};
exports.createInventoryItem = createInventoryItem;
const deleteInventoryItem = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const id = req.params.id;
        await prisma_1.default.inventory.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'Inventory', `Deleted inventory item ID: ${id}`);
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
};
exports.deleteInventoryItem = deleteInventoryItem;
const updateInventoryItem = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const id = req.params.id;
        const { itemName, quantity, unit, minThreshold, price, category } = req.body;
        await prisma_1.default.inventory.updateMany({
            where: { id, tenantId },
            data: {
                itemName,
                quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
                unit,
                minThreshold: minThreshold !== undefined ? parseFloat(minThreshold) : undefined,
                price: price !== undefined ? parseFloat(price) : undefined,
                category,
            },
        });
        const item = await prisma_1.default.inventory.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'Inventory', `Updated inventory item ID: ${id}`);
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
};
exports.updateInventoryItem = updateInventoryItem;
