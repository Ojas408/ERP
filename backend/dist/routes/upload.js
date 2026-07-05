"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_1 = require("../utils/audit");
const router = (0, express_1.Router)();
// Ensure uploads folder exists in working directory
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer disk storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
// POST /api/upload - Handle file upload and log metadata in Document model
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        const userEmail = req.user.email;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { employeeId, vehicleId, challanId } = req.body;
        const fileDocument = await prisma_1.default.document.create({
            data: {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                fileType: req.file.mimetype,
                filePath: `/uploads/${req.file.filename}`,
                fileSize: req.file.size,
                tenantId,
                employeeId: employeeId || undefined,
                vehicleId: vehicleId || undefined,
                challanId: challanId || undefined,
            },
        });
        await (0, audit_1.logActivity)(userId, userEmail, tenantId, 'UPLOAD_FILE', 'Document', `Uploaded file ${req.file.originalname} for ${employeeId ? 'Employee' : vehicleId ? 'Vehicle' : challanId ? 'Challan' : 'General'}`);
        res.status(201).json(fileDocument);
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Failed to upload file' });
    }
});
// GET /api/upload - List documents for the tenant (optional filter by entity)
router.get('/', async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { employeeId, vehicleId, challanId } = req.query;
        const documents = await prisma_1.default.document.findMany({
            where: {
                tenantId,
                employeeId: employeeId ? String(employeeId) : undefined,
                vehicleId: vehicleId ? String(vehicleId) : undefined,
                challanId: challanId ? String(challanId) : undefined,
            },
            orderBy: { uploadedAt: 'desc' },
        });
        res.json(documents);
    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Failed to fetch documents' });
    }
});
// DELETE /api/upload/:id - Delete a file document
router.delete('/:id', async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        const userEmail = req.user.email;
        const id = req.params.id;
        const doc = await prisma_1.default.document.findFirst({
            where: { id, tenantId },
        });
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        // Remove file from disk
        const diskPath = path_1.default.join(process.cwd(), 'uploads', doc.fileName);
        if (fs_1.default.existsSync(diskPath)) {
            fs_1.default.unlinkSync(diskPath);
        }
        await prisma_1.default.document.delete({ where: { id: doc.id } });
        await (0, audit_1.logActivity)(userId, userEmail, tenantId, 'DELETE_FILE', 'Document', `Deleted file ${doc.originalName}`);
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Failed to delete document' });
    }
});
exports.default = router;
