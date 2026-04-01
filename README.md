# ShopVue — Alokai Vue E-Commerce Demo

A learning-focused e-commerce storefront built with **Vue 3**, **TypeScript**, **Tailwind CSS v4**, and **Storefront UI v2**. This project demonstrates how to build a modern, component-driven shopping experience by integrating a real REST API with a reactive UI.

---

## What This Project Covers

- **Vue 3 Composition API** — `ref`, `computed`, `onMounted`, `<script setup>`
- **TypeScript** — interfaces, type inference, generics with `ref<T>`
- **Tailwind CSS v4** — utility-first styling with responsive layouts
- **Storefront UI v2** — pre-built, accessible e-commerce components (`SfButton`, `SfDrawer`, `SfRating`, `SfChip`, and more)
- **Composable Store Pattern** — shared reactive state across components without Pinia
- **REST API Integration** — fetching products and cart data from a public mock API
- **Component Architecture** — splitting UI into focused, reusable `.vue` files

---

## Features

- Product listing with live data from a public API
- Category filter chips (auto-generated from API data)
- Product cards with sale badges, star ratings, and discounted pricing
- Add to cart with instant cart drawer feedback
- Cart drawer with quantity controls, remove item, subtotal, savings, and total
- Sticky navbar with live cart badge count
- Loading spinner and error state handling
- Responsive layout (mobile, tablet, desktop)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) | Frontend framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vite.dev/) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| [Storefront UI v2](https://docs.storefrontui.io/v2/) | E-commerce UI components |

---

## API

This project uses the [Beeceptor Fake Store API](https://fake-store-api.mock.beeceptor.com):

| Endpoint | Used For |
|---|---|
| `/api/products` | Product listing |
| `/api/carts` | Initial cart state |

---

## Getting Started

```bash
# Clone the repo
git clone https://bitbucket.org/shubhajitcognizant/alokai-vue.git
cd alokai-vue

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

This project follows the **Alokai monorepo structure** — frontend and middleware are separated into their own apps, mirroring a real production Alokai project.

```
alokai-vue/
├── apps/
│   ├── storefront/                        ← Vue frontend application
│   │   └── src/
│   │       ├── components/                # Reusable UI components
│   │       │   ├── CartDrawer.vue         # Sliding cart sidebar
│   │       │   └── HelloWorld.vue
│   │       ├── pages/                     # Page-level components
│   │       │   └── HomePage.vue           # Home page (navbar, hero, grid, footer)
│   │       ├── modules/                   # Feature modules
│   │       │   └── cart/
│   │       │       └── useCart.ts         # Shared cart state (composable)
│   │       ├── styles/
│   │       │   └── main.css               # Tailwind + Storefront UI imports
│   │       ├── assets/
│   │       ├── App.vue                    # Root component
│   │       └── main.ts                    # App entry point
│   │
│   └── storefront-middleware/             ← Backend integration layer (stub)
│       └── src/
│           ├── api/                       # REST endpoints exposed to frontend
│           │   ├── products.ts            # GET /api/products
│           │   └── cart.ts                # GET /api/carts
│           ├── integrations/
│           │   └── fake-store/            # Connector to fake-store-api
│           ├── config/
│           │   └── middleware.config.ts   # Integration configuration
│           └── index.ts                   # Express server entry point
│
├── package.json                           # Root workspace (npm workspaces)
└── README.md
```

---

## Learning Notes

Every file in this project is heavily commented to explain **why** decisions were made, not just **what** the code does. It is designed for developers who are new to Vue 3, TypeScript, or the Composition API.
