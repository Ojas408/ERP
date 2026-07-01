import prisma from '../lib/prisma';
export const getPurchaseOrders = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const orders = await prisma.purchaseOrder.findMany({
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
export const createPurchaseOrder = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { orderNumber, date, vendorId, totalAmount, status, items } = req.body;
    try {
        const order = await prisma.purchaseOrder.create({
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
export const updatePurchaseOrder = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const { orderNumber, date, vendorId, totalAmount, status, items } = req.body;
    try {
        await prisma.purchaseOrder.updateMany({
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
        const order = await prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating purchase order' });
    }
};
export const deletePurchaseOrder = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        await prisma.purchaseOrder.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Purchase order deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting purchase order' });
    }
};
