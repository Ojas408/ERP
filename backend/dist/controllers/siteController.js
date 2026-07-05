"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSite = exports.updateSite = exports.createSite = exports.getSites = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getSites = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const sites = await prisma_1.default.site.findMany({ where: { tenantId } });
        res.json(sites);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sites' });
    }
};
exports.getSites = getSites;
const createSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { name, location, status } = req.body;
    try {
        const site = await prisma_1.default.site.create({
            data: { tenantId, name, location, status },
        });
        res.status(201).json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating site' });
    }
};
exports.createSite = createSite;
const updateSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const { name, location, status } = req.body;
    try {
        await prisma_1.default.site.updateMany({
            where: { id, tenantId },
            data: { name, location, status },
        });
        const site = await prisma_1.default.site.findFirst({ where: { id, tenantId } });
        res.json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating site' });
    }
};
exports.updateSite = updateSite;
const deleteSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        await prisma_1.default.site.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Site deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting site' });
    }
};
exports.deleteSite = deleteSite;
