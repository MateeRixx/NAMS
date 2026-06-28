import { Router } from 'express';
import { customerAuth } from '../../middleware/customerAuth.js';
import * as customerPortalController from './customer-portal.controller.js';

const router = Router();

router.use(customerAuth);

router.get('/dashboard', customerPortalController.getDashboard);
router.get('/products', customerPortalController.listProducts);
router.post('/subscriptions', customerPortalController.createSubscription);
router.get('/subscriptions', customerPortalController.listSubscriptions);
router.patch('/subscriptions/:id/cancel', customerPortalController.cancelSubscription);
router.patch('/subscriptions/:id/pause', customerPortalController.pauseSubscription);
router.patch('/subscriptions/:id/resume', customerPortalController.resumeSubscription);
router.get('/invoices', customerPortalController.listInvoices);
router.get('/invoices/:id', customerPortalController.getInvoice);
router.get('/invoices/:id/pdf', customerPortalController.downloadInvoicePdf);
router.post('/invoices/:id/pay', customerPortalController.initInvoicePayment);
router.post('/invoices/:id/verify', customerPortalController.verifyInvoicePayment);
router.get('/complaints', customerPortalController.listComplaints);
router.post('/complaints', customerPortalController.createComplaint);
router.get('/addresses', customerPortalController.listAddresses);
router.post('/addresses', customerPortalController.createAddress);
router.patch('/addresses/:id', customerPortalController.updateAddress);
router.delete('/addresses/:id', customerPortalController.deleteAddress);

router.get('/onboarding', customerPortalController.getOnboardingStatus);
router.get('/profile', customerPortalController.getProfile);
router.patch('/profile', customerPortalController.updateProfile);

router.post('/cart/estimate', customerPortalController.estimateCart);
router.post('/cart/checkout', customerPortalController.checkoutCart);

router.get('/notifications', customerPortalController.listNotifications);
router.get('/notifications/unread-count', customerPortalController.getUnreadNotificationCount);

router.get('/distribution-requests', customerPortalController.listMyDistributionRequests);
router.post('/distribution-requests', customerPortalController.createMyDistributionRequest);
router.get('/article-requests', customerPortalController.listMyArticleRequests);
router.post('/article-requests', customerPortalController.createMyArticleRequest);

export default router;
