import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';
export const getInventory = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const inventory = await prisma.inventory.findMany({ where: { tenantId } });
        res.json(inventory);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching inventory' });
    }
};
export const createInventoryItem = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const items = await prisma.$transaction(data.map(item => prisma.inventory.create({
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
            await logActivity(userId, email, tenantId, 'BULK_CREATE', 'Inventory', `Imported ${items.length} inventory items`);
            res.status(201).json(items);
        }
        else {
            const item = await prisma.inventory.create({
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
            await logActivity(userId, email, tenantId, 'CREATE', 'Inventory', `Created inventory item: ${item.itemName}`);
            res.status(201).json(item);
        }
    }
    catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ message: 'Error creating inventory item' });
    }
};
export const deleteInventoryItem = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const id = req.params.id;
        await prisma.inventory.deleteMany({ where: { id, tenantId } });
        await logActivity(userId, email, tenantId, 'DELETE', 'Inventory', `Deleted inventory item ID: ${id}`);
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
};
export const updateInventoryItem = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const id = req.params.id;
        const { itemName, quantity, unit, minThreshold, price, category } = req.body;
        await prisma.inventory.updateMany({
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
        const item = await prisma.inventory.findFirst({ where: { id, tenantId } });
        await logActivity(userId, email, tenantId, 'UPDATE', 'Inventory', `Updated inventory item ID: ${id}`);
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
};
