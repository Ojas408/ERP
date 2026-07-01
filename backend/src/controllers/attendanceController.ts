import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getAttendances = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const attendances = await prisma.attendance.findMany({
      where: { tenantId },
      include: { employee: true },
      orderBy: { date: 'desc' },
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
};

export const createAttendance = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    if (Array.isArray(data)) {
      // We need to resolve employee ID from employee code if necessary, or just insert direct employeeId
      // Let's support both: direct employeeId, or if not provided look up by employeeCode
      const attendanceRecords = await prisma.$transaction(
        data.map(item => {
          return prisma.attendance.create({
            data: {
              tenantId,
              employeeId: item.employeeId,
              hoursWorked: parseFloat(item.hoursWorked) || 8,
              overtime: parseFloat(item.overtime || 0),
              status: item.status || 'present',
              date: item.date ? new Date(item.date) : new Date(),
            }
          });
        })
      );
      await logActivity(userId, email, tenantId, 'BULK_CREATE', 'Attendance', `Imported ${attendanceRecords.length} attendance logs`);
      res.status(201).json(attendanceRecords);
    } else {
      const attendance = await prisma.attendance.create({
        data: {
          tenantId,
          employeeId: data.employeeId,
          hoursWorked: parseFloat(data.hoursWorked),
          overtime: parseFloat(data.overtime || 0),
          status: data.status,
          date: data.date ? new Date(data.date) : new Date(),
        },
      });
      await logActivity(userId, email, tenantId, 'CREATE', 'Attendance', `Marked attendance for employee ID: ${data.employeeId}`);
      res.status(201).json(attendance);
    }
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ error: 'Failed to create attendance' });
  }
};
