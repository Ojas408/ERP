import prisma from '../lib/prisma';
export const logActivity = async (userId, userEmail, tenantId, action, entity, details) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                userEmail,
                tenantId,
                action,
                entity,
                details,
            },
        });
    }
    catch (error) {
        console.error('Failed to write audit log:', error);
    }
};
