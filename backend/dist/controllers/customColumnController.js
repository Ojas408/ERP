"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomColumn = exports.createCustomColumn = exports.getCustomColumns = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getCustomColumns = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { entity } = req.query;
        const columns = await prisma_1.default.customColumn.findMany({
            where: {
                tenantId,
                ...(entity ? { entity: String(entity) } : {}),
            },
        });
        res.json(columns);
    }
    catch (error) {
        console.error('Get custom columns error:', error);
        res.status(500).json({ message: 'Failed to fetch custom columns' });
    }
};
exports.getCustomColumns = getCustomColumns;
const createCustomColumn = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { entity, name, key, type } = req.body;
        const column = await prisma_1.default.customColumn.create({
            data: {
                entity,
                name,
                key,
                type,
                tenantId,
            },
        });
        res.status(201).json(column);
    }
    catch (error) {
        console.error('Create custom column error:', error);
        res.status(500).json({ message: 'Failed to create custom column' });
    }
};
exports.createCustomColumn = createCustomColumn;
const deleteCustomColumn = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = String(req.params.id);
        const column = await prisma_1.default.customColumn.findUnique({
            where: { id },
        });
        if (!column || column.tenantId !== tenantId) {
            return res.status(404).json({ message: 'Custom column not found' });
        }
        await prisma_1.default.customColumn.delete({
            where: { id },
        });
        res.json({ message: 'Custom column deleted successfully' });
    }
    catch (error) {
        console.error('Delete custom column error:', error);
        res.status(500).json({ message: 'Failed to delete custom column' });
    }
};
exports.deleteCustomColumn = deleteCustomColumn;
