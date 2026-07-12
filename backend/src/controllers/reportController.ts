import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
const productionRate = 1200;

const monthName = (date: Date) => date.toLocaleString('en-US', { month: 'short' });
const fullMonthName = (date: Date) => date.toLocaleString('en-US', { month: 'long' });
const formatTime = (date?: Date | null) =>
  date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const percent = (value: number, total: number) => (total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0);

const startOfWeek = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
};

const durationHours = (start: Date, end?: Date | null) => {
  const endTime = end ? end.getTime() : Date.now();
  return Math.max(0, (endTime - start.getTime()) / 36e5);
};

export const getBusinessReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const [productions, expenses, purchaseOrders, vehicles, maintenances, employees] = await Promise.all([
      prisma.production.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      prisma.expense.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      prisma.purchaseOrder.findMany({ where: { tenantId }, include: { vendor: true }, orderBy: { date: 'asc' } }),
      prisma.vehicle.findMany({ where: { tenantId } }),
      prisma.maintenance.findMany({ where: { tenantId } }),
      prisma.employee.findMany({ where: { tenantId } }),
    ]);

    const monthKeys = new Set<string>();
    productions.forEach((item) => monthKeys.add(monthName(item.date)));
    expenses.forEach((item) => monthKeys.add(monthName(item.date)));
    purchaseOrders.forEach((item) => monthKeys.add(monthName(item.date)));

    const revenueData = Array.from(monthKeys).map((month) => {
      const monthProduction = productions.filter((item) => monthName(item.date) === month);
      const monthExpenses = expenses.filter((item) => monthName(item.date) === month);
      const monthPurchaseOrders = purchaseOrders.filter((item) => monthName(item.date) === month);
      const revenue = sum(monthProduction.map((item) => item.amount * productionRate));
      const expenseTotal = sum(monthExpenses.map((item) => item.amount)) + sum(monthPurchaseOrders.map((item) => item.totalAmount));
      return {
        id: month,
        month,
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
      };
    });

    const totalRevenue = sum(revenueData.map((item) => item.revenue));
    const totalExpenses = sum(revenueData.map((item) => item.expenses));
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
    const previousRevenue = revenueData.at(-2)?.revenue || 0;
    const currentRevenue = revenueData.at(-1)?.revenue || 0;
    const revenueGrowth = previousRevenue > 0 ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : 0;

    const productionRevenue = sum(productions.map((item) => item.amount * productionRate));
    const purchaseRevenue = sum(purchaseOrders.filter((item) => item.status === 'received').map((item) => item.totalAmount));
    const revenueSources = [
      { name: 'Production Output', amount: productionRevenue },
      { name: 'Received Purchase Orders', amount: purchaseRevenue },
      { name: 'Other Operations', amount: Math.max(0, totalRevenue - productionRevenue - purchaseRevenue) },
    ].filter((item) => item.amount > 0);

    const revenueBySource = revenueSources.map((item, index) => ({
      id: item.name,
      name: item.name,
      amount: item.amount,
      value: percent(item.amount, sum(revenueSources.map((source) => source.amount))),
      color: colors[index % colors.length],
    }));

    const productionTarget = Math.max(500, productions.length * 500);
    const productionActual = sum(productions.map((item) => item.amount));
    const activeVehicles = vehicles.filter((item) => item.status === 'available' || item.status === 'in-use').length;
    const completedMaintenance = maintenances.filter((item) => item.status === 'completed').length;

    res.json({
      totals: {
        totalRevenue,
        totalExpenses,
        netProfit,
        margin,
        revenueGrowth,
        roi: totalExpenses > 0 ? Number(((netProfit / totalExpenses) * 100).toFixed(1)) : 0,
      },
      revenueData,
      revenueBySource,
      profitMargins: revenueData.map((item) => ({
        id: item.month,
        quarter: item.month,
        margin: item.revenue > 0 ? Number(((item.profit / item.revenue) * 100).toFixed(1)) : 0,
      })),
      performanceMetrics: [
        { id: 'production', metric: 'Production Efficiency', current: percent(productionActual, productionTarget), target: 85, benchmark: 80 },
        { id: 'growth', metric: 'Revenue Growth', current: Math.max(0, revenueGrowth), target: 8, benchmark: 6 },
        { id: 'margin', metric: 'Profit Margin', current: margin, target: 30, benchmark: 25 },
        { id: 'fleet', metric: 'Fleet Availability', current: percent(activeVehicles, vehicles.length), target: 90, benchmark: 80 },
        { id: 'maintenance', metric: 'Maintenance Closure', current: percent(completedMaintenance, maintenances.length), target: 90, benchmark: 75 },
        { id: 'workforce', metric: 'Active Workforce', current: percent(employees.filter((item) => item.status === 'active').length, employees.length), target: 95, benchmark: 85 },
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const getAccountsReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const [productions, expenses, purchaseOrders, vendors] = await Promise.all([
      prisma.production.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      prisma.expense.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      prisma.purchaseOrder.findMany({ where: { tenantId }, include: { vendor: true }, orderBy: { date: 'asc' } }),
      prisma.vendor.findMany({ where: { tenantId } }),
    ]);

    const productionRevenue = sum(productions.map((item) => item.amount * productionRate));
    const expenseByCategory = Array.from(
      expenses.reduce((map, item) => map.set(item.category, (map.get(item.category) || 0) + item.amount), new Map<string, number>()),
      ([category, amount]) => ({ category, amount })
    );
    const poTotal = sum(purchaseOrders.map((item) => item.totalAmount));

    const plData = [
      { id: 'income-production', type: 'Income', head: 'Production Revenue', amount: productionRevenue },
      ...purchaseOrders
        .filter((item) => item.status === 'received')
        .map((item) => ({ id: `income-${item.id}`, type: 'Income', head: `Received PO ${item.orderNumber}`, amount: item.totalAmount })),
      ...expenseByCategory.map((item) => ({ id: `expense-${item.category}`, type: 'Expense', head: item.category, amount: item.amount })),
      { id: 'expense-purchase-orders', type: 'Expense', head: 'Purchase Orders', amount: poTotal },
    ];

    const monthKeys = new Set<string>();
    productions.forEach((item) => monthKeys.add(monthName(item.date)));
    expenses.forEach((item) => monthKeys.add(monthName(item.date)));
    purchaseOrders.forEach((item) => monthKeys.add(monthName(item.date)));

    let runningBalance = 0;
    const cashFlowData = Array.from(monthKeys).map((month) => {
      const inflow = sum(productions.filter((item) => monthName(item.date) === month).map((item) => item.amount * productionRate)) / 100000;
      const outflow = (
        sum(expenses.filter((item) => monthName(item.date) === month).map((item) => item.amount)) +
        sum(purchaseOrders.filter((item) => monthName(item.date) === month).map((item) => item.totalAmount))
      ) / 100000;
      runningBalance += inflow - outflow;
      return { id: month, month, inflow: Number(inflow.toFixed(2)), outflow: Number(outflow.toFixed(2)), balance: Number(runningBalance.toFixed(2)) };
    });

    const gstData = cashFlowData.map((item, index) => {
      const taxable = Math.round(item.inflow * 100000);
      const cgst = Math.round(taxable * 0.05);
      const sgst = Math.round(taxable * 0.05);
      return {
        id: `gst-${item.month}`,
        month: item.month,
        taxable,
        cgst,
        sgst,
        igst: 0,
        total: cgst + sgst,
        status: index === cashFlowData.length - 1 ? 'Pending' : 'Filed',
      };
    });

    const receivables = productions.slice(-5).map((item, index) => ({
      id: `rec-${item.id}`,
      party: item.siteId ? 'Site Billing' : 'Production Billing',
      invoice: `INV-${item.id.slice(0, 8)}`,
      amount: item.amount * productionRate,
      dueDate: new Date(item.date.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysOverdue: index % 2 === 0 ? 0 : 3,
      status: index % 2 === 0 ? 'Due' : 'Overdue',
    }));

    const payables = purchaseOrders.slice(-5).map((item, index) => ({
      id: `pay-${item.id}`,
      party: item.vendor?.name || vendors[index % Math.max(1, vendors.length)]?.name || 'Vendor',
      invoice: item.orderNumber,
      amount: item.totalAmount,
      dueDate: new Date(item.date.getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysOverdue: item.status === 'pending' ? 2 : 0,
      status: item.status === 'pending' ? 'Overdue' : 'Due',
    }));

    res.json({ plData, cashFlowData, gstData, receivables, payables });
  } catch (error) {
    next(error);
  }
};

export const getEfficiencyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const [productions, vehicles, maintenances, attendances, movements] = await Promise.all([
      prisma.production.findMany({ where: { tenantId } }),
      prisma.vehicle.findMany({ where: { tenantId } }),
      prisma.maintenance.findMany({ where: { tenantId }, include: { vehicle: true } }),
      prisma.attendance.findMany({ where: { tenantId } }),
      prisma.vehicleMovement.findMany({ where: { tenantId }, include: { vehicle: true } }),
    ]);

    const productionTarget = Math.max(500, productions.length * 500);
    const machine = Math.min(100, Math.round(percent(sum(productions.map((item) => item.amount)), productionTarget)));
    const vehicle = Math.round(percent(vehicles.filter((item) => item.status !== 'maintenance').length, vehicles.length));
    const labor = Math.round(percent(sum(attendances.map((item) => item.hoursWorked)), Math.max(1, attendances.length * 8)));
    const downtimeHours = Math.round(sum(maintenances.map((item) => item.status === 'completed' ? 4 : 8)));

    const weeklyMap = new Map<string, { production: number; attendance: number; attendanceTarget: number; vehicleTrips: number }>();
    productions.forEach((item) => {
      const key = `Week ${Math.ceil(startOfWeek(item.date).getDate() / 7)}`;
      const current = weeklyMap.get(key) || { production: 0, attendance: 0, attendanceTarget: 0, vehicleTrips: 0 };
      current.production += item.amount;
      weeklyMap.set(key, current);
    });
    attendances.forEach((item) => {
      const key = `Week ${Math.ceil(startOfWeek(item.date).getDate() / 7)}`;
      const current = weeklyMap.get(key) || { production: 0, attendance: 0, attendanceTarget: 0, vehicleTrips: 0 };
      current.attendance += item.hoursWorked;
      current.attendanceTarget += 8;
      weeklyMap.set(key, current);
    });
    movements.forEach((item) => {
      const key = `Week ${Math.ceil(startOfWeek(item.startTime).getDate() / 7)}`;
      const current = weeklyMap.get(key) || { production: 0, attendance: 0, attendanceTarget: 0, vehicleTrips: 0 };
      current.vehicleTrips += 1;
      weeklyMap.set(key, current);
    });

    const weeklyEfficiency = Array.from(weeklyMap, ([week, item]) => ({
      id: week,
      week,
      machine: Math.min(100, Math.round(percent(item.production, 500))),
      vehicle: Math.min(100, Math.round(percent(item.vehicleTrips, Math.max(1, vehicles.length)))),
      labor: Math.min(100, Math.round(percent(item.attendance, Math.max(1, item.attendanceTarget)))),
    }));

    const downtimeAnalysis = [
      { id: 'scheduled', reason: 'Scheduled Maintenance', hours: maintenances.filter((item) => item.type === 'Routine').length * 4 },
      { id: 'breakdown', reason: 'Breakdown', hours: maintenances.filter((item) => item.type === 'Breakdown').length * 8 },
      { id: 'repair', reason: 'Repair', hours: maintenances.filter((item) => item.type === 'Repair').length * 6 },
      { id: 'waiting', reason: 'Waiting / Idle', hours: movements.filter((item) => !item.endTime).length * 2 },
    ].map((item) => ({ ...item, percentage: percent(item.hours, downtimeHours || 1) }));

    const equipmentEfficiency = vehicles.map((item) => {
      const maintenanceCount = maintenances.filter((record) => record.vehicleId === item.id).length;
      const movementCount = movements.filter((record) => record.vehicleId === item.id).length;
      const uptime = Math.max(50, 100 - maintenanceCount * 8);
      const utilization = Math.min(100, movementCount * 20);
      const efficiency = Math.round((uptime + utilization) / 2);
      return {
        id: item.id,
        equipment: item.plateNumber,
        uptime,
        utilization,
        efficiency,
        status: efficiency >= 85 ? 'excellent' : efficiency >= 70 ? 'good' : 'average',
      };
    });

    res.json({
      overallEfficiency: [
        { id: 'machine', category: 'Machine', value: machine, fill: colors[0] },
        { id: 'vehicle', category: 'Vehicle', value: vehicle, fill: colors[1] },
        { id: 'labor', category: 'Labor', value: labor, fill: colors[2] },
      ],
      weeklyEfficiency,
      downtimeAnalysis,
      equipmentEfficiency,
      totals: {
        overall: Math.round((machine + vehicle + labor) / 3),
        machine,
        vehicle,
        labor,
        downtimeHours,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTargetReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const [productions, expenses, maintenances, movements] = await Promise.all([
      prisma.production.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      prisma.expense.findMany({ where: { tenantId } }),
      prisma.maintenance.findMany({ where: { tenantId } }),
      prisma.vehicleMovement.findMany({ where: { tenantId } }),
    ]);

    const monthlyTargets = Array.from(
      productions.reduce((map, item) => {
        const key = fullMonthName(item.date);
        map.set(key, (map.get(key) || 0) + item.amount);
        return map;
      }, new Map<string, number>()),
      ([month, achieved]) => {
        const target = Math.max(500, Math.ceil(achieved * 1.1));
        return { id: month, month, target, achieved, percentage: percent(achieved, target) };
      }
    );

    const productionTotal = sum(productions.map((item) => item.amount));
    const productionTarget = Math.max(500, productions.length * 500);
    const expenseTarget = Math.max(1, sum(expenses.map((item) => item.amount)) * 1.1);
    const maintenanceTarget = Math.max(1, maintenances.length);
    const logisticsTarget = Math.max(1, movements.length + 2);
    const departmentTargets = [
      { id: 'production', department: 'Production', target: productionTarget, achieved: productionTotal },
      { id: 'finance', department: 'Finance', target: expenseTarget, achieved: Math.max(0, expenseTarget - sum(expenses.map((item) => item.amount))) },
      { id: 'maintenance', department: 'Maintenance', target: maintenanceTarget, achieved: maintenances.filter((item) => item.status === 'completed').length },
      { id: 'logistics', department: 'Logistics', target: logisticsTarget, achieved: movements.length },
    ].map((item) => {
      const percentage = percent(item.achieved, item.target);
      return { ...item, percentage, status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'on-track' : 'at-risk' };
    });

    const weeklyProgress = Array.from(
      productions.reduce((map, item) => {
        const week = `Week ${Math.ceil(item.date.getDate() / 7)}`;
        map.set(week, (map.get(week) || 0) + item.amount);
        return map;
      }, new Map<string, number>()),
      ([week, achieved]) => ({ id: week, week, target: 500, achieved, daily: Math.round(achieved / 7) })
    );

    const performanceMetrics = departmentTargets.map((item) => ({
      id: item.id,
      metric: item.department,
      target: item.target.toLocaleString(),
      current: item.achieved.toLocaleString(),
      achievement: item.percentage,
    }));

    res.json({ monthlyTargets, departmentTargets, weeklyProgress, performanceMetrics });
  } catch (error) {
    next(error);
  }
};

export const getTimeMotionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const [movements, challans] = await Promise.all([
      prisma.vehicleMovement.findMany({ where: { tenantId }, include: { vehicle: true }, orderBy: { startTime: 'desc' } }),
      prisma.challan.findMany({ where: { tenantId } }),
    ]);

    const vehicleTimeData = movements.map((item) => {
      const travelHours = durationHours(item.startTime, item.endTime);
      const idleHours = item.endTime ? Math.max(0.25, travelHours * 0.12) : Math.max(0.5, travelHours * 0.2);
      const efficiency = Math.max(45, Math.min(98, Math.round(100 - idleHours * 8)));
      const challan = challans.find((record) => record.vehicleId === item.vehicleId);
      const delayReason = !item.endTime ? 'In Transit' : idleHours > 1 ? 'Site Waiting' : 'None';
      return {
        id: item.id,
        vehicleNo: item.vehicle?.plateNumber || 'Unassigned',
        driver: item.vehicle?.model || 'Fleet Driver',
        challanNo: challan?.challanNumber || '-',
        entryTime: formatTime(item.startTime),
        exitTime: formatTime(item.endTime),
        stopTime: `${Math.round(idleHours * 60)} min`,
        travelTime: `${travelHours.toFixed(1)}h`,
        idleTime: `${Math.round(idleHours * 60)} min`,
        siteWaitTime: `${Math.round(idleHours * 30)} min`,
        delayReason,
        efficiency,
      };
    });

    const delayTotals = vehicleTimeData.reduce((map, item) => {
      map.set(item.delayReason, (map.get(item.delayReason) || 0) + 1);
      return map;
    }, new Map<string, number>());
    const totalDelays = sum(Array.from(delayTotals.values()));
    const delayReasonData = Array.from(delayTotals, ([name, count], index) => ({
      id: name,
      name,
      value: percent(count, totalDelays),
      color: colors[index % colors.length],
    }));

    res.json({ vehicleTimeData, delayReasonData });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceOverviewReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const [vehicles, maintenances] = await Promise.all([
      prisma.vehicle.findMany({ where: { tenantId } }),
      prisma.maintenance.findMany({ where: { tenantId }, orderBy: { date: 'desc' } }),
    ]);

    const equipmentData = vehicles.map((vehicle) => {
      const latest = maintenances.find((item) => item.vehicleId === vehicle.id);
      const health = vehicle.status === 'maintenance' ? 65 : vehicle.status === 'in-use' ? 82 : 92;
      const lastMaintenance = latest ? latest.date.toLocaleDateString() : 'No record';
      return {
        id: vehicle.id,
        name: `${vehicle.plateNumber} - ${vehicle.model}`,
        status: vehicle.status === 'maintenance' ? 'maintenance' : vehicle.status === 'available' ? 'running' : 'running',
        health,
        lastMaintenance,
      };
    });

    res.json({ equipmentData });
  } catch (error) {
    next(error);
  }
};

export const getSettingsReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const admin = await prisma.user.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    const counts = await Promise.all([
      prisma.production.count({ where: { tenantId } }),
      prisma.inventory.count({ where: { tenantId } }),
      prisma.expense.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId } }),
      prisma.vehicle.count({ where: { tenantId } }),
      prisma.vendor.count({ where: { tenantId } }),
      prisma.site.count({ where: { tenantId } }),
    ]);

    res.json({
      profile: {
        name: admin?.name || 'Admin User',
        email: admin?.email || 'admin@example.com',
        role: admin?.role || 'admin',
        department: 'Management',
      },
      system: {
        databaseRecords: sum(counts),
        backupSchedule: 'Daily at 2:00 AM',
        retention: '12 months',
        timezone: 'IST (UTC+5:30)',
      },
    });
  } catch (error) {
    next(error);
  }
};
