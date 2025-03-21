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
    console.log(`[SUB] Create subscription requested for price: ${priceId}`);

    if (!priceId) {
      console.log('[SUB] Error: Price ID is missing');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get the user from the request (populated by your authentication middleware)
    const user = req.user;
    console.log(`[SUB] User from token: ${JSON.stringify(user)}`);

    // Get the full user record from the database
    let userRecord = await global.stores.users.get(user.email);
    console.log(`[SUB] User record from store: ${JSON.stringify(userRecord)}`);
    if (!userRecord) {
      console.log(`[SUB] Error: User not found in store for email: ${user.email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create a Stripe customer for this user
    let customerId = userRecord.stripeCustomerId;
    console.log(`[SUB] Existing Stripe customer ID: ${customerId || 'none'}`);

    if (!customerId) {
      // Create a customer in Stripe
      console.log(`[SUB] Creating new Stripe customer for user: ${userRecord.email}`);
      const customer = await stripe.customers.create({
        email: userRecord.email,
        name: userRecord.name,
        metadata: {
          userId: userRecord.email, // Using email as the user ID based on your system
        },
      });

      customerId = customer.id;
      console.log(`[SUB] New Stripe customer created with ID: ${customerId}`);

      // Update the user store with the Stripe customer ID
      // You'll need to implement this using your storage system
      try {
        userRecord.stripeCustomerId = customerId;
        await global.stores.users.set(user.email, userRecord);
        console.log(`[SUB] User record updated with Stripe customer ID: ${customerId}`);
        // Verify the update
        const updatedUser = await global.stores.users.get(user.email);
        console.log(`[SUB] Verified user record after update: ${JSON.stringify(updatedUser)}`);
      } catch (error) {
        console.error('[SUB] Error updating user with Stripe customer ID:', error);
      }
    }

    // Create a subscription
    console.log(`[SUB] Creating subscription for customer: ${customerId} with price: ${priceId}`);
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    console.log(`[SUB] Subscription created with ID: ${subscription.id}`);
    console.log(`[SUB] Subscription status: ${subscription.status}`);

    // Return the client secret for the payment intent
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('[SUB] Error creating subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

// Check subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log(`[SUB-STATUS] Checking subscription status for user: ${user.email}`);

    // Get the Stripe customer ID
    const userRecord = await global.stores.users.get(user.email);
    console.log(`[SUB-STATUS] User record: ${JSON.stringify(userRecord)}`);

    const customerId = userRecord?.stripeCustomerId;
    console.log(`[SUB-STATUS] Stripe customer ID: ${customerId || 'none'}`);

    if (!customerId) {
      console.log(`[SUB-STATUS] No Stripe customer ID for user: ${user.email}`);
      return res.json({ isSubscribed: false });
    }

    // Get customer's subscription
    console.log(`[SUB-STATUS] Fetching active subscription for customer: ${customerId}`);
    const subscription = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    console.log(`[SUB-STATUS] Found ${subscription.data.length} active subscription`);
    if (subscription.data.length > 0) {
      console.log(`[SUB-STATUS] Subscription details: ${JSON.stringify(subscription.data[0])}`);
    }

    const isSubscribed = subscription.data.length > 0;
    console.log(`[SUB-STATUS] Is user isSubscribed: ${isSubscribed}`);

    // Update user record with subscription status
    if (userRecord) {
      const previousStatus = userRecord.isSubscribed || false;
      userRecord.isSubscribed = isSubscribed;
      await global.stores.users.set(user.email, userRecord);
      console.log(
        `[SUB-STATUS] Updated user subscription status from ${previousStatus} to ${isSubscribed}`
      );

      // Verify the update
      const updatedUser = await global.stores.users.get(user.email);
      console.log(`[SUB-STATUS] Verified user record after update: ${JSON.stringify(updatedUser)}`);
    }

    res.json({
      isSubscribed,
      subscriptionDetails: isSubscribed
        ? {
            id: subscription.data[0].id,
            status: subscription.data[0].status,
            currentPeriodEnd: new Date(
              subscription.data[0].current_period_end * 1000
            ).toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('[SUB-STATUS] Error checking subscription status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create a customer portal session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log(`[PORTAL] Creating portal session for user: ${user.email}`);

    // Get the Stripe customer ID
    const userRecord = await global.stores.users.get(user.email);
    console.log(`[PORTAL] User record: ${JSON.stringify(userRecord)}`);

    const customerId = userRecord?.stripeCustomerId;
    console.log(`[PORTAL] Stripe customer ID: ${customerId || 'none'}`);

    if (!customerId) {
      console.log(`[PORTAL] No Stripe customer found for user: ${user.email}`);
      return res.status(400).json({ error: 'No Stripe customer found for this user' });
    }

    // Create a portal session
    console.log(`[PORTAL] Creating portal session for customer: ${customerId}`);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/profil`,
    });

    console.log(`[PORTAL] Portal session created with URL: ${session.url}`);
    // Return the URL of the portal
    res.json({ url: session.url });
  } catch (error) {
    console.error('[PORTAL] Error creating portal session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create a checkout session for subscription
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const user = req.user;
    console.log(`[CHECKOUT] Creating checkout session for user: ${user.email}, price: ${priceId}`);

    if (!priceId) {
      console.log('[CHECKOUT] Error: Price ID is missing');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get the full user record from the database
    let userRecord = await global.stores.users.get(user.email);
    console.log(`[CHECKOUT] User record: ${JSON.stringify(userRecord)}`);

    if (!userRecord) {
      console.log(`[CHECKOUT] Error: User not found in store for email: ${user.email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create a Stripe customer for this user
    let customerId = userRecord.stripeCustomerId;
    console.log(`[CHECKOUT] Existing Stripe customer ID: ${customerId || 'none'}`);

    if (!customerId) {
      // Create a customer in Stripe
      console.log(`[CHECKOUT] Creating new Stripe customer for user: ${userRecord.email}`);
      const customer = await stripe.customers.create({
        email: userRecord.email,
        name: userRecord.name,
        metadata: {
          userId: userRecord.email, // Using email as the user ID based on your system
        },
      });

      customerId = customer.id;
      console.log(`[CHECKOUT] New Stripe customer created with ID: ${customerId}`);

      // Update the user record with the Stripe customer ID
      try {
        userRecord.stripeCustomerId = customerId;
        await global.stores.users.set(user.email, userRecord);
        console.log(`[CHECKOUT] User record updated with Stripe customer ID: ${customerId}`);

        // Verify the update
        const updatedUser = await global.stores.users.get(user.email);
        console.log(`[CHECKOUT] Verified user record after update: ${JSON.stringify(updatedUser)}`);
      } catch (error) {
        console.error('[CHECKOUT] Error updating user with Stripe customer ID:', error);
      }
    }

    // Create the checkout session
    console.log(`[CHECKOUT] Creating checkout session for customer: ${customerId}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL}/lekcje?success=true`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/lekcje?canceled=true`,
      customer: customerId,
      client_reference_id: user.email,
      metadata: {
        userId: user.email,
      },
    });

    console.log(`[CHECKOUT] Checkout session created with ID: ${session.id}`);
    console.log(`[CHECKOUT] Checkout session URL: ${session.url}`);

    res.json({ url: session.url });
  } catch (error) {
    console.error('[CHECKOUT] Error creating checkout session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Force check and update subscription status from Stripe
router.post('/force-check-subscription', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log(`[FORCE-CHECK] Force checking subscription for user: ${user.email}`);

    // Get the full user record
    const userRecord = await global.stores.users.get(user.email);
    console.log(`[FORCE-CHECK] User record: ${JSON.stringify(userRecord)}`);

    if (!userRecord) {
      console.log(`[FORCE-CHECK] User not found in database: ${user.email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const customerId = userRecord.stripeCustomerId;
    console.log(`[FORCE-CHECK] Customer ID: ${customerId || 'none'}`);

    if (!customerId) {
      console.log(`[FORCE-CHECK] No Stripe customer ID found for user: ${user.email}`);
      return res.json({ isSubscribed: false, message: 'No Stripe customer ID found' });
    }

    // Retrieve customer from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    console.log(`[FORCE-CHECK] Stripe customer data: ${JSON.stringify(customer)}`);

    // Check for active subscription
    console.log(`[FORCE-CHECK] Fetching all subscription for customer: ${customerId}`);
    const subscription = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    console.log(`[FORCE-CHECK] Found ${subscription.data.length} subscription`);

    // Log all subscription for debugging
    subscription.data.forEach((sub, i) => {
      console.log(
        `[FORCE-CHECK] Subscription ${i + 1}/${subscription.data.length}: ID=${sub.id}, Status=${sub.status}`
      );
    });

    // Find active subscription
    const activeSubscriptions = subscription.data.filter(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    );

    console.log(`[FORCE-CHECK] Found ${activeSubscriptions.length} active subscription`);

    const isSubscribed = activeSubscriptions.length > 0;
    console.log(`[FORCE-CHECK] Is user isSubscribed: ${isSubscribed}`);

    // Update user record
    const previousStatus = userRecord.isSubscribed || false;
    userRecord.isSubscribed = isSubscribed;

    if (isSubscribed && activeSubscriptions.length > 0) {
      userRecord.stripeSubscriptionId = activeSubscriptions[0].id;
      console.log(`[FORCE-CHECK] Updating subscription ID to: ${activeSubscriptions[0].id}`);
    }

    await global.stores.users.set(user.email, userRecord);
    console.log(
      `[FORCE-CHECK] Updated subscription status from ${previousStatus} to ${isSubscribed}`
    );

    // Verify the update
    const updatedUser = await global.stores.users.get(user.email);
    console.log(`[FORCE-CHECK] User record after update: ${JSON.stringify(updatedUser)}`);

    res.json({
      isSubscribed,
      previousStatus,
      message: 'Subscription status updated',
      subscriptionDetails:
        isSubscribed && activeSubscriptions.length > 0
          ? {
              id: activeSubscriptions[0].id,
              status: activeSubscriptions[0].status,
              currentPeriodEnd: new Date(
                activeSubscriptions[0].current_period_end * 1000
              ).toISOString(),
            }
          : null,
    });
  } catch (error) {
    console.error('[FORCE-CHECK] Error checking subscription status:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
