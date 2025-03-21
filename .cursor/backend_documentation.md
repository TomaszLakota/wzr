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

## Inconsistencies & Notes

4. Products API from `products.js` isn't correctly registered in main server file

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
