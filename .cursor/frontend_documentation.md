# Frontend Documentation

## Project Overview

The frontend is a React application built with Vite, designed to provide an e-book sales platform with subscription management features. It communicates with the backend API for user authentication, e-book listing, purchasing, and subscription management.

## Tech Stack

- **Framework**: React
- **Build Tool**: Vite
- **Styling**: SCSS
- **API Communication**: Fetch API
- **Payment Processing**: Stripe integration

## Project Structure

### Root Configuration Files

- `vite.config.js` - Vite configuration
- `package.json` - Project dependencies and scripts
- `index.html` - Main HTML entry point
- `.env` - Environment variables (not committed to repository)
- `.prettierrc` & `.prettierignore` - Code formatting configuration
- `eslint.config.js` - ESLint configuration

### Source Code Structure

**src/**

- `main.jsx` - React application entry point
- `App.jsx` - Main application component with routing
- `App.scss` - Main component styles
- `index.scss` - Global styles and color definitions

**src/components/**

- Reusable UI components
- Each component in its own directory with dedicated SCSS file

**src/pages/**

- Page components for different application routes
- Each page in its own directory with dedicated SCSS file

**src/services/**

- API communication logic
- Stripe integration
- Authentication handling

**src/styles/**

- SCSS modules
- Variables
- Mixins
- Reusable classes

**src/assets/**

- Static assets (images, icons, fonts)

## Core Requirements

1. **User Interface Language**

   - All user-facing text MUST be in Polish
   - Currency formatting follows Polish standards (PLN)

2. **Styling**

   - SCSS for all styling
   - Colors defined in `src/index.scss`
   - Component-specific styles in dedicated SCSS modules

3. **API & Integrations**

   - Stripe for payment processing
   - Backend communication through dedicated services
   - Error handling and form validation

4. **Security**
   - JWT authentication
   - Protected routes
   - Secure payment handling via Stripe
   - Input validation and sanitization

## Development Guidelines

- Application runs through Vite
- Hot Module Replacement enabled
- Automatic code formatting with Prettier
- Code linting with ESLint

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

## Error Handling

- User-friendly error messages (in Polish)
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
