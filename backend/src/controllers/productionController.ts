import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getProductions = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const productions = await prisma.production.findMany({
      where: { tenantId },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching productions' });
  }
};

export const createProduction = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    if (Array.isArray(data)) {
      const productions = await prisma.$transaction(
        data.map(item => prisma.production.create({
          data: {
            tenantId,
            amount: parseFloat(item.amount) || 0,
            unit: item.unit || 'tons',
            siteId: item.siteId || undefined,
            notes: item.notes || null,
            quality: item.quality || null,
            grade: item.grade || item.quality || null,
            productionType: item.productionType || null,
            towerName: item.towerName || null,
            isRejected: item.isRejected === true || item.isRejected === 'true',
            rejectionReason: item.rejectionReason || null,
            date: item.date ? new Date(item.date) : new Date(),
          }
        }))
      );
      await logActivity(userId, email, tenantId, 'BULK_CREATE', 'Production', `Imported ${productions.length} production logs`);
      res.status(201).json(productions);
    } else {
      const production = await prisma.production.create({
        data: {
          tenantId,
          amount: parseFloat(data.amount),
          unit: data.unit,
          siteId: data.siteId,
          notes: data.notes,
          quality: data.quality || null,
          grade: data.grade || data.quality || null,
          productionType: data.productionType || null,
          towerName: data.towerName || null,
          isRejected: data.isRejected === true || data.isRejected === 'true',
          rejectionReason: data.rejectionReason || null,
          date: data.date ? new Date(data.date) : undefined,
        },
      });
      await logActivity(userId, email, tenantId, 'CREATE', 'Production', `Created production log amount: ${production.amount}`);
      res.status(201).json(production);
    }
  } catch (error) {
    console.error('Error creating production:', error);
    res.status(500).json({ message: 'Error creating production' });
  }
};

export const deleteProduction = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenantId;
    const { userId, email } = req.user!;
    await prisma.production.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'Production', `Deleted production log ID: ${id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete production' });
  }
};

export const updateProduction = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenantId;
    const { userId, email } = req.user!;
    const { amount, unit, siteId, notes, date, quality, grade, productionType, towerName, isRejected, rejectionReason } = req.body;
    await prisma.production.updateMany({
      where: { id, tenantId },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        unit,
        siteId,
        notes,
        quality,
        grade,
        productionType,
        towerName,
        isRejected: isRejected !== undefined ? (isRejected === true || isRejected === 'true') : undefined,
        rejectionReason,
        date: date ? new Date(date) : undefined,
      },
    });
    
    const production = await prisma.production.findFirst({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'Production', `Updated production log ID: ${id}`);
    res.json(production);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update production' });
  }
};
