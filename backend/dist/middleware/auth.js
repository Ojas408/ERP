import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Verify that the tenant actually exists in the database
        const tenantExists = await prisma.tenant.findUnique({
            where: { id: decoded.tenantId }
        });
        if (!tenantExists) {
            return res.status(401).json({ message: 'Session invalid: workspace no longer exists' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
