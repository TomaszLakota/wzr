import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';
import stripe from 'stripe';

dotenv.config();

const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Initialize products in the store
router.get('/init-products', async (req, res) => {
  try {
    const { products } = global.stores;

    // Fetch products from Stripe API
    const stripeProducts = await stripeClient.products.list({
      active: true,
      limit: 10,
    });

    console.log(`Fetched ${stripeProducts.data.length} products from Stripe`);

    let initializedCount = 0;

    // Process each product
    for (const product of stripeProducts.data) {
      try {
        // Get prices for this product
        const prices = await stripeClient.prices.list({
          product: product.id,
          active: true,
          limit: 1,
        });

        if (prices.data.length > 0) {
          const price = prices.data[0];

          // Create a product record with the price
          const productRecord = {
            id: product.id,
            name: product.name,
            description: product.description || '',
            images: product.images || [],
            active: product.active,
            price: {
              id: price.id,
              currency: price.currency,
              unit_amount: price.unit_amount,
              formatted: `${(price.unit_amount / 100).toFixed(0)} zł`,
            },
          };

          // Store the product in our database
          await products.set(product.id, productRecord);
          initializedCount++;
        }
      } catch (priceError) {
        console.error(`Error fetching prices for product ${product.id}:`, priceError);
      }
    }

    res.status(200).json({
      message: 'Products initialized successfully',
      count: initializedCount,
    });
  } catch (error) {
    console.error('Error initializing products:', error);
    res.status(500).json({ error: 'Failed to initialize products' });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { products } = global.stores;

    // Use iterator() to get all products
    const productList = [];

    // Retrieve each product using the iterator
    for await (const [key, value] of products.iterator()) {
      if (value && value.active) {
        productList.push(value);
      }
    }

    res.json(productList);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get a specific product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { products } = global.stores;

    const product = await products.get(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(`Error fetching product ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create checkout session for a product
router.post('/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { products } = global.stores;

    const product = await products.get(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.price || !product.price.id) {
      return res.status(400).json({ error: 'Product has no valid price' });
    }

    // Here you would create a Stripe checkout session using the product's price ID
    // For now, just return a success message
    res.json({
      success: true,
      message: 'Checkout session created',
      // In a real implementation:
      // sessionUrl: checkoutSession.url
    });
  } catch (error) {
    console.error(`Error creating checkout for product ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
