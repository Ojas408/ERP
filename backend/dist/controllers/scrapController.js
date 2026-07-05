"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScrap = exports.updateScrap = exports.createScrap = exports.getScraps = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getScraps = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const scraps = await prisma_1.default.scrap.findMany({
            where: { tenantId },
            include: { site: true },
            orderBy: { date: 'desc' },
        });
        res.json(scraps);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching scrap records' });
    }
};
exports.getScraps = getScraps;
const createScrap = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const { date, materialType, quantity, unit, siteId, saleStatus, saleValue, buyerName, remarks } = req.body;
    try {
        const scrap = await prisma_1.default.scrap.create({
            data: {
                tenantId,
                date: date ? new Date(date) : new Date(),
                materialType,
                quantity: parseFloat(quantity) || 0,
                unit: unit || 'kg',
                siteId: siteId || null,
                saleStatus: saleStatus || 'stored',
                saleValue: saleValue ? parseFloat(saleValue) : null,
                buyerName: buyerName || null,
                remarks: remarks || null,
            },
        });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'Scrap', `Created scrap record: ${scrap.materialType} (${scrap.quantity} ${scrap.unit})`);
        res.status(201).json(scrap);
    }
    catch (error) {
        console.error('Error creating scrap entry:', error);
        res.status(500).json({ message: 'Error creating scrap record' });
    }
};
exports.createScrap = createScrap;
const updateScrap = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { date, materialType, quantity, unit, siteId, saleStatus, saleValue, buyerName, remarks } = req.body;
    try {
        await prisma_1.default.scrap.updateMany({
            where: { id, tenantId },
            data: {
                date: date ? new Date(date) : undefined,
                materialType,
                quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
                unit,
                siteId,
                saleStatus,
                saleValue: saleValue !== undefined ? (saleValue ? parseFloat(saleValue) : null) : undefined,
                buyerName,
                remarks,
            },
        });
        const scrap = await prisma_1.default.scrap.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'Scrap', `Updated scrap record ID: ${id}`);
        res.json(scrap);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating scrap record' });
    }
};
exports.updateScrap = updateScrap;
const deleteScrap = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.scrap.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'Scrap', `Deleted scrap record ID: ${id}`);
        res.json({ message: 'Scrap record deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting scrap record' });
    }
};
exports.deleteScrap = deleteScrap;
