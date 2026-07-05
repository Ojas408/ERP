"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChallan = exports.updateChallan = exports.createChallan = exports.getChallans = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getChallans = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const challans = await prisma_1.default.challan.findMany({
            where: { tenantId },
            include: { vehicle: true },
            orderBy: { date: 'desc' },
        });
        res.json(challans);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching challans' });
    }
};
exports.getChallans = getChallans;
const createChallan = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const challans = await prisma_1.default.$transaction(data.map(item => prisma_1.default.challan.create({
                data: {
                    tenantId,
                    challanNumber: item.challanNumber,
                    date: item.date ? new Date(item.date) : new Date(),
                    vehicleId: item.vehicleId,
                    material: item.material,
                    quantity: parseFloat(item.quantity) || 0,
                    destination: item.destination,
                    status: item.status || 'pending',
                }
            })));
            await (0, audit_1.logActivity)(userId, email, tenantId, 'BULK_CREATE', 'Challan', `Imported ${challans.length} challans`);
            res.status(201).json(challans);
        }
        else {
            const challan = await prisma_1.default.challan.create({
                data: {
                    tenantId,
                    challanNumber: data.challanNumber,
                    date: data.date ? new Date(data.date) : undefined,
                    vehicleId: data.vehicleId,
                    material: data.material,
                    quantity: parseFloat(data.quantity),
                    destination: data.destination,
                    status: data.status || 'pending',
                },
            });
            await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'Challan', `Created challan: ${challan.challanNumber}`);
            res.status(201).json(challan);
        }
    }
    catch (error) {
        console.error('Error creating challan:', error);
        res.status(500).json({ message: 'Error creating challan' });
    }
};
exports.createChallan = createChallan;
const updateChallan = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { challanNumber, date, vehicleId, material, quantity, destination, status } = req.body;
    try {
        await prisma_1.default.challan.updateMany({
            where: { id, tenantId },
            data: {
                challanNumber,
                date: date ? new Date(date) : undefined,
                vehicleId,
                material,
                quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
                destination,
                status,
            },
        });
        const challan = await prisma_1.default.challan.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'Challan', `Updated challan ID: ${id}`);
        res.json(challan);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating challan' });
    }
};
exports.updateChallan = updateChallan;
const deleteChallan = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.challan.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'Challan', `Deleted challan ID: ${id}`);
        res.json({ message: 'Challan deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting challan' });
    }
};
exports.deleteChallan = deleteChallan;
