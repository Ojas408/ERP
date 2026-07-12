import { Router } from 'express';
import { getProductions, createProduction, deleteProduction, updateProduction } from '../controllers/productionController';
import { getInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem } from '../controllers/inventoryController';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { getDashboardStats } from '../controllers/statsController';
import { getEmployees, createEmployee, deleteEmployee, updateEmployee } from '../controllers/employeeController';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendorController';
import { getSites, createSite, updateSite, deleteSite } from '../controllers/siteController';
import { getConsumptions, createConsumption, updateConsumption, deleteConsumption } from '../controllers/consumptionController';
import { getAttendances, createAttendance, updateAttendance, deleteAttendance } from '../controllers/attendanceController';
import { getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance } from '../controllers/maintenanceController';
import { getChallans, createChallan, updateChallan, deleteChallan } from '../controllers/challanController';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from '../controllers/purchaseOrderController';
import { getVehicleMovements, createVehicleMovement, updateVehicleMovement, deleteVehicleMovement } from '../controllers/vehicleMovementController';
import { getMaterialInwards, createMaterialInward, updateMaterialInward, deleteMaterialInward } from '../controllers/materialInwardController';
import { getRmcGrades, createRmcGrade, updateRmcGrade, deleteRmcGrade } from '../controllers/rmcGradeController';
import { getScraps, createScrap, updateScrap, deleteScrap } from '../controllers/scrapController';
import {
  getOverheadEntries,
  getOverheadSummary,
  createOverheadEntry,
  updateOverheadEntry,
  deleteOverheadEntry,
} from '../controllers/overheadController';
import {
  getAccountsReport,
  getBusinessReport,
  getEfficiencyReport,
  getMaintenanceOverviewReport,
  getSettingsReport,
  getTargetReport,
  getTimeMotionReport,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import express from 'express';
import uploadRouter from './upload';
import { getMasters, createMaster, updateMaster, deleteMaster } from '../controllers/masterController';
import { getCustomColumns, createCustomColumn, deleteCustomColumn } from '../controllers/customColumnController';

const router = Router();

// Apply authentication to all API routes below
router.use(authenticate);

// Document upload route
router.use('/upload', uploadRouter);

// Master Data routes
router.get('/masters/:type', authorize(['all', 'admin', 'hr', 'accounts', 'purchase', 'site engineer']), getMasters);
router.post('/masters/:type', authorize(['all', 'admin']), createMaster);
router.put('/masters/:type/:id', authorize(['all', 'admin']), updateMaster);
router.delete('/masters/:type/:id', authorize(['all', 'admin']), deleteMaster);

// Stats
router.get('/stats', authorize(['stats', 'dashboard']), getDashboardStats);

// Reports and derived dashboards
router.get('/reports/accounts', authorize(['reports/accounts']), getAccountsReport);
router.get('/reports/business', authorize(['reports/business']), getBusinessReport);
router.get('/reports/efficiency', authorize(['reports/efficiency']), getEfficiencyReport);
router.get('/reports/targets', authorize(['reports/targets']), getTargetReport);
router.get('/reports/time-motion', authorize(['reports/time-motion']), getTimeMotionReport);
router.get('/reports/maintenance-overview', authorize(['reports/maintenance-overview']), getMaintenanceOverviewReport);
router.get('/reports/settings', authorize(['all']), getSettingsReport);

// Production
router.get('/production', authorize(['production']), getProductions);
router.post('/production', authorize(['production']), createProduction);
router.put('/production/:id', authorize(['production']), updateProduction);
router.delete('/production/:id', authorize(['production']), deleteProduction);

// Inventory
router.get('/inventory', authorize(['inventory']), getInventory);
router.post('/inventory', authorize(['inventory']), createInventoryItem);
router.put('/inventory/:id', authorize(['inventory']), updateInventoryItem);
router.delete('/inventory/:id', authorize(['inventory']), deleteInventoryItem);

// Expenses
router.get('/expenses', authorize(['expenses']), getExpenses);
router.post('/expenses', authorize(['expenses']), createExpense);
router.put('/expenses/:id', authorize(['expenses']), updateExpense);
router.delete('/expenses/:id', authorize(['expenses']), deleteExpense);

// Employees
router.get('/employees', authorize(['employees']), getEmployees);
router.post('/employees', authorize(['employees']), createEmployee);
router.put('/employees/:id', authorize(['employees']), updateEmployee);
router.delete('/employees/:id', authorize(['employees']), deleteEmployee);

// Vehicles
router.get('/vehicles', authorize(['vehicles', 'vehicle-io', 'time-motion', 'maintenance', 'challans']), getVehicles);
router.post('/vehicles', authorize(['vehicles']), createVehicle);
router.put('/vehicles/:id', authorize(['vehicles']), updateVehicle);
router.delete('/vehicles/:id', authorize(['vehicles']), deleteVehicle);

// Vendors
router.get('/vendors', authorize(['vendors']), getVendors);
router.post('/vendors', authorize(['vendors']), createVendor);
router.put('/vendors/:id', authorize(['vendors']), updateVendor);
router.delete('/vendors/:id', authorize(['vendors']), deleteVendor);

// Sites
router.get('/sites', authorize(['sites', 'challans']), getSites);
router.post('/sites', authorize(['sites']), createSite);
router.put('/sites/:id', authorize(['sites']), updateSite);
router.delete('/sites/:id', authorize(['sites']), deleteSite);

// Consumption
router.get('/consumption', authorize(['consumption']), getConsumptions);
router.post('/consumption', authorize(['consumption']), createConsumption);
router.put('/consumption/:id', authorize(['consumption']), updateConsumption);
router.delete('/consumption/:id', authorize(['consumption']), deleteConsumption);

// Attendance
router.get('/attendance', authorize(['attendance', 'employees']), getAttendances);
router.post('/attendance', authorize(['attendance', 'employees']), createAttendance);
router.put('/attendance/:id', authorize(['attendance', 'employees']), updateAttendance);
router.delete('/attendance/:id', authorize(['attendance', 'employees']), deleteAttendance);

// Maintenance
router.get('/maintenance', authorize(['maintenance']), getMaintenances);
router.post('/maintenance', authorize(['maintenance']), createMaintenance);
router.put('/maintenance/:id', authorize(['maintenance']), updateMaintenance);
router.delete('/maintenance/:id', authorize(['maintenance']), deleteMaintenance);

// Challan
router.get('/challans', authorize(['challans']), getChallans);
router.post('/challans', authorize(['challans']), createChallan);
router.put('/challans/:id', authorize(['challans']), updateChallan);
router.delete('/challans/:id', authorize(['challans']), deleteChallan);

// Purchase Orders
router.get('/purchase-orders', authorize(['purchase-orders']), getPurchaseOrders);
router.post('/purchase-orders', authorize(['purchase-orders']), createPurchaseOrder);
router.put('/purchase-orders/:id', authorize(['purchase-orders']), updatePurchaseOrder);
router.delete('/purchase-orders/:id', authorize(['purchase-orders']), deletePurchaseOrder);

// Vehicle Movements
router.get('/vehicle-movements', authorize(['vehicle-io', 'time-motion']), getVehicleMovements);
router.post('/vehicle-movements', authorize(['vehicle-io']), createVehicleMovement);
router.put('/vehicle-movements/:id', authorize(['vehicle-io']), updateVehicleMovement);
router.delete('/vehicle-movements/:id', authorize(['vehicle-io']), deleteVehicleMovement);

// Material Inward
router.get('/material-inward', authorize(['material-inward']), getMaterialInwards);
router.post('/material-inward', authorize(['material-inward']), createMaterialInward);
router.put('/material-inward/:id', authorize(['material-inward']), updateMaterialInward);
router.delete('/material-inward/:id', authorize(['material-inward']), deleteMaterialInward);

// RMC Grades
router.get('/rmc-grades', authorize(['rmc-grades']), getRmcGrades);
router.post('/rmc-grades', authorize(['rmc-grades']), createRmcGrade);
router.put('/rmc-grades/:id', authorize(['rmc-grades']), updateRmcGrade);
router.delete('/rmc-grades/:id', authorize(['rmc-grades']), deleteRmcGrade);

// Scrap Management
router.get('/scrap', authorize(['scrap']), getScraps);
router.post('/scrap', authorize(['scrap']), createScrap);
router.put('/scrap/:id', authorize(['scrap']), updateScrap);
router.delete('/scrap/:id', authorize(['scrap']), deleteScrap);

// Overhead Report
router.get('/overhead', authorize(['overhead-report', 'reports/accounts']), getOverheadEntries);
router.get('/overhead/summary', authorize(['overhead-report', 'reports/accounts']), getOverheadSummary);
router.post('/overhead', authorize(['overhead-report']), createOverheadEntry);
router.put('/overhead/:id', authorize(['overhead-report']), updateOverheadEntry);
router.delete('/overhead/:id', authorize(['overhead-report']), deleteOverheadEntry);

// Custom Columns
router.get('/custom-columns', authorize(['all']), getCustomColumns);
router.post('/custom-columns', authorize(['all', 'admin']), createCustomColumn);
router.delete('/custom-columns/:id', authorize(['all', 'admin']), deleteCustomColumn);

export default router;
