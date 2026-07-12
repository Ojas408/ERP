"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsumption = exports.updateConsumption = exports.createConsumption = exports.getConsumptions = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getConsumptions = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const consumptions = await prisma_1.default.consumption.findMany({
            where: { tenantId },
            include: { site: true },
            orderBy: { date: 'desc' },
        });
        res.json(consumptions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch consumptions' });
    }
};
exports.getConsumptions = getConsumptions;
const createConsumption = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { material, amount, unit, siteId, date, isRejected, rejectionReason } = req.body;
        const consumption = await prisma_1.default.consumption.create({
            data: {
                tenantId,
                material,
                amount: parseFloat(amount),
                unit,
                siteId,
                isRejected: isRejected === true || isRejected === 'true',
                rejectionReason: rejectionReason || null,
                date: date ? new Date(date) : new Date(),
                customData: req.body.customData || undefined,
            },
        });
        res.json(consumption);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create consumption' });
    }
};
exports.createConsumption = createConsumption;
const updateConsumption = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const { material, amount, unit, siteId, date, isRejected, rejectionReason } = req.body;
        await prisma_1.default.consumption.updateMany({
            where: { id, tenantId },
            data: {
                material,
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                unit,
                siteId,
                isRejected: isRejected !== undefined ? (isRejected === true || isRejected === 'true') : undefined,
                rejectionReason,
                date: date ? new Date(date) : undefined,
                customData: req.body.customData !== undefined ? req.body.customData : undefined,
            },
        });
        const consumption = await prisma_1.default.consumption.findFirst({ where: { id, tenantId } });
        res.json(consumption);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update consumption' });
    }
};
exports.updateConsumption = updateConsumption;
const deleteConsumption = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        await prisma_1.default.consumption.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Consumption deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete consumption' });
    }
};
exports.deleteConsumption = deleteConsumption;
