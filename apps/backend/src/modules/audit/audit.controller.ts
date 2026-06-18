import { type Request, type Response, type NextFunction } from 'express';
import * as auditService from './audit.service.js';

export async function listAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = req.query['page'] ? Number(req.query['page']) : 1;
    const pageSize = req.query['pageSize'] ? Number(req.query['pageSize']) : 50;
    const result = await auditService.listAuditLogs(req.user!.agencyId, page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await auditService.getAuditLog(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
