"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const logActivity = async (userId, userEmail, tenantId, action, entity, details) => {
    try {
        await prisma_1.default.auditLog.create({
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
exports.logActivity = logActivity;
