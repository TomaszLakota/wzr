ALL NAMES ARE JUST EXAMPLES, NAMING CONVENTION TO FOLLOW

server/
├── .env # Environment variables (DATABASE_URL, STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET, etc.) - DO NOT COMMIT
├── .env.example # Example environment variables file - COMMIT THIS
├── .gitignore # Specifies intentionally untracked files that Git should ignore
├── package.json # Project dependencies and scripts
├── package-lock.json # Exact dependency versions
├── tsconfig.json # TypeScript configuration (if using TypeScript)
├── README.md # Project documentation
├── server.js # Main entry point: Initializes Express app, starts the server
│
├── src/ # Main source code directory
│ ├── app.js # Express application setup (middleware, routes)
│ │
│ ├── config/ # Configuration files
│ │ ├── index.js # Exports all configurations consolidated
│ │ ├── server.js # Server configuration (port, environment)
│ │ ├── supabase.js # Supabase client initialization
│ │ ├── stripe.js # Stripe client initialization
│ │
│ ├── api/ # API routes definition (grouped by feature/version)
│ │ ├── v1/ # (ACTUALLY NEVER MIND, KEEP ALL FILES DIRECTLY IN api)
│ │ │ ├── index.js # Mounts all v1 routes
│ │ │ ├── auth.routes.js # Authentication routes (login, register, refresh token via Supabase)
│ │ │ ├── users.routes.js # User profile routes (get profile, update profile)
│ │ │ ├── products.routes.js # Ebook/Product routes (list ebooks, get ebook details)
│ │ │ ├── subscriptions.routes.js # Subscription plan routes (list plans, get plan details)
│ │ │ ├── orders.routes.js # Order/Purchase routes (create checkout session, view order history)
│ │ │ ├── webhooks.routes.js # Webhook routes (for Stripe events)
│ │ │ └── content.routes.js # Routes for accessing purchased content (e.g., download ebook link)
│ │
│ ├── controllers/ # Request handlers (logic triggered by routes)
│ │ ├── auth.controller.js
│ │ ├── user.controller.js
│ │ ├── product.controller.js
│ │ ├── subscription.controller.js
│ │ ├── order.controller.js
│ │ ├── webhook.controller.js # Handles incoming Stripe webhooks
│ │ └── content.controller.js
│ │
│ ├── services/ # Business logic, interactions with external services/DB
│ │ ├── auth.service.js # Handles Supabase Auth logic (interacting with Supabase client)
│ │ ├── user.service.js # User profile logic (interacting with Supabase DB)
│ │ ├── product.service.js # Ebook logic (interacting with Supabase DB)
│ │ ├── subscription.service.js # Subscription plan logic (interacting with Supabase DB, potentially Stripe Plans)
│ │ ├── payment.service.js # Stripe interaction logic (create checkout, manage subscriptions)
│ │ ├── order.service.js # Order processing logic (saving orders post-payment)
│ │ ├── webhook.service.js # Logic to process verified Stripe events (update DB, grant access)
│ │ ├── content.service.js # Logic for securely providing access to purchased content (e.g., generating signed URLs if using Supabase Storage)
│ │ └── email.service.js # (Optional) Service for sending emails (receipts, notifications)
│ │
│ ├── models/ # Data models/schemas/interfaces (even if DB is schema-less or managed by Supabase, defining structure here is good practice, especially with TS)
│ │ ├── User.js # Represents the user structure in your DB
│ │ ├── Product.js # Represents the ebook structure
│ │ ├── SubscriptionPlan.js # Represents a subscription plan
│ │ ├── Subscription.js # Represents a user's active subscription instance
│ │ ├── Order.js # Represents a purchase order
│ │ └── AccessRights.js # (Optional) Represents user access rights to specific content
│ │
│ ├── middleware/ # Express middleware functions
│ │ ├── authenticate.js # Verifies user authentication (e.g., validates JWT from Supabase Auth)
│ │ ├── validateRequest.js # Middleware for validating request body/params/query (e.g., using Joi or Zod)
│ │ ├── errorHandler.js # Global error handling middleware
│ │ ├── checkSubscription.js # Checks if user has an active, valid subscription for certain routes
│ │ ├── checkOwnership.js # Checks if user owns a specific ebook for content access routes
│ │ └── verifyStripeWebhook.js # Verifies the signature of incoming Stripe webhooks
│ │
│ └── utils/ # Utility functions, helpers
│ ├── apiError.js # Custom Error class for API errors
│ ├── apiResponse.js # Standardized API response structure
│ ├── asyncHandler.js # Wrapper for async route handlers to catch errors
│ └── helpers.js # General utility functions (e.g., date formatting, slug generation)
│
├── tests/ # Automated tests
│ ├── unit/ # Unit tests (testing individual functions/modules)
│ ├── integration/ # Integration tests (testing interaction between modules)
│ └── e2e/ # End-to-end tests (testing full API flows)
│
└── docs/ # API documentation (e.g., OpenAPI/Swagger specs)
└── api.yaml # OpenAPI specification file
