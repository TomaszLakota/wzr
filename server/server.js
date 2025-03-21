import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

// Import routes
import apiRoutes from './routes/api.js';
import subscriptionRoutes from './routes/subscription.js';

dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API routes
app.use('/api', apiRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Stripe webhook handler
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Handle subscription checkout completion
      if (session.mode === 'subscription') {
        try {
          const customer = await stripe.customers.retrieve(session.customer);

          // Update the user's subscription status
          if (customer && customer.metadata.userId) {
            const userRecord = await global.stores.users.get(customer.metadata.userId);
            if (userRecord) {
              userRecord.isSubscribed = true;
              await global.stores.users.set(customer.metadata.userId, userRecord);
              console.log(`Updated subscription status for user ${customer.metadata.userId}`);
            }
          }
        } catch (error) {
          console.error(`Error updating user subscription status: ${error.message}`);
        }
      } else {
        // Handle one-time payment (like ebook purchase)
        // Get the payment intent from the session
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

        // Update payment intent with session metadata for later reference
        await stripe.paymentIntents.update(session.payment_intent, {
          metadata: {
            ...paymentIntent.metadata,
            session_id: session.id,
            type: session.metadata.type || 'ebook',
          },
        });
      }

      console.log(`Payment successful for session ${session.id}`);
      break;

    case 'invoice.payment_succeeded':
      // Handle successful subscription payment
      const invoice = event.data.object;
      if (
        invoice.billing_reason === 'subscription_create' ||
        invoice.billing_reason === 'subscription_cycle'
      ) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customer = await stripe.customers.retrieve(invoice.customer);

        if (customer.metadata.userId) {
          try {
            // Update user subscription status in your database
            const userRecord = await global.stores.users.get(customer.metadata.userId);
            if (userRecord) {
              userRecord.isSubscribed = true;
              await global.stores.users.set(customer.metadata.userId, userRecord);
              console.log(`Updated subscription status for user ${customer.metadata.userId}`);
            }
          } catch (error) {
            console.error(`Error updating user subscription status: ${error.message}`);
          }
        }
      }
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      const cancelledSubscription = event.data.object;
      const cancelledCustomer = await stripe.customers.retrieve(cancelledSubscription.customer);

      if (cancelledCustomer.metadata.userId) {
        try {
          // Update user subscription status in your database
          const userRecord = await global.stores.users.get(cancelledCustomer.metadata.userId);
          if (userRecord) {
            userRecord.isSubscribed = false;
            await global.stores.users.set(cancelledCustomer.metadata.userId, userRecord);
            console.log(`Subscription cancelled for user ${cancelledCustomer.metadata.userId}`);
          }
        } catch (error) {
          console.error(`Error updating user subscription status: ${error.message}`);
        }
      }
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
  app.use(express.static(path.join(__dirname, '../build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
