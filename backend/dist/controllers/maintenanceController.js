"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaintenance = exports.updateMaintenance = exports.createMaintenance = exports.getMaintenances = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getMaintenances = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const maintenances = await prisma_1.default.maintenance.findMany({
            where: { tenantId },
            include: { vehicle: true },
            orderBy: { date: 'desc' },
        });
        res.json(maintenances);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch maintenances' });
    }
};
exports.getMaintenances = getMaintenances;
const createMaintenance = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { vehicleId, type, cost, description, date, status } = req.body;
        const maintenance = await prisma_1.default.$transaction(async (tx) => {
            const newMaintenance = await tx.maintenance.create({
                data: {
                    tenantId,
                    vehicleId,
                    type,
                    cost: parseFloat(cost),
                    description,
                    status,
                    date: date ? new Date(date) : new Date(),
                },
            });
            // Update vehicle status if needed
            if (status === 'pending') {
                await tx.vehicle.updateMany({
                    where: { id: vehicleId, tenantId },
                    data: { status: 'maintenance' },
                });
            }
            else {
                await tx.vehicle.updateMany({
                    where: { id: vehicleId, tenantId },
                    data: { lastService: date ? new Date(date) : new Date(), status: 'available' },
                });
            }
            return newMaintenance;
        });
        res.json(maintenance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create maintenance' });
    }
};
exports.createMaintenance = createMaintenance;
const updateMaintenance = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const { vehicleId, type, cost, description, date, status } = req.body;
        await prisma_1.default.maintenance.updateMany({
            where: { id, tenantId },
            data: {
                vehicleId,
                type,
                cost: cost !== undefined ? parseFloat(cost) : undefined,
                description,
                status,
                date: date ? new Date(date) : undefined,
            },
        });
        const maintenance = await prisma_1.default.maintenance.findFirst({ where: { id, tenantId } });
        res.json(maintenance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update maintenance' });
    }
};
exports.updateMaintenance = updateMaintenance;
const deleteMaintenance = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        await prisma_1.default.maintenance.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete maintenance' });
    }
};
exports.deleteMaintenance = deleteMaintenance;
