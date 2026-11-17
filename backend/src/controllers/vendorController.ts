import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getVendors = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const vendors = await prisma.vendor.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors' });
  }
};

export const createVendor = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (Array.isArray(req.body)) {
    try {
      const records = req.body
        .filter((item: any) => item && item.name && String(item.name).trim() !== '')
        .map((item: any) => ({
          tenantId,
          name: String(item.name).trim(),
          contact: item.contact ? String(item.contact).trim() : null,
          category: item.category ? String(item.category).trim() : 'General Supplier',
        }));
      if (records.length === 0) {
        return res.status(400).json({ message: 'No valid vendor records provided' });
      }
      await prisma.vendor.createMany({ data: records });
      return res.status(201).json({ message: 'Vendors imported successfully', count: records.length });
    } catch (error) {
      return res.status(500).json({ message: 'Error importing vendors' });
    }
  }

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
