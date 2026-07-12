import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCustomColumns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { entity } = req.query;

    const columns = await prisma.customColumn.findMany({
      where: {
        tenantId,
        ...(entity ? { entity: String(entity) } : {}),
      },
    });

    res.json(columns);
  } catch (error) {
    next(error);
  }
};

export const createCustomColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { entity, name, key, type } = req.body;

    const column = await prisma.customColumn.create({
      data: {
        entity,
        name,
        key,
        type,
        tenantId,
      },
    });

    res.status(201).json(column);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const column = await prisma.customColumn.findUnique({
      where: { id: String(id) },
    });

    if (!column || column.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Custom column not found' });
    }

    await prisma.customColumn.delete({
      where: { id: String(id) },
    });

    res.json({ message: 'Custom column deleted successfully' });
  } catch (error) {
    next(error);
  }
};
