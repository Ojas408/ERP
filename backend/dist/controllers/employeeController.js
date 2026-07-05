"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployee = exports.deleteEmployee = exports.createEmployee = exports.getEmployees = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getEmployees = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const employees = await prisma_1.default.employee.findMany({ where: { tenantId } });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employees' });
    }
};
exports.getEmployees = getEmployees;
const createEmployee = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            const employees = await prisma_1.default.$transaction(data.map(item => prisma_1.default.employee.create({
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
            })));
            await (0, audit_1.logActivity)(userId, email, tenantId, 'BULK_CREATE', 'Employee', `Imported ${employees.length} employees`);
            res.status(201).json(employees);
        }
        else {
            const employee = await prisma_1.default.employee.create({
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
            await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'Employee', `Created employee: ${employee.name}`);
            res.status(201).json(employee);
        }
    }
    catch (error) {
        console.error('Error in createEmployee:', error);
        res.status(500).json({ message: 'Error creating employee' });
    }
};
exports.createEmployee = createEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const id = req.params.id;
        await prisma_1.default.employee.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'Employee', `Deleted employee ID: ${id}`);
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};
exports.deleteEmployee = deleteEmployee;
const updateEmployee = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { userId, email } = req.user;
        const id = req.params.id;
        const { employeeCode, name, position, department, designation, contact, salary, status, joinedDate } = req.body;
        await prisma_1.default.employee.updateMany({
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
        const employee = await prisma_1.default.employee.findFirst({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'Employee', `Updated employee ID: ${id}`);
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update employee' });
    }
};
exports.updateEmployee = updateEmployee;
