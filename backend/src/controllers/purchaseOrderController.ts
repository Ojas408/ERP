import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getPurchaseOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { vendor: true },
      orderBy: { date: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { orderNumber, date, vendorId, totalAmount, status, items } = req.body;
  try {
    const order = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        orderNumber,
        date: date ? new Date(date) : undefined,
        vendorId,
        totalAmount: parseFloat(totalAmount),
        status,
        items,
      },
    });
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  const { orderNumber, date, vendorId, totalAmount, status, items } = req.body;
  try {
    await prisma.purchaseOrder.updateMany({
      where: { id, tenantId },
      data: {
        orderNumber,
        date: date ? new Date(date) : undefined,
        vendorId,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
        status,
        items,
      },
    });
    const order = await prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  try {
    await prisma.purchaseOrder.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    next(error);
  }
};
