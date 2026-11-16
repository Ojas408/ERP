"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBOMVsActualComparison = exports.deleteBOM = exports.approveBOM = exports.submitBOMForApproval = exports.createBOMRevision = exports.updateBOM = exports.createBOM = exports.getBOMById = exports.getBOMs = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
// Helper to compute standard cost per CuM from items
function calculateBOMStandardCost(items) {
    const total = items.reduce((sum, item) => {
        const wastage = (item.wastagePercent || 0) / 100;
        const effectiveQty = item.standardQty * (1 + wastage);
        return sum + (effectiveQty * (item.standardRate || 0));
    }, 0);
    return round2(total);
}
// 1. List all BOMs
const getBOMs = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { gradeName, siteId, status } = req.query;
        const boms = await prisma_1.default.billOfMaterial.findMany({
            where: {
                tenantId,
                ...(gradeName ? { gradeName } : {}),
                ...(siteId && siteId !== 'all' ? { siteId } : {}),
                ...(status && status !== 'all' ? { status } : {}),
            },
            include: {
                site: { select: { id: true, name: true } },
                items: true,
                _count: { select: { items: true, revisions: true } },
            },
            orderBy: [{ gradeName: 'asc' }, { version: 'desc' }],
        });
        res.json(boms);
    }
    catch (error) {
        console.error('Error fetching BOMs:', error);
        res.status(500).json({ message: 'Error fetching Bill of Materials', error: error.message });
    }
};
exports.getBOMs = getBOMs;
// 2. Get BOM by ID
const getBOMById = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const bom = await prisma_1.default.billOfMaterial.findFirst({
            where: { id, tenantId },
            include: {
                site: { select: { id: true, name: true } },
                items: { orderBy: { createdAt: 'asc' } },
                revisions: { orderBy: { revisionNumber: 'desc' } },
            },
        });
        if (!bom) {
            return res.status(404).json({ message: 'BOM not found' });
        }
        res.json(bom);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching BOM details', error: error.message });
    }
};
exports.getBOMById = getBOMById;
// 3. Create a new BOM
const createBOM = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { code, name, gradeName, gradeId, siteId, remarks, targetSlump, density, items = [], } = req.body;
        if (!name || !gradeName) {
            return res.status(400).json({ message: 'BOM Name and Grade are required' });
        }
        const standardCostPerCuM = calculateBOMStandardCost(items);
        const bom = await prisma_1.default.billOfMaterial.create({
            data: {
                code: code || `BOM-${gradeName}-${Date.now().toString().slice(-4)}`,
                name,
                gradeName,
                gradeId: gradeId || null,
                siteId: siteId || null,
                status: 'draft',
                version: 1,
                remarks: remarks || null,
                targetSlump: targetSlump || '120-150 mm',
                density: density ? parseFloat(String(density)) : 2400,
                standardCostPerCuM,
                tenantId,
                items: {
                    create: items.map((item) => {
                        const wastage = (parseFloat(String(item.wastagePercent)) || 0) / 100;
                        const standardQty = parseFloat(String(item.standardQty)) || 0;
                        const standardRate = parseFloat(String(item.standardRate)) || 0;
                        const standardCost = round2(standardQty * (1 + wastage) * standardRate);
                        return {
                            materialName: item.materialName,
                            materialCategory: item.materialCategory || null,
                            standardQty,
                            unit: item.unit || 'kg',
                            wastagePercent: parseFloat(String(item.wastagePercent)) || 0,
                            standardRate,
                            standardCost,
                            tenantId,
                        };
                    }),
                },
            },
            include: {
                items: true,
                site: true,
            },
        });
        await (0, audit_1.logActivity)(req.user.userId, req.user.email, tenantId, 'CREATE', 'BillOfMaterial', `Created BOM ${bom.name} (v${bom.version}) for ${bom.gradeName}`);
        res.status(201).json(bom);
    }
    catch (error) {
        console.error('Error creating BOM:', error);
        res.status(500).json({ message: 'Error creating Bill of Material', error: error.message });
    }
};
exports.createBOM = createBOM;
// 4. Update an existing BOM
const updateBOM = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const { name, code, remarks, targetSlump, density, items } = req.body;
        const existing = await prisma_1.default.billOfMaterial.findFirst({
            where: { id, tenantId },
            include: { items: true },
        });
        if (!existing) {
            return res.status(404).json({ message: 'BOM not found' });
        }
        if (existing.status === 'approved') {
            return res.status(400).json({ message: 'Approved BOMs cannot be edited directly. Create a new revision instead.' });
        }
        let standardCostPerCuM = existing.standardCostPerCuM;
        if (Array.isArray(items)) {
            standardCostPerCuM = calculateBOMStandardCost(items);
            await prisma_1.default.bOMItem.deleteMany({ where: { bomId: id, tenantId } });
            await prisma_1.default.bOMItem.createMany({
                data: items.map((item) => {
                    const wastage = (parseFloat(String(item.wastagePercent)) || 0) / 100;
                    const standardQty = parseFloat(String(item.standardQty)) || 0;
                    const standardRate = parseFloat(String(item.standardRate)) || 0;
                    const standardCost = round2(standardQty * (1 + wastage) * standardRate);
                    return {
                        bomId: id,
                        materialName: item.materialName,
                        materialCategory: item.materialCategory || null,
                        standardQty,
                        unit: item.unit || 'kg',
                        wastagePercent: parseFloat(String(item.wastagePercent)) || 0,
                        standardRate,
                        standardCost,
                        tenantId,
                    };
                }),
            });
        }
        const updated = await prisma_1.default.billOfMaterial.update({
            where: { id },
            data: {
                name: name !== undefined ? name : existing.name,
                code: code !== undefined ? code : existing.code,
                remarks: remarks !== undefined ? remarks : existing.remarks,
                targetSlump: targetSlump !== undefined ? targetSlump : existing.targetSlump,
                density: density !== undefined ? parseFloat(String(density)) : existing.density,
                standardCostPerCuM,
            },
            include: { items: true, site: true },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating BOM', error: error.message });
    }
};
exports.updateBOM = updateBOM;
// 5. Create a new Revision for an approved BOM
const createBOMRevision = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const { changeReason, items } = req.body;
        const currentBOM = await prisma_1.default.billOfMaterial.findFirst({
            where: { id, tenantId },
            include: { items: true },
        });
        if (!currentBOM) {
            return res.status(404).json({ message: 'BOM not found' });
        }
        const nextVersion = currentBOM.version + 1;
        const newItems = Array.isArray(items) && items.length > 0 ? items : currentBOM.items;
        const newCost = calculateBOMStandardCost(newItems);
        await prisma_1.default.bOMRevision.create({
            data: {
                bomId: id,
                revisionNumber: currentBOM.version,
                changeReason: changeReason || `Updated to revision ${nextVersion}`,
                previousCost: currentBOM.standardCostPerCuM,
                newCost,
                changedBy: req.user.email,
                snapshot: currentBOM.items,
                tenantId,
            },
        });
        await prisma_1.default.bOMItem.deleteMany({ where: { bomId: id, tenantId } });
        await prisma_1.default.bOMItem.createMany({
            data: newItems.map((item) => {
                const wastage = (parseFloat(String(item.wastagePercent)) || 0) / 100;
                const standardQty = parseFloat(String(item.standardQty)) || 0;
                const standardRate = parseFloat(String(item.standardRate)) || 0;
                const standardCost = round2(standardQty * (1 + wastage) * standardRate);
                return {
                    bomId: id,
                    materialName: item.materialName,
                    materialCategory: item.materialCategory || null,
                    standardQty,
                    unit: item.unit || 'kg',
                    wastagePercent: parseFloat(String(item.wastagePercent)) || 0,
                    standardRate,
                    standardCost,
                    tenantId,
                };
            }),
        });
        const updatedBOM = await prisma_1.default.billOfMaterial.update({
            where: { id },
            data: {
                version: nextVersion,
                status: 'pending_approval',
                standardCostPerCuM: newCost,
                approvedBy: null,
                approvedAt: null,
            },
            include: { items: true, revisions: true },
        });
        await (0, audit_1.logActivity)(req.user.userId, req.user.email, tenantId, 'REVISE', 'BillOfMaterial', `Created Revision v${nextVersion} for BOM ${updatedBOM.name}`);
        res.json(updatedBOM);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating BOM revision', error: error.message });
    }
};
exports.createBOMRevision = createBOMRevision;
// 6. Submit BOM for Approval
const submitBOMForApproval = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const bom = await prisma_1.default.billOfMaterial.update({
            where: { id },
            data: { status: 'pending_approval' },
            include: { items: true },
        });
        res.json(bom);
    }
    catch (error) {
        res.status(500).json({ message: 'Error submitting BOM for approval', error: error.message });
    }
};
exports.submitBOMForApproval = submitBOMForApproval;
// 7. Approve BOM (Role: Admin / Super Admin / Manager)
const approveBOM = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        const bom = await prisma_1.default.billOfMaterial.findFirst({ where: { id, tenantId } });
        if (!bom)
            return res.status(404).json({ message: 'BOM not found' });
        await prisma_1.default.billOfMaterial.updateMany({
            where: {
                tenantId,
                gradeName: bom.gradeName,
                siteId: bom.siteId,
                id: { not: id },
                status: 'approved',
            },
            data: { status: 'archived', effectiveTo: new Date() },
        });
        const approved = await prisma_1.default.billOfMaterial.update({
            where: { id },
            data: {
                status: 'approved',
                approvedBy: req.user.email,
                approvedAt: new Date(),
                effectiveFrom: new Date(),
            },
            include: { items: true },
        });
        await (0, audit_1.logActivity)(req.user.userId, req.user.email, tenantId, 'APPROVE', 'BillOfMaterial', `Approved BOM ${approved.name} (v${approved.version}) for ${approved.gradeName}`);
        res.json(approved);
    }
    catch (error) {
        res.status(500).json({ message: 'Error approving BOM', error: error.message });
    }
};
exports.approveBOM = approveBOM;
// 8. Delete BOM
const deleteBOM = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = req.params.id;
        await prisma_1.default.billOfMaterial.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'BOM deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting BOM', error: error.message });
    }
};
exports.deleteBOM = deleteBOM;
// 9. Standard vs Actual Consumption & Cost Comparison
const getBOMVsActualComparison = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { siteId, month, year, startDate, endDate } = req.query;
        let start;
        let end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        }
        else {
            const now = new Date();
            const y = year ? parseInt(year, 10) : now.getFullYear();
            const m = month ? parseInt(month, 10) - 1 : now.getMonth();
            start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
            end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
        }
        const siteFilter = siteId && siteId !== 'all' ? { siteId } : {};
        const productions = await prisma_1.default.production.findMany({
            where: {
                tenantId,
                date: { gte: start, lt: end },
                isRejected: false,
                ...siteFilter,
            },
        });
        const productionByGrade = {};
        let totalCuM = 0;
        productions.forEach((p) => {
            const g = (p.grade || 'M25').trim().toUpperCase();
            const qty = p.amount || 0;
            productionByGrade[g] = (productionByGrade[g] || 0) + qty;
            totalCuM += qty;
        });
        const approvedBOMs = await prisma_1.default.billOfMaterial.findMany({
            where: {
                tenantId,
                status: 'approved',
                ...(siteId && siteId !== 'all' ? { OR: [{ siteId }, { siteId: null }] } : {}),
            },
            include: { items: true },
        });
        const bomByGrade = {};
        approvedBOMs.forEach((bom) => {
            const g = bom.gradeName.trim().toUpperCase();
            if (!bomByGrade[g] || bom.version > bomByGrade[g].version) {
                bomByGrade[g] = bom;
            }
        });
        const standardTotalsByMaterial = {};
        const gradeBreakdowns = [];
        Object.entries(productionByGrade).forEach(([grade, cum]) => {
            const bom = bomByGrade[grade];
            const gradeItems = [];
            let gradeStdCost = 0;
            if (bom && bom.items) {
                bom.items.forEach((item) => {
                    const mat = item.materialName.trim();
                    const effectivePerCuM = item.standardQty * (1 + (item.wastagePercent || 0) / 100);
                    const totalStdQty = effectivePerCuM * cum;
                    const totalCost = totalStdQty * (item.standardRate || 0);
                    gradeStdCost += totalCost;
                    if (!standardTotalsByMaterial[mat]) {
                        standardTotalsByMaterial[mat] = { stdQty: 0, unit: item.unit, stdCost: 0, stdRate: item.standardRate };
                    }
                    standardTotalsByMaterial[mat].stdQty += totalStdQty;
                    standardTotalsByMaterial[mat].stdCost += totalCost;
                    gradeItems.push({
                        material: mat,
                        standardPerCuM: round2(effectivePerCuM),
                        unit: item.unit,
                        totalStandardQty: round2(totalStdQty),
                        rate: item.standardRate,
                        totalCost: round2(totalCost),
                    });
                });
            }
            gradeBreakdowns.push({
                grade,
                productionCuM: round2(cum),
                hasApprovedBOM: !!bom,
                bomVersion: bom ? bom.version : null,
                standardCostPerCuM: bom ? bom.standardCostPerCuM : 0,
                totalStandardCost: round2(gradeStdCost),
                items: gradeItems,
            });
        });
        const consumptions = await prisma_1.default.consumption.findMany({
            where: {
                tenantId,
                date: { gte: start, lt: end },
                isRejected: false,
                ...siteFilter,
            },
        });
        const inwards = await prisma_1.default.materialInward.findMany({
            where: {
                tenantId,
                date: { gte: start, lt: end },
                ...siteFilter,
            },
        });
        const inwardRates = {};
        inwards.forEach((row) => {
            const key = (row.materialName || '').trim();
            if (!key)
                return;
            if (!inwardRates[key])
                inwardRates[key] = { totalVal: 0, totalQty: 0 };
            inwardRates[key].totalVal += (row.unitPrice || 0) * (row.quantity || 0);
            inwardRates[key].totalQty += (row.quantity || 0);
        });
        const actualsByMaterial = {};
        consumptions.forEach((c) => {
            const mat = (c.material || '').trim();
            if (!mat)
                return;
            const rateObj = inwardRates[mat];
            const avgRate = c.unitPrice != null ? c.unitPrice : rateObj && rateObj.totalQty > 0 ? rateObj.totalVal / rateObj.totalQty : 0;
            const cost = (c.amount || 0) * avgRate;
            if (!actualsByMaterial[mat]) {
                actualsByMaterial[mat] = { actualQty: 0, unit: c.unit || 'MT', actualCost: 0 };
            }
            actualsByMaterial[mat].actualQty += c.amount || 0;
            actualsByMaterial[mat].actualCost += cost;
        });
        const allMaterials = Array.from(new Set([...Object.keys(standardTotalsByMaterial), ...Object.keys(actualsByMaterial)]));
        const comparison = allMaterials.map((mat) => {
            const std = standardTotalsByMaterial[mat] || { stdQty: 0, unit: 'kg', stdCost: 0, stdRate: 0 };
            const act = actualsByMaterial[mat] || { actualQty: 0, unit: std.unit, actualCost: 0 };
            const qtyVariance = round2(act.actualQty - std.stdQty);
            const costVariance = round2(act.actualCost - std.stdCost);
            const variancePercent = std.stdQty > 0 ? round2((qtyVariance / std.stdQty) * 100) : 0;
            return {
                material: mat,
                unit: std.unit || act.unit,
                standardQty: round2(std.stdQty),
                actualQty: round2(act.actualQty),
                qtyVariance,
                variancePercent,
                standardCost: round2(std.stdCost),
                actualCost: round2(act.actualCost),
                costVariance,
                status: Math.abs(variancePercent) <= 5 ? 'normal' : variancePercent > 5 ? 'over_consumed' : 'under_consumed',
            };
        });
        res.json({
            totalProductionCuM: round2(totalCuM),
            period: { start, end },
            gradeBreakdowns,
            comparison,
            warnings: [
                ...Object.keys(productionByGrade).filter(g => !bomByGrade[g]).map(g => `Grade ${g} (${productionByGrade[g]} CuM) has no approved BOM.`),
                consumptions.length === 0 ? 'No actual consumption records found for this period.' : null,
            ].filter(Boolean),
        });
    }
    catch (error) {
        console.error('Error in BOM vs actual comparison:', error);
        res.status(500).json({ message: 'Error calculating BOM comparison', error: error.message });
    }
};
exports.getBOMVsActualComparison = getBOMVsActualComparison;
