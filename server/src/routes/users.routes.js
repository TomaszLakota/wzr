import express from 'express';
import {
  getUserByEmail,
  updateSubscriptionStatus,
  getAllSubscribedUsersAdmin,
  createCustomerPortalSessionAdmin,
  deleteAccount,
} from '../controllers/user.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/users/:email', authenticateToken, getUserByEmail);
router.post('/users/update-subscription', authenticateToken, updateSubscriptionStatus);
router.delete('/users/delete-account', authenticateToken, deleteAccount);

router.get('/admin/users/subscriptions', authenticateToken, isAdmin, getAllSubscribedUsersAdmin);
router.post('/admin/users/:email/portal', authenticateToken, isAdmin, createCustomerPortalSessionAdmin);

export default router;
