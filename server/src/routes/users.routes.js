import express from 'express';
import {
  getUserByEmail,
  updateSubscriptionStatus,
  getAllSubscribedUsersAdmin,
  createCustomerPortalSessionAdmin,
} from '../controllers/user.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import stripe from 'stripe';

const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Get user by email
router.get('/users/:email', authenticateToken, getUserByEmail);

// Update user subscription status
router.post('/users/update-subscription', authenticateToken, updateSubscriptionStatus);

// Admin route to get all users with subscriptions
router.get('/admin/users/subscriptions', authenticateToken, isAdmin, getAllSubscribedUsersAdmin);

// Admin route to create customer portal session
router.post(
  '/admin/users/:email/portal',
  authenticateToken,
  isAdmin,
  createCustomerPortalSessionAdmin
);

export default router;
