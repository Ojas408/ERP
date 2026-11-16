import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getSites = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const sites = await prisma.site.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            productions: true,
            materialInwards: true,
            consumptions: true,
            vehicles: true,
            scraps: true,
            overheadEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sites' });
  }
};

export const getSiteById = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  try {
    const site = await prisma.site.findFirst({
      where: { id, tenantId },
      include: {
        productions: { take: 10, orderBy: { createdAt: 'desc' } },
        materialInwards: { take: 10, orderBy: { createdAt: 'desc' } },
        consumptions: { take: 10, orderBy: { createdAt: 'desc' } },
        vehicles: { take: 10 },
        _count: {
          select: {
            productions: true,
            materialInwards: true,
            consumptions: true,
            vehicles: true,
            scraps: true,
            overheadEntries: true,
          },
        },
      },
    });
    if (!site) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(site);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project details' });
  }
};

export const createSite = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { name, location, status, clientName, managerName, budget, spent, progress, startDate, endDate, description } = req.body;
  try {
    const site = await prisma.site.create({
      data: {
        tenantId,
        name,
        location,
        status: status || 'active',
        clientName: clientName || null,
        managerName: managerName || null,
        budget: budget ? parseFloat(budget) : 5000000,
        spent: spent ? parseFloat(spent) : 0,
        progress: progress ? parseFloat(progress) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
    });
    res.status(201).json(site);
  } catch (error) {
    res.status(500).json({ message: 'Error creating site' });
  }
};

export const updateSite = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  const { name, location, status, clientName, managerName, budget, spent, progress, startDate, endDate, description } = req.body;
  try {
    await prisma.site.updateMany({
      where: { id, tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status }),
        ...(clientName !== undefined && { clientName }),
        ...(managerName !== undefined && { managerName }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(spent !== undefined && { spent: parseFloat(spent) }),
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(description !== undefined && { description }),
      },
    });
    const site = await prisma.site.findFirst({ where: { id, tenantId } });
    res.json(site);
  } catch (error) {
    res.status(500).json({ message: 'Error updating site' });
  }
};

export const deleteSite = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  try {
    await prisma.site.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting site' });
  }
};
