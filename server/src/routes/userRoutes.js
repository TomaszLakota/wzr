import express from 'express';
import { getUserByEmail, updateSubscriptionStatus } from '../controllers/userController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import stripe from 'stripe';

const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

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

    // Get detailed subscription info for each user
    const usersWithDetails = await Promise.all(
      subscribedUsers.map(async (user) => {
        try {
          const subscriptions = await stripeClient.subscriptions.list({
            customer: user.stripeCustomerId,
            limit: 1,
            expand: ['data.items.data.price'],
          });

          const subscription = subscriptions.data[0];
          const { password, ...userWithoutPassword } = user;

          let planName = 'Unknown Plan';
          if (subscription?.items?.data[0]?.price?.product) {
            try {
              const product = await stripeClient.products.retrieve(
                subscription.items.data[0].price.product
              );
              planName = product.name;
            } catch (productError) {
              console.error(`Error fetching product details: ${productError.message}`);
            }
          }

          return {
            ...userWithoutPassword,
            subscriptionStartDate: subscription ? new Date(subscription.start_date * 1000) : null,
            subscriptionStatus: subscription ? subscription.status : 'unknown',
            subscriptionPlan: planName,
          };
        } catch (error) {
          console.error(`Error fetching subscription details for user ${user.email}:`, error);
          return {
            ...user,
            subscriptionStartDate: null,
            subscriptionStatus: 'error',
            subscriptionPlan: 'Error fetching plan',
          };
        }
      })
    );

    res.json(usersWithDetails);
  } catch (error) {
    console.error('Error fetching subscribed users:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
