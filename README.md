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
- **Firebase Auth** — email/password sign-up, login, logout, guest mode, and password reset
- **Firestore** — real-time cart, order, address, and wishlist persistence per user
- **Stripe Payments** — card payment flow via PaymentIntents (test mode)
- **REST API Integration** — fetching products from a public mock API via Express middleware
- **Component Architecture** — splitting UI into focused, reusable `.vue` files

---

## Features

### Core Shopping
- Product listing with live data from a public API
- Product detail page with image, description, ratings, and add-to-cart
- Category filter chips (auto-generated from API data)
- Product cards with sale badges, star ratings, and discounted pricing
- Add to cart with toast notification feedback
- Cart drawer with quantity controls, remove item, subtotal, savings, and total
- Sticky header with live cart badge count
- Responsive layout (mobile, tablet, desktop)

### Authentication
- User sign-up and login (Firebase Auth)
- Guest checkout mode (cart persisted to sessionStorage)
- **Password reset** — "Forgot password?" sends a Firebase reset email
- Logged-in user cart persisted to Firestore
- Protected routes — redirects unauthenticated users to login

### Checkout & Payments
- Multi-step checkout: address → payment
- Saved address picker at checkout (registered users)
- Stripe card element integration (test mode)
- **Promo / coupon code** input on cart page and cart drawer (see codes below)
- Order success page after confirmed payment

### Account Management (`/account`)
- **My Account tab** — username, email, account type, user ID
- **My Orders tab** — full order history with reorder and star rating per item
- **My Address tab** — full saved address management:
  - Add multiple addresses with label (Home, Work, etc.)
  - Edit and delete saved addresses
  - Set a default address
  - Auto-migrates legacy single address to the new multi-address system

### Saved Addresses
- Addresses stored in Firestore: `users/{uid}/savedAddresses`
- At checkout, registered users see a radio-card picker of their saved addresses
- Selecting a saved address pre-fills the delivery form
- "Enter new address" option with optional save-to-account checkbox

### Wishlist (`/wishlist`)
- Heart icon on every product detail page — click to toggle wishlist
- Red heart = wishlisted; badge count shown in header
- Wishlist page shows all saved items with add-to-cart and remove
- Stored in Firestore for registered users, localStorage for guests
- Accessible via header icon and user dropdown menu

### Search (`/search?q=`)
- Header search bar navigates to full `/search` results page on Enter
- Result grid with category filter pills and sort dropdown
- Sort by: Most Relevant, Price Low→High, Price High→Low, Highest Rated
- Inline dropdown still shows 6 quick results while typing

### Order Management
- Order history at `/orders` with reorder functionality
- **Order detail page** at `/orders/:id`:
  - Full order summary (date, items, total, shipping status)
  - Delivery address displayed (if saved on order)
  - Per-item star rating
  - Payment reference
  - Reorder all items button
- "View Details" link on each order card in history

### SEO
- `useMeta` composable sets `<title>`, `<meta description>`, and all `og:` tags
- Applied to: Home, PLP, PDP (reactive — updates when product loads), Login, Sign Up, Cart, Checkout, Account, Order History, Search, Wishlist, Order Detail, Forgot Password

### Error Handling
- **404 page** — custom "Page not found" with navigation links
- Catch-all route `/:pathMatch(.*)*` for all unknown URLs

---

## Promo Codes

Enter these in the **cart page** or **cart drawer** promo code field:

| Code | Discount | Description |
|------|----------|-------------|
| `SHOPVUE` | 10% off | 10% off your entire order |
| `SAVE20` | 20% off | 20% off your entire order |
| `FIRST10` | $10 off | $10 flat discount on your order |
| `FREESHIP` | Free shipping | Free shipping (already free, but applied) |

> Codes are case-insensitive. Only one code can be active at a time. Click **Remove** to clear an applied code.

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

```
alokai-vue/
├── apps/
│   ├── storefront/                        ← Vue frontend application
│   │   └── src/
│   │       ├── components/
│   │       │   ├── AddToCartButton.vue
│   │       │   ├── AppHeader.vue          # Search → /search, wishlist icon, user menu
│   │       │   ├── AppFooter.vue
│   │       │   ├── CartDrawer.vue         # Promo code input + discount row
│   │       │   └── ToastNotification.vue
│   │       ├── pages/
│   │       │   ├── HomePage.vue
│   │       │   ├── ProductListPage.vue
│   │       │   ├── ProductDetailPage.vue  # Wishlist heart toggle
│   │       │   ├── SearchPage.vue         # NEW — /search?q= results page
│   │       │   ├── LoginPage.vue          # + "Forgot password?" link
│   │       │   ├── SignUpPage.vue
│   │       │   ├── ForgotPasswordPage.vue # NEW — password reset flow
│   │       │   ├── CartPage.vue           # + Promo code input
│   │       │   ├── CheckoutPage.vue       # + Saved address picker
│   │       │   ├── PaymentPage.vue
│   │       │   ├── OrderSuccessPage.vue
│   │       │   ├── OrderHistoryPage.vue   # + "View Details" link per order
│   │       │   ├── OrderDetailPage.vue    # NEW — /orders/:id detail page
│   │       │   ├── WishlistPage.vue       # NEW — /wishlist page
│   │       │   ├── UserProfilePage.vue
│   │       │   ├── SidePanelPage.vue      # Address tab: full CRUD (add/edit/delete/default)
│   │       │   └── NotFoundPage.vue       # NEW — 404 catch-all page
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   │   └── useAuth.ts         # + resetPassword() via Firebase
│   │       │   ├── cart/
│   │       │   │   └── useCart.ts
│   │       │   └── products/
│   │       │       └── useProducts.ts
│   │       ├── composables/
│   │       │   ├── useCheckout.ts
│   │       │   ├── useSavedAddresses.ts   # NEW — Firestore multi-address CRUD
│   │       │   ├── useWishlist.ts         # NEW — Firestore/localStorage wishlist
│   │       │   ├── usePromo.ts            # NEW — promo code engine
│   │       │   ├── useMeta.ts             # NEW — SEO <title> + og: tags
│   │       │   └── useToast.ts
│   │       ├── firebase/
│   │       │   └── config.ts
│   │       ├── router/
│   │       │   └── index.ts               # + new routes + catch-all 404
│   │       ├── styles/
│   │       │   └── main.css
│   │       ├── App.vue
│   │       └── main.ts
│   │
│   └── storefront-middleware/             ← Express backend integration layer
│       └── src/
│           ├── api/
│           │   ├── products.ts
│           │   ├── cart.ts
│           │   └── payment.ts
│           ├── integrations/
│           │   └── fake-store/
│           ├── config/
│           │   └── middleware.config.ts
│           └── index.ts
│
├── vite.config.ts
├── package.json
└── README.md
```

---

## Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Home | No |
| `/plp` | Product Listing | No |
| `/product/:id` | Product Detail | No |
| `/search?q=` | Search Results | No |
| `/cart` | Cart | No |
| `/login` | Login | No |
| `/signup` | Sign Up | No |
| `/forgot-password` | Forgot Password | No |
| `/checkout` | Checkout (Address) | Yes |
| `/checkout/payment` | Payment | Yes |
| `/order-success` | Order Success | Yes |
| `/orders` | Order History | Yes |
| `/orders/:id` | Order Detail | Yes |
| `/account` | My Account | Yes |
| `/user` | User Profile | Yes (non-guest) |
| `/wishlist` | Wishlist | Yes |
| `/:pathMatch(.*)` | 404 Not Found | No |

---

## Firestore Data Model

```
users/{uid}
  ├── username, email, createdAt
  ├── wishlist: WishlistItem[]           ← added
  └── savedAddresses/{addressId}         ← added (subcollection)
        label, fullName, line1, line2,
        city, state, zip, country, isDefault

users/{uid}/orders/{orderId}
  stripePaymentId, items[], total, createdAt, status

carts/{uid}
  items: CartItem[]
```

---

## Test Cards (Stripe)

Use these on the checkout page — no real charges are made. All cards use any future expiry date and any 3-digit CVC.

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

