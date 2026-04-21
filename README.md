# ShopVue — Alokai Vue E-Commerce Demo

A learning-focused e-commerce storefront built with **Vue 3**, **TypeScript**, **Tailwind CSS v4**, and **Storefront UI v3**. This project demonstrates how to build a modern, full-stack shopping experience with real authentication, payments, and data persistence.

---

## What This Project Covers

- **Vue 3 Composition API** — `ref`, `computed`, `onMounted`, `<script setup>`
- **TypeScript** — interfaces, type inference, generics with `ref<T>`
- **Tailwind CSS v4** — utility-first styling with responsive layouts
- **Storefront UI v3** — pre-built, accessible e-commerce components (`SfButton`, `SfDrawer`, `SfRating`, `SfChip`, and more)
- **Vue Router** — client-side routing with auth guards and protected routes
- **Composable Pattern** — shared reactive state across components without Pinia
- **Firebase Auth** — email/password sign-up, login, logout, and guest mode
- **Firestore** — real-time cart and order persistence per user
- **Stripe Payments** — card payment flow via PaymentIntents (test mode)
- **REST API Integration** — fetching products from a public mock API via Express middleware
- **Component Architecture** — splitting UI into focused, reusable `.vue` files

---

## Features

- Product listing with live data from a public API
- Product detail page with image, description, ratings, and add-to-cart
- Category filter chips (auto-generated from API data)
- Product cards with sale badges, star ratings, and discounted pricing
- Add to cart with toast notification feedback
- Cart drawer with quantity controls, remove item, subtotal, savings, and total
- Sticky header with live cart badge count
- User sign-up and login (Firebase Auth)
- Guest checkout mode (cart persisted to sessionStorage)
- Logged-in user cart persisted to Firestore
- Checkout page with Stripe card element (test mode)
- Order success page after confirmed payment
- Order history page (orders stored in Firestore)
- User profile page
- Protected routes — redirects unauthenticated users to login
- Loading spinner and error state handling
- Responsive layout (mobile, tablet, desktop)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) | Frontend framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vite.dev/) | Build tool & dev server |
| [Vue Router](https://router.vuejs.org/) | Client-side routing |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| [Storefront UI v3](https://docs.storefrontui.io/v3/) | E-commerce UI components |
| [Firebase](https://firebase.google.com/) | Authentication & Firestore database |
| [Stripe](https://stripe.com/) | Payment processing (test mode) |
| [Express.js](https://expressjs.com/) | Backend middleware (API + payment intent) |

---

## API

The Express middleware (`apps/storefront-middleware`) exposes these endpoints:

| Endpoint | Method | Used For |
|---|---|---|
| `/api/products` | GET | Product listing |
| `/api/products/:id` | GET | Single product detail |
| `/api/carts` | GET | Initial cart state |
| `/api/create-payment-intent` | POST | Create Stripe PaymentIntent |

Products and cart data are sourced from the [Beeceptor Fake Store API](https://fake-store-api.mock.beeceptor.com). Payment intents are created server-side using your Stripe secret key.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://bitbucket.org/shubhajitcognizant/alokai-vue.git
cd alokai-vue
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` inside `apps/storefront/` and fill in your keys:

```bash
cp apps/storefront/.env.example apps/storefront/.env.local
```

```env
# Firebase — from Firebase Console → Project Settings → Your apps → Web app
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Stripe — from https://dashboard.stripe.com/test/apikeys (starts with pk_test_)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

You also need a `STRIPE_SECRET_KEY` available to the middleware (set it in your shell or a `.env` in `apps/storefront-middleware/`).

### 3. Start both servers

```bash
# Terminal 1 — Vite dev server (frontend) on http://localhost:5173
npm run dev

# Terminal 2 — Express middleware on http://localhost:3000
npm run dev:middleware
```

Open `http://localhost:5173` in your browser.

> The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so both servers must be running for product data and payments to work.

---

## Project Structure

This project follows the **Alokai monorepo structure** — frontend and middleware are separated into their own apps, mirroring a real production Alokai project.

```
alokai-vue/
├── apps/
│   ├── storefront/                        ← Vue frontend application
│   │   └── src/
│   │       ├── components/
│   │       │   ├── AddToCartButton.vue
│   │       │   ├── AppHeader.vue
│   │       │   ├── AppFooter.vue
│   │       │   ├── CartDrawer.vue
│   │       │   └── ToastNotification.vue
│   │       ├── pages/
│   │       │   ├── HomePage.vue
│   │       │   ├── ProductDetailPage.vue
│   │       │   ├── LoginPage.vue
│   │       │   ├── SignUpPage.vue
│   │       │   ├── CheckoutPage.vue
│   │       │   ├── OrderSuccessPage.vue
│   │       │   ├── OrderHistoryPage.vue
│   │       │   ├── UserProfilePage.vue
│   │       │   └── SidePanelPage.vue
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   │   └── useAuth.ts         # Firebase auth composable
│   │       │   └── cart/
│   │       │       └── useCart.ts         # Cart state + Firestore sync
│   │       ├── composables/
│   │       │   └── useToast.ts            # Toast notification composable
│   │       ├── firebase/
│   │       │   └── config.ts              # Firebase app initialisation
│   │       ├── router/
│   │       │   └── index.ts               # Vue Router + auth guards
│   │       ├── styles/
│   │       │   └── main.css               # Tailwind + Storefront UI imports
│   │       ├── App.vue
│   │       └── main.ts
│   │
│   └── storefront-middleware/             ← Express backend integration layer
│       └── src/
│           ├── api/
│           │   ├── products.ts            # GET /api/products, /api/products/:id
│           │   ├── cart.ts                # GET /api/carts
│           │   └── payment.ts             # POST /api/create-payment-intent
│           ├── integrations/
│           │   └── fake-store/            # Connector to Beeceptor fake-store API
│           ├── config/
│           │   └── middleware.config.ts
│           └── index.ts                   # Express server entry point (port 3000)
│
├── vite.config.ts                         # Vite config (root is apps/storefront)
├── package.json                           # Root workspace (npm workspaces)
└── README.md
```

---

## Test Cards (Stripe)

Use these on the checkout page — no real charges are made. All cards use any future expiry date and any 3-digit CVC.

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
