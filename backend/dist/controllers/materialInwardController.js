"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterialInward = exports.updateMaterialInward = exports.createMaterialInward = exports.getMaterialInwards = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getMaterialInwards = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const inwards = await prisma_1.default.materialInward.findMany({
            where: { tenantId },
            include: { site: true },
            orderBy: { date: 'desc' },
        });
        res.json(inwards);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching material inward records' });
    }
};
exports.getMaterialInwards = getMaterialInwards;
const createMaterialInward = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const inwards = await prisma_1.default.$transaction(data.map(item => prisma_1.default.materialInward.create({
                data: {
                    tenantId,
                    inwardNumber: item.inwardNumber,
                    date: item.date ? new Date(item.date) : new Date(),
                    materialName: item.materialName,
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || 'units',
                    supplierName: item.supplierName,
                    vehicleNumber: item.vehicleNumber,
                    challanNumber: item.challanNumber,
                    siteId: item.siteId,
                    receivedBy: item.receivedBy,
                    remarks: item.remarks,
                }
            })));
            await (0, audit_1.logActivity)(userId, email, tenantId, 'BULK_CREATE', 'MaterialInward', `Imported ${inwards.length} inward logs`);
            res.status(201).json(inwards);
        }
        else {
            const inward = await prisma_1.default.materialInward.create({
                data: {
                    tenantId,
                    inwardNumber: data.inwardNumber,
                    date: data.date ? new Date(data.date) : new Date(),
                    materialName: data.materialName,
                    quantity: parseFloat(data.quantity) || 0,
                    unit: data.unit || 'units',
                    supplierName: data.supplierName,
                    vehicleNumber: data.vehicleNumber,
                    challanNumber: data.challanNumber,
                    siteId: data.siteId,
                    receivedBy: data.receivedBy,
                    remarks: data.remarks,
                },
            });
            await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'MaterialInward', `Created inward log: ${inward.inwardNumber}`);
            res.status(201).json(inward);
        }
    }
    catch (error) {
        console.error('Error creating inward entry:', error);
        res.status(500).json({ message: 'Error creating material inward log' });
    }
};
exports.createMaterialInward = createMaterialInward;
const updateMaterialInward = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { inwardNumber, date, materialName, quantity, unit, supplierName, vehicleNumber, challanNumber, siteId, receivedBy, remarks } = req.body;
    try {
        await prisma_1.default.materialInward.updateMany({
            where: { id, tenantId },
            data: {
                inwardNumber,
                date: date ? new Date(date) : undefined,
                materialName,
                quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
                unit,
                supplierName,
                vehicleNumber,
                challanNumber,
                siteId,
                receivedBy,
                remarks,
            },
        });
        const inward = await prisma_1.default.materialInward.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'MaterialInward', `Updated inward ID: ${id}`);
        res.json(inward);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating material inward log' });
    }
};
exports.updateMaterialInward = updateMaterialInward;
const deleteMaterialInward = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.materialInward.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'MaterialInward', `Deleted inward ID: ${id}`);
        res.json({ message: 'Material inward log deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting material inward log' });
    }
};
exports.deleteMaterialInward = deleteMaterialInward;
