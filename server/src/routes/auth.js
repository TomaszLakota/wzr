import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import stripe from 'stripe';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Register endpoint
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const users = global.stores.users;

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

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = global.stores.users;

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

    // If user has a stripeCustomerId, check for active subscription
    // to ensure subscription status is accurate
    if (user.stripeCustomerId) {
      console.log(`[LOGIN] User has Stripe customer ID: ${user.stripeCustomerId}`);
      try {
        const subscriptions = await stripeClient.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 100,
        });

        console.log(`[LOGIN] Found ${subscriptions.data.length} subscription for user`);

        // Find active subscription
        const activeSubscriptions = subscriptions.data.filter(
          (sub) => sub.status === 'active' || sub.status === 'trialing'
        );

        console.log(`[LOGIN] User has ${activeSubscriptions.length} active subscription`);

        // Update user subscription status if needed
        const isSubscribed = activeSubscriptions.length > 0;

        if (user.isSubscribed !== isSubscribed) {
          console.log(
            `[LOGIN] Updating subscription status from ${user.isSubscribed} to ${isSubscribed}`
          );
          user.isSubscribed = isSubscribed;

          if (isSubscribed && activeSubscriptions.length > 0) {
            user.stripeSubscriptionId = activeSubscriptions[0].id;
            console.log(`[LOGIN] Setting subscription ID to: ${activeSubscriptions[0].id}`);
          }

          await users.set(email, user);
          console.log(`[LOGIN] User subscription status updated`);
        }
      } catch (error) {
        console.error(`[LOGIN] Error checking subscription status: ${error.message}`);
      }
    }

    // Generate JWT token
    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '24h',
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    console.log(`Login successful for user: ${email}`);
    console.log(
      `User subscription status: ${user.isSubscribed ? 'Subscribed' : 'Not isSubscribed'}`
    );

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

export default router;
