import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createStores } from './config/storage.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import subscriptionRoutes from '../routes/subscription.js';
import productRoutes from '../routes/products.js';
import apiRoutes from './routes/api.js';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import stripe from 'stripe';

dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('Starting server with configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', port);
console.log('- Redis URL configured:', !!process.env.REDIS_URL);
console.log('- JWT Secret configured:', !!process.env.JWT_SECRET);

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

try {
  // Initialize stores
  const stores = createStores();
  // Make stores globally accessible
  global.stores = stores;

  const { users, products, orders } = stores;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api', apiRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/products', productRoutes);

  // Initialize products directly at startup
  const initializeProducts = async () => {
    try {
      // Define the test ebook product directly here to avoid circular imports
      const testEbookProduct = {
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

      // Check if product already exists
      const existingProduct = await products.get(testEbookProduct.id);

      if (!existingProduct) {
        // Store the test ebook product
        await products.set(testEbookProduct.id, testEbookProduct);
        console.log(`Product ${testEbookProduct.id} initialized in the store`);
      } else {
        console.log(`Product ${testEbookProduct.id} already exists in the store`);
      }
    } catch (error) {
      console.error('Error initializing products:', error);
    }
  };

  // Initialize products when the server starts
  initializeProducts()
    .then(() => {
      console.log('Product initialization completed');

      // Start the server after initialization is complete
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize products:', error);
      // Continue starting the server even if initialization fails
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Mode: ${process.env.NODE_ENV || 'development'} (after initialization error)`);
      });
    });

  app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
      const existingUser = await users.get(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = {
        email,
        name,
        password: hashedPassword,
        createdAt: Date.now(),
        stripeCustomerId: null,
        isSubscribed: false,
      };

      await users.set(email, user);

      // Generate JWT token
      const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: '24h',
      });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        message: 'Registration successful',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);

    // Input validation
    if (!email || !password) {
      console.log(`Login failed: Missing ${!email ? 'email' : 'password'} for attempt`);
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const user = await users.get(email);
      if (!user) {
        console.log(`Login failed: No user found for email ${email}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log(`Login failed: Invalid password for email ${email}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: '24h',
      });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      console.log(`Login successful for user: ${email}`);

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', {
        email,
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Middleware to protect routes
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  };

  // Protected route example
  app.get('/api/users/:email', authenticateToken, async (req, res) => {
    try {
      // Only allow users to access their own data
      if (req.user.email !== req.params.email) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const user = await users.get(req.params.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stripe webhook handler
  app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SECRET_KEY);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        // Get the payment intent from the session
        const paymentIntent = await stripeClient.paymentIntents.retrieve(session.payment_intent);

        // Update payment intent with session metadata for later reference
        await stripeClient.paymentIntents.update(session.payment_intent, {
          metadata: {
            ...paymentIntent.metadata,
            session_id: session.id,
            type: session.metadata.type || 'ebook',
          },
        });

        console.log(`Payment successful for session ${session.id}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname, '../../build')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../build', 'index.html'));
    });
  }
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
