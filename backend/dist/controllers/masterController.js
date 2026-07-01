import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';
const typeToModelMap = {
    'departments': 'department',
    'material-categories': 'materialCategory',
    'vehicle-types': 'vehicleType',
    'expense-categories': 'expenseCategory',
    'uoms': 'unitOfMeasure'
};
const getModel = (type) => {
    const modelName = typeToModelMap[type.toLowerCase()];
    if (!modelName)
        return null;
    return prisma[modelName];
};
export const getMasters = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const type = req.params.type;
        const model = getModel(type);
        if (!model) {
            return res.status(400).json({ message: 'Invalid master data type' });
        }
        const items = await model.findMany({ where: { tenantId } });
        res.json(items);
    }
    catch (error) {
        console.error('Error fetching master data:', error);
        res.status(500).json({ message: 'Failed to fetch master data' });
    }
};
export const createMaster = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const type = req.params.type;
        const model = getModel(type);
        if (!model) {
            return res.status(400).json({ message: 'Invalid master data type' });
        }
        const data = req.body;
        if (Array.isArray(data)) {
            // Bulk insert
            const items = await prisma.$transaction(data.map(item => model.create({
                data: {
                    ...item,
                    tenantId
                }
            })));
            await logActivity(userId, email, tenantId, 'BULK_CREATE', type, `Imported ${items.length} master data rows`);
            return res.status(201).json(items);
        }
        else {
            // Single insert
            const item = await model.create({
                data: {
                    ...data,
                    tenantId
                }
            });
            await logActivity(userId, email, tenantId, 'CREATE', type, `Created master item: ${data.name || item.id}`);
            return res.status(201).json(item);
        }
    }
    catch (error) {
        console.error('Error creating master data:', error);
        res.status(500).json({ message: 'Failed to create master data' });
    }
};
export const updateMaster = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const type = req.params.type;
        const id = req.params.id;
        const model = getModel(type);
        if (!model) {
            return res.status(400).json({ message: 'Invalid master data type' });
        }
        const data = req.body;
        delete data.id;
        delete data.tenantId;
        await model.updateMany({
            where: { id, tenantId },
            data
        });
        const updatedItem = await model.findFirst({
            where: { id, tenantId }
        });
        await logActivity(userId, email, tenantId, 'UPDATE', type, `Updated master item ID: ${id}`);
        res.json(updatedItem);
    }
    catch (error) {
        console.error('Error updating master data:', error);
        res.status(500).json({ message: 'Failed to update master data' });
    }
};
export const deleteMaster = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const type = req.params.type;
        const id = req.params.id;
        const model = getModel(type);
        if (!model) {
            return res.status(400).json({ message: 'Invalid master data type' });
        }
        await model.deleteMany({
            where: { id, tenantId }
        });
        await logActivity(userId, email, tenantId, 'DELETE', type, `Deleted master item ID: ${id}`);
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting master data:', error);
        res.status(500).json({ message: 'Failed to delete master data' });
    }
};
