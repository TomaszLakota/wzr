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
  console.log('[REGISTER] Received registration request');
  const { email, password, name } = req.body;
  const supabase = req.app.locals.supabase; // Get Supabase client

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
    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116: No rows found
      console.error('Error checking existing user:', selectError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password: hashedPassword,
        // Initialize other fields as needed based on your schema
        // stripe_customer_id: null,
        // subscription_status: 'inactive'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return res.status(500).json({ error: 'Failed to register user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        stripeCustomerId: newUser.stripe_customer_id, // Use Supabase column name
      },
      JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
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
  console.log('[LOGIN] Received login request');
  const { email, password } = req.body;
  const supabase = req.app.locals.supabase;

  console.log(`Login attempt for email: ${email}`);

  // Input validation
  if (!email || !password) {
    console.log(`Login failed: Missing ${!email ? 'email' : 'password'} for attempt`);
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Fetch user from Supabase
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*') // Select all fields needed
      .eq('email', email)
      .single();

    if (selectError || !user) {
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching user:', selectError);
      } else {
        console.log(`Login failed: No user found for email ${email}`);
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`Login failed: Invalid password for email ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let userForToken = { ...user }; // Copy user data
    let updatedUserData = {}; // Store potential updates

    // If user has a stripeCustomerId, check for active subscription
    if (user.stripe_customer_id) {
      console.log(`[LOGIN] User has Stripe customer ID: ${user.stripe_customer_id}`);
      try {
        const subscriptions = await stripeClient.subscriptions.list({
          customer: user.stripe_customer_id,
          limit: 1, // Only need the latest potentially active one
          status: 'active', // Filter for active subs directly
        });

        const isSubscribed = subscriptions.data.length > 0;
        const currentDbStatus = user.subscription_status === 'active';
        console.log(
          `[LOGIN] Stripe active subs: ${subscriptions.data.length}, DB status: ${currentDbStatus}`
        );

        // Update user subscription status in DB if needed
        if (currentDbStatus !== isSubscribed) {
          const newStatus = isSubscribed ? 'active' : 'inactive';
          console.log(
            `[LOGIN] Updating subscription status from ${user.subscription_status} to ${newStatus}`
          );
          updatedUserData.subscription_status = newStatus;
          userForToken.subscription_status = newStatus; // Update data for token
        }
      } catch (error) {
        console.error(`[LOGIN] Error checking subscription status: ${error.message}`);
        // Decide if this should prevent login or just log the error
      }
    }

    // Persist updates if any
    if (Object.keys(updatedUserData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updatedUserData)
        .eq('id', user.id);

      if (updateError) {
        console.error('[LOGIN] Error updating user subscription status in DB:', updateError);
        // Decide how to handle this - maybe proceed with old status in token?
      } else {
        console.log(`[LOGIN] User subscription status updated in DB`);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userForToken.id,
        email: userForToken.email,
        name: userForToken.name,
        stripeCustomerId: userForToken.stripe_customer_id,
        subscriptionStatus: userForToken.subscription_status,
      },
      JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = userForToken;

    console.log(`Login successful for user: ${email}`);
    console.log(`User subscription status: ${userForToken.subscription_status}`);

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
