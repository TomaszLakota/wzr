import stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export default stripeClient;
