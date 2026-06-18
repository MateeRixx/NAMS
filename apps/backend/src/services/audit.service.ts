import prisma from '@newsflow/database';

export interface AuditLogEntry {
  agencyId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        agencyId: entry.agencyId,
        userId: entry.userId ?? null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        oldValue: (entry.oldValue ?? null) as never,
        newValue: (entry.newValue ?? null) as never,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('[AuditService] Failed to create audit log:', err);
  }
}
