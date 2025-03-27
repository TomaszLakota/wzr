import stripeClient from '../config/stripeConfig.js';

// Process Stripe webhook events
export const handleStripeWebhook = async (req, res) => {
  console.log('[DEBUG] Webhook handler called');
  console.log('[DEBUG] Stripe signature:', req.headers['stripe-signature']);
  console.log('[DEBUG] Raw body available:', !!req.rawBody);
  console.log('[DEBUG] Body type:', typeof req.body);

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[WEBHOOK] Error: STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    if (!sig) {
      console.error('[WEBHOOK] Error: No Stripe signature found in headers');
      return res.status(400).send('No Stripe signature found');
    }

    if (!req.body) {
      console.error('[WEBHOOK] Error: No raw body available');
      return res.status(400).send('No raw body available');
    }

    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`[WEBHOOK] Received Stripe event: ${event.type}`);
  } catch (err) {
    console.error(`[WEBHOOK] Webhook Error: ${err.message}`);
    console.error('[WEBHOOK] Full error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    default:
      console.log(`[WEBHOOK] Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

// Handle checkout.session.completed event
const handleCheckoutSessionCompleted = async (session) => {
  const { users } = global.stores;

  console.log(`[WEBHOOK] Checkout session completed: ${session.id}`);
  console.log(`[WEBHOOK] Session details: ${JSON.stringify(session)}`);

  try {
    // For subscription checkouts
    if (session.mode === 'subscription') {
      console.log(`[WEBHOOK] Subscription checkout detected`);
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      console.log(`[WEBHOOK] Customer ID: ${customerId}, Subscription ID: ${subscriptionId}`);

      // Get customer details to find the user
      const customer = await stripeClient.customers.retrieve(customerId);
      console.log(`[WEBHOOK] Customer details: ${JSON.stringify(customer)}`);

      // Get the user from metadata or client_reference_id
      const userId = customer.metadata.userId || session.client_reference_id;
      console.log(`[WEBHOOK] User ID from metadata: ${userId}`);

      if (userId) {
        // Update the user's subscription status
        const userRecord = await users.get(userId);
        console.log(`[WEBHOOK] User record before update: ${JSON.stringify(userRecord)}`);

        if (userRecord) {
          userRecord.isSubscribed = true;
          userRecord.stripeSubscriptionId = subscriptionId;
          await users.set(userId, userRecord);
          console.log(`[WEBHOOK] Updated subscription status for user ${userId}`);

          // Verify the update
          const updatedUser = await users.get(userId);
          console.log(`[WEBHOOK] User record after update: ${JSON.stringify(updatedUser)}`);
        } else {
          console.log(`[WEBHOOK] User record not found for ${userId}`);
        }
      } else {
        console.log(`[WEBHOOK] No user ID found in customer metadata or session`);
      }
    } else if (session.mode === 'payment') {
      // For one-time payments
      console.log(`[WEBHOOK] One-time payment checkout detected`);
      console.log(`[WEBHOOK] Session ID: ${session.id}`);
      console.log(`[WEBHOOK] Payment Intent: ${session.payment_intent}`);
      console.log(`[WEBHOOK] Customer: ${session.customer}`);
      console.log(`[WEBHOOK] Session metadata:`, session.metadata);

      // Get the payment intent from the session
      const paymentIntent = await stripeClient.paymentIntents.retrieve(session.payment_intent);
      console.log(`[WEBHOOK] Original payment intent metadata:`, paymentIntent.metadata);

      // Update payment intent with session metadata for later reference
      const updatedPaymentIntent = await stripeClient.paymentIntents.update(
        session.payment_intent,
        {
          metadata: {
            ...paymentIntent.metadata,
            session_id: session.id,
            type: session.metadata.type || 'ebook',
          },
        }
      );

      console.log(`[WEBHOOK] Updated payment intent metadata:`, updatedPaymentIntent.metadata);
      console.log(`[WEBHOOK] Payment intent ${session.payment_intent} update completed`);
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error processing checkout session: ${error.message}`);
    console.error(error);
  }

  console.log(`[WEBHOOK] Checkout session completed: ${session.id}`);
};

// Handle invoice.payment_succeeded event
const handleInvoicePaymentSucceeded = async (invoice) => {
  // Handle invoice.payment_succeeded event
};

// Handle customer.subscription.deleted event
const handleSubscriptionDeleted = async (subscription) => {
  // Handle customer.subscription.deleted event
};
