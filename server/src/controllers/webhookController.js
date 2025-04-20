import stripeClient from '../config/stripeConfig.js';

// Process Stripe webhook events
export const handleStripeWebhook = async (req, res) => {
  console.log('[DEBUG] Webhook handler called');
  console.log('[DEBUG] Stripe signature:', req.headers['stripe-signature']);
  console.log('[DEBUG] Raw body available:', !!req.rawBody);
  console.log('[DEBUG] Body type:', typeof req.body);

  const sig = req.headers['stripe-signature'];
  const supabase = req.app.locals.supabase; // Get Supabase client
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

  // Handle the event, passing supabase client
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(supabase, event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(supabase, event.data.object);
      break;

    case 'customer.subscription.updated': // Handle updates too (e.g., status changes)
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(supabase, event.data.object);
      break;

    default:
      console.log(`[WEBHOOK] Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

// Handle checkout.session.completed event
const handleCheckoutSessionCompleted = async (supabase, session) => {
  console.log(`[WEBHOOK] Checkout session completed: ${session.id}`);

  try {
    // --- Subscription Checkout ---
    if (session.mode === 'subscription' && session.subscription) {
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      // Use client_reference_id preferentially if available, otherwise fallback to customer metadata
      const userId = session.client_reference_id;

      console.log(
        `[WEBHOOK_SUB] Sub checkout. Customer: ${customerId}, Sub ID: ${subscriptionId}, User ID: ${userId}`
      );

      if (userId) {
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            stripe_subscription_id: subscriptionId, // Store subscription ID if needed
            stripe_customer_id: customerId, // Ensure customer ID is stored/updated
          })
          .eq('id', userId);

        if (error) {
          console.error(`[WEBHOOK_SUB] Error updating user ${userId} subscription status:`, error);
        } else {
          console.log(`[WEBHOOK_SUB] Updated subscription status to active for user ${userId}`);
        }
      } else {
        console.error(
          `[WEBHOOK_SUB] Cannot update subscription status: User ID not found in session (client_reference_id).`
        );
      }
    }
    // --- One-time Payment Checkout ---
    else if (session.mode === 'payment' && session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const productIdsString = session.metadata?.productIds; // Expecting comma-separated Stripe Product IDs

      console.log(
        `[WEBHOOK_PAYMENT] Payment checkout. User: ${userId}, Products: ${productIdsString}`
      );

      if (!userId || !productIdsString) {
        console.error(
          `[WEBHOOK_PAYMENT] Missing required metadata: userId or productIds in session ${session.id}`
        );
        return;
      }

      const productIds = productIdsString.split(',');
      const itemsToInsert = productIds.map((productId) => ({
        user_id: userId,
        product_id: productId,
        // Optionally add purchase price, currency from line items if needed
        // purchase_date: new Date() // Handled by DB default
      }));

      if (itemsToInsert.length > 0) {
        const { error } = await supabase
          .from('user_ebooks') // Assuming table name is 'user_ebooks'
          .insert(itemsToInsert)
          .select(); // Optionally select to confirm insertion

        if (error) {
          // Handle potential duplicate errors gracefully if UNIQUE constraint exists
          if (error.code === '23505') {
            // Postgres unique violation
            console.warn(
              `[WEBHOOK_PAYMENT] Attempted to insert duplicate ebook purchase for user ${userId}, product(s): ${productIds.join(',')}. Ignoring.`
            );
          } else {
            console.error(
              `[WEBHOOK_PAYMENT] Error inserting purchase record for user ${userId}:`,
              error
            );
          }
        } else {
          console.log(
            `[WEBHOOK_PAYMENT] Successfully recorded purchase for user ${userId}, product(s): ${productIds.join(',')}`
          );
        }
      }
    }
    // --- Other session modes or statuses ---
    else {
      console.log(
        `[WEBHOOK] Ignoring checkout session ${session.id}: mode=${session.mode}, status=${session.payment_status}`
      );
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error processing checkout session ${session.id}:`, error);
  }
};

// Handle invoice.payment_succeeded event (Confirms subscription renewal)
const handleInvoicePaymentSucceeded = async (supabase, invoice) => {
  // Typically confirms a subscription is active after payment.
  // Could be redundant if checkout.session.completed and sub updates are handled,
  // but can serve as a backup or handle specific renewal logic.
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (
    invoice.billing_reason === 'subscription_cycle' ||
    invoice.billing_reason === 'subscription_create'
  ) {
    console.log(`[WEBHOOK_INVOICE] Invoice paid for sub ${subscriptionId}, customer ${customerId}`);
    if (customerId) {
      // Ensure user status is active
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active' })
        .eq('stripe_customer_id', customerId);
      // Optionally update based on email if customer ID isn't reliable
      // .eq('email', invoice.customer_email)

      if (error) {
        console.error(
          `[WEBHOOK_INVOICE] Error ensuring active status for customer ${customerId}:`,
          error
        );
      } else {
        console.log(`[WEBHOOK_INVOICE] Ensured active status for customer ${customerId}`);
      }
    }
  }
};

// Handle customer.subscription.updated and customer.subscription.deleted events
const handleSubscriptionChange = async (supabase, subscription) => {
  const customerId = subscription.customer;
  const status = subscription.status;
  // Determine the status to set in DB (e.g., past_due -> inactive)
  const dbStatus = status === 'active' || status === 'trialing' ? 'active' : 'inactive';

  console.log(
    `[WEBHOOK_SUB_CHANGE] Sub ${subscription.id} changed. Customer: ${customerId}, New Status: ${status}, DB Status: ${dbStatus}`
  );

  if (customerId) {
    const { error } = await supabase
      .from('users')
      .update({ subscription_status: dbStatus })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error(
        `[WEBHOOK_SUB_CHANGE] Error updating status to ${dbStatus} for customer ${customerId}:`,
        error
      );
    } else {
      console.log(`[WEBHOOK_SUB_CHANGE] Updated status to ${dbStatus} for customer ${customerId}`);
    }
  } else {
    console.error(
      `[WEBHOOK_SUB_CHANGE] Cannot update subscription status: Customer ID missing in subscription ${subscription.id}`
    );
  }
};
