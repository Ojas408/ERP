import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing database records to prevent duplicate key errors
  console.log('Cleaning database...');
  await prisma.attendance.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.vehicleMovement.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.consumption.deleteMany({});
  await prisma.production.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.overheadEntry.deleteMany({});
  await prisma.scrap.deleteMany({});
  await prisma.rMCGrade.deleteMany({});
  await prisma.materialInward.deleteMany({});
  await prisma.site.deleteMany({});
  
  // Clean new lookup and document models
  await prisma.document.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.materialCategory.deleteMany({});
  await prisma.vehicleType.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.unitOfMeasure.deleteMany({});

  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // 1. Seed Tenants
  console.log('Seeding Tenants...');
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Default Company',
    }
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Apex Builders Ltd',
    }
  });

  // 1.5 Seed Master Data for Tenant A
  console.log('Seeding Master Data for Tenant A...');
  await prisma.department.createMany({
    data: [
      { name: 'HR & Admin', tenantId: tenantA.id },
      { name: 'Finance & Accounts', tenantId: tenantA.id },
      { name: 'Operations & Sites', tenantId: tenantA.id },
      { name: 'Procurement & Stores', tenantId: tenantA.id },
      { name: 'Engineering', tenantId: tenantA.id }
    ]
  });

  await prisma.materialCategory.createMany({
    data: [
      { name: 'Cement & Concrete', tenantId: tenantA.id },
      { name: 'Iron & Reinforcements', tenantId: tenantA.id },
      { name: 'Aggregates & Sand', tenantId: tenantA.id },
      { name: 'Electrical & Wiring', tenantId: tenantA.id },
      { name: 'Plumbing & Fittings', tenantId: tenantA.id },
      { name: 'Fuels & Oils', tenantId: tenantA.id }
    ]
  });

  await prisma.vehicleType.createMany({
    data: [
      { name: 'Excavator / Backhoe', tenantId: tenantA.id },
      { name: 'Dumper Truck', tenantId: tenantA.id },
      { name: 'Transit Mixer', tenantId: tenantA.id },
      { name: 'Tower Crane', tenantId: tenantA.id },
      { name: 'Utility Vehicle', tenantId: tenantA.id }
    ]
  });

  await prisma.expenseCategory.createMany({
    data: [
      { name: 'Fuel & Diesel', tenantId: tenantA.id },
      { name: 'Labour Wages', tenantId: tenantA.id },
      { name: 'Material Purchase', tenantId: tenantA.id },
      { name: 'Equipment Maintenance', tenantId: tenantA.id },
      { name: 'Office Supplies', tenantId: tenantA.id },
      { name: 'Miscellaneous', tenantId: tenantA.id }
    ]
  });

  await prisma.unitOfMeasure.createMany({
    data: [
      { name: 'Tons', code: 'ton', tenantId: tenantA.id },
      { name: 'Kilograms', code: 'kg', tenantId: tenantA.id },
      { name: 'Liters', code: 'ltr', tenantId: tenantA.id },
      { name: 'Bags', code: 'bag', tenantId: tenantA.id },
      { name: 'Pieces', code: 'pcs', tenantId: tenantA.id },
      { name: 'Meters', code: 'm', tenantId: tenantA.id }
    ]
  });

  // 2. Seed Users
  console.log('Seeding Users...');
  const adminA = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User A',
      password: hashedPassword,
      role: 'Super Admin',
      tenantId: tenantA.id
    }
  });

  const adminB = await prisma.user.create({
    data: {
      email: 'apex@example.com',
      name: 'Apex Manager',
      password: hashedPassword,
      role: 'Super Admin',
      tenantId: tenantB.id
    }
  });

  // 3. Seed Sites (Projects) for Tenant A
  console.log('Seeding Sites...');
  const site1 = await prisma.site.create({
    data: { name: 'Metro Line Phase 1', location: 'Seattle Central', status: 'active', tenantId: tenantA.id },
  });

  const site2 = await prisma.site.create({
    data: { name: 'Skyline Residency', location: 'Downtown Bellevue', status: 'active', tenantId: tenantA.id },
  });

  const site3 = await prisma.site.create({
    data: { name: 'Highway NH-4 Bypass', location: 'Tacoma Outer Ring', status: 'on-hold', tenantId: tenantA.id },
  });

  // Seed Sites for Tenant B (to test isolation)
  await prisma.site.create({
    data: { name: 'Apex Tech Park', location: 'Portland North', status: 'active', tenantId: tenantB.id },
  });

  // 4. Seed Vehicles (Equipment) for Tenant A
  console.log('Seeding Vehicles (Equipment)...');
  const vehicle1 = await prisma.vehicle.create({
    data: { plateNumber: 'WA-04-AX-5555', model: 'JCB Excavator', status: 'available', lastService: new Date('2026-01-15'), tenantId: tenantA.id }
  });

  const vehicle2 = await prisma.vehicle.create({
    data: { plateNumber: 'OR-12-BQ-8812', model: 'Dumper Truck', status: 'in-use', lastService: new Date('2026-03-10'), tenantId: tenantA.id }
  });

  const vehicle3 = await prisma.vehicle.create({
    data: { plateNumber: 'CA-99-ZZ-4321', model: 'Transit Mixer', status: 'maintenance', lastService: new Date('2026-05-20'), tenantId: tenantA.id }
  });

  const vehicle4 = await prisma.vehicle.create({
    data: { plateNumber: 'WA-10-XY-9900', model: 'Tower Crane', status: 'available', lastService: new Date('2026-02-18'), tenantId: tenantA.id }
  });

  // 5. Seed Employees (Workers) for Tenant A
  console.log('Seeding Employees (Workers)...');
  const emp1 = await prisma.employee.create({
    data: { name: 'David Miller', position: 'Supervisor', salary: 35000, status: 'active', joinedDate: new Date('2025-06-15'), tenantId: tenantA.id }
  });

  const emp2 = await prisma.employee.create({
    data: { name: 'Karan Sharma', position: 'Operator', salary: 25000, status: 'active', joinedDate: new Date('2025-08-20'), tenantId: tenantA.id }
  });

  const emp3 = await prisma.employee.create({
    data: { name: 'Sanjay Yadav', position: 'Mason', salary: 18000, status: 'active', joinedDate: new Date('2025-11-05'), tenantId: tenantA.id }
  });

  const emp4 = await prisma.employee.create({
    data: { name: 'Robert Chen', position: 'Electrician', salary: 22000, status: 'active', joinedDate: new Date('2026-01-10'), tenantId: tenantA.id }
  });

  const emp5 = await prisma.employee.create({
    data: { name: 'Amit Patel', position: 'Labourer', salary: 12000, status: 'inactive', joinedDate: new Date('2025-04-12'), tenantId: tenantA.id }
  });

  // 6. Seed Attendance logs (Tenant A)
  console.log('Seeding Attendance records...');
  await prisma.attendance.createMany({
    data: [
      { employeeId: emp1.id, date: new Date('2026-05-29'), hoursWorked: 8, status: 'present', tenantId: tenantA.id },
      { employeeId: emp2.id, date: new Date('2026-05-29'), hoursWorked: 10, overtime: 2, status: 'present', tenantId: tenantA.id },
      { employeeId: emp3.id, date: new Date('2026-05-29'), hoursWorked: 8, status: 'present', tenantId: tenantA.id },
      { employeeId: emp4.id, date: new Date('2026-05-29'), hoursWorked: 0, status: 'leave', tenantId: tenantA.id },
      { employeeId: emp1.id, date: new Date('2026-05-30'), hoursWorked: 8, status: 'present', tenantId: tenantA.id },
      { employeeId: emp2.id, date: new Date('2026-05-30'), hoursWorked: 8, status: 'present', tenantId: tenantA.id },
      { employeeId: emp3.id, date: new Date('2026-05-30'), hoursWorked: 0, status: 'absent', tenantId: tenantA.id },
    ]
  });

  // 7. Seed Vendors for Tenant A
  console.log('Seeding Vendors...');
  const vendor1 = await prisma.vendor.create({
    data: { name: 'Supreme Cement Group', category: 'Cement & Concrete', contact: '+1 (206) 555-0192', tenantId: tenantA.id }
  });

  const vendor2 = await prisma.vendor.create({
    data: { name: 'Apex Steel Industries', category: 'Iron & Reinforcements', contact: '+1 (425) 555-0144', tenantId: tenantA.id }
  });

  const vendor3 = await prisma.vendor.create({
    data: { name: 'Pacific Energy Fuels', category: 'Diesel & Oil', contact: '+1 (253) 555-0168', tenantId: tenantA.id }
  });

  // 8. Seed Purchase Orders for Tenant A
  console.log('Seeding Purchase Orders...');
  await prisma.purchaseOrder.createMany({
    data: [
      { orderNumber: 'PO-2026-1004', vendorId: vendor1.id, totalAmount: 450000, status: 'approved', items: '1000 Bags of Grade-A Cement', tenantId: tenantA.id },
      { orderNumber: 'PO-2026-1005', vendorId: vendor2.id, totalAmount: 1200000, status: 'pending', items: '20 Tons of TMT Steel Rods', tenantId: tenantA.id },
      { orderNumber: 'PO-2026-1006', vendorId: vendor3.id, totalAmount: 180000, status: 'received', items: '3000 Liters of Diesel Fuel', tenantId: tenantA.id },
    ]
  });

  // 9. Seed Traffic Challans (Violations) for Tenant A
  console.log('Seeding Traffic Challans...');
  await prisma.challan.createMany({
    data: [
      { challanNumber: 'TRF-2026-8899', vehicleId: vehicle2.id, material: 'Overloading', quantity: 5000, destination: 'Tacoma Highway Checkpost', status: 'pending', tenantId: tenantA.id },
      { challanNumber: 'TRF-2026-8900', vehicleId: vehicle2.id, material: 'Speeding', quantity: 2000, destination: 'Bellevue Bridge', status: 'paid', tenantId: tenantA.id },
      { challanNumber: 'TRF-2026-8901', vehicleId: vehicle3.id, material: 'No Fitness Cert', quantity: 10000, destination: 'Seattle Central Port', status: 'pending', tenantId: tenantA.id },
    ]
  });

  // 10. Seed Inventory for Tenant A
  console.log('Seeding Inventory...');
  await prisma.inventory.createMany({
    data: [
      { itemName: 'Portland Cement', quantity: 850, unit: 'bags', minThreshold: 100, price: 420, category: 'Materials', tenantId: tenantA.id },
      { itemName: 'TMT Steel Rods (12mm)', quantity: 3500, unit: 'kg', minThreshold: 500, price: 65, category: 'Reinforcements', tenantId: tenantA.id },
      { itemName: 'Diesel Fuel', quantity: 800, unit: 'liters', minThreshold: 1000, price: 95, category: 'Fuels', tenantId: tenantA.id }, // Trigger low stock!
      { itemName: 'River Sand', quantity: 45, unit: 'tons', minThreshold: 10, price: 2800, category: 'Aggregates', tenantId: tenantA.id },
    ]
  });

  // 11. Seed Expenses for Tenant A
  console.log('Seeding Expenses...');
  await prisma.expense.createMany({
    data: [
      { category: 'Material', amount: 357000, description: 'Purchased 850 bags cement', paymentStatus: 'paid', tenantId: tenantA.id },
      { category: 'Salary', amount: 102000, description: 'Monthly wages - Laborers', paymentStatus: 'paid', tenantId: tenantA.id },
      { category: 'Fuel', amount: 76000, description: 'Refueled dumpers wa-04', paymentStatus: 'paid', tenantId: tenantA.id },
      { category: 'Maintenance', amount: 45000, description: 'Servicing waiver jcb excavator', paymentStatus: 'pending', tenantId: tenantA.id },
    ]
  });

  // 12. Seed Production Logs for Tenant A
  console.log('Seeding Production...');
  await prisma.production.createMany({
    data: [
      { amount: 85, unit: 'cum', grade: 'M25', productionType: 'Transit Mixture', siteId: site1.id, towerName: 'Tower A - Foundation', notes: 'Transit mixer batch for foundation pour', date: new Date('2026-05-28T09:30:00'), tenantId: tenantA.id },
      { amount: 120, unit: 'sqm', grade: 'M20', productionType: 'Slabs', siteId: site2.id, towerName: 'Skyline Block B - Slab 3', notes: 'Ground floor slab casting completed', date: new Date('2026-05-29T14:00:00'), tenantId: tenantA.id },
      { amount: 65, unit: 'cum', grade: 'M30', productionType: 'Column', siteId: site1.id, towerName: 'Metro Line - Column C4', notes: 'Column casting segment 1', date: new Date('2026-05-30T08:00:00'), tenantId: tenantA.id },
      { amount: 45, unit: 'cum', grade: 'M25', productionType: 'Transit Mixture', siteId: site2.id, towerName: 'Skyline Residency - Podium', notes: 'Podium level RMC supply', date: new Date('2026-05-30T11:30:00'), tenantId: tenantA.id },
    ]
  });

  // 13. Seed Consumptions for Tenant A
  console.log('Seeding Consumptions...');
  await prisma.consumption.createMany({
    data: [
      { material: 'Portland Cement', amount: 150, unit: 'bags', siteId: site1.id, tenantId: tenantA.id },
      { material: 'River Sand', amount: 5, unit: 'tons', siteId: site1.id, tenantId: tenantA.id },
      { material: 'TMT Steel Rods (12mm)', amount: 400, unit: 'kg', siteId: site2.id, tenantId: tenantA.id },
    ]
  });

  // 14. Seed Vehicle Movements for Tenant A
  console.log('Seeding Vehicle Movements...');
  await prisma.vehicleMovement.createMany({
    data: [
      { vehicleId: vehicle2.id, fromLocation: 'Seattle Port', toLocation: 'Skyline Residency', startTime: new Date('2026-05-30T09:00:00'), endTime: new Date('2026-05-30T10:30:00'), distance: 25.5, fuelConsumed: 12, tenantId: tenantA.id },
      { vehicleId: vehicle1.id, fromLocation: 'Tacoma Depot', toLocation: 'Metro Line Phase 1', startTime: new Date('2026-05-30T08:15:00'), endTime: new Date('2026-05-30T11:00:00'), distance: 42, fuelConsumed: 22, tenantId: tenantA.id },
    ]
  });

  // 15. Seed Maintenances for Tenant A
  console.log('Seeding Maintenances...');
  await prisma.maintenance.createMany({
    data: [
      { vehicleId: vehicle1.id, type: 'Routine', cost: 15000, description: 'Hydraulic oil replacement & general tuning', status: 'completed', date: new Date('2026-01-15'), tenantId: tenantA.id },
      { vehicleId: vehicle3.id, type: 'Repair', cost: 30000, description: 'Engine coolant system repair', status: 'pending', date: new Date('2026-05-20'), tenantId: tenantA.id },
    ]
  });

  // 16. Seed Material Inward
  console.log('Seeding Material Inward...');
  await prisma.materialInward.createMany({
    data: [
      { inwardNumber: 'INW-2026-001', materialName: 'Cement', quantity: 500, unit: 'bags', supplierName: 'Supreme Cement Group', siteId: site1.id, receivedBy: 'David Miller', remarks: 'OPC 53 Grade cement bags', date: new Date('2026-05-27T10:00:00'), tenantId: tenantA.id },
      { inwardNumber: 'INW-2026-002', materialName: 'Aggregate', quantity: 120, unit: 'tons', supplierName: 'Pacific Aggregates Ltd', siteId: site1.id, receivedBy: 'Karan Sharma', remarks: '20mm crushed stone aggregate', date: new Date('2026-05-28T08:30:00'), tenantId: tenantA.id },
      { inwardNumber: 'INW-2026-003', materialName: 'Cement', quantity: 300, unit: 'bags', supplierName: 'Supreme Cement Group', siteId: site2.id, receivedBy: 'Sanjay Yadav', remarks: 'PPC cement for slab work', date: new Date('2026-05-29T09:15:00'), tenantId: tenantA.id },
      { inwardNumber: 'INW-2026-004', materialName: 'Aggregate', quantity: 85, unit: 'tons', supplierName: 'Pacific Aggregates Ltd', siteId: site2.id, receivedBy: 'Robert Chen', remarks: '10mm fine aggregate for RMC', date: new Date('2026-05-30T07:45:00'), tenantId: tenantA.id },
      { inwardNumber: 'INW-2026-005', materialName: 'Sand', quantity: 60, unit: 'tons', supplierName: 'River Sand Suppliers', siteId: site1.id, receivedBy: 'David Miller', tenantId: tenantA.id },
      { inwardNumber: 'INW-2026-006', materialName: 'Steel', quantity: 2500, unit: 'kg', supplierName: 'Apex Steel Industries', siteId: site2.id, receivedBy: 'Karan Sharma', tenantId: tenantA.id },
    ]
  });

  // 17. Seed RMC Grades
  console.log('Seeding RMC Grades...');
  await prisma.rMCGrade.createMany({
    data: [
      { grade: 'M20', mixRatio: '1:1.5:3', cementContent: 300, waterCementRatio: 0.55, admixture: 'Superplasticizer', description: 'Standard foundation mix', tenantId: tenantA.id },
      { grade: 'M25', mixRatio: '1:1:2', cementContent: 350, waterCementRatio: 0.50, admixture: 'Superplasticizer', description: 'Column and beam mix', tenantId: tenantA.id },
      { grade: 'M30', mixRatio: '1:0.75:1.5', cementContent: 380, waterCementRatio: 0.45, admixture: 'PCE based', description: 'High-rise structural mix', tenantId: tenantA.id },
    ]
  });

  // 18. Seed Scrap
  console.log('Seeding Scrap...');
  await prisma.scrap.createMany({
    data: [
      { materialType: 'Steel', quantity: 2.5, unit: 'tons', siteId: site1.id, saleStatus: 'stored', remarks: 'Cut-off rebar pieces', tenantId: tenantA.id },
      { materialType: 'Concrete', quantity: 8, unit: 'tons', siteId: site2.id, saleStatus: 'sold', saleValue: 12000, buyerName: 'EcoRecycle Ltd', tenantId: tenantA.id },
    ]
  });

  // 19. Seed Total Overhead Report — June plant sample (correct units)
  console.log('Seeding Overhead Entries (June plant report)...');
  const TOTAL_CUM = 9549;
  const OH_DATE = new Date('2026-06-15T10:00:00Z');
  const plantMeta = { plantName: 'Jaypee Wish Town (KRH & GDI)', monthYearStr: 'JUNE 2026', totalProductionCuM: TOTAL_CUM };

  // Ensure production denominator exists
  await prisma.production.create({
    data: {
      amount: TOTAL_CUM,
      unit: 'cum',
      grade: 'Mixed Grades',
      productionType: 'Transit Mixture',
      siteId: site1.id,
      towerName: 'Jaypee Wish Town — All Plants',
      notes: 'Monthly total for overhead Cost/CuM',
      date: OH_DATE,
      tenantId: tenantA.id,
    },
  });

  const overheadRows: any[] = [];
  const pushOh = (category: string, description: string, quantity: number | null, unit: string, amount: number, extra: any = {}) => {
    overheadRows.push({
      category, description, quantity, unit, amount,
      siteId: site1.id, date: OH_DATE, tenantId: tenantA.id,
      customData: { ...plantMeta, ...extra },
    });
  };

  // Machinery — nos + ₹/month
  pushOh('Machinery', 'Batching Plant (Main Unit)', 2, 'nos', 0, { rate: 0, remarks: 'Company Owned' });
  pushOh('Machinery', 'Transit Mixers (TMs)', 14, 'nos', 1983240, { rate: 141660 });
  pushOh('Machinery', 'JCB', 1, 'nos', 155760, { rate: 155760 });
  pushOh('Machinery', 'Loader', 1, 'nos', 152400, { rate: 152400 });
  pushOh('Machinery', 'Concrete Pumps (with pump labour & tractor trolley)', 1, 'nos', 287400, { rate: 287400 });
  pushOh('Machinery', 'Water Tanker & Spares', 0, 'nos', 0, { rate: 0 });

  // Fuel — Litres + ₹/Litre
  const fuelRate = 95.85;
  ;[
    ['Diesel - TMs', 14420],
    ['Diesel - JCB', 1400],
    ['Diesel - LOADER', 1100],
    ['Diesel - CONCRETE PUMP', 800],
    ['Diesel - TRACTOR', 40],
    ['Diesel - DG', 20],
  ].forEach(([desc, litres]) => {
    const L = litres as number;
    const amt = Math.round(L * fuelRate * 100) / 100;
    pushOh('Fuel', desc as string, L, 'Litres', amt, { rate: fuelRate, avgFuelConsumption: L / TOTAL_CUM });
  });

  // Raw Material — MT + ₹/MT
  ;[
    ['Cement', 2227.653, 6610.0, 14724816.3],
    ['20 mm Aggregate', 6272.685, 1440.0, 9032666.4],
    ['10 mm Aggregate', 4311.435, 1517.25, 6541524.8],
    ['Fine Aggregate', 7867.832, 1266.25, 9962642.3],
    ['Fly Ash', 1135.845, 3120.5, 3544304.3],
    ['Admixture', 13.018, 119000.0, 1549142.0],
    ['Water / Ice', 0, 0, 0],
  ].forEach(([desc, mt, rate, amt]) => {
    pushOh('Raw Material', desc as string, mt as number, 'MT', amt as number, { rate, remarks: 'Avg cost per MT (incl. GST)' });
  });

  // Manpower — persons
  ;[
    ['Maintenance & Electrical', 2, 51000],
    ['Quality Team', 9, 233485],
    ['Batching Plant Operator', 4, 100000],
    ['Production Supervision', 2, 60000],
    ['Helper / Unskilled Labour', 11, 370400],
    ['JCB & Loader Operator', 2, 0],
    ['Housekeeping', 1, 0],
  ].forEach(([desc, persons, amt]) => {
    pushOh('Manpower', desc as string, persons as number, 'persons', amt as number, { personnelDetails: `${persons} persons` });
  });

  pushOh('Electricity', 'Power consumption for overall Plant Operations', null, 'kWh', 218419, { remarks: 'Plant electricity bill' });
  pushOh('Maintenance', 'General Maintenance & Repair', null, 'ls', 15000, {});
  pushOh('Maintenance', 'Calibration of Plant', null, 'ls', 0, {});
  pushOh('Maintenance', 'Compliance / External Tests', null, 'ls', 0, {});

  await prisma.overheadEntry.createMany({ data: overheadRows });

  // 20. Seed role-based test users (password: admin123)
  console.log('Seeding role test users...');
  const roleUsers = [
    { email: 'hr@example.com', name: 'HR Manager', role: 'HR' },
    { email: 'accounts@example.com', name: 'Accounts Lead', role: 'Accounts' },
    { email: 'purchase@example.com', name: 'Purchase Officer', role: 'Purchase' },
    { email: 'site@example.com', name: 'Site Engineer', role: 'Site Engineer' },
    { email: 'manager@example.com', name: 'Operations Manager', role: 'Manager' },
    { email: 'viewer@example.com', name: 'Report Viewer', role: 'Viewer' },
  ];
  for (const u of roleUsers) {
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: u.role,
        tenantId: tenantA.id,
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log('Admin: admin@example.com / admin123');
  console.log('Role test users (same password): hr@, accounts@, purchase@, site@, manager@, viewer@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
