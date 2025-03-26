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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { users } = global.stores;

    // Get all users first to get total count
    const allUsers = await users.getAll();
    const subscribedUsers = allUsers.filter((user) => user.isSubscribed);

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = subscribedUsers.slice(startIndex, endIndex);

    // Fetch all unique product IDs from Stripe first
    const productIds = new Set();
    const subscriptionsByCustomer = new Map();

    // Batch fetch subscriptions for paginated users
    const subscriptionsPromises = paginatedUsers.map((user) =>
      stripeClient.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 1,
        expand: ['data.items.data.price'],
      })
    );

    const subscriptionsResults = await Promise.all(
      subscriptionsPromises.map((p) => p.catch((e) => ({ error: e, data: [] })))
    );

    // Collect all product IDs and map subscriptions to customers
    subscriptionsResults.forEach((result, index) => {
      if (!result.error && result.data?.[0]) {
        const user = paginatedUsers[index];
        const subscription = result.data[0];
        const productId = subscription?.items?.data[0]?.price?.product;

        if (productId) {
          productIds.add(productId);
        }

        subscriptionsByCustomer.set(user.email, subscription);
      }
    });

    // Batch fetch all needed products at once
    const productsMap = new Map();
    if (productIds.size > 0) {
      const products = await stripeClient.products.list({
        ids: Array.from(productIds),
        limit: 100,
      });

      products.data.forEach((product) => {
        productsMap.set(product.id, product);
      });
    }

    // Combine all the data
    const usersWithDetails = paginatedUsers.map((user) => {
      const { password, ...userWithoutPassword } = user;
      const subscription = subscriptionsByCustomer.get(user.email);

      if (!subscription) {
        return {
          ...userWithoutPassword,
          subscriptionStartDate: null,
          subscriptionStatus: 'error',
          subscriptionPlan: 'Error fetching plan',
        };
      }

      const productId = subscription?.items?.data[0]?.price?.product;
      const product = productsMap.get(productId);

      return {
        ...userWithoutPassword,
        subscriptionStartDate: new Date(subscription.start_date * 1000),
        subscriptionStatus: subscription.status,
        subscriptionPlan: product?.name || 'Unknown Plan',
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      };
    });

    res.json({
      users: usersWithDetails,
      pagination: {
        total: subscribedUsers.length,
        page,
        limit,
        totalPages: Math.ceil(subscribedUsers.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subscribed users:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Admin route to create customer portal session
router.post('/admin/users/:email/portal', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { users } = global.stores;
    const user = await users.get(req.params.email);

    if (!user || !user.stripeCustomerId) {
      return res
        .status(404)
        .json({ error: 'Użytkownik nie znaleziony lub brak ID klienta Stripe' });
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/admin`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
