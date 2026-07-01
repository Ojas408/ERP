import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getVendors = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const vendors = await prisma.vendor.findMany({ where: { tenantId } });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors' });
  }
};

export const createVendor = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { name, contact, category } = req.body;
  try {
    const vendor = await prisma.vendor.create({
      data: { tenantId, name, contact, category },
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vendor' });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  const { name, contact, category } = req.body;
  try {
    await prisma.vendor.updateMany({
      where: { id, tenantId },
      data: { name, contact, category },
    });
    const vendor = await prisma.vendor.findFirst({ where: { id, tenantId } });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor' });
  }
};

export const deleteVendor = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  try {
    await prisma.vendor.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vendor' });
  }
};
