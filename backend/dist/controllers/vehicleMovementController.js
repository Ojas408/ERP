"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicleMovement = exports.updateVehicleMovement = exports.createVehicleMovement = exports.getVehicleMovements = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getVehicleMovements = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const movements = await prisma_1.default.vehicleMovement.findMany({
            where: { tenantId },
            include: { vehicle: true },
            orderBy: { startTime: 'desc' },
        });
        res.json(movements);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching vehicle movements' });
    }
};
exports.getVehicleMovements = getVehicleMovements;
const createVehicleMovement = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { vehicleId, fromLocation, toLocation, startTime, endTime, distance, fuelConsumed } = req.body;
    try {
        const movement = await prisma_1.default.vehicleMovement.create({
            data: {
                tenantId,
                vehicleId,
                fromLocation,
                toLocation,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : undefined,
                distance: distance ? parseFloat(distance) : undefined,
                fuelConsumed: fuelConsumed ? parseFloat(fuelConsumed) : undefined,
            },
        });
        res.status(201).json(movement);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating vehicle movement' });
    }
};
exports.createVehicleMovement = createVehicleMovement;
const updateVehicleMovement = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const { vehicleId, fromLocation, toLocation, startTime, endTime, distance, fuelConsumed } = req.body;
    try {
        await prisma_1.default.vehicleMovement.updateMany({
            where: { id, tenantId },
            data: {
                vehicleId,
                fromLocation,
                toLocation,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                distance: distance !== undefined ? parseFloat(distance) : undefined,
                fuelConsumed: fuelConsumed !== undefined ? parseFloat(fuelConsumed) : undefined,
            },
        });
        const movement = await prisma_1.default.vehicleMovement.findFirst({ where: { id, tenantId } });
        res.json(movement);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating vehicle movement' });
    }
};
exports.updateVehicleMovement = updateVehicleMovement;
const deleteVehicleMovement = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        await prisma_1.default.vehicleMovement.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Vehicle movement deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting vehicle movement' });
    }
};
exports.deleteVehicleMovement = deleteVehicleMovement;
