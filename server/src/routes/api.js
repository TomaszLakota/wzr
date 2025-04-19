import express from 'express';
import stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import { getAllLessons, getLessonById } from '../services/lessonService.js';

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
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'ID ceny jest wymagane' });
    }

    // Get frontend URL from environment variable or use client-provided URL as fallback
    const frontendUrl = process.env.FRONTEND_URL || (successUrl ? new URL(successUrl).origin : '');

    // Get user from auth token
    const user = req.user; // authenticateToken middleware already verified and decoded the token
    let customerId = user.stripeCustomerId;

    // If user has no Stripe customer ID, create one
    if (!customerId) {
      try {
        const customer = await stripeClient.customers.create({
          email: user.email,
          metadata: {
            userId: user.email, // Using email as userId since that's our primary key
          },
        });

        // Update user in database with new Stripe customer ID
        await global.stores.users.set(user.email, {
          ...user,
          stripeCustomerId: customer.id,
        });

        customerId = customer.id;
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return res.status(500).json({ error: 'Nie udało się utworzyć konta klienta' });
      }
    }

    // Create checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${frontendUrl}/platnosc/sukces?payment_intent={PAYMENT_INTENT}`,
      cancel_url: cancelUrl || `${frontendUrl}/ebooki`,
      customer: customerId,
      metadata: {
        type: 'ebook',
      },
      client_reference_id: user.email,
    };

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

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
    if (!req.user?.stripeCustomerId) {
      console.log('No Stripe customer ID found for user');
      return res.json([]); // Return empty array if user has no Stripe customer ID
    }

    console.log('Fetching ebooks for customer:', req.user.stripeCustomerId);

    // Get all successful checkout sessions for this customer with line items expanded
    const sessions = await stripeClient.checkout.sessions.list({
      customer: req.user.stripeCustomerId,
      limit: 100,
      expand: ['data.line_items'],
    });

    // Extract price IDs from line items
    const priceIds = sessions.data
      .filter((session) => session.payment_status === 'paid')
      .flatMap((session) => session.line_items.data)
      .map((item) => item.price?.id)
      .filter(Boolean);

    if (priceIds.length === 0) {
      console.log('No paid items found for customer');
      return res.json([]);
    }

    // Fetch all prices and their products
    const allPrices = [];
    for (const priceId of priceIds) {
      try {
        const price = await stripeClient.prices.retrieve(priceId, {
          expand: ['product'],
        });
        allPrices.push(price);
      } catch (error) {
        console.error(`Error fetching price ${priceId}:`, error.message);
        // Continue with other prices if one fails
      }
    }

    // Create a map of prices for easy lookup
    const priceMap = new Map(allPrices.map((price) => [price.id, price]));

    // Process sessions and extract purchased ebooks
    const purchases = sessions.data
      .filter((session) => session.payment_status === 'paid')
      .flatMap((session) => {
        const lineItem = session.line_items.data[0];
        if (!lineItem?.price?.id) return [];

        const price = priceMap.get(lineItem.price.id);
        if (!price?.product) return [];

        const product = price.product;

        // Skip if not an ebook
        if (!product.metadata?.type || product.metadata.type !== 'ebook') return [];

        return [
          {
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images || [],
            active: product.active,
            price: {
              id: price.id,
              currency: price.currency,
              unit_amount: price.unit_amount,
              formatted: formatPrice(price.unit_amount, price.currency),
            },
            purchaseInfo: {
              purchaseDate: new Date(session.created * 1000).toISOString(),
              paymentId: session.payment_intent,
              downloadUrl: product.metadata.download_url || null,
            },
          },
        ];
      })
      .sort(
        (a, b) => new Date(b.purchaseInfo.purchaseDate) - new Date(a.purchaseInfo.purchaseDate)
      );

    console.log('Valid purchases found:', purchases.length);
    res.json(purchases);
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

/**
 * Get all lessons
 */
router.get('/lekcje', async (req, res) => {
  try {
    const lessons = await getAllLessons();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error.message);
    res.status(500).json({ error: 'Nie udało się pobrać listy lekcji' });
  }
});

/**
 * Get a single lesson by ID
 */
router.get('/lekcje/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id, 10);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID lekcji' });
    }
    const lesson = await getLessonById(lessonId);
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ error: 'Nie znaleziono lekcji' });
    }
  } catch (error) {
    console.error('Error fetching lesson:', error.message);
    res.status(500).json({ error: 'Nie udało się pobrać lekcji' });
  }
});

export default router;
