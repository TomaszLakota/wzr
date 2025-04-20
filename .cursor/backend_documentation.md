# Backend Documentation

## Overview

Node.js Express server for e-book sales and Stripe subscription management.

- **Environment**: `dev` / `prod`
- **Port**: `PORT` env var (default: 3000)
- **Entry Point**: `src/index.js`

## Important notes

Don't `cd server && some command`, it won't work, it's windows 10

## Core Technologies

- **Framework**: Express
- **Payments**: Stripe
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **CORS**: cors
- **DB**: supabase

## Key Concepts

- **Data Storage**: Uses configurable storage (`src/config/storage.js`). `users` and `products` data.
- **Authentication**: JWT-based (`Bearer <token>`). `authenticateToken` middleware (`src/middleware/auth.js`) protects routes. Token expiry: 24h.
- **Payments**: Stripe integration (`src/config/stripeConfig.js`). Supports one-time purchases and recurring subscriptions.

## API Endpoints

### Auth

| Method | Endpoint        | Description       | Auth |
| :----- | :-------------- | :---------------- | :--- |
| POST   | `/api/register` | Register new user | No   |
| POST   | `/api/login`    | Login user        | No   |

### Users

| Method | Endpoint                         | Description                     | Auth |
| :----- | :------------------------------- | :------------------------------ | :--- |
| GET    | `/api/users/:email`              | Get user details by email       | Yes  |
| POST   | `/api/users/update-subscription` | Sync subscription status (user) | Yes  |

### E-books & Payments (One-time)

| Method | Endpoint                                   | Description                    | Auth |
| :----- | :----------------------------------------- | :----------------------------- | :--- |
| GET    | `/api/ebooks`                              | Get all e-books with prices    | No   |
| GET    | `/api/user/ebooks`                         | Get user's purchased e-books   | Yes  |
| POST   | `/api/checkout`                            | Create Stripe checkout session | No   |
| GET    | `/api/payments/:paymentIntentId/verify`    | Verify payment by Intent ID    | No   |
| GET    | `/api/checkout/sessions/:sessionId/verify` | Verify payment by Session ID   | No   |

### Subscriptions

| Method | Endpoint                                     | Description                      | Auth |
| :----- | :------------------------------------------- | :------------------------------- | :--- |
| POST   | `/api/subscription/create-subscription`      | Create subscription              | Yes  |
| GET    | `/api/subscription/subscription-status`      | Check user's subscription status | Yes  |
| POST   | `/api/subscription/create-portal-session`    | Create Stripe customer portal    | Yes  |
| POST   | `/api/subscription/create-checkout-session`  | Create Stripe checkout (sub)     | Yes  |
| POST   | `/api/subscription/force-check-subscription` | Force sync subscription status   | Yes  |

### Lessons (requires subscription)

| Method | Endpoint           | Description                 | Auth |
| :----- | :----------------- | :-------------------------- | :--- |
| GET    | `/api/lekcje`      | Get all lessons with videos | No   |
| GET    | `/api/lekcje/:id`  | Get lesson by ID            | No   |
| POST   | `/api/lessons`     | Create or update lesson     | Yes  |
| DELETE | `/api/lessons/:id` | Delete lesson               | Yes  |

### Webhooks

| Method | Endpoint   | Description                    |
| :----- | :--------- | :----------------------------- |
| POST   | `/webhook` | Handles Stripe webhook events. |

## Webhook Events Handled (`src/controllers/webhookController.js`)

- `checkout.session.completed`: Process purchase, grant access.
- `invoice.payment_succeeded`: Update subscription status to active.
- `customer.subscription.deleted`: Update subscription status to inactive.

## Key Files & Structure

- **`src/index.js`**: Server entry point, middleware, routing setup.
- **`src/config/`**:
  - `storage.js`: Data store initialization (SQLite/Redis).
  - `stripeConfig.js`: Stripe client initialization.
- **`src/controllers/`**: Request/response handling.
  - `userController.js`: User fetching, subscription sync.
  - `webhookController.js`: Stripe event processing.
- **`src/services/`**: Business logic.
  - `productService.js`: Stripe product initialization.
  - `lessonService.js`: Lesson CRUD operations.
  - `videoService.js`: Bunny.net video interactions.
- **`src/routes/`**: Define API endpoints and link to controllers.
  - `api.js`: E-book checkout, payment verification.
  - `subscription.js`: Subscription management endpoints.
  - `products.js`: (Likely internal Stripe product sync).
  - `auth.js`: Registration, login.
  - `userRoutes.js`: User detail fetching, manual sub sync trigger.
  - `webhookRoutes.js`: Stripe webhook endpoint.
- **`src/middleware/`**:
  - `auth.js`: `authenticateToken` JWT validation.

## Notes

- **Error Format**: `{ error: string }`
- **Security**: Input validation, JWT, bcrypt, HTTPS recommended.
- **Language**: User-facing errors/text should be in Polish.

### Articles

Articles are fetched from a Supabase database.

| Method | Endpoint              | Description              | Auth |
| :----- | :-------------------- | :----------------------- | :--- |
| GET    | `/api/articles`       | Get all article previews | No   |
| GET    | `/api/articles/:slug` | Get full article by slug | No   |
