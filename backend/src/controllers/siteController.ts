import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getSites = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const sites = await prisma.site.findMany({ where: { tenantId } });
    res.json(sites);
  } catch (error) {
    next(error);
  }
};

export const createSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { name, location, status } = req.body;
  try {
    const site = await prisma.site.create({
      data: { tenantId, name, location, status },
    });
    res.status(201).json(site);
  } catch (error) {
    next(error);
  }
};

export const updateSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  const { name, location, status } = req.body;
  try {
    await prisma.site.updateMany({
      where: { id, tenantId },
      data: { name, location, status },
    });
    const site = await prisma.site.findFirst({ where: { id, tenantId } });
    res.json(site);
  } catch (error) {
    next(error);
  }
};

export const deleteSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  try {
    await prisma.site.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    next(error);
  }
};
