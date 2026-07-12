"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRmcGrade = exports.updateRmcGrade = exports.createRmcGrade = exports.getRmcGrades = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getRmcGrades = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const grades = await prisma_1.default.rMCGrade.findMany({
            where: { tenantId },
            orderBy: { grade: 'asc' },
        });
        res.json(grades);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching RMC grades' });
    }
};
exports.getRmcGrades = getRmcGrades;
const createRmcGrade = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const { grade, mixRatio, cementContent, waterCementRatio, admixture, description } = req.body;
    try {
        const rmcGrade = await prisma_1.default.rMCGrade.create({
            data: {
                tenantId,
                grade,
                mixRatio,
                cementContent: cementContent ? parseFloat(cementContent) : null,
                waterCementRatio: waterCementRatio ? parseFloat(waterCementRatio) : null,
                admixture,
                description,
                customData: req.body.customData || undefined,
            },
        });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'RMCGrade', `Created RMC Grade: ${rmcGrade.grade}`);
        res.status(201).json(rmcGrade);
    }
    catch (error) {
        console.error('Error creating RMC grade:', error);
        res.status(500).json({ message: 'Error creating RMC grade' });
    }
};
exports.createRmcGrade = createRmcGrade;
const updateRmcGrade = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { grade, mixRatio, cementContent, waterCementRatio, admixture, description } = req.body;
    try {
        await prisma_1.default.rMCGrade.updateMany({
            where: { id, tenantId },
            data: {
                grade,
                mixRatio,
                cementContent: cementContent !== undefined ? (cementContent ? parseFloat(cementContent) : null) : undefined,
                waterCementRatio: waterCementRatio !== undefined ? (waterCementRatio ? parseFloat(waterCementRatio) : null) : undefined,
                admixture,
                description,
                customData: req.body.customData !== undefined ? req.body.customData : undefined,
            },
        });
        const rmcGrade = await prisma_1.default.rMCGrade.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'RMCGrade', `Updated RMC Grade ID: ${id}`);
        res.json(rmcGrade);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating RMC grade' });
    }
};
exports.updateRmcGrade = updateRmcGrade;
const deleteRmcGrade = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.rMCGrade.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'RMCGrade', `Deleted RMC Grade ID: ${id}`);
        res.json({ message: 'RMC grade deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting RMC grade' });
    }
};
exports.deleteRmcGrade = deleteRmcGrade;
