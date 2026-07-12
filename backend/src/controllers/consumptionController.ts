import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getConsumptions = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const consumptions = await prisma.consumption.findMany({
      where: { tenantId },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(consumptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch consumptions' });
  }
};

export const createConsumption = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { material, amount, unit, siteId, date, isRejected, rejectionReason } = req.body;
    const consumption = await prisma.consumption.create({
      data: {
        tenantId,
        material,
        amount: parseFloat(amount),
        unit,
        siteId,
        isRejected: isRejected === true || isRejected === 'true',
        rejectionReason: rejectionReason || null,
        date: date ? new Date(date) : new Date(),
        customData: req.body.customData || undefined,
      },
    });
    res.json(consumption);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create consumption' });
  }
};

export const updateConsumption = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = req.params.id as string;
    const { material, amount, unit, siteId, date, isRejected, rejectionReason } = req.body;
    await prisma.consumption.updateMany({
      where: { id, tenantId },
      data: {
        material,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        unit,
        siteId,
        isRejected: isRejected !== undefined ? (isRejected === true || isRejected === 'true') : undefined,
        rejectionReason,
        date: date ? new Date(date) : undefined,
        customData: req.body.customData !== undefined ? req.body.customData : undefined,
      },
    });
    const consumption = await prisma.consumption.findFirst({ where: { id, tenantId } });
    res.json(consumption);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update consumption' });
  }
};

export const deleteConsumption = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = req.params.id as string;
    await prisma.consumption.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Consumption deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete consumption' });
  }
};
