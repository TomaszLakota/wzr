# Backend Documentation

## Project Overview

The backend is a Node.js Express server that provides API endpoints for e-book sales and subscription management using Stripe.

## Server Configuration

- **Environment**: The server supports dev and prod environments.
- **Port**: Runs on PORT from environment variables or defaults to 3000.
- **Server File**: Main entry point is `src/index.js`.

## Dependencies

- express: Web framework
- stripe: Payment processing
- bcryptjs: Password hashing
- jsonwebtoken: Authentication
- @keyv/sqlite: Data storage (dev)
- @keyv/redis: Data storage (prod)
- cors: Cross-origin resource sharing

## Core Concepts

### Data Storage

- Uses Keyv for data persistence
- Development: SQLite
- Production: Redis
- Store structure:
  - `users`: User accounts and credentials
  - `products`: Product data

### Authentication

- JWT-based authentication
- Token expires in 24 hours
- Protected routes use `authenticateToken` middleware
- Token format: `Bearer <token>`

### Payments & Subscriptions

- Uses Stripe for payment processing
- Supports one-time purchases (e-books)
- Supports recurring subscription

## API Endpoints

### User Management

| Method | Endpoint                         | Description                | Auth Required |
| ------ | -------------------------------- | -------------------------- | ------------- |
| POST   | `/api/register`                  | Register new user          | No            |
| POST   | `/api/login`                     | Login user                 | No            |
| GET    | `/api/users/:email`              | Get user details           | Yes           |
| POST   | `/api/users/update-subscription` | Update subscription status | Yes           |

### E-book Management

| Method | Endpoint           | Description                  | Auth Required |
| ------ | ------------------ | ---------------------------- | ------------- |
| GET    | `/api/ebooks`      | Get all e-books with prices  | No            |
| GET    | `/api/user/ebooks` | Get user's purchased e-books | Yes           |

### Payment Processing

| Method | Endpoint                                   | Description             | Auth Required |
| ------ | ------------------------------------------ | ----------------------- | ------------- |
| POST   | `/api/checkout`                            | Create checkout session | No            |
| GET    | `/api/payments/:paymentIntentId/verify`    | Verify payment          | No            |
| GET    | `/api/checkout/sessions/:sessionId/verify` | Verify by session ID    | No            |

### Subscription Management

| Method | Endpoint                                     | Description                      | Auth Required |
| ------ | -------------------------------------------- | -------------------------------- | ------------- |
| POST   | `/api/subscription/create-subscription`      | Create subscription              | Yes           |
| GET    | `/api/subscription/subscription-status`      | Check subscription status        | Yes           |
| POST   | `/api/subscription/create-portal-session`    | Create customer portal session   | Yes           |
| POST   | `/api/subscription/create-checkout-session`  | Create checkout session          | Yes           |
| POST   | `/api/subscription/force-check-subscription` | Force update subscription status | Yes           |

### Webhooks

| Method | Endpoint   | Description            |
| ------ | ---------- | ---------------------- |
| POST   | `/webhook` | Stripe webhook handler |

### Lesson Management

| Method | Endpoint           | Description                 | Auth Required |
| ------ | ------------------ | --------------------------- | ------------- |
| GET    | `/api/lessons`     | Get all lessons with videos | No            |
| GET    | `/api/lessons/:id` | Get lesson by ID            | No            |
| POST   | `/api/lessons`     | Create or update lesson     | Yes           |
| DELETE | `/api/lessons/:id` | Delete lesson               | Yes           |

## Webhook Events Handled

- `checkout.session.completed`: Process completed purchase
- `invoice.payment_succeeded`: Update subscription status
- `customer.subscription.deleted`: Cancel subscription

## Data Models

### User

```js
{
  email: string,          // Primary key
  name: string,
  password: string,       // Hashed
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  isSubscribed: boolean
}
```

### Product (E-book)

```js
{
  id: string,             // From Stripe
  name: string,
  description: string,
  images: string[],
  active: boolean,
  price: {
    id: string,           // From Stripe
    currency: string,
    unit_amount: number,
    formatted: string     // Formatted price
  },
  metadata: {
    type: 'ebook',
    download_url: string  // Optional
  }
}
```

### Lesson

```js
{
  id: string,             // Unique identifier
  videoId: string,        // Optional, Bunny.net video ID
  videoUrl: string,       // Generated from videoId
  // ... other lesson fields
}
```

## File Structure and Purpose

### Main Server Files

1. **src/index.js**
   - Main entry point for the server
   - Sets up Express application
   - Initializes data stores and middleware
   - Configures routes
   - Serves static files in production

### Configuration

2. **src/config/storage.js**

   - Public functions:
     - `createStores()`: Creates and initializes data storage mechanisms
     - Configures SQLite (dev) and Redis (prod) storage

3. **src/config/stripeConfig.js**
   - Centralizes Stripe client configuration
   - Exports initialized Stripe client for use across the application

### Controllers

4. **src/controllers/userController.js**

   - Public functions:
     - `getUserByEmail()`: Gets user details by email
     - `updateSubscriptionStatus()`: Updates user subscription status

5. **src/controllers/webhookController.js**
   - Public functions:
     - `handleStripeWebhook()`: Processes Stripe webhook events
     - `handleCheckoutSessionCompleted()`: Handles completed checkout sessions
     - `handleInvoicePaymentSucceeded()`: Handles successful invoice payments
     - `handleSubscriptionDeleted()`: Handles subscription deletion events

### Services

6. **src/services/productService.js**

   - Public functions:
     - `initializeProducts()`: Fetches and initializes products from Stripe

7. **src/services/lessonService.js**

   - Public functions:
     - `initializeLessons()`: Initializes lessons store (mock data in dev only)
     - `getAllLessons()`: Gets all lessons with video URLs
     - `getLessonById()`: Gets a specific lesson by ID
     - `upsertLesson()`: Creates or updates a lesson
     - `deleteLesson()`: Deletes a lesson

8. **src/services/videoService.js**
   - Public functions:
     - `listVideos()`: Lists all videos from Bunny.net
     - `getVideoStreamUrl()`: Generates streaming URL for a video

### Route Files

9. **src/routes/api.js**

   - Public functions:
     - `GET /api/ebooks`: Fetches all e-books with prices
     - `POST /api/checkout`: Creates checkout session
     - `GET /api/payments/:paymentIntentId/verify`: Verifies payment status
     - `GET /api/user/ebooks`: Gets user's purchased e-books
     - `GET /api/checkout/sessions/:sessionId/verify`: Verifies payment by session ID
     - `formatPrice()`: Helper function to format prices

10. **src/routes/subscription.js**

    - Public functions:
      - `POST /api/subscription/create-subscription`: Creates subscription
      - `GET /api/subscription/subscription-status`: Checks subscription status
      - `POST /api/subscription/create-portal-session`: Creates customer portal session
      - `POST /api/subscription/create-checkout-session`: Creates checkout session
      - `POST /api/subscription/force-check-subscription`: Forces update of subscription status

11. **src/routes/products.js**

    - Handles product-related operations in Stripe
    - Manages e-book products in the system

12. **src/routes/auth.js**

    - Public functions:
      - `POST /api/register`: Registers new user
      - `POST /api/login`: Authenticates user and issues JWT token

13. **src/routes/userRoutes.js**

    - Public functions:
      - `GET /api/users/:email`: Gets user details
      - `POST /api/users/update-subscription`: Updates user subscription status

14. **src/routes/webhookRoutes.js**
    - Public functions:
      - `POST /webhook`: Processes Stripe webhook events

### Middleware

15. **src/middleware/auth.js**
    - Public functions:
      - `authenticateToken()`: Middleware to validate JWT tokens and authenticate users

## Code Organization Principles

- **Separation of Concerns**:

  - Controllers handle request/response logic
  - Services handle business logic
  - Routes define API endpoints
  - Config centralizes configuration

- **Modularity**:

  - Related functionality is grouped together
  - Each file has a single responsibility
  - Dependencies are explicitly imported

- **Central Configuration**:
  - Stripe client is configured once and imported where needed
  - Environment variables are loaded in relevant config files

## Error Handling

- All endpoints return consistent error formats:
  ```js
  {
    error: string;
  }
  ```
- Polish language used for most user-facing error messages
- HTTP status codes properly utilized (400, 401, 403, 404, 500)

## Security Considerations

- Always validate user input
- JWT tokens with proper expiration
- Password hashing with bcrypt
- Route protection through middleware
- Client errors don't expose sensitive information
