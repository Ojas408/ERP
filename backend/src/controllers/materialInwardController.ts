import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

function parseOptionalFloat(v: any) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export const getMaterialInwards = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const inwards = await prisma.materialInward.findMany({
      where: { tenantId },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(inwards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching material inward records' });
  }
};

export const createMaterialInward = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    if (Array.isArray(data)) {
      const inwards = await prisma.$transaction(
        data.map((item) =>
          prisma.materialInward.create({
            data: {
              tenantId,
              inwardNumber: item.inwardNumber,
              date: item.date ? new Date(item.date) : new Date(),
              materialName: item.materialName,
              quantity: parseFloat(item.quantity) || 0,
              unit: item.unit || 'units',
              supplierName: item.supplierName,
              vehicleNumber: item.vehicleNumber,
              challanNumber: item.challanNumber,
              siteId: item.siteId,
              receivedBy: item.receivedBy,
              remarks: item.remarks,
              unitPrice: parseOptionalFloat(item.unitPrice),
              sourceLocation: item.sourceLocation || null,
              brand: item.brand || null,
              mfgLocation: item.mfgLocation || null,
            },
          })
        )
      );
      await logActivity(userId, email, tenantId, 'BULK_CREATE', 'MaterialInward', `Imported ${inwards.length} inward logs`);
      res.status(201).json(inwards);
    } else {
      const inward = await prisma.materialInward.create({
        data: {
          tenantId,
          inwardNumber: data.inwardNumber,
          date: data.date ? new Date(data.date) : new Date(),
          materialName: data.materialName,
          quantity: parseFloat(data.quantity) || 0,
          unit: data.unit || 'units',
          supplierName: data.supplierName,
          vehicleNumber: data.vehicleNumber,
          challanNumber: data.challanNumber,
          siteId: data.siteId,
          receivedBy: data.receivedBy,
          remarks: data.remarks,
          unitPrice: parseOptionalFloat(data.unitPrice),
          sourceLocation: data.sourceLocation || null,
          brand: data.brand || null,
          mfgLocation: data.mfgLocation || null,
        },
      });
      await logActivity(userId, email, tenantId, 'CREATE', 'MaterialInward', `Created inward log: ${inward.inwardNumber}`);
      res.status(201).json(inward);
    }
  } catch (error) {
    console.error('Error creating inward entry:', error);
    res.status(500).json({ message: 'Error creating material inward log' });
  }
};

export const updateMaterialInward = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  const {
    inwardNumber,
    date,
    materialName,
    quantity,
    unit,
    supplierName,
    vehicleNumber,
    challanNumber,
    siteId,
    receivedBy,
    remarks,
    unitPrice,
    sourceLocation,
    brand,
    mfgLocation,
  } = req.body;
  try {
    await prisma.materialInward.updateMany({
      where: { id, tenantId },
      data: {
        inwardNumber,
        date: date ? new Date(date) : undefined,
        materialName,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit,
        supplierName,
        vehicleNumber,
        challanNumber,
        siteId,
        receivedBy,
        remarks,
        unitPrice: unitPrice !== undefined ? parseOptionalFloat(unitPrice) : undefined,
        sourceLocation: sourceLocation !== undefined ? sourceLocation || null : undefined,
        brand: brand !== undefined ? brand || null : undefined,
        mfgLocation: mfgLocation !== undefined ? mfgLocation || null : undefined,
      },
    });
    const inward = await prisma.materialInward.findFirst({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'MaterialInward', `Updated inward ID: ${id}`);
    res.json(inward);
  } catch (error) {
    res.status(500).json({ message: 'Error updating material inward log' });
  }
};

export const deleteMaterialInward = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  try {
    await prisma.materialInward.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'MaterialInward', `Deleted inward ID: ${id}`);
    res.json({ message: 'Material inward log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting material inward log' });
  }
};
