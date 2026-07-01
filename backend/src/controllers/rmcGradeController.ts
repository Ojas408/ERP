import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getRmcGrades = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const grades = await prisma.rMCGrade.findMany({
      where: { tenantId },
      orderBy: { grade: 'asc' },
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching RMC grades' });
  }
};

export const createRmcGrade = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const { grade, mixRatio, cementContent, waterCementRatio, admixture, description } = req.body;
  try {
    const rmcGrade = await prisma.rMCGrade.create({
      data: {
        tenantId,
        grade,
        mixRatio,
        cementContent: cementContent ? parseFloat(cementContent) : null,
        waterCementRatio: waterCementRatio ? parseFloat(waterCementRatio) : null,
        admixture,
        description,
      },
    });
    await logActivity(userId, email, tenantId, 'CREATE', 'RMCGrade', `Created RMC Grade: ${rmcGrade.grade}`);
    res.status(201).json(rmcGrade);
  } catch (error) {
    console.error('Error creating RMC grade:', error);
    res.status(500).json({ message: 'Error creating RMC grade' });
  }
};

export const updateRmcGrade = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  const { grade, mixRatio, cementContent, waterCementRatio, admixture, description } = req.body;
  try {
    await prisma.rMCGrade.updateMany({
      where: { id, tenantId },
      data: {
        grade,
        mixRatio,
        cementContent: cementContent !== undefined ? (cementContent ? parseFloat(cementContent) : null) : undefined,
        waterCementRatio: waterCementRatio !== undefined ? (waterCementRatio ? parseFloat(waterCementRatio) : null) : undefined,
        admixture,
        description,
      },
    });
    const rmcGrade = await prisma.rMCGrade.findFirst({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'RMCGrade', `Updated RMC Grade ID: ${id}`);
    res.json(rmcGrade);
  } catch (error) {
    res.status(500).json({ message: 'Error updating RMC grade' });
  }
};

export const deleteRmcGrade = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  try {
    await prisma.rMCGrade.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'RMCGrade', `Deleted RMC Grade ID: ${id}`);
    res.json({ message: 'RMC grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting RMC grade' });
  }
};
