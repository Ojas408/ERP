import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';

const SECTION_ORDER = [
  'Machinery',
  'Fuel',
  'Raw Material',
  'Manpower',
  'Electricity',
  'Maintenance',
  'Scrap',
] as const;

type SectionKey = (typeof SECTION_ORDER)[number];

/** Map legacy / free-text categories into report sections */
/** Canonical unit for each overhead section — never mix Litres / MT / bags. */
export const SECTION_UNITS: Record<string, string> = {
  Machinery: 'nos',
  Fuel: 'Litres',
  'Raw Material': 'MT',
  Manpower: 'persons',
  Electricity: 'kWh',
  Maintenance: 'ls',
  Scrap: 'tons',
};

function normalizeCategory(category: string): SectionKey | 'Other' {
  const c = (category || '').trim().toLowerCase();
  if (c === 'machinery' || c.includes('machin') || c.includes('equipment hire')) return 'Machinery';
  if (c === 'fuel' || c.includes('fuel') || c.includes('diesel') || c.includes('lubricant')) return 'Fuel';
  if (
    c === 'raw material' ||
    c === 'cement' ||
    c === 'aggregate' ||
    c.includes('ggbs') ||
    c.includes('fly ash') ||
    c.includes('admix') ||
    c.includes('micro fine')
  ) {
    return 'Raw Material';
  }
  if (c === 'manpower' || c.includes('manpower') || c === 'labour' || c === 'labor') return 'Manpower';
  if (c.includes('electric') || c.includes('power')) return 'Electricity';
  if (c.includes('maintain') || c.includes('misc')) return 'Maintenance';
  if (c.includes('scrap')) return 'Scrap';
  // Transit Mixture / Slabs are production types — keep out of Fuel/Maintenance
  if (c === 'transit mixture' || c === 'slabs') return 'Other';
  return 'Other';
}

function defaultUnitFor(section: string, entryUnit?: string | null) {
  const canonical = SECTION_UNITS[section];
  if (!canonical) return entryUnit || null;
  const u = (entryUnit || '').toLowerCase();
  if (section === 'Fuel' && (u.includes('litr') || u === 'l' || u === 'liter' || u === 'litre')) return 'Litres';
  if (section === 'Raw Material' && (u === 'mt' || u.includes('ton') || u === 'metric ton')) return 'MT';
  if (section === 'Machinery' && (u === 'nos' || u === 'qty' || u === 'units' || u === 'no' || u === '')) return 'nos';
  if (section === 'Manpower' && (u.includes('person') || u === 'nos' || u === 'qty')) return 'persons';
  return canonical;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function perCuM(amount: number, totalCuM: number) {
  if (!totalCuM || totalCuM <= 0) return 0;
  return round2(amount / totalCuM);
}

function monthRange(month?: string, year?: string) {
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getFullYear();
  const m = month ? parseInt(month, 10) - 1 : now.getMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return { start, end, year: y, month: m + 1 };
}

export const getOverheadEntries = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { month, year, siteId } = req.query as Record<string, string | undefined>;
    const { start, end } = monthRange(month, year);

    const entries = await prisma.overheadEntry.findMany({
      where: {
        tenantId,
        date: { gte: start, lt: end },
        ...(siteId ? { siteId } : {}),
      },
      include: { site: true },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overhead entries' });
  }
};

export const getOverheadSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { month, year, siteId, includeExtras } = req.query as Record<string, string | undefined>;
    const { start, end, year: y, month: m } = monthRange(month, year);
    const siteFilter = siteId ? { siteId } : {};
    // Extras off by default — they mixed bags/tons/salaries into the plant ₹/CuM report.
    const withExtras = includeExtras === '1' || includeExtras === 'true';

    const [entries, expenses, employees, productions, consumptions, inventory, scraps, inwards] =
      await Promise.all([
        prisma.overheadEntry.findMany({
          where: { tenantId, date: { gte: start, lt: end }, ...siteFilter },
          include: { site: true },
          orderBy: { date: 'asc' },
        }),
        withExtras
          ? prisma.expense.findMany({ where: { tenantId, date: { gte: start, lt: end } } })
          : Promise.resolve([] as any[]),
        withExtras
          ? prisma.employee.findMany({ where: { tenantId, status: 'active' } })
          : Promise.resolve([] as any[]),
        prisma.production.findMany({
          where: {
            tenantId,
            date: { gte: start, lt: end },
            isRejected: false,
            ...siteFilter,
          },
        }),
        withExtras
          ? prisma.consumption.findMany({
              where: {
                tenantId,
                date: { gte: start, lt: end },
                isRejected: false,
                ...siteFilter,
              },
            })
          : Promise.resolve([] as any[]),
        withExtras ? prisma.inventory.findMany({ where: { tenantId } }) : Promise.resolve([] as any[]),
        prisma.scrap.findMany({
          where: { tenantId, date: { gte: start, lt: end }, ...siteFilter },
        }),
        withExtras
          ? prisma.materialInward.findMany({
              where: { tenantId, date: { gte: start, lt: end }, ...(siteId ? { siteId } : {}) },
            })
          : Promise.resolve([] as any[]),
      ]);

    // Total concrete production in cubic meters
    const totalProductionCuM = productions
      .filter((p) => {
        const u = (p.unit || 'cum').toLowerCase();
        return u === 'cum' || u === 'm3' || u === 'cu.m' || u === 'cumec';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const inventoryPriceMap: Record<string, number> = {};
    inventory.forEach((item) => {
      const key = (item.itemName || '').trim().toLowerCase();
      if (key && item.price != null) inventoryPriceMap[key] = item.price;
    });

    // Weighted average unit price from material inward
    const inwardRate: Record<string, { totalValue: number; totalQty: number }> = {};
    inwards.forEach((row) => {
      const key = (row.materialName || '').trim().toLowerCase();
      if (!key || row.unitPrice == null) return;
      if (!inwardRate[key]) inwardRate[key] = { totalValue: 0, totalQty: 0 };
      inwardRate[key].totalValue += (row.unitPrice || 0) * (row.quantity || 0);
      inwardRate[key].totalQty += row.quantity || 0;
    });
    Object.entries(inwardRate).forEach(([key, v]) => {
      if (v.totalQty > 0) inventoryPriceMap[key] = v.totalValue / v.totalQty;
    });

    type LineItem = {
      id?: string;
      source: 'overhead' | 'consumption' | 'scrap' | 'salary' | 'expense';
      description: string;
      quantity: number | null;
      unit: string | null;
      rate: number | null;
      amount: number;
      costPerCuM: number;
      remarks?: string | null;
      personnelDetails?: string | null;
      avgFuelConsumption?: number | null;
      siteName?: string | null;
      customData?: any;
    };

    const sections: Record<string, { rows: LineItem[]; totalAmount: number; totalCostPerCuM: number }> = {};
    SECTION_ORDER.forEach((s) => {
      sections[s] = { rows: [], totalAmount: 0, totalCostPerCuM: 0 };
    });
    sections['Other'] = { rows: [], totalAmount: 0, totalCostPerCuM: 0 };

    const pushRow = (section: string, row: LineItem) => {
      if (!sections[section]) sections[section] = { rows: [], totalAmount: 0, totalCostPerCuM: 0 };
      sections[section].rows.push(row);
      sections[section].totalAmount += row.amount;
    };

    // 1) Explicit overhead entries (correct unit per section)
    entries.forEach((entry) => {
      const section = normalizeCategory(entry.category);
      const cd = (entry.customData as Record<string, any>) || {};
      const unit = defaultUnitFor(section, entry.unit);
      const rate =
        cd.rate != null && cd.rate !== ''
          ? parseFloat(String(cd.rate)) || null
          : entry.quantity && entry.quantity > 0
            ? round2(entry.amount / entry.quantity)
            : null;
      pushRow(section, {
        id: entry.id,
        source: 'overhead',
        description: entry.description || entry.category,
        quantity: entry.quantity,
        unit,
        rate,
        amount: entry.amount || 0,
        costPerCuM: perCuM(entry.amount || 0, totalProductionCuM),
        remarks: cd.remarks || null,
        personnelDetails: cd.personnelDetails || null,
        avgFuelConsumption:
          section === 'Fuel'
            ? cd.avgFuelConsumption != null
              ? parseFloat(String(cd.avgFuelConsumption)) || null
              : entry.quantity && totalProductionCuM > 0
                ? round2(entry.quantity / totalProductionCuM)
                : null
            : null,
        siteName: entry.site?.name || null,
        customData: cd,
      });
    });

    let expenseByCategory: Record<string, number> = {};
    let totalSalaries = 0;
    const scrapQty = scraps.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const scrapCost = scraps.reduce((sum, s) => {
      if (s.saleStatus === 'sold') return sum - (s.saleValue || 0);
      return sum + (s.saleValue || 0);
    }, 0);

    if (withExtras) {
      // 2) Consumption → Fuel / Raw Materials
      const consumedByMaterial: Record<
        string,
        { qty: number; unit: string; cost: number; sourceLocation?: string; brand?: string; mfgLocation?: string }
      > = {};

      consumptions.forEach((c) => {
        const key = (c.material || '').trim();
        if (!key) return;
        const lk = key.toLowerCase();
        let unitPrice = c.unitPrice != null ? c.unitPrice : inventoryPriceMap[lk];
        if (unitPrice == null) unitPrice = 0;
        const cost = (c.amount || 0) * unitPrice;
        if (!consumedByMaterial[key]) {
          consumedByMaterial[key] = {
            qty: 0,
            unit: c.unit || '',
            cost: 0,
            sourceLocation: c.sourceLocation || undefined,
            brand: c.brand || undefined,
            mfgLocation: c.mfgLocation || undefined,
          };
        }
        consumedByMaterial[key].qty += c.amount || 0;
        consumedByMaterial[key].cost += cost;
        if (c.unit) consumedByMaterial[key].unit = c.unit;
      });

      Object.entries(consumedByMaterial).forEach(([material, data]) => {
        const lk = material.toLowerCase();
        const isFuel = lk.includes('diesel') || lk.includes('fuel') || lk.includes('lubricant');
        const section: SectionKey = isFuel ? 'Fuel' : 'Raw Material';
        const already = sections[section].rows.some(
          (r) => r.description.toLowerCase() === material.toLowerCase() && r.source === 'overhead'
        );
        if (already || (data.cost <= 0 && data.qty <= 0)) return;
        const rate = data.qty > 0 ? round2(data.cost / data.qty) : inventoryPriceMap[lk] || null;
        pushRow(section, {
          source: 'consumption',
          description: material,
          quantity: data.qty,
          unit: defaultUnitFor(section, data.unit || (isFuel ? 'Litres' : 'MT')),
          rate,
          amount: round2(data.cost),
          costPerCuM: perCuM(data.cost, totalProductionCuM),
          remarks: 'From consumption',
          avgFuelConsumption:
            isFuel && totalProductionCuM > 0 ? round2(data.qty / totalProductionCuM) : null,
        });
      });

      if (scraps.length > 0) {
        pushRow('Scrap', {
          source: 'scrap',
          description: 'Scrap / waste',
          quantity: scrapQty,
          unit: scraps[0]?.unit || 'tons',
          rate: null,
          amount: round2(Math.abs(scrapCost)),
          costPerCuM: perCuM(Math.abs(scrapCost), totalProductionCuM),
          remarks: 'From scrap management',
        });
      }

      totalSalaries = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      if (sections['Manpower'].rows.length === 0 && totalSalaries > 0) {
        pushRow('Manpower', {
          source: 'salary',
          description: 'Active employee salaries (monthly)',
          quantity: employees.length,
          unit: 'persons',
          rate: null,
          amount: round2(totalSalaries),
          costPerCuM: perCuM(totalSalaries, totalProductionCuM),
          personnelDetails: `${employees.length} active employees`,
          remarks: 'Auto from payroll',
        });
      }

      expenseByCategory = expenses.reduce((acc: Record<string, number>, exp) => {
        const cat = exp.category || 'Miscellaneous';
        acc[cat] = (acc[cat] || 0) + exp.amount;
        return acc;
      }, {});
      Object.entries(expenseByCategory).forEach(([cat, amount]) => {
        const section = normalizeCategory(cat);
        const target = section === 'Other' ? 'Maintenance' : section;
        pushRow(target, {
          source: 'expense',
          description: `Expense: ${cat}`,
          quantity: null,
          unit: null,
          rate: null,
          amount: round2(amount),
          costPerCuM: perCuM(amount, totalProductionCuM),
          remarks: 'From expenses ledger',
        });
      });
    }

    // Finalize section totals
    Object.keys(sections).forEach((key) => {
      sections[key].totalAmount = round2(sections[key].totalAmount);
      sections[key].totalCostPerCuM = perCuM(sections[key].totalAmount, totalProductionCuM);
    });

    const orderedSections = [...SECTION_ORDER, 'Other']
      .filter((key) => sections[key] && sections[key].rows.length > 0)
      .map((key) => ({
        category: key,
        unit: SECTION_UNITS[key] || '',
        rows: sections[key].rows,
        totalAmount: sections[key].totalAmount,
        totalCostPerCuM: sections[key].totalCostPerCuM,
      }));

    const grandTotal = round2(orderedSections.reduce((s, sec) => s + sec.totalAmount, 0));
    const overallCostPerCuM = perCuM(grandTotal, totalProductionCuM);

    const summary = orderedSections.map((sec) => ({
      category: sec.category,
      quantity: sec.rows.reduce((s, r) => s + (r.quantity || 0), 0),
      unit: sec.unit,
      amount: sec.totalAmount,
      costPerCuM: sec.totalCostPerCuM,
      percentOfTotal: grandTotal > 0 ? round2((sec.totalAmount / grandTotal) * 100) : 0,
    }));

    const transitMixture =
      summary.find((s) => s.category === 'Fuel') || { quantity: 0, amount: 0, unit: 'Litres', costPerCuM: 0 };
    const slabs = { quantity: 0, amount: 0, unit: 'sqm', costPerCuM: 0 };

    const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    res.json({
      month,
      year: y,
      monthNumber: m,
      monthLabel,
      siteId: siteId || null,
      totalProductionCuM: round2(totalProductionCuM),
      sections: orderedSections,
      entries: summary,
      expenses: expenseByCategory,
      totalSalaries,
      grandTotal,
      overallCostPerCuM,
      transitMixture,
      slabs,
      scrap: {
        count: scraps.length,
        quantity: scrapQty,
        amount: round2(Math.abs(scrapCost)),
        costPerCuM: perCuM(Math.abs(scrapCost), totalProductionCuM),
      },
      productionByGrade: Object.entries(
        productions.reduce((acc: Record<string, number>, p) => {
          const g = p.grade || p.quality || 'Unspecified';
          const u = (p.unit || 'cum').toLowerCase();
          if (u === 'cum' || u === 'm3' || u === 'cu.m') {
            acc[g] = (acc[g] || 0) + (p.amount || 0);
          }
          return acc;
        }, {})
      ).map(([grade, cum]) => ({ grade, cum: round2(cum as number) })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error building overhead summary' });
  }
};

export const createOverheadEntry = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const data = req.body;
  try {
    const section = normalizeCategory(data.category);
    const unit = data.unit || SECTION_UNITS[section] || null;
    const entry = await prisma.overheadEntry.create({
      data: {
        tenantId,
        category: data.category,
        description: data.description || null,
        quantity: data.quantity !== undefined && data.quantity !== '' ? parseFloat(data.quantity) : null,
        unit,
        amount: parseFloat(data.amount) || 0,
        siteId: data.siteId || null,
        date: data.date ? new Date(data.date) : new Date(),
        customData: data.customData || undefined,
      },
      include: { site: true },
    });
    await logActivity(userId, email, tenantId, 'CREATE', 'OverheadEntry', `Created overhead: ${entry.category}`);
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating overhead entry' });
  }
};

export const updateOverheadEntry = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  const { category, description, quantity, unit, amount, siteId, date, customData } = req.body;
  try {
    await prisma.overheadEntry.updateMany({
      where: { id, tenantId },
      data: {
        category,
        description,
        quantity: quantity !== undefined && quantity !== '' ? parseFloat(quantity) : undefined,
        unit,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        siteId,
        date: date ? new Date(date) : undefined,
        customData: customData !== undefined ? customData : undefined,
      },
    });
    const entry = await prisma.overheadEntry.findFirst({ where: { id, tenantId }, include: { site: true } });
    await logActivity(userId, email, tenantId, 'UPDATE', 'OverheadEntry', `Updated overhead ID: ${id}`);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating overhead entry' });
  }
};

export const deleteOverheadEntry = async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { userId, email } = req.user!;
  const id = req.params.id as string;
  try {
    await prisma.overheadEntry.deleteMany({ where: { id, tenantId } });
    await logActivity(userId, email, tenantId, 'DELETE', 'OverheadEntry', `Deleted overhead ID: ${id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting overhead entry' });
  }
};
