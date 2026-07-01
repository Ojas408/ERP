import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';
export const getVehicles = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const vehicles = await prisma.vehicle.findMany({
            where: { tenantId },
            include: { site: true }
        });
        res.json(vehicles);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching vehicles' });
    }
};
export const createVehicle = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const vehicles = await prisma.$transaction(data.map(item => prisma.vehicle.create({
                data: {
                    tenantId,
                    plateNumber: item.plateNumber,
                    model: item.model,
                    status: item.status || 'available',
                    vehicleType: item.vehicleType || undefined,
                    driver: item.driver || undefined,
                    siteId: item.siteId || undefined,
                    lastService: item.lastService ? new Date(item.lastService) : undefined,
                }
            })));
            await logActivity(userId, email, tenantId, 'BULK_CREATE', 'Vehicle', `Imported ${vehicles.length} vehicles`);
            res.status(201).json(vehicles);
        }
        else {
            const vehicle = await prisma.vehicle.create({
                data: {
                    tenantId,
                    plateNumber: data.plateNumber,
                    model: data.model,
                    status: data.status || 'available',
                    vehicleType: data.vehicleType || undefined,
                    driver: data.driver || undefined,
                    siteId: data.siteId || undefined,
                    lastService: data.lastService ? new Date(data.lastService) : undefined,
                },
            });
            await logActivity(userId, email, tenantId, 'CREATE', 'Vehicle', `Created vehicle plate: ${vehicle.plateNumber}`);
            res.status(201).json(vehicle);
        }
    }
    catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({ message: 'Error creating vehicle' });
    }
};
export const updateVehicle = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { plateNumber, model, status, lastService, vehicleType, driver, siteId } = req.body;
    try {
        await prisma.vehicle.updateMany({
            where: { id, tenantId },
            data: {
                plateNumber,
                model,
                status,
                vehicleType,
                driver,
                siteId: siteId || null,
                lastService: lastService ? new Date(lastService) : undefined,
            },
        });
        const vehicle = await prisma.vehicle.findFirst({ where: { id, tenantId } });
        await logActivity(userId, email, tenantId, 'UPDATE', 'Vehicle', `Updated vehicle ID: ${id}`);
        res.json(vehicle);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating vehicle' });
    }
};
export const deleteVehicle = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma.vehicle.deleteMany({ where: { id, tenantId } });
        await logActivity(userId, email, tenantId, 'DELETE', 'Vehicle', `Deleted vehicle ID: ${id}`);
        res.json({ message: 'Vehicle deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting vehicle' });
    }
};
