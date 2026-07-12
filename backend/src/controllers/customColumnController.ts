import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCustomColumns = async (req: Request, res: Response) => {
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
    console.error('Get custom columns error:', error);
    res.status(500).json({ message: 'Failed to fetch custom columns' });
  }
};

export const createCustomColumn = async (req: Request, res: Response) => {
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
    console.error('Create custom column error:', error);
    res.status(500).json({ message: 'Failed to create custom column' });
  }
};

export const deleteCustomColumn = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const id = req.params.id as string;

    const column = await prisma.customColumn.findUnique({
      where: { id },
    });

    if (!column || column.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Custom column not found' });
    }

    await prisma.customColumn.delete({
      where: { id },
    });

    res.json({ message: 'Custom column deleted successfully' });
  } catch (error) {
    console.error('Delete custom column error:', error);
    res.status(500).json({ message: 'Failed to delete custom column' });
  }
};
