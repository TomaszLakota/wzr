import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createStores } from './config/storage.js';
import subscriptionRoutes from '../routes/subscription.js';
import productRoutes from '../routes/products.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import stripe from 'stripe';
import { authenticateToken } from './middleware/auth.js';

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
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api', authRoutes);

  // Initialize products directly at startup
  const initializeProducts = async () => {
    try {
      // Fetch products from Stripe API
      const stripeProducts = await stripeClient.products.list({
        active: true,
        limit: 100,
      });

      console.log(`Fetched ${stripeProducts.data.length} products from Stripe`);

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
            console.log(`Product ${product.id} initialized in the store`);
          } else {
            console.log(`No active prices found for product ${product.id}`);
          }
        } catch (priceError) {
          console.error(`Error fetching prices for product ${product.id}:`, priceError);
        }
      }

      // If no products were found, log a message
      if (stripeProducts.data.length === 0) {
        console.log('No active products found in Stripe');
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

  // Add a route to update user subscription status
  app.post('/api/users/update-subscription', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      console.log(`[UPDATE-SUB] Manually updating subscription status for user: ${user.email}`);

      // Get user record
      const userRecord = await users.get(user.email);
      if (!userRecord) {
        console.log(`[UPDATE-SUB] User not found: ${user.email}`);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`[UPDATE-SUB] Current user record: ${JSON.stringify(userRecord)}`);

      // Check if user has Stripe customer ID
      if (!userRecord.stripeCustomerId) {
        console.log(`[UPDATE-SUB] User has no Stripe customer ID`);
        return res.json({
          success: false,
          message: 'No Stripe customer found',
          isSubscribed: false,
        });
      }

      // Check for active subscription
      try {
        console.log(
          `[UPDATE-SUB] Fetching subscription for customer: ${userRecord.stripeCustomerId}`
        );
        const subscription = await stripeClient.subscription.list({
          customer: userRecord.stripeCustomerId,
          limit: 100,
        });

        console.log(`[UPDATE-SUB] Found ${subscription.data.length} subscription`);

        // Find active subscription
        const activeSubscriptions = subscription.data.filter(
          (sub) => sub.status === 'active' || sub.status === 'trialing'
        );

        console.log(`[UPDATE-SUB] Found ${activeSubscriptions.length} active subscription`);

        const isSubscribed = activeSubscriptions.length > 0;
        const previousStatus = userRecord.isSubscribed || false;

        // Update subscription status
        userRecord.isSubscribed = isSubscribed;

        if (isSubscribed && activeSubscriptions.length > 0) {
          userRecord.stripeSubscriptionId = activeSubscriptions[0].id;
          console.log(`[UPDATE-SUB] Setting subscription ID to: ${activeSubscriptions[0].id}`);
        }

        // Save updated user
        await users.set(user.email, userRecord);
        console.log(
          `[UPDATE-SUB] Updated user subscription status from ${previousStatus} to ${isSubscribed}`
        );

        // Verify update
        const updatedUser = await users.get(user.email);
        console.log(`[UPDATE-SUB] User record after update: ${JSON.stringify(updatedUser)}`);

        return res.json({
          success: true,
          message: 'Subscription status updated',
          isSubscribed,
          previousStatus,
          subscriptionDetails:
            isSubscribed && activeSubscriptions.length > 0
              ? {
                  id: activeSubscriptions[0].id,
                  status: activeSubscriptions[0].status,
                  currentPeriodEnd: new Date(
                    activeSubscriptions[0].current_period_end * 1000
                  ).toISOString(),
                }
              : null,
        });
      } catch (error) {
        console.error(`[UPDATE-SUB] Error checking subscription status: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: 'Error checking subscription status',
        });
      }
    } catch (error) {
      console.error(`[UPDATE-SUB] Error updating subscription status: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Stripe webhook handler
  app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_KEY
      );
      console.log(`[WEBHOOK] Received Stripe event: ${event.type}`);
    } catch (err) {
      console.error(`[WEBHOOK] Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`[WEBHOOK] Checkout session completed: ${session.id}`);
        console.log(`[WEBHOOK] Session details: ${JSON.stringify(session)}`);

        try {
          // For subscription checkouts
          if (session.mode === 'subscription') {
            console.log(`[WEBHOOK] Subscription checkout detected`);
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            console.log(`[WEBHOOK] Customer ID: ${customerId}, Subscription ID: ${subscriptionId}`);

            // Get customer details to find the user
            const customer = await stripeClient.customers.retrieve(customerId);
            console.log(`[WEBHOOK] Customer details: ${JSON.stringify(customer)}`);

            // Get the user from metadata or client_reference_id
            const userId = customer.metadata.userId || session.client_reference_id;
            console.log(`[WEBHOOK] User ID from metadata: ${userId}`);

            if (userId) {
              // Update the user's subscription status
              const userRecord = await users.get(userId);
              console.log(`[WEBHOOK] User record before update: ${JSON.stringify(userRecord)}`);

              if (userRecord) {
                userRecord.isSubscribed = true;
                userRecord.stripeSubscriptionId = subscriptionId;
                await users.set(userId, userRecord);
                console.log(`[WEBHOOK] Updated subscription status for user ${userId}`);

                // Verify the update
                const updatedUser = await users.get(userId);
                console.log(`[WEBHOOK] User record after update: ${JSON.stringify(updatedUser)}`);
              } else {
                console.log(`[WEBHOOK] User record not found for ${userId}`);
              }
            } else {
              console.log(`[WEBHOOK] No user ID found in customer metadata or session`);
            }
          } else {
            // For one-time payments
            console.log(`[WEBHOOK] One-time payment checkout detected`);

            // Get the payment intent from the session
            const paymentIntent = await stripeClient.paymentIntents.retrieve(
              session.payment_intent
            );
            console.log(`[WEBHOOK] Payment intent details: ${JSON.stringify(paymentIntent)}`);

            // Update payment intent with session metadata for later reference
            await stripeClient.paymentIntents.update(session.payment_intent, {
              metadata: {
                ...paymentIntent.metadata,
                session_id: session.id,
                type: session.metadata.type || 'ebook',
              },
            });
          }
        } catch (error) {
          console.error(`[WEBHOOK] Error processing checkout session: ${error.message}`);
          console.error(error);
        }

        console.log(`[WEBHOOK] Payment successful for session ${session.id}`);
        break;

      case 'invoice.payment_succeeded':
        try {
          const invoice = event.data.object;
          console.log(`[WEBHOOK] Invoice payment succeeded: ${invoice.id}`);
          console.log(`[WEBHOOK] Invoice details: ${JSON.stringify(invoice)}`);

          if (
            invoice.billing_reason === 'subscription_create' ||
            invoice.billing_reason === 'subscription_cycle'
          ) {
            console.log(
              `[WEBHOOK] Subscription invoice detected for reason: ${invoice.billing_reason}`
            );

            const subscription = await stripeClient.subscription.retrieve(invoice.subscription);
            console.log(`[WEBHOOK] Subscription details: ${JSON.stringify(subscription)}`);

            const customer = await stripeClient.customers.retrieve(invoice.customer);
            console.log(`[WEBHOOK] Customer details: ${JSON.stringify(customer)}`);

            const userId = customer.metadata.userId;
            console.log(`[WEBHOOK] User ID from metadata: ${userId}`);

            if (userId) {
              const userRecord = await users.get(userId);
              console.log(`[WEBHOOK] User record before update: ${JSON.stringify(userRecord)}`);

              if (userRecord) {
                userRecord.isSubscribed = true;
                userRecord.stripeSubscriptionId = invoice.subscription;
                await users.set(userId, userRecord);
                console.log(`[WEBHOOK] Updated subscription status for user ${userId}`);

                // Verify the update
                const updatedUser = await users.get(userId);
                console.log(`[WEBHOOK] User record after update: ${JSON.stringify(updatedUser)}`);
              } else {
                console.log(`[WEBHOOK] User record not found for ${userId}`);
              }
            } else {
              console.log(`[WEBHOOK] No user ID found in customer metadata`);
            }
          }
        } catch (error) {
          console.error(`[WEBHOOK] Error processing invoice payment: ${error.message}`);
          console.error(error);
        }
        break;

      case 'customer.subscription.deleted':
        try {
          const cancelledSubscription = event.data.object;
          console.log(`[WEBHOOK] Subscription deleted: ${cancelledSubscription.id}`);
          console.log(`[WEBHOOK] Subscription details: ${JSON.stringify(cancelledSubscription)}`);

          const cancelledCustomer = await stripeClient.customers.retrieve(
            cancelledSubscription.customer
          );
          console.log(`[WEBHOOK] Customer details: ${JSON.stringify(cancelledCustomer)}`);

          const userId = cancelledCustomer.metadata.userId;
          console.log(`[WEBHOOK] User ID from metadata: ${userId}`);

          if (userId) {
            const userRecord = await users.get(userId);
            console.log(`[WEBHOOK] User record before update: ${JSON.stringify(userRecord)}`);

            if (userRecord) {
              userRecord.isSubscribed = false;
              userRecord.stripeSubscriptionId = null;
              await users.set(userId, userRecord);
              console.log(`[WEBHOOK] Updated subscription status for user ${userId}`);

              // Verify the update
              const updatedUser = await users.get(userId);
              console.log(`[WEBHOOK] User record after update: ${JSON.stringify(updatedUser)}`);
            } else {
              console.log(`[WEBHOOK] User record not found for ${userId}`);
            }
          } else {
            console.log(`[WEBHOOK] No user ID found in customer metadata`);
          }
        } catch (error) {
          console.error(`[WEBHOOK] Error processing subscription cancellation: ${error.message}`);
          console.error(error);
        }
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event type ${event.type}`);
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
