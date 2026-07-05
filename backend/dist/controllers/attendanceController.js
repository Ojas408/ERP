"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttendance = exports.updateAttendance = exports.createAttendance = exports.getAttendances = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const getAttendances = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const attendances = await prisma_1.default.attendance.findMany({
            where: { tenantId },
            include: { employee: true },
            orderBy: { date: 'desc' },
        });
        res.json(attendances);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendances' });
    }
};
exports.getAttendances = getAttendances;
const createAttendance = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            // We need to resolve employee ID from employee code if necessary, or just insert direct employeeId
            // Let's support both: direct employeeId, or if not provided look up by employeeCode
            const attendanceRecords = await prisma_1.default.$transaction(data.map(item => {
                return prisma_1.default.attendance.create({
                    data: {
                        tenantId,
                        employeeId: item.employeeId,
                        hoursWorked: parseFloat(item.hoursWorked) || 8,
                        overtime: parseFloat(item.overtime || 0),
                        status: item.status || 'present',
                        date: item.date ? new Date(item.date) : new Date(),
                    }
                });
            }));
            await (0, audit_1.logActivity)(userId, email, tenantId, 'BULK_CREATE', 'Attendance', `Imported ${attendanceRecords.length} attendance logs`);
            res.status(201).json(attendanceRecords);
        }
        else {
            const attendance = await prisma_1.default.attendance.create({
                data: {
                    tenantId,
                    employeeId: data.employeeId,
                    hoursWorked: parseFloat(data.hoursWorked),
                    overtime: parseFloat(data.overtime || 0),
                    status: data.status,
                    date: data.date ? new Date(data.date) : new Date(),
                },
            });
            await (0, audit_1.logActivity)(userId, email, tenantId, 'CREATE', 'Attendance', `Marked attendance for employee ID: ${data.employeeId}`);
            res.status(201).json(attendance);
        }
    }
    catch (error) {
        console.error('Error creating attendance:', error);
        res.status(500).json({ error: 'Failed to create attendance' });
    }
};
exports.createAttendance = createAttendance;
const updateAttendance = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    const { employeeId, hoursWorked, overtime, status, date } = req.body;
    try {
        await prisma_1.default.attendance.updateMany({
            where: { id, tenantId },
            data: {
                employeeId,
                hoursWorked: hoursWorked !== undefined ? parseFloat(hoursWorked) : undefined,
                overtime: overtime !== undefined ? parseFloat(overtime) : undefined,
                status,
                date: date ? new Date(date) : undefined,
            },
        });
        const attendance = await prisma_1.default.attendance.findFirst({
            where: { id, tenantId },
            include: { employee: true },
        });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'UPDATE', 'Attendance', `Updated attendance ID: ${id}`);
        res.json(attendance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update attendance' });
    }
};
exports.updateAttendance = updateAttendance;
const deleteAttendance = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, email } = req.user;
    const id = req.params.id;
    try {
        await prisma_1.default.attendance.deleteMany({ where: { id, tenantId } });
        await (0, audit_1.logActivity)(userId, email, tenantId, 'DELETE', 'Attendance', `Deleted attendance ID: ${id}`);
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete attendance' });
    }
};
exports.deleteAttendance = deleteAttendance;
