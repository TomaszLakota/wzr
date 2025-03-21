import stripeClient from '../config/stripeConfig.js';

// Process Stripe webhook events
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_KEY
    );
    console.log(`[WEBHOOK] Received Stripe event: ${event.type}`);
  } catch (err) {
    console.error(`[WEBHOOK] Webhook Error: ${err.message}`);
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
    } else {
      // For one-time payments
      console.log(`[WEBHOOK] One-time payment checkout detected`);

      // Get the payment intent from the session
      const paymentIntent = await stripeClient.paymentIntents.retrieve(session.payment_intent);
      console.log(`[WEBHOOK] Payment intent details: ${JSON.stringify(paymentIntent)}`);

      // Update payment intent with session metadata for later reference
      await stripeClient.paymentIntents.update(session.payment_intent, {
        metadata: {
          ...paymentIntent.metadata,
          session_id: session.id,
          type: session.metadata.type || 'ebook',
        },
      });
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error processing checkout session: ${error.message}`);
    console.error(error);
  }

  console.log(`[WEBHOOK] Payment successful for session ${session.id}`);
};

// Handle invoice.payment_succeeded event
const handleInvoicePaymentSucceeded = async (invoice) => {
  const { users } = global.stores;

  try {
    console.log(`[WEBHOOK] Invoice payment succeeded: ${invoice.id}`);
    console.log(`[WEBHOOK] Invoice details: ${JSON.stringify(invoice)}`);

    if (
      invoice.billing_reason === 'subscription_create' ||
      invoice.billing_reason === 'subscription_cycle'
    ) {
      console.log(`[WEBHOOK] Subscription invoice detected for reason: ${invoice.billing_reason}`);

      const subscription = await stripeClient.subscription.retrieve(invoice.subscription);
      console.log(`[WEBHOOK] Subscription details: ${JSON.stringify(subscription)}`);

      const customer = await stripeClient.customers.retrieve(invoice.customer);
      console.log(`[WEBHOOK] Customer details: ${JSON.stringify(customer)}`);

      const userId = customer.metadata.userId;
      console.log(`[WEBHOOK] User ID from metadata: ${userId}`);

      if (userId) {
        const userRecord = await users.get(userId);
        console.log(`[WEBHOOK] User record before update: ${JSON.stringify(userRecord)}`);

        if (userRecord) {
          userRecord.isSubscribed = true;
          userRecord.stripeSubscriptionId = invoice.subscription;
          await users.set(userId, userRecord);
          console.log(`[WEBHOOK] Updated subscription status for user ${userId}`);

          // Verify the update
          const updatedUser = await users.get(userId);
          console.log(`[WEBHOOK] User record after update: ${JSON.stringify(updatedUser)}`);
        } else {
          console.log(`[WEBHOOK] User record not found for ${userId}`);
        }
      } else {
        console.log(`[WEBHOOK] No user ID found in customer metadata`);
      }
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error processing invoice payment: ${error.message}`);
    console.error(error);
  }
};

// Handle customer.subscription.deleted event
const handleSubscriptionDeleted = async (cancelledSubscription) => {
  const { users } = global.stores;

  try {
    console.log(`[WEBHOOK] Subscription deleted: ${cancelledSubscription.id}`);
    console.log(`[WEBHOOK] Subscription details: ${JSON.stringify(cancelledSubscription)}`);

    const cancelledCustomer = await stripeClient.customers.retrieve(cancelledSubscription.customer);
    console.log(`[WEBHOOK] Customer details: ${JSON.stringify(cancelledCustomer)}`);

    const userId = cancelledCustomer.metadata.userId;
    console.log(`[WEBHOOK] User ID from metadata: ${userId}`);

    if (userId) {
      const userRecord = await users.get(userId);
      console.log(`[WEBHOOK] User record before update: ${JSON.stringify(userRecord)}`);

      if (userRecord) {
        userRecord.isSubscribed = false;
        userRecord.stripeSubscriptionId = null;
        await users.set(userId, userRecord);
        console.log(`[WEBHOOK] Updated subscription status for user ${userId}`);

        // Verify the update
        const updatedUser = await users.get(userId);
        console.log(`[WEBHOOK] User record after update: ${JSON.stringify(updatedUser)}`);
      } else {
        console.log(`[WEBHOOK] User record not found for ${userId}`);
      }
    } else {
      console.log(`[WEBHOOK] No user ID found in customer metadata`);
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error processing subscription cancellation: ${error.message}`);
    console.error(error);
  }
};
