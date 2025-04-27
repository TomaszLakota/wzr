import express from 'express';
import stripe from 'stripe';
import ebooksRouter from './ebooks.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import productRoutes from './products.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import articlesRouter from './articles.routes.js';
import lessonsRouter from './lessons.routes.js';
import webhookRoutes from './webhooks.routes.js';
import contactRoutes from './contact.routes.js';
const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

router.use('/ebooks', ebooksRouter);
router.use('/subscription', subscriptionRoutes);
router.use('/products', productRoutes);
router.use('/articles', articlesRouter);
router.use('/lekcje', lessonsRouter);
router.use(userRoutes);
router.use(authRoutes);
router.use(webhookRoutes);
router.use(contactRoutes);

/**
 * Verify payment status
 */
router.get('/payments/:paymentIntentId/verify', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'ID intencji płatności jest wymagane' });
    }

    // Retrieve payment intent
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({ error: 'Nie znaleziono płatności' });
    }

    // Return payment status
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error verifying payment:', error.message);
    res.status(500).json({ error: 'Nie udało się zweryfikować płatności' });
  }
});

/**
 * Verify checkout session status and grant access if paid
 */
router.get('/checkout/sessions/:sessionId/verify', async (req, res) => {
  const supabase = req.app.locals.supabase; // Get supabase client
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: 'ID sesji jest wymagane' });
    }

    // Retrieve the session, including payment intent status if needed later
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    let accessGranted = false;

    if (session.status === 'complete' && session.payment_status === 'paid') {
      if (session.metadata && session.metadata.userId && session.metadata.productIds) {
        const userId = session.metadata.userId;
        // Assuming productIds metadata stores a single ID for now
        const productId = session.metadata.productIds;

        console.log(`Checkout session ${sessionId} paid. Granting access for user ${userId} to product ${productId}`);

        try {
          // Use upsert to avoid errors if the webhook runs later and inserts the same record
          const { error: upsertError } = await supabase.from('user_ebooks').upsert(
            {
              user_id: userId,
              product_id: productId,
              // purchase_date is handled by default value or trigger in DB
              // stripe_checkout_session_id: sessionId // Optionally store session ID
            },
            { onConflict: 'user_id, product_id' } // Specify conflict target
          );

          if (upsertError) {
            console.error(`Error upserting ebook access for user ${userId}, product ${productId}:`, upsertError);
            // Decide how to handle: maybe still return success but log error?
          } else {
            console.log(`Access granted successfully for user ${userId} to product ${productId}`);
            accessGranted = true;
          }
        } catch (dbError) {
          console.error('Database error during access grant:', dbError);
          // Decide how to handle
        }
      } else {
        console.warn(`Missing metadata in session ${sessionId}. Cannot grant access.`);
        // Metadata missing - maybe purchased via different flow?
      }
    } else {
      console.log(`Session ${sessionId} status: ${session.status}, payment_status: ${session.payment_status}. Access not granted yet.`);
    }

    // Return original verification details plus access status
    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      accessGranted: accessGranted, // Inform frontend if access was attempted/granted
    });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    res.status(500).json({ error: 'Nie udało się zweryfikować sesji płatności' });
  }
});

export default router;
