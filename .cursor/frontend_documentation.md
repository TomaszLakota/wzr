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
- `blog/`
- `admin-panel/`

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
   - import using @use

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

## Landing Page

The landing page (`Home.tsx`) is designed to showcase all major features of the platform:

1. **Hero Section**

   - Main headline and introduction to the platform
   - Call-to-action buttons for lessons and e-books

2. **Features Grid**

   - Cards highlighting language lessons, cultural content, language guides, and yoga trips
   - Each card links to the respective section of the website

3. **E-books Section**

   - Showcases digital publications for language learning
   - Links to the e-book library

4. **CTA Section**
   - Final call to action encouraging registration or browsing lessons
   - Strong visual design with primary brand colors

All sections are responsive and use consistent styling throughout.

## Components

### `ArticlePreview` (`src/components/article-preview`)

- **Purpose:** Displays a preview of a blog article, typically just the title, linking to the full article detail page.
- **Props:**
  - `article`: An object containing at least the `title` and `slug` of the article.
- **Usage:** Used in `Blog.tsx` to list available articles.

### `ArticleDetail` (`src/components/article-detail`)

- **Purpose:** Displays the full content of a single blog article.
- **Data Fetching:** Fetches the article data based on the `slug` parameter from the URL using `useParams()` and the `/api/articles/:slug` endpoint.
- **Usage:** Rendered via a route like `/blog/:slug`.

### `EbookCard` (`src/components/ebook-card`)

- **Purpose:** Displays a card representing an e-book, typically showing title, cover image, and price.
- **Props:** E-book data object.
- **Usage:** Used in `Ebooks.tsx` and potentially `Home.tsx`.

### `Footer` (`src/components/footer`)

- **Purpose:** Displays the standard site footer with navigation links, copyright information, etc.
- **Usage:** Included via the main `Layout` component.

### `Header` (`src/components/header`)

- **Purpose:** Displays the main site header/navigation bar.
- **Usage:** Included via the main `Layout` component.

### `Layout` (`src/components/layout`)

- **Purpose:** Provides the overall page structure, typically including `Header` and `Footer`.
- **Usage:** Wraps page content in `App.tsx`.

### `Lesson` (`src/components/lesson`)

- **Purpose:** Displays details or content for a specific lesson.
- **Props:** Lesson data object.
- **Usage:** Potentially used within the `Lesson` page (`src/pages/lesson`).

### `LessonThumbnail` (`src/components/lesson-thumbnail`)

- **Purpose:** Displays a preview/thumbnail for a lesson.
- **Props:** Lesson data object (title, image, etc.).
- **Usage:** Used in `Lessons.tsx` page.

### `LessonVideo` (`src/components/lesson-video`)

- **Purpose:** Embeds or displays the video content for a lesson.
- **Props:** Video source URL or ID.
- **Usage:** Used within the `Lesson` page or component.

### `Subscription` (`src/components/subscription`)

- **Purpose:** Displays subscription options or management UI.
- **Usage:** Potentially used on profile or dedicated subscription pages.

## Pages

### `Blog` (`src/pages/Blog.tsx`)

- **Purpose:** Displays a list of article previews.
- **Data Fetching:** Fetches a list of article previews (title and slug) from the `/api/articles` endpoint.
- **Components Used:** `ArticlePreview`.

### `ArticleDetail` (`src/pages/ArticleDetail.tsx`)

Displays a single article fetched from the backend based on the URL slug.

- **Route:** `/artykuly/:slug`
- **Fetches Data:** Yes, from `/api/artykuly/:slug`.
- **State:** Manages loading, error, and article data.

### `AdminPanel` (`src/pages/admin-panel`)

- **Purpose:** Provides administrative controls for managing content (e-books, lessons, articles, users).
- **Route:** Typically `/admin` or similar, protected.
- **Fetches Data:** Yes, various admin-related data.

### `Ebooks` (`src/pages/ebooks`)

- **Purpose:** Displays a list or grid of available e-books for purchase.
- **Route:** `/ebooki`
- **Fetches Data:** Yes, from `/api/ebooks`.
- **Components Used:** `EbookCard`.

### `EmailActivated` (`src/pages/email-activated`)

- **Purpose:** Confirmation page shown after a user clicks an email verification link.
- **Route:** `/aktywacja-email` or similar.

### `Home` (`src/pages/home`)

- **Purpose:** The main landing page of the application.
- **Route:** `/`
- **Components Used:** Various components to showcase features, e-books, etc.

### `LanguageGuide` (`src/pages/language-guide`)

- **Purpose:** Page dedicated to language guides or specific language learning resources.
- **Route:** `/przewodnik-jezykowy` or similar.

### `Lesson` (`src/pages/lesson`)

- **Purpose:** Displays the content of a specific lesson, likely including video and text.
- **Route:** `/lekcje/:lessonId` or similar.
- **Fetches Data:** Yes, specific lesson data from `/api/lessons/:lessonId`.
- **Components Used:** `LessonVideo`, potentially `Lesson` component.

### `Lessons` (`src/pages/lessons`)

- **Purpose:** Displays a list or grid of available lessons.
- **Route:** `/lekcje`
- **Fetches Data:** Yes, list of lessons from `/api/lessons`.
- **Components Used:** `LessonThumbnail`.

### `Library` (`src/pages/library`)

- **Purpose:** User's personal library showing purchased e-books or accessible subscribed content.
- **Route:** `/biblioteka` or similar, protected.
- **Fetches Data:** Yes, user-specific purchased/subscribed items.

### `Login` (`src/pages/login`)

- **Purpose:** Allows users to log in to their accounts.
- **Route:** `/logowanie`
- **Components Used:** Login form component.

### `PaymentSuccess` (`src/pages/payment-success`)

- **Purpose:** Confirmation page shown after a successful Stripe payment.
- **Route:** `/sukces-platnosci` or similar.

### `Profile` (`src/pages/profile`)

- **Purpose:** Allows users to view and manage their profile information and subscriptions.
- **Route:** `/profil` or similar, protected.
- **Fetches Data:** Yes, user profile data.
- **Components Used:** `Subscription` component potentially.

### `Register` (`src/pages/register`)

- **Purpose:** Allows new users to create an account.
- **Route:** `/rejestracja`
- **Components Used:** Registration form component.
- **Redirects:** Navigates to `/rejestracja-sukces` upon successful registration.

### `RegistrationSuccess` (`src/pages/registration-success`)

- **Purpose:** Confirmation page shown after a user successfully submits the registration form.
- **Route:** `/rejestracja-sukces`
- **Content:** Informs the user that an activation email has been sent.

### `YogaTrips` (`src/pages/yoga-trips`)

- **Purpose:** Page dedicated to information about yoga trips offered.
- **Route:** `/wyjazdy-joga` or similar.
