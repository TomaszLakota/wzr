import express from 'express';
import { authenticateToken } from '../src/middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// The test ebook product from Stripe
export const testEbookProduct = {
  id: 'prod_Rydzf2Xagl0dem',
  name: 'test ebook',
  description: 'Test ebook product',
  images: [],
  active: true,
  price: {
    id: 'price_1R4gmL2cdengCFrj8rPznlZu',
    currency: 'pln',
    unit_amount: 2900,
    formatted: '29 zł',
  },
};

// Initialize products in the store
router.get('/init-products', async (req, res) => {
  try {
    const { products } = global.stores;

    // Check if products already exist
    const existingProduct = await products.get(testEbookProduct.id);

    if (!existingProduct) {
      // Store the test ebook product
      await products.set(testEbookProduct.id, testEbookProduct);
      console.log(`Product ${testEbookProduct.id} initialized in the store`);
    }

    res.status(200).json({ message: 'Products initialized successfully' });
  } catch (error) {
    console.error('Error initializing products:', error);
    res.status(500).json({ error: 'Failed to initialize products' });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { products } = global.stores;

    // In a real app, you would have a way to list all keys or retrieve all products
    // For this example, we'll just return the test ebook product
    const testProduct = await products.get(testEbookProduct.id);

    res.json([testProduct]);
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
