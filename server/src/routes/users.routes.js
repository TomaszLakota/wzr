import express from 'express';
import { getUserByEmail, updateSubscriptionStatus } from '../controllers/user.controller.js';
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
  const supabase = req.app.locals.supabase;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch paginated subscribed users and total count from Supabase
    const {
      data: subscribedUsers,
      error: fetchError,
      count,
    } = await supabase
      .from('users')
      .select('id, email, name, stripe_customer_id, created_at', { count: 'exact' })
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Error fetching subscribed users:', fetchError);
      return res.status(500).json({ error: 'Błąd podczas pobierania użytkowników' });
    }

    const totalSubscribedUsers = count || 0;

    // 2. Batch fetch subscription details from Stripe for the paginated users
    const productIds = new Set();
    const subscriptionsByCustomer = new Map();

    const subscriptionsPromises = subscribedUsers
      .filter((user) => user.stripe_customer_id) // Only fetch for users with a customer ID
      .map(
        (user) =>
          stripeClient.subscriptions
            .list({
              customer: user.stripe_customer_id,
              limit: 1,
              status: 'active', // Double-check with active status
              expand: ['data.items.data.price'],
            })
            .catch((e) => ({ error: e, data: [], customerId: user.stripe_customer_id })) // Catch errors per user
      );

    const subscriptionsResults = await Promise.all(subscriptionsPromises);

    // 3. Collect product IDs and map subscriptions to customers
    subscriptionsResults.forEach((result) => {
      if (!result.error && result.data?.[0]) {
        const subscription = result.data[0];
        const customerId = subscription.customer;
        const productId = subscription?.items?.data[0]?.price?.product;

        if (customerId) {
          subscriptionsByCustomer.set(customerId, subscription);
          if (productId) {
            productIds.add(productId);
          }
        }
      } else if (result.error) {
        console.error(
          `Error fetching subscription for customer ${result.customerId}:`,
          result.error.message
        );
        // Map error state or default subscription object if needed
        if (result.customerId)
          subscriptionsByCustomer.set(result.customerId, { error: 'Failed to fetch' });
      }
    });

    // 4. Batch fetch product details from Stripe
    const productsMap = new Map();
    if (productIds.size > 0) {
      try {
        const products = await stripeClient.products.list({
          ids: Array.from(productIds),
          limit: Math.min(productIds.size, 100), // Stripe limit is 100
        });
        products.data.forEach((product) => {
          productsMap.set(product.id, product);
        });
      } catch (productError) {
        console.error('Error fetching product details from Stripe:', productError);
        // Handle error - perhaps return plans as 'Error fetching'
      }
    }

    // 5. Combine user data with subscription and product details
    const usersWithDetails = subscribedUsers.map((user) => {
      const { password, ...userWithoutPassword } = user; // Ensure password is not selected or remove it
      const subscription = subscriptionsByCustomer.get(user.stripe_customer_id);

      if (!subscription || subscription.error) {
        return {
          ...userWithoutPassword,
          subscriptionStartDate: null,
          subscriptionStatus: subscription?.error || 'unknown',
          subscriptionPlan: subscription?.error ? 'Error fetching plan' : 'Unknown',
          cancelAt: null,
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
        total: totalSubscribedUsers,
        page,
        limit,
        totalPages: Math.ceil(totalSubscribedUsers / limit),
      },
    });
  } catch (error) {
    console.error('Error processing /admin/users/subscriptions:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Admin route to create customer portal session
router.post('/admin/users/:email/portal', authenticateToken, isAdmin, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userEmail = req.params.email;

  try {
    // Fetch user by email to get their Stripe Customer ID
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('email', userEmail)
      .single();

    if (fetchError || !user) {
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error fetching user ${userEmail} for portal:`, fetchError);
        return res.status(500).json({ error: 'Błąd podczas pobierania użytkownika' });
      }
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    if (!user.stripe_customer_id) {
      return res.status(404).json({ error: 'Użytkownik nie posiada ID klienta Stripe' });
    }

    // Create Stripe Billing Portal Session
    const session = await stripeClient.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/admin/users`, // More specific return URL?
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(`Error creating portal session for ${userEmail}:`, error);
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: `Błąd Stripe: ${error.message}` });
    }
    res.status(500).json({ error: 'Błąd serwera podczas tworzenia sesji portalu' });
  }
});

export default router;
