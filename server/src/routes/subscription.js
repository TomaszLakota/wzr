import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper to get/create Stripe customer and update Supabase user
const getOrCreateStripeCustomer = async (supabase, userId, userEmail, userName) => {
  // 1. Fetch user to get current Stripe Customer ID
  const { data: user, error: fetchUserError } = await supabase
    .from('users')
    .select('id, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (fetchUserError || !user) {
    console.error(`[SUB_HELPER] Error fetching user ${userId}:`, fetchUserError);
    throw new Error('User not found');
  }

  if (user.stripe_customer_id) {
    console.log(
      `[SUB_HELPER] Found existing Stripe customer ID ${user.stripe_customer_id} for user ${userId}`
    );
    return user.stripe_customer_id;
  }

  // 2. Create Stripe customer if not found
  console.log(`[SUB_HELPER] Creating Stripe customer for user ${userId} (${userEmail})`);
  try {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        userId: userId, // Store our DB user ID
      },
    });
    const customerId = customer.id;

    // 3. Update user record in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);

    if (updateError) {
      console.error(
        `[SUB_HELPER] Failed to update user ${userId} with Stripe customer ID ${customerId}:`,
        updateError
      );
      // Decide how to handle - throw error? Log and continue?
      throw new Error('Failed to update user with Stripe customer ID');
    }
    console.log(`[SUB_HELPER] Associated Stripe customer ${customerId} with user ${userId}`);
    return customerId;
  } catch (stripeError) {
    console.error('[SUB_HELPER] Error creating Stripe customer:', stripeError);
    throw new Error('Could not create Stripe customer');
  }
};

// Create a subscription (likely deprecated by create-checkout-session?)
// Keeping refactored logic for reference, but checkout session is preferred by Stripe
router.post('/create-subscription', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userId = req.user.userId;
  const userEmail = req.user.email;
  const userName = req.user.name;
  try {
    const { priceId } = req.body;
    console.log(`[SUB_CREATE] Create subscription requested for user ${userId}, price: ${priceId}`);
    if (!priceId) return res.status(400).json({ error: 'Price ID is required' });

    const customerId = await getOrCreateStripeCustomer(supabase, userId, userEmail, userName);

    console.log(`[SUB_CREATE] Creating subscription for customer: ${customerId}`);
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    console.log(`[SUB_CREATE] Subscription ${subscription.id} created (${subscription.status})`);
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent?.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    console.error(`[SUB_CREATE] Error creating subscription for user ${userId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Check subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userId = req.user.userId;
  console.log(`[SUB_STATUS] Checking subscription status for user: ${userId}`);

  try {
    // 1. Fetch user for customer ID
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, stripe_customer_id, subscription_status') // Select current status too
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error(`[SUB_STATUS] Error fetching user ${userId}:`, fetchError);
      return res.status(404).json({ error: 'User not found' });
    }

    const customerId = user.stripe_customer_id;
    if (!customerId) {
      console.log(`[SUB_STATUS] No Stripe customer ID for user ${userId}`);
      // Ensure status is inactive if no customer ID
      if (user.subscription_status !== 'inactive') {
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId);
      }
      return res.json({ isSubscribed: false, subscriptionDetails: null });
    }

    // 2. Check Stripe for active subscription
    console.log(`[SUB_STATUS] Fetching active subscription for customer: ${customerId}`);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
      expand: ['data.default_payment_method'], // Optionally expand needed fields
    });

    const activeSubscription = subscriptions.data.length > 0 ? subscriptions.data[0] : null;
    const isStripeSubscribed = !!activeSubscription;
    const currentDbStatus = user.subscription_status === 'active';

    console.log(`[SUB_STATUS] Stripe active: ${isStripeSubscribed}, DB status: ${currentDbStatus}`);

    // 3. Update DB if status mismatch
    if (currentDbStatus !== isStripeSubscribed) {
      const newDbStatus = isStripeSubscribed ? 'active' : 'inactive';
      console.log(`[SUB_STATUS] Updating DB status for user ${userId} to ${newDbStatus}`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ subscription_status: newDbStatus })
        .eq('id', userId);
      if (updateError) {
        console.error(`[SUB_STATUS] Failed to update DB status for user ${userId}:`, updateError);
        // Decide whether to return old status or error
      }
    }

    res.json({
      isSubscribed: isStripeSubscribed,
      subscriptionDetails: activeSubscription
        ? {
            id: activeSubscription.id,
            status: activeSubscription.status,
            currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString(),
            // Add other relevant details
            // paymentMethod: activeSubscription.default_payment_method
          }
        : null,
    });
  } catch (error) {
    console.error(`[SUB_STATUS] Error checking subscription status for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Create a customer portal session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userId = req.user.userId;
  console.log(`[PORTAL] Creating portal session for user: ${userId}`);
  try {
    // 1. Fetch user for customer ID
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error(`[PORTAL] Error fetching user ${userId}:`, fetchError);
      return res.status(404).json({ error: 'User not found' });
    }

    const customerId = user.stripe_customer_id;
    if (!customerId) {
      console.log(`[PORTAL] No Stripe customer ID for user ${userId}`);
      return res.status(400).json({ error: 'Stripe customer account not found for this user' });
    }

    // 2. Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/profil`, // Ensure this matches your frontend route
    });

    console.log(`[PORTAL] Portal session created for customer ${customerId}`);
    res.json({ url: portalSession.url });
  } catch (error) {
    console.error(`[PORTAL] Error creating portal session for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
});

// Create a checkout session for subscription
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userId = req.user.userId;
  const userEmail = req.user.email;
  const userName = req.user.name;
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    console.log(`[SUB_CHECKOUT] Creating checkout session for user: ${userId}, price: ${priceId}`);
    if (!priceId) return res.status(400).json({ error: 'Price ID is required' });

    const customerId = await getOrCreateStripeCustomer(supabase, userId, userEmail, userName);

    const frontendUrl = process.env.FRONTEND_URL || (successUrl ? new URL(successUrl).origin : '');

    console.log(`[SUB_CHECKOUT] Creating checkout session for customer: ${customerId}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer: customerId,
      success_url: successUrl || `${frontendUrl}/profil?session_id={CHECKOUT_SESSION_ID}`, // Redirect to profile/dashboard on success
      cancel_url: cancelUrl || `${frontendUrl}/`,
      // Use client_reference_id to link session to your user ID for webhook handling
      client_reference_id: userId,
      // Or use metadata if preferred
      // metadata: { userId: userId }
    });

    console.log(`[SUB_CHECKOUT] Checkout session ${session.id} created`);
    res.json({ url: session.url });
  } catch (error) {
    console.error(`[SUB_CHECKOUT] Error creating checkout session for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Force check subscription (Alias for /subscription-status endpoint logic)
router.post('/force-check-subscription', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userId = req.user.userId;
  console.log(`[FORCE_CHECK] Force checking subscription status for user: ${userId}`);

  // Reuse the logic from GET /subscription-status
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single();
    if (fetchError || !user) throw new Error('User not found');

    const customerId = user.stripe_customer_id;
    if (!customerId) {
      if (user.subscription_status !== 'inactive') {
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId);
      }
      return res.json({
        success: true,
        isSubscribed: false,
        message: 'User has no Stripe customer ID.',
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    const isStripeSubscribed = subscriptions.data.length > 0;
    const currentDbStatus = user.subscription_status === 'active';

    if (currentDbStatus !== isStripeSubscribed) {
      const newDbStatus = isStripeSubscribed ? 'active' : 'inactive';
      await supabase.from('users').update({ subscription_status: newDbStatus }).eq('id', userId);
      console.log(`[FORCE_CHECK] Updated DB status for user ${userId} to ${newDbStatus}`);
    }

    res.json({
      success: true,
      isSubscribed: isStripeSubscribed,
      message: 'Subscription status synchronized.',
    });
  } catch (error) {
    console.error(`[FORCE_CHECK] Error force checking subscription for user ${userId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to synchronize subscription status' });
  }
});

export default router;
