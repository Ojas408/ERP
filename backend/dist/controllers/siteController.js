"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSite = exports.updateSite = exports.createSite = exports.getSiteById = exports.getSites = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getSites = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const sites = await prisma_1.default.site.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: {
                        productions: true,
                        materialInwards: true,
                        consumptions: true,
                        vehicles: true,
                        scraps: true,
                        overheadEntries: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sites);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sites' });
    }
};
exports.getSites = getSites;
const getSiteById = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        const site = await prisma_1.default.site.findFirst({
            where: { id, tenantId },
            include: {
                productions: { take: 10, orderBy: { createdAt: 'desc' } },
                materialInwards: { take: 10, orderBy: { createdAt: 'desc' } },
                consumptions: { take: 10, orderBy: { createdAt: 'desc' } },
                vehicles: { take: 10 },
                _count: {
                    select: {
                        productions: true,
                        materialInwards: true,
                        consumptions: true,
                        vehicles: true,
                        scraps: true,
                        overheadEntries: true,
                    },
                },
            },
        });
        if (!site) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching project details' });
    }
};
exports.getSiteById = getSiteById;
const createSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { name, location, status, clientName, managerName, budget, spent, progress, startDate, endDate, description } = req.body;
    try {
        const site = await prisma_1.default.site.create({
            data: {
                tenantId,
                name,
                location,
                status: status || 'active',
                clientName: clientName || null,
                managerName: managerName || null,
                budget: budget ? parseFloat(budget) : 5000000,
                spent: spent ? parseFloat(spent) : 0,
                progress: progress ? parseFloat(progress) : 0,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                description: description || null,
            },
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
    const { name, location, status, clientName, managerName, budget, spent, progress, startDate, endDate, description } = req.body;
    try {
        await prisma_1.default.site.updateMany({
            where: { id, tenantId },
            data: {
                ...(name !== undefined && { name }),
                ...(location !== undefined && { location }),
                ...(status !== undefined && { status }),
                ...(clientName !== undefined && { clientName }),
                ...(managerName !== undefined && { managerName }),
                ...(budget !== undefined && { budget: parseFloat(budget) }),
                ...(spent !== undefined && { spent: parseFloat(spent) }),
                ...(progress !== undefined && { progress: parseFloat(progress) }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(description !== undefined && { description }),
            },
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
