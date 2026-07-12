import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getChallans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const challans = await prisma.challan.findMany({
      where: { tenantId },
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    });
    res.json(challans);
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    if (Array.isArray(data)) {
      const challans = await prisma.$transaction(
        data.map(item => prisma.challan.create({
          data: {
            tenantId,
            challanNumber: item.challanNumber,
            date: item.date ? new Date(item.date) : new Date(),
            vehicleId: item.vehicleId,
            material: item.material,
            quantity: parseFloat(item.quantity) || 0,
            destination: item.destination,
            status: item.status || 'pending',
          }
        }))
      );
      await logActivity(userId, email, tenantId, 'BULK_CREATE', 'Challan', `Imported ${challans.length} challans`);
      res.status(201).json(challans);
    } else {
      const challan = await prisma.challan.create({
        data: {
          tenantId,
          challanNumber: data.challanNumber,
          date: data.date ? new Date(data.date) : undefined,
          vehicleId: data.vehicleId,
          material: data.material,
          quantity: parseFloat(data.quantity),
          destination: data.destination,
          status: data.status || 'pending',
        },
      });
      await logActivity(userId, email, tenantId, 'CREATE', 'Challan', `Created challan: ${challan.challanNumber}`);
      res.status(201).json(challan);
    }
  } catch (error) {
    next(error);
  }
};

export const updateChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  const { challanNumber, date, vehicleId, material, quantity, destination, status } = req.body;
  try {
    await prisma.challan.updateMany({
      where: { id, tenantId },
      data: {
        challanNumber,
        date: date ? new Date(date) : undefined,
        vehicleId,
        material,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        destination,
        status,
      },
    });
    const challan = await prisma.challan.findFirst({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'Challan', `Updated challan ID: ${id}`);
    res.json(challan);
  } catch (error) {
    next(error);
  }
};

export const deleteChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  try {
    await prisma.challan.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'Challan', `Deleted challan ID: ${id}`);
    res.json({ message: 'Challan deleted successfully' });
  } catch (error) {
    next(error);
  }
};
