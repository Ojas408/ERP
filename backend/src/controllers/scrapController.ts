import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getScraps = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const scraps = await prisma.scrap.findMany({
      where: { tenantId },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(scraps);
  } catch (error) {
    next(error);
  }
};

export const createScrap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const { date, materialType, quantity, unit, siteId, saleStatus, saleValue, buyerName, remarks } = req.body;
  try {
    const scrap = await prisma.scrap.create({
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
    await logActivity(userId, email, tenantId, 'CREATE', 'Scrap', `Created scrap record: ${scrap.materialType} (${scrap.quantity} ${scrap.unit})`);
    res.status(201).json(scrap);
  } catch (error) {
    next(error);
  }
};

export const updateScrap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  const { date, materialType, quantity, unit, siteId, saleStatus, saleValue, buyerName, remarks } = req.body;
  try {
    await prisma.scrap.updateMany({
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
    const scrap = await prisma.scrap.findFirst({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'Scrap', `Updated scrap record ID: ${id}`);
    res.json(scrap);
  } catch (error) {
    next(error);
  }
};

export const deleteScrap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  try {
    await prisma.scrap.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'Scrap', `Deleted scrap record ID: ${id}`);
    res.json({ message: 'Scrap record deleted successfully' });
  } catch (error) {
    next(error);
  }
};
