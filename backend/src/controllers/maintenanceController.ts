import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getMaintenances = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const maintenances = await prisma.maintenance.findMany({
      where: { tenantId },
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    });
    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenances' });
  }
};

export const createMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId, type, cost, description, date, status } = req.body;
    
    const maintenance = await prisma.$transaction(async (tx) => {
      const newMaintenance = await tx.maintenance.create({
        data: {
          tenantId,
          vehicleId,
          type,
          cost: parseFloat(cost),
          description,
          status,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Update vehicle status if needed
      if (status === 'pending') {
        await tx.vehicle.updateMany({
          where: { id: vehicleId, tenantId },
          data: { status: 'maintenance' },
        });
      } else {
         await tx.vehicle.updateMany({
          where: { id: vehicleId, tenantId },
          data: { lastService: date ? new Date(date) : new Date(), status: 'available' },
        });
      }
      return newMaintenance;
    });

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create maintenance' });
  }
};

export const updateMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = req.params.id as string;
    const { vehicleId, type, cost, description, date, status } = req.body;
    await prisma.maintenance.updateMany({
      where: { id, tenantId },
      data: {
        vehicleId,
        type,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        description,
        status,
        date: date ? new Date(date) : undefined,
      },
    });
    const maintenance = await prisma.maintenance.findFirst({ where: { id, tenantId } });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update maintenance' });
  }
};

export const deleteMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = req.params.id as string;
    await prisma.maintenance.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete maintenance' });
  }
};
