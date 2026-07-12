import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

export const getEmployees = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const employees = await prisma.employee.findMany({ where: { tenantId } });
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    if (Array.isArray(data)) {
      const employees = await prisma.$transaction(
        data.map(item => prisma.employee.create({
          data: {
            tenantId,
            employeeCode: item.employeeCode || undefined,
            name: item.name,
            position: item.position || 'Staff',
            department: item.department || undefined,
            designation: item.designation || undefined,
            contact: item.contact || undefined,
            salary: parseFloat(item.salary) || 0,
            status: item.status || 'active',
            joinedDate: item.joinedDate ? new Date(item.joinedDate) : undefined,
          }
        }))
      );
      await logActivity(userId, email, tenantId, 'BULK_CREATE', 'Employee', `Imported ${employees.length} employees`);
      res.status(201).json(employees);
    } else {
      const employee = await prisma.employee.create({
        data: {
          tenantId,
          employeeCode: data.employeeCode || undefined,
          name: data.name,
          position: data.position || 'Staff',
          department: data.department || undefined,
          designation: data.designation || undefined,
          contact: data.contact || undefined,
          salary: parseFloat(data.salary) || 0,
          status: data.status || 'active',
          joinedDate: data.joinedDate ? new Date(data.joinedDate) : undefined,
        },
      });
      await logActivity(userId, email, tenantId, 'CREATE', 'Employee', `Created employee: ${employee.name}`);
      res.status(201).json(employee);
    }
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const { userId, email } = req.user!;
    const id = req.params.id as string;
    await prisma.employee.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'Employee', `Deleted employee ID: ${id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const { userId, email } = req.user!;
    const id = req.params.id as string;
    const { employeeCode, name, position, department, designation, contact, salary, status, joinedDate } = req.body;
    await prisma.employee.updateMany({
      where: { id, tenantId },
      data: {
        employeeCode,
        name,
        position,
        department,
        designation,
        contact,
        salary: salary !== undefined ? parseFloat(salary) : undefined,
        status,
        joinedDate: joinedDate ? new Date(joinedDate) : undefined,
      },
    });
    const employee = await prisma.employee.findFirst({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'Employee', `Updated employee ID: ${id}`);
    res.json(employee);
  } catch (error) {
    next(error);
  }
};
