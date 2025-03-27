# Frontend Documentation

## Project Overview

The frontend is a React application built with Vite, designed to provide an e-book sales platform with subscription management features. It communicates with the backend API for user authentication, e-book listing, purchasing, and subscription management.

## Tech Stack

- **Framework**: React
- **Build Tool**: Vite
- **Styling**: SCSS
- **API Communication**: Fetch API
- **Payment Processing**: Stripe integration

## Core Concepts

### Authentication

- JWT-based authentication
- Token stored in localStorage
- Protected routes require authentication

### E-book Shopping

- Browse available e-books
- View e-book details
- Make purchases through Stripe checkout
- Access purchased e-books

### Subscription Management

- Subscribe to premium content
- Manage subscription (upgrade, cancel)
- Access subscription-only content

## File Structure and Purpose

### Main Application Files

**src/main.jsx**

- Entry point for the React application
- Initializes React and renders the App component

**src/App.jsx**

- Main React application component
- Sets up routing and application layout
- Manages authentication state
- Provides context for user data

### Services

**src/services/stripeService.js**

- Public functions:
  - `createCheckoutSession()`: Creates checkout session for product purchase
  - `verifyPaymentStatus()`: Verifies payment status

**src/services/apiClient.js**
use it for all api calls

### Pages

**src/pages/** (Directory)

- Page components for different routes in the application
- Includes:
  - Home page
  - E-book list page
  - E-book details page
  - Checkout page
  - Payment success page
  - User dashboard page
  - Subscription management page

### Components

**src/components/** (Directory)

- Reusable UI components
- Includes:
  - Navigation bar
  - E-book card
  - Payment button
  - Subscription card
  - User profile
  - Loading indicator
  - Authentication forms

### Styles

**src/index.scss**

- Global stylesheet with color definitions and base styles

**src/styles/** (Directory)

- SCSS modules for component-specific styling
- Includes variables, mixins, and reusable style classes

### Assets

8. **src/assets/** (Directory)
   - Static assets such as images, icons, and fonts

## User Flows

### E-book Purchase Flow

1. User browses e-books on the e-book list page
2. User selects an e-book to view details
3. User clicks "Buy Now" to initiate checkout
4. User is redirected to Stripe checkout
5. Upon successful payment, user is redirected to success page
6. User can access purchased e-book from their dashboard

### Subscription Flow

1. User navigates to subscription page
2. User selects a subscription plan
3. User is redirected to Stripe checkout for subscription
4. Upon successful subscription, user is redirected to success page
5. User gains access to subscription-only content
6. User can manage subscription from their dashboard

## API Integration

The frontend communicates with the backend API for:

- User authentication (login/register)
- Fetching e-book catalog
- Creating checkout sessions
- Verifying payments
- Managing subscriptions
- Accessing user-specific data

## Error Handling

- User-friendly error messages
- Form validation
- Payment error handling
- Network error handling

## Responsive Design

- Mobile-first approach
- Responsive for tablets and desktops
- Adaptive UI elements based on screen size

## Security Considerations

- Token-based authentication
- Protected routes
- Secure payment handling through Stripe
- Input validation and sanitization
- HTTPS required for production

## Implementation Notes

- All user-facing text is in Polish
- Currency is formatted according to Polish locale (PLN)
- Form validation follows Polish conventions
- UI design adheres to modern web standards
