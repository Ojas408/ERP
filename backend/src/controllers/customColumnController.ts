import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getCustomColumns = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { entity } = req.query;

    const columns = await prisma.customColumn.findMany({
      where: {
        tenantId,
        ...(entity ? { entity: String(entity) } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(columns);
  } catch (error) {
    console.error('Get custom columns error:', error);
    res.status(500).json({ message: 'Failed to fetch custom columns' });
  }
};

export const createCustomColumn = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { entity, name, type } = req.body;

    if (!entity || !name || !type) {
      return res.status(400).json({ message: 'entity, name and type are required' });
    }

    const key = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!key) {
      return res.status(400).json({ message: 'name must contain at least one alphanumeric character' });
    }

    const existing = await prisma.customColumn.findFirst({
      where: { tenantId, entity: String(entity), key },
    });
    if (existing) {
      return res.status(409).json({ message: 'A column with this name already exists for this entity' });
    }

    const column = await prisma.customColumn.create({
      data: {
        entity: String(entity),
        name: String(name).trim(),
        key,
        type: String(type),
        tenantId,
      },
    });

    res.status(201).json(column);
  } catch (error) {
    console.error('Create custom column error:', error);
    res.status(500).json({ message: 'Failed to create custom column' });
  }
};

export const deleteCustomColumn = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
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
