# Backend Endpoints

## Main API Routes

Base path: `/api`

### E-book Endpoints

- **GET** `/api/ebooks` - Get all ebooks with prices
- **POST** `/api/checkout` - Create a checkout session for e-book purchase
- **GET** `/api/payments/:paymentIntentId/verify` - Verify payment status
- **GET** `/api/user/ebooks` - Get user's purchased ebooks (requires authentication)
- **GET** `/api/checkout/sessions/:sessionId/verify` - Verify payment status by session ID

## Subscription Routes

Base path: `/api/subscription`

- **POST** `/api/subscription/create-subscription` - Create a subscription (requires authentication)
- **GET** `/api/subscription/subscription-status` - Check subscription status (requires authentication)
- **POST** `/api/subscription/create-portal-session` - Create a customer portal session (requires authentication)
- **POST** `/api/subscription/create-checkout-session` - Create a checkout session for subscription (requires authentication)

## Products Routes

While there appears to be a products.js file, it doesn't seem to be registered to any base route in server.js. The file contains the following endpoints, but might not be active:

- **GET** `/init-products` - Initialize products in the store
- **GET** `/` - Get all products
- **GET** `/:id` - Get a specific product by ID
- **POST** `/:id/checkout` - Create checkout session for a product (requires authentication)

## Webhook Handler

- **POST** `/webhook` - Stripe webhook handler for various events:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `customer.subscription.deleted`

## Static Files (Production Only)

In production mode, the server also serves static files from the `/build` directory and has a catch-all route that returns the React app:

- **GET** `*` - Serves the React app (Production only)
