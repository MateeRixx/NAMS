import { type Request, type Response, type NextFunction } from 'express';
import * as customerService from './customer.service.js';

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerService.createCustomer(req.body as never, req.user!.agencyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await customerService.getCustomer(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await customerService.updateCustomer(id, req.body as never, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    await customerService.deleteCustomer(id, req.user!.agencyId, req.user!.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerService.listCustomers(req.query as never, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.params['customerId']!;
    const result = await customerService.createAddress(
      customerId,
      req.body as never,
      req.user!.agencyId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.params['customerId']!;
    const result = await customerService.listAddresses(customerId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.params['customerId']!;
    const addressId = req.params['addressId']!;
    const result = await customerService.updateAddress(
      customerId,
      addressId,
      req.body as never,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.params['customerId']!;
    const addressId = req.params['addressId']!;
    await customerService.deleteAddress(customerId, addressId, req.user!.agencyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
