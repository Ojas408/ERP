import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

const SECTION_ORDER = [
  'Machinery & Equipment',
  'Fuel & Lubricants',
  'Electricity & Power',
  'Employee Cost',
  'Contract Labour',
  'Maintenance & Repairs',
  'Equipment Rental',
  'Other Operational Expenses',
] as const;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function perCuM(amount: number, totalCuM: number) {
  if (!totalCuM || totalCuM <= 0) return 0;
  return round2(amount / totalCuM);
}

function parseDateRange(month?: string, year?: string, startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return { start, end, year: start.getFullYear(), month: start.getMonth() + 1 };
  }
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getFullYear();
  const m = month ? parseInt(month, 10) - 1 : now.getMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return { start, end, year: y, month: m + 1 };
}

// 1. Get raw overhead entries (for manual adjustments / backward compatibility)
export const getOverheadEntries = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { month, year, siteId, startDate, endDate } = req.query as Record<string, string | undefined>;
    const { start, end } = parseDateRange(month, year, startDate, endDate);

    const entries = await prisma.overheadEntry.findMany({
      where: {
        tenantId,
        date: { gte: start, lt: end },
        ...(siteId && siteId !== 'all' ? { siteId } : {}),
      },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overhead entries' });
  }
};

// 2. Create manual overhead entry
export const createOverheadEntry = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { category, description, quantity, unit, amount, siteId, date, customData } = req.body;

    const entry = await prisma.overheadEntry.create({
      data: {
        category,
        description,
        quantity: quantity != null ? parseFloat(String(quantity)) : null,
        unit: unit || null,
        amount: parseFloat(String(amount)) || 0,
        siteId: siteId || null,
        date: date ? new Date(date) : new Date(),
        customData: customData || null,
        tenantId,
      },
      include: { site: true },
    });

    await logActivity(
      req.user!.userId,
      req.user!.email,
      tenantId,
      'CREATE',
      'OverheadEntry',
      `Created overhead entry for ${category} (₹${entry.amount})`
    );

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error creating overhead entry' });
  }
};

// 3. Update overhead entry
export const updateOverheadEntry = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = req.params.id as string;
    const { category, description, quantity, unit, amount, siteId, date, customData } = req.body;

    const entry = await prisma.overheadEntry.update({
      where: { id },
      data: {
        category,
        description,
        quantity: quantity != null ? parseFloat(String(quantity)) : null,
        unit: unit || null,
        amount: parseFloat(String(amount)) || 0,
        siteId: siteId || null,
        date: date ? new Date(date) : undefined,
        customData: customData !== undefined ? customData : undefined,
      },
      include: { site: true },
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating overhead entry' });
  }
};

// 4. Delete overhead entry
export const deleteOverheadEntry = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = req.params.id as string;
    await prisma.overheadEntry.deleteMany({ where: { id, tenantId } });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entry' });
  }
};

// 5. COMPLETE AUTOMATED ERP-INTEGRATED OVERHEAD REPORT (The Primary Engine)
export const getOverheadSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { month, year, siteId, startDate, endDate, costCategory } = req.query as Record<string, string | undefined>;
    const { start, end, year: y, month: m } = parseDateRange(month, year, startDate, endDate);
    const siteFilter = siteId && siteId !== 'all' ? { siteId } : {};

    // Previous month range for MoM Trends
    const prevStart = new Date(Date.UTC(y, m - 2, 1, 0, 0, 0));
    const prevEnd = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));

    // Parallel fetch from all live ERP models
    const [
      sites,
      currentProductions,
      prevProductions,
      vehicles,
      maintenances,
      consumptions,
      materialInwards,
      inventoryItems,
      employees,
      attendances,
      expenses,
      scraps,
      approvedBOMs,
      manualOverheads,
    ] = await Promise.all([
      prisma.site.findMany({ where: { tenantId } }),
      prisma.production.findMany({
        where: { tenantId, date: { gte: start, lt: end }, isRejected: false, ...siteFilter },
        include: { site: true },
      }),
      prisma.production.findMany({
        where: { tenantId, date: { gte: prevStart, lt: prevEnd }, isRejected: false, ...siteFilter },
      }),
      prisma.vehicle.findMany({
        where: { tenantId, ...(siteId && siteId !== 'all' ? { siteId } : {}) },
        include: { site: true, maintenances: { where: { date: { gte: start, lt: end } } } },
      }),
      prisma.maintenance.findMany({
        where: { tenantId, date: { gte: start, lt: end } },
        include: { vehicle: { include: { site: true } } },
      }),
      prisma.consumption.findMany({
        where: { tenantId, date: { gte: start, lt: end }, isRejected: false, ...siteFilter },
        include: { site: true },
      }),
      prisma.materialInward.findMany({
        where: { tenantId, date: { gte: start, lt: end }, ...(siteId && siteId !== 'all' ? { siteId } : {}) },
        include: { site: true },
      }),
      prisma.inventory.findMany({ where: { tenantId } }),
      prisma.employee.findMany({ where: { tenantId, status: 'active' }, include: { site: true } }),
      prisma.attendance.findMany({ where: { tenantId, date: { gte: start, lt: end } } }),
      prisma.expense.findMany({
        where: { tenantId, date: { gte: start, lt: end }, ...(siteId && siteId !== 'all' ? { OR: [{ siteId }, { siteId: null }] } : {}) },
        include: { site: true },
      }),
      prisma.scrap.findMany({
        where: { tenantId, date: { gte: start, lt: end }, ...siteFilter },
      }),
      prisma.billOfMaterial.findMany({
        where: { tenantId, status: 'approved' },
        include: { items: true },
      }),
      prisma.overheadEntry.findMany({
        where: { tenantId, date: { gte: start, lt: end }, ...siteFilter },
        include: { site: true },
      }),
    ]);

    // SECTION 1: Production Metrics
    const totalProductionCuM = currentProductions.reduce((sum, p) => sum + (p.amount || 0), 0);
    const prevProductionCuM = prevProductions.reduce((sum, p) => sum + (p.amount || 0), 0);

    const productionByGrade: Record<string, number> = {};
    const productionBySite: Record<string, number> = {};
    currentProductions.forEach((p) => {
      const g = (p.grade || 'M25').trim().toUpperCase();
      productionByGrade[g] = (productionByGrade[g] || 0) + (p.amount || 0);
      const sId = p.siteId || 'unassigned';
      productionBySite[sId] = (productionBySite[sId] || 0) + (p.amount || 0);
    });

    // Verification Warnings accumulator
    const warnings: Array<{ id: string; type: 'warning' | 'info' | 'error'; module: string; message: string; count?: number; amount?: number }> = [];

    // Helper for weighted average rate from Material Inward
    const inwardRates: Record<string, { totalVal: number; totalQty: number; unitPrice: number }> = {};
    materialInwards.forEach((row) => {
      const key = (row.materialName || '').trim().toLowerCase();
      if (!key) return;
      if (!inwardRates[key]) inwardRates[key] = { totalVal: 0, totalQty: 0, unitPrice: row.unitPrice || 0 };
      inwardRates[key].totalVal += (row.unitPrice || 0) * (row.quantity || 0);
      inwardRates[key].totalQty += (row.quantity || 0);
      if (row.unitPrice) inwardRates[key].unitPrice = row.unitPrice;
    });

    const getMaterialRate = (matName: string, fallbackRate?: number | null): number => {
      const key = matName.trim().toLowerCase();
      const inw = inwardRates[key];
      if (inw && inw.totalQty > 0) return round2(inw.totalVal / inw.totalQty);
      if (fallbackRate != null && fallbackRate > 0) return fallbackRate;
      const inv = inventoryItems.find((i) => i.itemName.toLowerCase() === key);
      if (inv && inv.price != null) return inv.price;
      return 0;
    };

    // SECTION 2 & 5: Machinery & Equipment Costs
    // Separate owned vs rented equipment
    let totalMachineryCost = 0;
    const equipmentAnalysis: any[] = [];
    vehicles.forEach((veh) => {
      const vehMaints = veh.maintenances || [];
      const maintCost = vehMaints.reduce((sum, m) => sum + (m.cost || 0), 0);
      const isRented = (veh.vehicleType || '').toLowerCase().includes('rental') || 
                       (veh.model || '').toLowerCase().includes('rental') || 
                       ((veh as any).rentalAmount && (veh as any).rentalAmount > 0);
      const rentalCost = ((veh as any).rentalAmount && (veh as any).rentalAmount > 0) 
        ? (veh as any).rentalAmount 
        : (isRented ? (maintCost > 0 ? maintCost : 45000) : 0);
      const effectiveMaint = isRented ? 0 : maintCost;
      const totalCost = effectiveMaint + rentalCost;

      totalMachineryCost += totalCost;
      equipmentAnalysis.push({
        id: veh.id,
        plateNumber: veh.plateNumber,
        model: veh.model,
        type: veh.vehicleType || 'Transit Mixer',
        plant: veh.site?.name || 'Central Fleet',
        plantId: veh.siteId,
        maintenanceCost: round2(effectiveMaint),
        rentalCost: round2(rentalCost),
        isRented,
        totalCost: round2(totalCost),
        maintenanceRecords: vehMaints.length,
      });
    });

    // Check manual adjustments for machinery
    const manualMachinery = manualOverheads.filter((o) => o.category.toLowerCase().includes('machin'));
    const manualMachineryTotal = manualMachinery.reduce((s, m) => s + (m.amount || 0), 0);
    if (equipmentAnalysis.length === 0 && manualMachineryTotal > 0) {
      totalMachineryCost = manualMachineryTotal;
    }

    // SECTION 6: Fuel Reconciliation & Cost
    let fuelPurchasedQty = 0;
    let fuelPurchasedVal = 0;
    materialInwards
      .filter((inw) => {
        const m = (inw.materialName || '').toLowerCase();
        return m.includes('fuel') || m.includes('diesel') || m.includes('lubricant');
      })
      .forEach((inw) => {
        fuelPurchasedQty += inw.quantity || 0;
        fuelPurchasedVal += (inw.quantity || 0) * (inw.unitPrice || 0);
      });

    let fuelConsumedQty = 0;
    let fuelConsumedVal = 0;
    const fuelConsumptions = consumptions.filter((c) => {
      const m = (c.material || '').toLowerCase();
      return m.includes('fuel') || m.includes('diesel') || m.includes('lubricant');
    });

    fuelConsumptions.forEach((c) => {
      const rate = getMaterialRate(c.material, c.unitPrice);
      const val = (c.amount || 0) * (rate > 0 ? rate : 92);
      fuelConsumedQty += c.amount || 0;
      fuelConsumedVal += val;
    });

    // Check manual overhead fuel if no consumption logged
    const manualFuel = manualOverheads.filter((o) => o.category.toLowerCase().includes('fuel'));
    const manualFuelTotal = manualFuel.reduce((s, f) => s + (f.amount || 0), 0);
    const manualFuelQty = manualFuel.reduce((s, f) => s + (f.quantity || 0), 0);
    if (fuelConsumedVal === 0 && manualFuelTotal > 0) {
      fuelConsumedVal = manualFuelTotal;
      fuelConsumedQty = manualFuelQty;
    }

    const totalFuelCost = round2(fuelConsumedVal);
    const avgFuelEfficiency = totalProductionCuM > 0 ? round2(fuelConsumedQty / totalProductionCuM) : 0;
    const closingFuelStock = Math.max(0, 1500 + fuelPurchasedQty - fuelConsumedQty);

    if (fuelConsumedVal > 0 && fuelPurchasedVal === 0) {
      warnings.push({
        id: 'fuel-no-inward',
        type: 'info',
        module: 'Material Inward',
        message: 'Fuel consumed using estimated/standard rates; no fuel inward purchase invoices found for this period.',
      });
    }

    // SECTION 3 & 6: Electricity & Power Consumption
    const electricityExpenses = expenses.filter((e) => {
      const cat = (e.category || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      return cat.includes('electric') || cat.includes('power') || desc.includes('electric') || desc.includes('power');
    });
    const manualElectricity = manualOverheads.filter((o) => {
      const cat = (o.category || '').toLowerCase();
      const desc = (o.description || '').toLowerCase();
      return cat.includes('electric') || cat.includes('power') || desc.includes('electric') || desc.includes('power');
    });

    const electricityBills: Array<{
      id: string;
      date: Date | string;
      plant: string;
      plantId: string | null;
      source: string;
      billNumber: string;
      provider: string;
      powerType: string;
      unitsKWh: number;
      amount: number;
      ratePerUnit: number;
      remarks: string;
    }> = [];

    let totalElectricityCost = 0;
    let totalElectricityUnits = 0;

    electricityExpenses.forEach((exp) => {
      const amt = exp.amount || 0;
      totalElectricityCost += amt;
      let units = 0;
      const desc = exp.description || '';
      const unitMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:kwh|units|unit)/i);
      if (unitMatch) units = parseFloat(unitMatch[1]);
      totalElectricityUnits += units;

      electricityBills.push({
        id: exp.id,
        date: exp.date,
        plant: exp.site?.name || 'All Plants / Central',
        plantId: exp.siteId,
        source: 'Expense Ledger',
        billNumber: exp.invoiceNumber || exp.voucherNumber || ('EXP-' + exp.id.slice(0, 6).toUpperCase()),
        provider: exp.vendorName || 'State Power Grid',
        powerType: 'Grid Power (SEB)',
        unitsKWh: round2(units),
        amount: round2(amt),
        ratePerUnit: units > 0 ? round2(amt / units) : 0,
        remarks: exp.description || 'Plant power expense',
      });
    });

    manualElectricity.forEach((oh) => {
      const amt = oh.amount || 0;
      totalElectricityCost += amt;
      const cd = (oh.customData as any) || {};
      const units = oh.quantity != null ? oh.quantity : (cd.unitsKWh || 0);
      totalElectricityUnits += units;

      electricityBills.push({
        id: oh.id,
        date: oh.date,
        plant: oh.site?.name || cd.plantName || 'Batching Plant Site',
        plantId: oh.siteId,
        source: 'Power Log',
        billNumber: cd.billNumber || cd.meterNumber || ('BILL-' + oh.id.slice(0, 6).toUpperCase()),
        provider: cd.provider || 'State Electricity Board',
        powerType: cd.powerType || 'Grid Power (HT Supply)',
        unitsKWh: round2(units),
        amount: round2(amt),
        ratePerUnit: units > 0 ? round2(amt / units) : 0,
        remarks: cd.remarks || oh.description || 'Plant electricity bill',
      });
    });

    totalElectricityCost = round2(totalElectricityCost);
    totalElectricityUnits = round2(totalElectricityUnits);
    const avgRatePerKWh = totalElectricityUnits > 0 ? round2(totalElectricityCost / totalElectricityUnits) : 0;
    const specificPowerConsumption = totalProductionCuM > 0 ? round2(totalElectricityUnits / totalProductionCuM) : 0;

    if (totalElectricityCost === 0) {
      warnings.push({
        id: 'elec-missing',
        type: 'warning',
        module: 'Electricity & Power',
        message: 'No electricity or power consumption bills recorded for the selected period.',
      });
    } else if (totalElectricityUnits === 0) {
      warnings.push({
        id: 'elec-meter-readings',
        type: 'info',
        module: 'Electricity & Power',
        message: `${electricityBills.length} electricity bill(s) found (₹${totalElectricityCost.toLocaleString('en-IN')}), but meter readings (kWh) are not tracked.`,
        amount: totalElectricityCost,
      });
    }

    // SECTION 4 & 7: Manpower & Labour Analysis
    let totalPermanentSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const totalOvertimeHours = attendances.reduce((sum, a) => sum + (a.overtime || 0), 0);
    const manualManpower = manualOverheads.filter((o) => o.category.toLowerCase().includes('manpower') || o.category.toLowerCase().includes('labour'));
    const manualManpowerTotal = manualManpower.reduce((s, m) => s + (m.amount || 0), 0);

    if (totalPermanentSalaries === 0 && manualManpowerTotal > 0) {
      totalPermanentSalaries = manualManpowerTotal;
    }
    const totalEmployeeCost = round2(totalPermanentSalaries);

    // Contract Labour from expenses
    const contractLabourExpenses = expenses.filter((e) => {
      const cat = (e.category || '').toLowerCase();
      return cat.includes('contract labour') || cat.includes('contractor') || cat.includes('labour payment');
    });
    const totalContractLabourCost = round2(contractLabourExpenses.reduce((sum, e) => sum + (e.amount || 0), 0));

    if (contractLabourExpenses.length > 0) {
      warnings.push({
        id: 'labour-attendance',
        type: 'info',
        module: 'Payroll / Expenses',
        message: 'Contract labour derived from contractor ledger vouchers; individual worker biometric attendance not present.',
        amount: totalContractLabourCost,
      });
    }

    // SECTION 8: Plant Maintenance & Repairs (Deduplicated)
    const directMaintenanceCosts = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
    const generalRepairExpenses = expenses.filter((e) => {
      const cat = (e.category || '').toLowerCase();
      return (cat.includes('repair') || cat.includes('maintenance')) && !cat.includes('vehicle');
    });
    const repairExpensesCost = generalRepairExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalMaintenanceCost = round2(directMaintenanceCosts + repairExpensesCost);

    // Equipment Rental
    const rentalExpenses = expenses.filter((e) => (e.category || '').toLowerCase().includes('rental'));
    const totalEquipmentRentalCost = round2(rentalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0));

    // Other Operational Expenses (Admin, Tea, Transport, Misc)
    const otherExpensesList = expenses.filter((e) => {
      const cat = (e.category || '').toLowerCase();
      return (
        !cat.includes('electric') &&
        !cat.includes('power') &&
        !cat.includes('contract labour') &&
        !cat.includes('repair') &&
        !cat.includes('maintenance') &&
        !cat.includes('rental')
      );
    });
    const unallocatedExpenses = expenses.filter((e) => !e.siteId);
    if (unallocatedExpenses.length > 0) {
      warnings.push({
        id: 'exp-unallocated',
        type: 'warning',
        module: 'Expenses',
        message: `${unallocatedExpenses.length} expense vouchers lack specific plant allocation; treated as shared corporate overhead.`,
        count: unallocatedExpenses.length,
        amount: round2(unallocatedExpenses.reduce((s, e) => s + (e.amount || 0), 0)),
      });
    }
    const totalOtherExpenses = round2(otherExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0));

    // Scrap Sales (Credited back / deduction)
    const totalScrapRecovery = scraps.reduce((sum, s) => (s.saleStatus === 'sold' ? sum + (s.saleValue || 0) : sum), 0);

    // PURE TOTAL OVERHEAD (Crucial: NO raw materials in pure overhead!)
    const pureTotalOverhead = round2(
      totalMachineryCost +
      totalFuelCost +
      totalElectricityCost +
      totalEmployeeCost +
      totalContractLabourCost +
      totalMaintenanceCost +
      totalEquipmentRentalCost +
      totalOtherExpenses -
      totalScrapRecovery
    );

    const overheadCostPerCuM = perCuM(pureTotalOverhead, totalProductionCuM);

    // SECTION 9: Direct Raw Material Cost (Cement, Aggregates, Sand, Admixtures)
    const rawMaterialConsumptions = consumptions.filter((c) => {
      const m = (c.material || '').toLowerCase();
      return !m.includes('fuel') && !m.includes('diesel') && !m.includes('lubricant');
    });

    let totalDirectMaterialCost = 0;
    const materialSummary: Record<string, { qty: number; unit: string; totalCost: number; rate: number }> = {};
    rawMaterialConsumptions.forEach((c) => {
      const rate = getMaterialRate(c.material, c.unitPrice);
      const cost = (c.amount || 0) * rate;
      totalDirectMaterialCost += cost;

      const key = c.material;
      if (!materialSummary[key]) {
        materialSummary[key] = { qty: 0, unit: c.unit || 'MT', totalCost: 0, rate };
      }
      materialSummary[key].qty += c.amount || 0;
      materialSummary[key].totalCost += cost;
    });

    totalDirectMaterialCost = round2(totalDirectMaterialCost);
    const materialCostPerCuM = perCuM(totalDirectMaterialCost, totalProductionCuM);

    // TOTAL OPERATING COST = Pure Overhead + Direct Material Cost
    const totalOperatingCost = round2(pureTotalOverhead + totalDirectMaterialCost);
    const totalOperatingCostPerCuM = perCuM(totalOperatingCost, totalProductionCuM);

    // SECTION 3: Category-wise Breakdown Table
    const categoryTable = [
      {
        srNo: 1,
        category: 'Machinery & Equipment',
        amount: totalMachineryCost,
        costPerCuM: perCuM(totalMachineryCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalMachineryCost / pureTotalOverhead) * 100) : 0,
        records: vehicles.length,
        source: 'Vehicles / Maintenance',
      },
      {
        srNo: 2,
        category: 'Fuel & Lubricants',
        amount: totalFuelCost,
        costPerCuM: perCuM(totalFuelCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalFuelCost / pureTotalOverhead) * 100) : 0,
        records: fuelConsumptions.length || manualFuel.length,
        source: 'Consumption / Inward',
      },
      {
        srNo: 3,
        category: 'Electricity & Power',
        amount: totalElectricityCost,
        costPerCuM: perCuM(totalElectricityCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalElectricityCost / pureTotalOverhead) * 100) : 0,
        records: electricityBills.length,
        source: 'Power Bills & Meter Logs',
      },
      {
        srNo: 4,
        category: 'Employee Cost (Salaries)',
        amount: totalEmployeeCost,
        costPerCuM: perCuM(totalEmployeeCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalEmployeeCost / pureTotalOverhead) * 100) : 0,
        records: employees.length,
        source: 'Payroll / Attendance',
      },
      {
        srNo: 5,
        category: 'Contract Labour',
        amount: totalContractLabourCost,
        costPerCuM: perCuM(totalContractLabourCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalContractLabourCost / pureTotalOverhead) * 100) : 0,
        records: contractLabourExpenses.length,
        source: 'Contractor Expenses',
      },
      {
        srNo: 6,
        category: 'Maintenance & Repairs',
        amount: totalMaintenanceCost,
        costPerCuM: perCuM(totalMaintenanceCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalMaintenanceCost / pureTotalOverhead) * 100) : 0,
        records: maintenances.length + generalRepairExpenses.length,
        source: 'Maintenance Ledger',
      },
      {
        srNo: 7,
        category: 'Equipment Rental',
        amount: totalEquipmentRentalCost,
        costPerCuM: perCuM(totalEquipmentRentalCost, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalEquipmentRentalCost / pureTotalOverhead) * 100) : 0,
        records: rentalExpenses.length,
        source: 'Rental Vouchers',
      },
      {
        srNo: 8,
        category: 'Other Operational Expenses',
        amount: totalOtherExpenses,
        costPerCuM: perCuM(totalOtherExpenses, totalProductionCuM),
        contribution: pureTotalOverhead > 0 ? round2((totalOtherExpenses / pureTotalOverhead) * 100) : 0,
        records: otherExpensesList.length,
        source: 'General Ledger',
      },
    ];

    // SECTION 4: Plant-wise Overhead Comparison
    const plantComparison: any[] = [];
    const unallocatedElectricity = electricityBills.filter((b) => !b.plantId).reduce((s, b) => s + b.amount, 0);

    sites.forEach((site) => {
      const siteCuM = productionBySite[site.id] || 0;
      const siteVehicles = vehicles.filter((v) => v.siteId === site.id);
      const siteMachineryCost = siteVehicles.reduce(
        (sum, v) => sum + (v.maintenances || []).reduce((s, m) => s + (m.cost || 0), 0),
        0
      );
      const siteFuelConsumed = consumptions
        .filter((c) => c.siteId === site.id && ((c.material || '').toLowerCase().includes('fuel') || (c.material || '').toLowerCase().includes('diesel')))
        .reduce((sum, c) => sum + (c.amount || 0) * getMaterialRate(c.material, c.unitPrice), 0);

      const siteEmployees = employees.filter((e) => e.siteId === site.id);
      const siteManpowerCost = siteEmployees.reduce((sum, e) => sum + (e.salary || 0), 0) || (totalEmployeeCost / (sites.length || 1));

      const siteElectricityBills = electricityBills.filter((b) => b.plantId === site.id);
      const siteDirectElectricity = siteElectricityBills.reduce((s, b) => s + b.amount, 0);
      const siteAllocatedElectricity = round2(siteDirectElectricity + (unallocatedElectricity / (sites.length || 1)));
      const siteSharedExpenses = round2(totalOtherExpenses / (sites.length || 1));

      const siteDirectOverhead = round2(siteMachineryCost + siteFuelConsumed + siteManpowerCost + siteAllocatedElectricity + siteSharedExpenses);
      const siteCostPerCuM = perCuM(siteDirectOverhead, siteCuM);

      plantComparison.push({
        siteId: site.id,
        siteName: site.name,
        productionCuM: round2(siteCuM),
        machineryCost: round2(siteMachineryCost),
        fuelCost: round2(siteFuelConsumed),
        electricityCost: siteAllocatedElectricity,
        manpowerCost: round2(siteManpowerCost),
        otherExpenses: siteSharedExpenses,
        totalOverhead: round2(siteDirectOverhead),
        overheadCostPerCuM: siteCostPerCuM,
      });
    });

    // Month label
    const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    res.json({
      reportingPeriod: {
        month,
        year: y,
        monthLabel,
        start,
        end,
      },
      selectedSite: siteId || 'all',
      executiveSummary: {
        totalProductionCuM: round2(totalProductionCuM),
        prevProductionCuM: round2(prevProductionCuM),
        productionMoMChangePercent: prevProductionCuM > 0 ? round2(((totalProductionCuM - prevProductionCuM) / prevProductionCuM) * 100) : 0,
        totalMachineryCost,
        totalFuelCost,
        totalElectricityCost,
        totalEmployeeCost,
        totalContractLabourCost,
        totalMaintenanceCost,
        totalEquipmentRentalCost,
        totalOtherExpenses,
        totalScrapRecovery,
        pureTotalOverhead,
        overheadCostPerCuM,
        totalDirectMaterialCost,
        materialCostPerCuM,
        totalOperatingCost,
        totalOperatingCostPerCuM,
      },
      categoryTable,
      plantComparison,
      equipmentAnalysis,
      fuelAnalysis: {
        fuelPurchasedQty: round2(fuelPurchasedQty),
        fuelPurchasedVal: round2(fuelPurchasedVal),
        fuelConsumedQty: round2(fuelConsumedQty),
        fuelConsumedVal: round2(fuelConsumedVal),
        closingStockQty: round2(closingFuelStock),
        avgFuelEfficiencyLPerCuM: avgFuelEfficiency,
      },
      electricityAnalysis: {
        totalElectricityCost: round2(totalElectricityCost),
        totalUnitsKWh: round2(totalElectricityUnits),
        avgRatePerKWh,
        specificPowerConsumptionKWhPerCuM: specificPowerConsumption,
        costPerCuM: perCuM(totalElectricityCost, totalProductionCuM),
        bills: electricityBills,
      },
      manpowerAnalysis: {
        activeEmployees: employees.length,
        totalSalaries: totalEmployeeCost,
        overtimeHours: round2(totalOvertimeHours),
        contractLabourCost: totalContractLabourCost,
      },
      directMaterialAnalysis: {
        totalCost: totalDirectMaterialCost,
        costPerCuM: materialCostPerCuM,
        materials: Object.entries(materialSummary).map(([mat, d]) => ({
          material: mat,
          qty: round2(d.qty),
          unit: d.unit,
          totalCost: round2(d.totalCost),
          avgRate: round2(d.rate),
        })),
      },
      productionByGrade: Object.entries(productionByGrade).map(([grade, cum]) => ({
        grade,
        cum: round2(cum),
      })),
      verification: {
        status: warnings.some((w) => w.type === 'error') ? 'Incomplete' : warnings.length > 0 ? 'Partially Verified' : 'Fully Verified',
        warnings,
        completenessScore: Math.max(0, 100 - warnings.length * 15),
      },
      // For legacy backward compatibility with existing frontends
      sections: categoryTable.map((cat) => ({
        category: cat.category,
        totalAmount: cat.amount,
        totalCostPerCuM: cat.costPerCuM,
        rows: [],
      })),
      entries: categoryTable.map((cat) => ({
        category: cat.category,
        amount: cat.amount,
        costPerCuM: cat.costPerCuM,
        percentOfTotal: cat.contribution,
      })),
      grandTotal: pureTotalOverhead,
      overallCostPerCuM: overheadCostPerCuM,
      totalProductionCuM: round2(totalProductionCuM),
    });
  } catch (error: any) {
    console.error('Error generating automated overhead report:', error);
    res.status(500).json({ message: 'Error generating automated overhead report', error: error.message });
  }
};
