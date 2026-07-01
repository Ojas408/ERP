import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getVehicleMovements = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const movements = await prisma.vehicleMovement.findMany({
      where: { tenantId },
      include: { vehicle: true },
      orderBy: { startTime: 'desc' },
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle movements' });
  }
};

export const createVehicleMovement = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { vehicleId, fromLocation, toLocation, startTime, endTime, distance, fuelConsumed } = req.body;
  try {
    const movement = await prisma.vehicleMovement.create({
      data: {
        tenantId,
        vehicleId,
        fromLocation,
        toLocation,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        distance: distance ? parseFloat(distance) : undefined,
        fuelConsumed: fuelConsumed ? parseFloat(fuelConsumed) : undefined,
      },
    });
    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vehicle movement' });
  }
};

export const updateVehicleMovement = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  const { vehicleId, fromLocation, toLocation, startTime, endTime, distance, fuelConsumed } = req.body;
  try {
    await prisma.vehicleMovement.updateMany({
      where: { id, tenantId },
      data: {
        vehicleId,
        fromLocation,
        toLocation,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        distance: distance !== undefined ? parseFloat(distance) : undefined,
        fuelConsumed: fuelConsumed !== undefined ? parseFloat(fuelConsumed) : undefined,
      },
    });
    const movement = await prisma.vehicleMovement.findFirst({ where: { id, tenantId } });
    res.json(movement);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle movement' });
  }
};

export const deleteVehicleMovement = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const id = req.params.id as string;
  try {
    await prisma.vehicleMovement.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Vehicle movement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle movement' });
  }
};
