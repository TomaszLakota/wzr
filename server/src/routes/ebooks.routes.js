import express from 'express';
import stripe from 'stripe';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Helper function
const formatPrice = (amount, currency) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

/**
 * Get all ebooks with prices from Supabase
 */
router.get('/', async (req, res) => {
  // Changed path from '/ebooks' to '/'
  const supabase = req.app.locals.supabase;
  try {
    const { data: ebooks, error } = await supabase
      .from('products')
      .select(
        `
            id,
            name,
            description,
            active,
            image_url,
            prices (
                id,
                currency,
                unit_amount,
                active
            )
        `
      )
      .eq('active', true)
      .eq('prices.active', true);

    if (error) {
      console.error('Error fetching ebooks from Supabase:', error);
      throw error;
    }

    const formattedEbooks = ebooks
      .map((product) => {
        const activePrice = product.prices.find((p) => p.active);
        if (!activePrice) return null;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          image_url: product.image_url,
          price: {
            id: activePrice.id,
            currency: activePrice.currency,
            unit_amount: activePrice.unit_amount,
            formatted: formatPrice(activePrice.unit_amount, activePrice.currency),
          },
        };
      })
      .filter(Boolean);

    res.json(formattedEbooks);
  } catch (error) {
    console.error('Error fetching ebooks:', error.message);
    res.status(500).json({ error: 'Nie udało się pobrać listy ebooków' });
  }
});

/**
 * Get a single ebook by ID with full description
 */
router.get('/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id } = req.params;

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
            id,
            name,
            description,
            full_description,
            active,
            image_url,
            prices (
                id,
                currency,
                unit_amount,
                active
            )
        `
      )
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      console.error(`Error fetching ebook ${id} from Supabase:`, error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'E-book nie został znaleziony' });
      }
      throw error;
    }

    if (!product) {
      return res.status(404).json({ error: 'E-book nie został znaleziony' });
    }

    const activePrice = product.prices?.find((p) => p.active);
    if (!activePrice) {
      return res.status(404).json({ error: 'E-book nie ma aktywnej ceny' });
    }

    const formattedEbook = {
      id: product.id,
      name: product.name,
      description: product.description,
      full_description: product.full_description,
      active: product.active,
      image_url: product.image_url,
      price: {
        id: activePrice.id,
        currency: activePrice.currency,
        unit_amount: activePrice.unit_amount,
        formatted: formatPrice(activePrice.unit_amount, activePrice.currency),
      },
    };

    res.json(formattedEbook);
  } catch (error) {
    console.error(`Error fetching ebook ${id}:`, error.message);
    res.status(500).json({ error: 'Nie udało się pobrać szczegółów e-booka' });
  }
});

/**
 * Create a checkout session for ebook purchase
 */
router.post('/checkout', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  // Get productId from body OR fetch it from Stripe price later
  let { priceId, productId, successUrl, cancelUrl } = req.body;
  const authenticatedUserId = req.user.userId;
  const userEmail = req.user.email;

  // Only priceId is strictly required from the request now
  if (!priceId) {
    return res.status(400).json({ error: 'ID ceny jest wymagane' });
  }

  try {
    // If productId is missing, fetch it from the Stripe Price object
    if (!productId) {
      try {
        console.log(`Product ID missing for price ${priceId}, fetching from Stripe...`);
        const priceObject = await stripeClient.prices.retrieve(priceId);
        if (!priceObject || !priceObject.product) {
          console.error(`Could not retrieve price or product ID for price ${priceId}`);
          return res
            .status(404)
            .json({ error: 'Nie znaleziono produktu powiązanego z podaną ceną' });
        }
        productId = priceObject.product; // Get productId from the price
        console.log(`Found product ID ${productId} for price ${priceId}`);
      } catch (stripeError) {
        console.error(`Error fetching price ${priceId} from Stripe:`, stripeError);
        return res.status(500).json({ error: 'Błąd podczas weryfikacji ceny produktu' });
      }
    }

    const { data: user, error: fetchUserError } = await supabase
      .from('users')
      .select('id, stripe_customer_id')
      .eq('id', authenticatedUserId)
      .single();

    if (fetchUserError || !user) {
      console.error('Error fetching user during checkout:', fetchUserError);
      return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      console.log(`Creating Stripe customer for user ${authenticatedUserId} (${userEmail})`);
      try {
        const customer = await stripeClient.customers.create({
          email: userEmail,
          metadata: {
            userId: authenticatedUserId,
          },
        });
        customerId = customer.id;

        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', authenticatedUserId);

        if (updateError) {
          console.error(
            `Failed to update user ${authenticatedUserId} with Stripe customer ID ${customerId}:`,
            updateError
          );
        }
        console.log(`Associated Stripe customer ${customerId} with user ${authenticatedUserId}`);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return res.status(500).json({ error: 'Nie udało się utworzyć konta klienta Stripe' });
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || (successUrl ? new URL(successUrl).origin : '');
    const sessionConfig = {
      payment_method_types: ['card', 'p24'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${frontendUrl}/platnosc/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${frontendUrl}/ebooki`,
      customer: customerId,
      metadata: {
        type: 'ebook',
        userId: authenticatedUserId,
        productIds: productId,
      },
    };

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Nie udało się utworzyć sesji płatności' });
  }
});

router.get('/user/purchased', authenticateToken, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const authenticatedUserId = req.user.userId;

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', authenticatedUserId)
      .single();

    if (userError) {
      console.error(`[GET /user/ebooks] Error fetching user ${authenticatedUserId}:`, userError);
      return res.status(500).json({ error: 'Błąd podczas pobierania danych użytkownika' });
    }

    if (!user?.stripe_customer_id) {
      console.log(
        `[GET /user/ebooks] User ${authenticatedUserId} not found or no Stripe customer ID associated. Returning empty list.`
      );
      return res.json([]); // No customer ID, so no Stripe purchases
    }

    const customerId = user.stripe_customer_id;
    const sessions = await stripeClient.checkout.sessions.list({
      customer: customerId,
      limit: 100,
      expand: ['data.line_items'],
    });

    const priceIds = sessions.data
      .filter((session) => session.payment_status === 'paid')
      .flatMap((session) => session.line_items?.data || [])
      .map((item) => item.price?.id)
      .filter(Boolean);

    if (priceIds.length === 0) {
      return res.json([]);
    }

    const pricesPromises = priceIds.map((priceId) =>
      stripeClient.prices.retrieve(priceId, { expand: ['product'] }).catch((error) => {
        console.error(`[GET /user/ebooks] Error fetching price ${priceId}:`, error.message);
        return null;
      })
    );
    const pricesResults = await Promise.all(pricesPromises);
    const allPrices = pricesResults.filter(Boolean);

    const priceMap = new Map(allPrices.map((price) => [price.id, price]));

    const purchases = sessions.data
      .filter((session) => session.payment_status === 'paid')
      .flatMap((session) => {
        if (!session.line_items?.data?.length) return [];

        return session.line_items.data
          .map((lineItem) => {
            if (!lineItem?.price?.id) return null;

            const price = priceMap.get(lineItem.price.id);
            if (!price || typeof price.product !== 'object' || price.product === null) return null;

            const product = price.product;

            if (product.metadata?.type !== 'ebook') return null;

            return {
              id: product.id,
              name: product.name,
              description: product.description,
              active: product.active,
              image_url: product.image_url,
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
            };
          })
          .filter(Boolean);
      })
      // Deduplicate based on product ID, keeping the latest purchase
      .reduce((acc, current) => {
        const existingIndex = acc.findIndex((item) => item.id === current.id);
        if (existingIndex > -1) {
          // If current is newer, replace; otherwise, keep existing
          if (
            new Date(current.purchaseInfo.purchaseDate) >
            new Date(acc[existingIndex].purchaseInfo.purchaseDate)
          ) {
            acc[existingIndex] = current;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, [])
      .sort(
        (a, b) => new Date(b.purchaseInfo.purchaseDate) - new Date(a.purchaseInfo.purchaseDate)
      ); // Sort by purchase date descending

    res.json(purchases);
  } catch (error) {
    console.error(
      `[GET /user/ebooks] Error fetching user ebooks for ${authenticatedUserId}:`,
      error.message,
      error.stack
    );
    res.status(500).json({ error: 'Nie udało się pobrać zakupionych ebooków' });
  }
});

router.post('/admin/sync-stripe', authenticateToken, isAdmin, async (req, res) => {
  const supabase = req.app.locals.supabase;
  console.log('[POST /admin/sync-stripe] Starting sync process...');

  try {
    // 1. Fetch active products from Stripe
    console.log('Fetching active products from Stripe...');
    const productsResponse = await stripeClient.products.list({
      limit: 100, // Adjust limit as needed
      active: true,
    });
    console.log(`Found ${productsResponse.data.length} active products.`);

    const productsToUpsert = [];
    const pricesToUpsert = [];

    // 2. Process each product
    for (const product of productsResponse.data) {
      // Filter for ebooks
      if (product.metadata?.type !== 'ebook') {
        // console.log(`Skipping product ${product.id} (not an ebook).`);
        continue;
      }
      console.log(`Processing ebook product ${product.id} (${product.name})...`);

      // Prepare product data for Supabase
      productsToUpsert.push({
        id: product.id, // Use Stripe product ID as primary key
        name: product.name,
        description: product.description,
        full_description: product.metadata?.full_description || product.description, // Use metadata if available, fall back to description
        active: product.active,
        image_url: product.images?.[0] || null, // Use first image URL
      });

      // 3. Fetch active prices for this product
      console.log(`Fetching active prices for product ${product.id}...`);
      const pricesResponse = await stripeClient.prices.list({
        product: product.id,
        active: true,
        limit: 10, // Adjust limit as needed
      });
      console.log(`Found ${pricesResponse.data.length} active prices for product ${product.id}.`);

      // Prepare price data for Supabase
      pricesResponse.data.forEach((price) => {
        pricesToUpsert.push({
          id: price.id, // Use Stripe price ID as primary key
          product_id: product.id,
          active: price.active,
          currency: price.currency,
          unit_amount: price.unit_amount,
        });
      });
    }

    // 4. Upsert Products into Supabase
    if (productsToUpsert.length > 0) {
      console.log(`Upserting ${productsToUpsert.length} products into Supabase...`);
      const { error: productUpsertError } = await supabase
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'id' }); // Match on 'id'

      if (productUpsertError) {
        console.error('Error upserting products:', productUpsertError);
        throw new Error(`Supabase product upsert failed: ${productUpsertError.message}`);
      }
      console.log('Products upserted successfully.');
    } else {
      console.log('No products to upsert.');
    }

    // 5. Upsert Prices into Supabase
    if (pricesToUpsert.length > 0) {
      console.log(`Upserting ${pricesToUpsert.length} prices into Supabase...`);
      const { error: priceUpsertError } = await supabase
        .from('prices')
        .upsert(pricesToUpsert, { onConflict: 'id' }); // Match on 'id'

      if (priceUpsertError) {
        console.error('Error upserting prices:', priceUpsertError);
        throw new Error(`Supabase price upsert failed: ${priceUpsertError.message}`);
      }
      console.log('Prices upserted successfully.');
    } else {
      console.log('No prices to upsert.');
    }

    console.log('[POST /admin/sync-stripe] Sync process completed successfully.');
    res.status(200).json({
      message: 'Sync successful',
      productsUpserted: productsToUpsert.length,
      pricesUpserted: pricesToUpsert.length,
    });
  } catch (error) {
    console.error('[POST /admin/sync-stripe] Sync process failed:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

export default router;
