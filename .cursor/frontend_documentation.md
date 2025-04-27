# Frontend Documentation

## 1. Project Overview

- **Type:** React (Vite) + SCSS application for an e-book sales platform.
- **Key Features:** E-book browsing/purchasing, user accounts, subscriptions, blog/articles.
- **Backend:** Communicates with a separate backend API. See [Backend Documentation](mdc:.cursor/backend_documentation.md).

## 2. Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
3.  **Environment Variables:**
    - Create a `.env` file in the root directory (if not present).
    - Define necessary variables (e.g., `VITE_API_BASE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`). Check existing code or ask team lead if unsure which variables are required.

## 3. Project Structure Highlights

```
src/
├── App.scss             # Empty - Global styles are in index.scss
├── App.tsx              # Main application component, routing setup
├── assets/              # Static assets (e.g., book-icon.svg)
│   └── book-icon.svg
├── components/          # Reusable UI components
│   ├── article-detail/  # ArticleDetail.tsx, ArticleDetail.scss
│   ├── article-preview/ # ArticlePreview.tsx, ArticlePreview.scss
│   ├── ebook-card/      # EbookCard.tsx, EbookCard.scss
│   ├── footer/          # Footer.tsx, Footer.scss
│   ├── header/          # Header.tsx, Header.scss
│   ├── layout/          # Layout.tsx, Layout.scss (wraps pages)
│   ├── lesson/          # Lesson.tsx, Lesson.scss (content within lesson page)
│   ├── lesson-thumbnail/# LessonThumbnail.tsx, LessonThumbnail.scss
│   ├── lesson-video/    # LessonVideo.tsx, LessonVideo.scss
│   └── subscription/    # SubscriptionButton.tsx, SubscriptionPromo.tsx, Subscription.scss
├── index.scss           # Primary global styles and imports
├── main.tsx             # Application entry point
├── pages/               # Top-level page components (mapped to routes)
│   ├── admin-panel/       # AdminPanel.tsx, AdminPanel.scss
│   ├── blog/              # Blog.tsx, Blog.scss
│   ├── ebook-details/     # EbookDetails.tsx, EbookDetails.scss
│   ├── ebooks/            # Ebooks.tsx, Ebooks.scss
│   ├── email-activated/   # EmailActivated.tsx, EmailActivated.scss
│   ├── forgotPassword/    # ForgotPassword.tsx, ForgotPassword.scss
│   ├── home/              # Home.tsx, Home.scss
│   ├── language-guide/    # LanguageGuide.tsx (no dedicated SCSS)
│   ├── lesson/            # LessonPage.tsx, LessonPage.scss (page container)
│   ├── lessons/           # LessonsPage.tsx, LessonsPage.scss
│   ├── library/           # Library.tsx, Library.scss
│   ├── login/             # Login.tsx, Login.scss
│   ├── payment-success/   # PaymentSuccess.tsx, PaymentSuccess.scss
│   ├── profile/           # Profile.tsx, Profile.scss
│   ├── register/          # Register.tsx, Register.scss
│   ├── registration-success/ # RegistrationSuccess.tsx, RegistrationSuccess.scss
│   ├── resetPassword/     # ResetPassword.tsx, ResetPassword.scss
│   └── yoga-trips/        # YogaTrips.tsx, YogaTrips.scss
├── services/            # API interaction logic
│   ├── apiClient.ts     # Centralized fetch wrapper for API calls
│   ├── authService.ts   # Authentication endpoints
│   ├── ebookService.ts  # E-book related endpoints
│   ├── stripeService.ts # Stripe checkout/subscription logic
│   └── userService.ts   # User profile/data endpoints
├── styles/              # Shared SCSS (variables, forms, page base styles)
│   ├── form.scss        # Base form styling
│   ├── page.scss        # Base page layout styling
│   └── variables.scss   # Core SCSS variables (colors, fonts, spacing, shadows) - NO separate _colors.scss
└── types/               # TypeScript type definitions
    ├── article.types.ts
    ├── auth.types.ts
    ├── ebook.types.ts
    ├── lesson.types.ts
    ├── shared.types.ts
    ├── stripe.types.ts
    └── user.types.ts
```

## 4. Core Conventions & Requirements

1.  **UI Language: POLISH ONLY**

    - All user-facing labels, messages, placeholders, etc., **MUST** be in Polish. No exceptions.
    - Currency: PLN.

2.  **Styling (SCSS)**

    - **Global Styles:** Defined in `src/index.scss`.
    - **Variables:** Use variables from `src/styles/variables.scss`. **DO NOT** hardcode colors, shadows, fonts, etc. Check `variables.scss` first. (Note: Colors are defined directly in `variables.scss`, not a separate `_colors.scss` file).
    - **Component Styles:** Each component/page should have its own `.scss` file within its directory (e.g., `src/pages/login/Login.scss`).
    - **Imports:** Use `@use` for importing SCSS partials/variables.
    - **Base Styles:** Check `src/styles/form.scss` and `src/styles/page.scss` for common base styles.

3.  **API Communication (`src/services/`)**

    - **`apiClient.ts`:** Use this configured `fetch` wrapper for all backend requests. It automatically adds the auth token from `localStorage` and handles common response scenarios (like 403 redirects). Review its implementation for details.
    - **Service Files:** Use the specific service files (`authService.ts`, `ebookService.ts`, etc.) for interacting with corresponding API endpoints. Don't call `apiClient` directly from components/pages if a service function exists.

4.  **State Management**

    - (Currently Undocumented - Describe the primary method here, e.g., Context API, Zustand, Redux Toolkit, or component state, and any patterns to follow).

5.  **Routing**

    - Handled in `src/App.tsx` using `react-router-dom`.
    - **Protected Routes:** Route protection is not handled at the router level in `App.tsx`. It's implemented _within_ individual page components (e.g., `Library`, `Profile`, `AdminPanel`) or `apiClient`

6.  **Types**
    - Use types defined in `src/types/` for API data and core domain objects. Keep types specific (e.g., `ebook.types.ts` for e-book data).

## 5. Key Services Deep Dive

- **`apiClient.ts`:**
  - _Purpose:_ Centralized HTTP request handler (using `fetch` API).
  - _Features:_ Configured base URL (via `VITE_API_BASE_URL` env var), automatically adds `Authorization: Bearer <token>` header from `localStorage`, common response handling (including 403 token expiry redirect), standard methods (get, post, put, delete).
- **`authService.ts`:**
  - _Purpose:_ Handles login, registration, password reset flows. Provides functions like `login()`, `register()`, `forgotPassword()`, `resetPassword()`.
- **`stripeService.ts`:**
  - _Purpose:_ Manages interactions with Stripe for creating checkout sessions (e-books, subscriptions).

## 6. Important User Flows (API/State Focus)

- **E-book Purchase:**
  1. User clicks "Buy" -> `stripeService.createEbookCheckoutSession(ebookId)` called.
  2. Backend returns Stripe session ID.
  3. Frontend redirects user to Stripe using the session ID.
  4. On success redirect (`/payment-success`): Potentially validate payment status with backend via `userService` or dedicated endpoint. Update user state/library access.
- **Subscription:** Similar flow using `stripeService.createSubscriptionCheckoutSession(planId)`.

## 7. Development Guidelines

- Follow standard Git flow (feature branches -> PRs).
- Ensure Prettier/ESLint checks pass before pushing.
- Keep backend documentation reference handy: [Backend Documentation](mdc:.cursor/backend_documentation.md).
