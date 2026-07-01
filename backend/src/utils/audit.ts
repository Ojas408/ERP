import prisma from '../lib/prisma';

export const logActivity = async (
  userId: string,
  userEmail: string,
  tenantId: string,
  action: string,
  entity: string,
  details?: string
) => {
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
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
