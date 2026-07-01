import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/audit';
const router = Router();
// Ensure uploads folder exists in working directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Multer disk storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});
const upload = multer({
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
        const fileDocument = await prisma.document.create({
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
        await logActivity(userId, userEmail, tenantId, 'UPLOAD_FILE', 'Document', `Uploaded file ${req.file.originalname} for ${employeeId ? 'Employee' : vehicleId ? 'Vehicle' : challanId ? 'Challan' : 'General'}`);
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
        const documents = await prisma.document.findMany({
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
        const doc = await prisma.document.findFirst({
            where: { id, tenantId },
        });
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        // Remove file from disk
        const diskPath = path.join(process.cwd(), 'uploads', doc.fileName);
        if (fs.existsSync(diskPath)) {
            fs.unlinkSync(diskPath);
        }
        await prisma.document.delete({ where: { id: doc.id } });
        await logActivity(userId, userEmail, tenantId, 'DELETE_FILE', 'Document', `Deleted file ${doc.originalName}`);
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Failed to delete document' });
    }
});
export default router;
