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

- `vite.config.ts` - Vite configuration
- `package.json` - Project dependencies and scripts
- `index.html` - Main HTML entry point
- `.env` - Environment variables (not committed to repository)
- `.prettierrc` & `.prettierignore` - Code formatting configuration
- `eslint.config.js` - ESLint configuration

### Source Code Structure

**src/**

- `main.tsx` - React application entry point
- `App.tsx` - Main application component with routing
- `App.scss` - Main component styles (potentially unused, check `index.scss` for global styles)
- `index.scss` - Global styles and color definitions

**src/components/**

- Reusable UI components
- Each component in its own directory with dedicated SCSS file
- `layout/`
- `footer/`
- `subscription/`
- `lesson-video/`
- `lesson-thumbnail/`
- `header/`
- `ebook-card/`
- `article-preview/`
- `article-detail/`
- `lesson/`

**src/pages/**

- Page components for different application routes
- Each page in its own directory with dedicated SCSS file
- `Home.tsx` & `Home.scss` - Landing page with sections for features, e-books, and call-to-action
- `email-activated/`
- `yoga-trips/`
- `register/`
- `profile/`
- `login/`
- `payment-success/`
- `library/`
- `lesson/`
- `lessons/`
- `language-guide/`
- `ebooks/`
- `ebook-details/` - Detailed view for a single e-book
- `blog/`
- `admin-panel/`
- `forgotPassword/`
- `resetPassword/`

**src/services/**

- API communication logic
- Stripe integration
- Authentication handling

### `apiClient.ts`

- **Purpose:** A centralized service for making HTTP requests to the backend API.
- **Features:**
  - Automatic token handling for authenticated requests
  - Consistent error handling
  - Response parsing
  - Cache control
  - Methods for common HTTP verbs (GET, POST, PUT, DELETE)

### `authService.ts`

- **Purpose:** Handles authentication-related API calls.
- **Methods:**
  - `login(email, password)`: Authenticates a user and returns a token and user data
  - `forgotPassword(email)`: Sends a password reset email to the user
  - `resetPassword(token, password)`: Resets the user's password using a valid token

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
   - Global variables (colors, breakpoints, shadows, etc.) are defined in `src/styles/variables.scss`.
   - Use variables defined in `src/styles/variables.scss` instead of hardcoding values (e.g., use `$primary-color` instead of `#333`, `$box-shadow-hover` for hover shadows).
   - Colors defined in `src/styles/_colors.scss` (imported by `variables.scss`)
   - Import using `@use`
   - **Important**: Always check `variables.scss` for existing variable names before creating new ones. Variable names should be consistent throughout the application.
   - do not change my colors without asking

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
2. User clicks on an e-book card to view its details on the dedicated EbookDetails page
3. User can either click "Buy Now" on the list page or on the details page to initiate checkout
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
