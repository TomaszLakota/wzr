import express from 'express';
import stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import { getAllLessons } from '../services/lessonService.js';

const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get all ebooks with prices
 */
router.get('/ebooks', async (req, res) => {
  try {
    // Fetch products from Stripe
    const productsResponse = await stripeClient.products.list({
      limit: 100,
      active: true,
    });

    // For each product, get its price
    const products = await Promise.all(
      productsResponse.data.map(async (product) => {
        // Only get ebooks (products with metadata.type = 'ebook')
        if (!product.metadata.type || product.metadata.type !== 'ebook') {
          return null;
        }

        // Get prices for this product
        const pricesResponse = await stripeClient.prices.list({
          product: product.id,
          limit: 1,
        });

        // If no prices found, skip this product
        if (!pricesResponse.data || pricesResponse.data.length === 0) {
          return null;
        }

        const price = pricesResponse.data[0];
        const formattedPrice = formatPrice(price.unit_amount, price.currency);

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images || [],
          active: product.active,
          price: {
            id: price.id,
            currency: price.currency,
            unit_amount: price.unit_amount,
            formatted: formattedPrice,
          },
        };
      })
    );

    // Filter out null products (those that aren't ebooks or don't have prices)
    const ebooks = products.filter((product) => product !== null);

    res.json(ebooks);
  } catch (error) {
    console.error('Error fetching ebooks:', error.message);
    res.status(500).json({ error: 'Nie udało się pobrać listy ebooków' });
  }
});

/**
 * Create a checkout session
 */
router.post('/checkout', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'ID ceny jest wymagane' });
    }

    // Get frontend URL from environment variable or use client-provided URL as fallback
    const frontendUrl = process.env.FRONTEND_URL || (successUrl ? new URL(successUrl).origin : '');

    // Create checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${frontendUrl}/platnosc/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${frontendUrl}/ebooki`,
      metadata: {
        type: 'ebook',
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).json({ error: 'Nie udało się utworzyć sesji płatności' });
  }
});

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
 * Get user's purchased ebooks
 */
router.get('/user/ebooks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch customer's payment intents
    const paymentIntents = await stripeClient.paymentIntents.list({
      customer: req.user.stripeCustomerId,
      limit: 100,
    });

    // Filter successful payments only
    const successfulPayments = paymentIntents.data.filter(
      (pi) => pi.status === 'succeeded' && pi.metadata.type === 'ebook'
    );

    // Get purchased products
    const purchases = await Promise.all(
      successfulPayments.map(async (payment) => {
        // Get the line items from this payment
        const lineItems = await stripeClient.checkout.sessions.listLineItems(
          payment.metadata.session_id
        );

        if (!lineItems.data || lineItems.data.length === 0) {
          return null;
        }

        // Get product details
        const product = await stripeClient.products.retrieve(lineItems.data[0].price.product);

        return {
          id: payment.id,
          productId: product.id,
          productName: product.name,
          purchaseDate: new Date(payment.created * 1000).toISOString(),
          downloadUrl: product.metadata.download_url || '#',
        };
      })
    );

    // Filter out null purchases
    const validPurchases = purchases.filter((purchase) => purchase !== null);

    res.json(validPurchases);
  } catch (error) {
    console.error('Error fetching user ebooks:', error.message);
    res.status(500).json({ error: 'Nie udało się pobrać zakupionych ebooków' });
  }
});

/**
 * Verify payment status by session ID
 */
router.get('/checkout/sessions/:sessionId/verify', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'ID sesji jest wymagane' });
    }

    // Retrieve session
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Nie znaleziono sesji' });
    }

    // If session has payment intent, get its details
    if (session.payment_intent) {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(session.payment_intent);

      // Return payment status
      return res.json({
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    }

    // If no payment intent, return session status
    return res.json({
      status: session.status === 'complete' ? 'succeeded' : session.status,
      amount: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error('Error verifying session:', error.message);
    res.status(500).json({ error: 'Nie udało się zweryfikować sesji' });
  }
});

/**
 * Format price according to currency
 */
const formatPrice = (amount, currency) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

// Get all lessons
router.get('/lessons', authenticateToken, async (req, res) => {
  try {
    const lessons = await getAllLessons();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania lekcji' });
  }
});

export default router;
