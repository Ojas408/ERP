"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productionController_1 = require("../controllers/productionController");
const inventoryController_1 = require("../controllers/inventoryController");
const expenseController_1 = require("../controllers/expenseController");
const statsController_1 = require("../controllers/statsController");
const employeeController_1 = require("../controllers/employeeController");
const vehicleController_1 = require("../controllers/vehicleController");
const vendorController_1 = require("../controllers/vendorController");
const siteController_1 = require("../controllers/siteController");
const consumptionController_1 = require("../controllers/consumptionController");
const attendanceController_1 = require("../controllers/attendanceController");
const maintenanceController_1 = require("../controllers/maintenanceController");
const challanController_1 = require("../controllers/challanController");
const purchaseOrderController_1 = require("../controllers/purchaseOrderController");
const vehicleMovementController_1 = require("../controllers/vehicleMovementController");
const materialInwardController_1 = require("../controllers/materialInwardController");
const rmcGradeController_1 = require("../controllers/rmcGradeController");
const scrapController_1 = require("../controllers/scrapController");
const overheadController_1 = require("../controllers/overheadController");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const upload_1 = __importDefault(require("./upload"));
const masterController_1 = require("../controllers/masterController");
const router = (0, express_1.Router)();
// Apply authentication to all API routes below
router.use(auth_1.authenticate);
// Document upload route
router.use('/upload', upload_1.default);
// Master Data routes
router.get('/masters/:type', (0, rbac_1.authorize)(['all', 'admin', 'hr', 'accounts', 'purchase', 'site engineer']), masterController_1.getMasters);
router.post('/masters/:type', (0, rbac_1.authorize)(['all', 'admin']), masterController_1.createMaster);
router.put('/masters/:type/:id', (0, rbac_1.authorize)(['all', 'admin']), masterController_1.updateMaster);
router.delete('/masters/:type/:id', (0, rbac_1.authorize)(['all', 'admin']), masterController_1.deleteMaster);
// Stats
router.get('/stats', (0, rbac_1.authorize)(['stats', 'dashboard']), statsController_1.getDashboardStats);
// Reports and derived dashboards
router.get('/reports/accounts', (0, rbac_1.authorize)(['reports/accounts']), reportController_1.getAccountsReport);
router.get('/reports/business', (0, rbac_1.authorize)(['reports/business']), reportController_1.getBusinessReport);
router.get('/reports/efficiency', (0, rbac_1.authorize)(['reports/efficiency']), reportController_1.getEfficiencyReport);
router.get('/reports/targets', (0, rbac_1.authorize)(['reports/targets']), reportController_1.getTargetReport);
router.get('/reports/time-motion', (0, rbac_1.authorize)(['reports/time-motion']), reportController_1.getTimeMotionReport);
router.get('/reports/maintenance-overview', (0, rbac_1.authorize)(['reports/maintenance-overview']), reportController_1.getMaintenanceOverviewReport);
router.get('/reports/settings', (0, rbac_1.authorize)(['all']), reportController_1.getSettingsReport);
// Production
router.get('/production', (0, rbac_1.authorize)(['production']), productionController_1.getProductions);
router.post('/production', (0, rbac_1.authorize)(['production']), productionController_1.createProduction);
router.put('/production/:id', (0, rbac_1.authorize)(['production']), productionController_1.updateProduction);
router.delete('/production/:id', (0, rbac_1.authorize)(['production']), productionController_1.deleteProduction);
// Inventory
router.get('/inventory', (0, rbac_1.authorize)(['inventory']), inventoryController_1.getInventory);
router.post('/inventory', (0, rbac_1.authorize)(['inventory']), inventoryController_1.createInventoryItem);
router.put('/inventory/:id', (0, rbac_1.authorize)(['inventory']), inventoryController_1.updateInventoryItem);
router.delete('/inventory/:id', (0, rbac_1.authorize)(['inventory']), inventoryController_1.deleteInventoryItem);
// Expenses
router.get('/expenses', (0, rbac_1.authorize)(['expenses']), expenseController_1.getExpenses);
router.post('/expenses', (0, rbac_1.authorize)(['expenses']), expenseController_1.createExpense);
router.put('/expenses/:id', (0, rbac_1.authorize)(['expenses']), expenseController_1.updateExpense);
router.delete('/expenses/:id', (0, rbac_1.authorize)(['expenses']), expenseController_1.deleteExpense);
// Employees
router.get('/employees', (0, rbac_1.authorize)(['employees']), employeeController_1.getEmployees);
router.post('/employees', (0, rbac_1.authorize)(['employees']), employeeController_1.createEmployee);
router.put('/employees/:id', (0, rbac_1.authorize)(['employees']), employeeController_1.updateEmployee);
router.delete('/employees/:id', (0, rbac_1.authorize)(['employees']), employeeController_1.deleteEmployee);
// Vehicles
router.get('/vehicles', (0, rbac_1.authorize)(['vehicles', 'vehicle-io', 'time-motion', 'maintenance', 'challans']), vehicleController_1.getVehicles);
router.post('/vehicles', (0, rbac_1.authorize)(['vehicles']), vehicleController_1.createVehicle);
router.put('/vehicles/:id', (0, rbac_1.authorize)(['vehicles']), vehicleController_1.updateVehicle);
router.delete('/vehicles/:id', (0, rbac_1.authorize)(['vehicles']), vehicleController_1.deleteVehicle);
// Vendors
router.get('/vendors', (0, rbac_1.authorize)(['vendors']), vendorController_1.getVendors);
router.post('/vendors', (0, rbac_1.authorize)(['vendors']), vendorController_1.createVendor);
router.put('/vendors/:id', (0, rbac_1.authorize)(['vendors']), vendorController_1.updateVendor);
router.delete('/vendors/:id', (0, rbac_1.authorize)(['vendors']), vendorController_1.deleteVendor);
// Sites
router.get('/sites', (0, rbac_1.authorize)(['sites', 'challans']), siteController_1.getSites);
router.post('/sites', (0, rbac_1.authorize)(['sites']), siteController_1.createSite);
router.put('/sites/:id', (0, rbac_1.authorize)(['sites']), siteController_1.updateSite);
router.delete('/sites/:id', (0, rbac_1.authorize)(['sites']), siteController_1.deleteSite);
// Consumption
router.get('/consumption', (0, rbac_1.authorize)(['consumption']), consumptionController_1.getConsumptions);
router.post('/consumption', (0, rbac_1.authorize)(['consumption']), consumptionController_1.createConsumption);
router.put('/consumption/:id', (0, rbac_1.authorize)(['consumption']), consumptionController_1.updateConsumption);
router.delete('/consumption/:id', (0, rbac_1.authorize)(['consumption']), consumptionController_1.deleteConsumption);
// Attendance
router.get('/attendance', (0, rbac_1.authorize)(['attendance', 'employees']), attendanceController_1.getAttendances);
router.post('/attendance', (0, rbac_1.authorize)(['attendance', 'employees']), attendanceController_1.createAttendance);
router.put('/attendance/:id', (0, rbac_1.authorize)(['attendance', 'employees']), attendanceController_1.updateAttendance);
router.delete('/attendance/:id', (0, rbac_1.authorize)(['attendance', 'employees']), attendanceController_1.deleteAttendance);
// Maintenance
router.get('/maintenance', (0, rbac_1.authorize)(['maintenance']), maintenanceController_1.getMaintenances);
router.post('/maintenance', (0, rbac_1.authorize)(['maintenance']), maintenanceController_1.createMaintenance);
router.put('/maintenance/:id', (0, rbac_1.authorize)(['maintenance']), maintenanceController_1.updateMaintenance);
router.delete('/maintenance/:id', (0, rbac_1.authorize)(['maintenance']), maintenanceController_1.deleteMaintenance);
// Challan
router.get('/challans', (0, rbac_1.authorize)(['challans']), challanController_1.getChallans);
router.post('/challans', (0, rbac_1.authorize)(['challans']), challanController_1.createChallan);
router.put('/challans/:id', (0, rbac_1.authorize)(['challans']), challanController_1.updateChallan);
router.delete('/challans/:id', (0, rbac_1.authorize)(['challans']), challanController_1.deleteChallan);
// Purchase Orders
router.get('/purchase-orders', (0, rbac_1.authorize)(['purchase-orders']), purchaseOrderController_1.getPurchaseOrders);
router.post('/purchase-orders', (0, rbac_1.authorize)(['purchase-orders']), purchaseOrderController_1.createPurchaseOrder);
router.put('/purchase-orders/:id', (0, rbac_1.authorize)(['purchase-orders']), purchaseOrderController_1.updatePurchaseOrder);
router.delete('/purchase-orders/:id', (0, rbac_1.authorize)(['purchase-orders']), purchaseOrderController_1.deletePurchaseOrder);
// Vehicle Movements
router.get('/vehicle-movements', (0, rbac_1.authorize)(['vehicle-io', 'time-motion']), vehicleMovementController_1.getVehicleMovements);
router.post('/vehicle-movements', (0, rbac_1.authorize)(['vehicle-io']), vehicleMovementController_1.createVehicleMovement);
router.put('/vehicle-movements/:id', (0, rbac_1.authorize)(['vehicle-io']), vehicleMovementController_1.updateVehicleMovement);
router.delete('/vehicle-movements/:id', (0, rbac_1.authorize)(['vehicle-io']), vehicleMovementController_1.deleteVehicleMovement);
// Material Inward
router.get('/material-inward', (0, rbac_1.authorize)(['material-inward']), materialInwardController_1.getMaterialInwards);
router.post('/material-inward', (0, rbac_1.authorize)(['material-inward']), materialInwardController_1.createMaterialInward);
router.put('/material-inward/:id', (0, rbac_1.authorize)(['material-inward']), materialInwardController_1.updateMaterialInward);
router.delete('/material-inward/:id', (0, rbac_1.authorize)(['material-inward']), materialInwardController_1.deleteMaterialInward);
// RMC Grades
router.get('/rmc-grades', (0, rbac_1.authorize)(['rmc-grades']), rmcGradeController_1.getRmcGrades);
router.post('/rmc-grades', (0, rbac_1.authorize)(['rmc-grades']), rmcGradeController_1.createRmcGrade);
router.put('/rmc-grades/:id', (0, rbac_1.authorize)(['rmc-grades']), rmcGradeController_1.updateRmcGrade);
router.delete('/rmc-grades/:id', (0, rbac_1.authorize)(['rmc-grades']), rmcGradeController_1.deleteRmcGrade);
// Scrap Management
router.get('/scrap', (0, rbac_1.authorize)(['scrap']), scrapController_1.getScraps);
router.post('/scrap', (0, rbac_1.authorize)(['scrap']), scrapController_1.createScrap);
router.put('/scrap/:id', (0, rbac_1.authorize)(['scrap']), scrapController_1.updateScrap);
router.delete('/scrap/:id', (0, rbac_1.authorize)(['scrap']), scrapController_1.deleteScrap);
// Overhead Report
router.get('/overhead', (0, rbac_1.authorize)(['overhead-report', 'reports/accounts']), overheadController_1.getOverheadEntries);
router.get('/overhead/summary', (0, rbac_1.authorize)(['overhead-report', 'reports/accounts']), overheadController_1.getOverheadSummary);
router.post('/overhead', (0, rbac_1.authorize)(['overhead-report']), overheadController_1.createOverheadEntry);
router.put('/overhead/:id', (0, rbac_1.authorize)(['overhead-report']), overheadController_1.updateOverheadEntry);
router.delete('/overhead/:id', (0, rbac_1.authorize)(['overhead-report']), overheadController_1.deleteOverheadEntry);
exports.default = router;
