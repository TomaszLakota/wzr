import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware to authenticate requests using your existing middleware
import { authenticateToken } from '../src/middleware/auth.js';

// Create a subscription
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get the user from the request (populated by your authentication middleware)
    const user = req.user;

    // Get or create a Stripe customer for this user
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Create a customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.email, // Using email as the user ID based on your system
        },
      });

      customerId = customer.id;

      // Update the user store with the Stripe customer ID
      // You'll need to implement this using your storage system
      try {
        const userRecord = await global.stores.users.get(user.email);
        userRecord.stripeCustomerId = customerId;
        await global.stores.users.set(user.email, userRecord);
      } catch (error) {
        console.error('Error updating user with Stripe customer ID:', error);
      }
    }

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Return the client secret for the payment intent
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

// Check subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Get the Stripe customer ID
    const userRecord = await global.stores.users.get(user.email);
    const customerId = userRecord?.stripeCustomerId;

    if (!customerId) {
      return res.json({ isSubscribed: false });
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const isSubscribed = subscriptions.data.length > 0;

    res.json({
      isSubscribed,
      subscriptionDetails: isSubscribed
        ? {
            id: subscriptions.data[0].id,
            status: subscriptions.data[0].status,
            currentPeriodEnd: new Date(
              subscriptions.data[0].current_period_end * 1000
            ).toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
