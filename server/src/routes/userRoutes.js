import express from 'express';
import { getUserByEmail, updateSubscriptionStatus } from '../controllers/userController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get user by email
router.get('/users/:email', authenticateToken, getUserByEmail);

// Update user subscription status
router.post('/users/update-subscription', authenticateToken, updateSubscriptionStatus);

// Admin route to get all users with subscriptions
router.get('/admin/users/subscriptions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { users } = global.stores;
    const allUsers = await users.getAll();

    // Filter users with stripe subscriptions
    const subscribedUsers = allUsers.filter((user) => user.isSubscribed);

    // Remove sensitive information
    const sanitizedUsers = subscribedUsers.map(({ password, ...user }) => user);

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching subscribed users:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
