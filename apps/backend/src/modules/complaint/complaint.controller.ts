import { type Request, type Response, type NextFunction } from 'express';
import * as complaintService from './complaint.service.js';

export async function createComplaint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await complaintService.createComplaint(
      req.body as never,
      req.user!.agencyId,
      req.user!.userId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await complaintService.getComplaint(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateComplaintStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await complaintService.updateComplaintStatus(
      id,
      req.body as never,
      req.user!.agencyId,
      req.user!.userId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listComplaints(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await complaintService.listComplaints(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getComplaintHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await complaintService.getComplaintHistory(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
