"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendor = exports.updateVendor = exports.createVendor = exports.getVendors = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getVendors = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const vendors = await prisma_1.default.vendor.findMany({ where: { tenantId } });
        res.json(vendors);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching vendors' });
    }
};
exports.getVendors = getVendors;
const createVendor = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { name, contact, category } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.create({
            data: { tenantId, name, contact, category },
        });
        res.status(201).json(vendor);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating vendor' });
    }
};
exports.createVendor = createVendor;
const updateVendor = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const { name, contact, category } = req.body;
    try {
        await prisma_1.default.vendor.updateMany({
            where: { id, tenantId },
            data: { name, contact, category },
        });
        const vendor = await prisma_1.default.vendor.findFirst({ where: { id, tenantId } });
        res.json(vendor);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating vendor' });
    }
};
exports.updateVendor = updateVendor;
const deleteVendor = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        await prisma_1.default.vendor.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Vendor deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting vendor' });
    }
};
exports.deleteVendor = deleteVendor;
