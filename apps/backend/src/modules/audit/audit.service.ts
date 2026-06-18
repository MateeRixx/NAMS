import * as auditRepository from './audit.repository.js';

export async function listAuditLogs(agencyId: string, page = 1, pageSize = 50) {
  const offset = (page - 1) * pageSize;
  const { logs, total } = await auditRepository.listAuditLogs(agencyId, pageSize, offset);
  return { logs, total, page, pageSize };
}

export async function getAuditLog(id: string, agencyId: string) {
  const log = await auditRepository.findAuditLogById(id, agencyId);
  if (!log) {
    const { NotFoundError } = await import('@newsflow/shared');
    throw new NotFoundError('AuditLog');
  }
  return log;
}
