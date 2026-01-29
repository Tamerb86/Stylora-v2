import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import generateRoutes from './generate.routes.js';
import stripeRoutes from './stripe.routes.js';
import plansRoutes from './plans.routes.js';
import billingRoutes from './billing.routes.js';

const router = Router();

// Health check (public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Public routes (no auth required)
// Plans - public endpoint
router.use('/plans', plansRoutes);

// Stripe webhook (public - uses signature verification)
router.use('/stripe', stripeRoutes);

// Billing webhook (public - uses signature verification)
// Note: billing routes has its own authMiddleware for protected endpoints
router.use('/billing', billingRoutes);

// Protected routes - require authentication
router.use(authMiddleware);

// User routes
router.use('/', userRoutes);

// Product routes
router.use('/products', productRoutes);

// Generate routes
router.use('/generate', generateRoutes);

export default router;
