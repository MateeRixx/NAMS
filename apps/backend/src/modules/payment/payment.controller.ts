import { type Request, type Response, type NextFunction } from 'express';
import * as paymentService from './payment.service.js';

export async function recordPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.recordPayment(req.user!.agencyId, req.user!.userId, req.body as never);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function initOnlinePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.initOnlinePayment(req.user!.agencyId, req.user!.userId, req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyOnlinePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.verifyOnlinePayment(req.user!.agencyId, req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function processRefund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.processRefund(req.user!.agencyId, req.user!.userId, req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function retryPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paymentId = req.params['paymentId']!;
    const result = await paymentService.retryFailedPayment(req.user!.agencyId, req.user!.userId, paymentId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function retryAllFailedPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.retryAllFailedPayments(req.user!.agencyId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await paymentService.getPayment(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = req.query['page'] ? Number(req.query['page']) : 1;
    const pageSize = req.query['pageSize'] ? Number(req.query['pageSize']) : 20;
    const result = await paymentService.listPayments(req.user!.agencyId, page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getInvoicePayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoiceId = req.params['invoiceId']!;
    const result = await paymentService.getInvoicePayments(invoiceId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getRefund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await paymentService.getRefund(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listRefunds(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = req.query['page'] ? Number(req.query['page']) : 1;
    const pageSize = req.query['pageSize'] ? Number(req.query['pageSize']) : 20;
    const result = await paymentService.listRefunds(req.user!.agencyId, page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function saveGatewayConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.saveGatewayConfig(req.user!.agencyId, req.user!.userId, req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getGatewayConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await paymentService.getGatewayConfig(req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const agencyId = req.params['agencyId']!;

    const { getPaymentGateway } = await import('../../services/payment-gateway.service.js');
    const { findGatewayConfig } = await import('./payment.repository.js');

    const config = await findGatewayConfig(agencyId);
    if (!config?.webhookSecret) {
      res.status(400).json({ success: false, error: { message: 'Webhook secret not configured' } });
      return;
    }

    const gateway = getPaymentGateway();
    const isValid = gateway.verifyWebhook(req.body, signature, config.webhookSecret);

    if (!isValid) {
      res.status(401).json({ success: false, error: { message: 'Invalid webhook signature' } });
      return;
    }

    const event = req.body as { event: string; payload: { payment: { entity: { id: string; order_id: string; status: string; failure_reason?: string; amount: number } } } };
    const paymentEntity = event.payload.payment.entity;

    switch (event.event) {
      case 'payment.captured': {
        res.json({ success: true, data: { status: 'captured' } });
        break;
      }
      case 'payment.failed': {
        await paymentService.handlePaymentFailure(
          agencyId,
          paymentEntity.order_id,
          paymentEntity.failure_reason ?? 'Payment declined by gateway'
        );
        res.json({ success: true, data: { status: 'failed' } });
        break;
      }
      default:
        res.json({ success: true, data: { status: 'ignored' } });
    }
  } catch (error) {
    next(error);
  }
}
