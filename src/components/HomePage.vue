<!--
  HomePage.vue — Main page of the e-commerce app

  This component is responsible for:
  1. Fetching products from the API when the page loads
  2. Fetching the initial cart state from the API
  3. Displaying a navbar, hero banner, category filter, product grid, and footer
  4. Wiring up "Add to cart" to the shared cart store

  VUE COMPOSITION API (used throughout this file):
  - ref()      → reactive variable (triggers re-render when changed)
  - computed() → derived value that auto-updates when its dependencies change
  - onMounted()→ lifecycle hook — runs once after the component is added to the DOM
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

/**
 * STOREFRONT UI COMPONENTS:
 * These are pre-built, accessible UI components from @storefront-ui/vue.
 * They are styled with Tailwind CSS and designed for e-commerce use cases.
 *
 * SfButton        — Button with variants: primary (default), secondary, tertiary
 * SfBadge         — Small badge/pill, used here to show cart item count
 * SfInput         — Text input field with optional prefix/suffix slots
 * SfRating        — Star rating display
 * SfChip          — Clickable tag/filter pill
 * SfLoaderCircular— Spinning loading indicator
 * Sf Icon*        — Icon components (no external icon library needed)
 */
import {
  SfButton,
  SfBadge,
  SfInput,
  SfRating,
  SfChip,
  SfLoaderCircular,
  SfIconShoppingCart,
  SfIconFavorite,
  SfIconSearch,
  SfIconMenu,
  SfIconPerson,
} from '@storefront-ui/vue'

// CartDrawer is our own component — the sliding cart sidebar.
import CartDrawer from './CartDrawer.vue'

// useCart() gives us access to the shared cart state and actions.
import { useCart } from '../stores/cart'

// ─────────────────────────────────────────────
// TYPESCRIPT INTERFACE
// ─────────────────────────────────────────────

/**
 * Defines the exact shape of a product returned by the API.
 * TypeScript will show an error if we try to access a property not listed here.
 * The `?` after `reviews` means it's optional (some products may not have reviews).
 */
interface ApiProduct {
  product_id: number
  name: string
  description: string
  price: number
  image: string
  discount: number        // percentage, e.g. 15 means 15% off
  availability: boolean
  brand: string
  category: string
  rating: number          // e.g. 4.5 out of 5
  reviews?: { user_id: number; rating: number; comment: string }[]
}

// ─────────────────────────────────────────────
// CART STATE (from shared store)
// ─────────────────────────────────────────────

/**
 * Destructure what we need from the cart store.
 * `count: cartCount` — rename `count` to `cartCount` for clarity in this file.
 *
 * These are the same reactive refs defined in cart.ts — any change made here
 * is instantly reflected in CartDrawer.vue (and vice versa) because they share
 * the same underlying state.
 */
const { isOpen, addItem, count: cartCount, loadCart } = useCart()

// ─────────────────────────────────────────────
// LOCAL STATE
// ─────────────────────────────────────────────

// The text typed into the search input (not yet wired to filtering — a good exercise!)
const searchQuery = ref('')

// Which category chip is currently selected. 'All' shows every product.
const activeCategory = ref('All')

// True while the API fetch is in progress — shows a spinner in the template.
const loading = ref(true)

// Holds any error message if the API fetch fails.
const error = ref('')

// The raw, unprocessed products array from the API.
const rawProducts = ref<ApiProduct[]>([])

// ─────────────────────────────────────────────
// COMPUTED VALUES
// ─────────────────────────────────────────────

/**
 * categories — Extracts a unique list of category names from the products.
 *
 * Step by step:
 * 1. .map()    → pulls just the `category` string from each product
 * 2. new Set() → removes duplicates (a Set can only hold unique values)
 * 3. [...]     → spread operator converts the Set back into an array
 * 4. We prepend 'All' so the user can reset the filter
 *
 * This is computed so it automatically updates if rawProducts changes.
 */
const categories = computed(() => {
  const unique = [...new Set(rawProducts.value.map((p) => p.category))]
  return ['All', ...unique]
})

/**
 * products — Filters and transforms raw API products for the template.
 *
 * WHY TRANSFORM? The API gives us raw data. We shape it into a cleaner
 * format that's easier to work with in the template.
 *
 * Two operations chained:
 * 1. .filter() → keeps only products matching the active category
 * 2. .map()    → transforms each product into our display format
 *
 * Discount calculation:
 *   originalPrice = $100, discount = 15%
 *   discountedPrice = 100 * (1 - 15/100) = 100 * 0.85 = $85.00
 *   The `+` before the expression converts the toFixed() string back to a number.
 *
 * Optional chaining `?.` — safely accesses `.length` even if `reviews` is undefined.
 * Nullish coalescing `?? 0` — uses 0 as fallback if the result is null/undefined.
 */
const products = computed(() => {
  return rawProducts.value
    .filter((p) => activeCategory.value === 'All' || p.category === activeCategory.value)
    .map((p) => ({
      product_id: p.product_id,
      name: p.name,
      price: p.discount > 0 ? +(p.price * (1 - p.discount / 100)).toFixed(2) : p.price,
      originalPrice: p.discount > 0 ? p.price : null,
      rating: Math.round(p.rating),        // SfRating expects a whole number
      reviewCount: p.reviews?.length ?? 0,
      image: p.image,
      badge: p.discount > 0 ? 'Sale' : null,
    }))
})

// ─────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────

/**
 * handleAddToCart — Called when the user clicks "Add to cart" on a product card.
 *
 * It does two things:
 * 1. Calls `addItem()` from the cart store to add/increment the product.
 * 2. Opens the cart drawer so the user sees their updated cart immediately.
 *
 * `typeof products.value[0]` — TypeScript trick to infer the type of a single
 * product from the computed array, without needing to define a separate interface.
 */
function handleAddToCart(product: (typeof products.value)[0]) {
  addItem({
    product_id: product.product_id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
  })
  // Open the cart drawer to give immediate visual feedback
  isOpen.value = true
}

// ─────────────────────────────────────────────
// LIFECYCLE HOOK
// ─────────────────────────────────────────────

/**
 * onMounted — Runs once, after the component is fully rendered in the browser.
 *
 * WHY onMounted AND NOT just top-level code?
 * Vue components may be rendered on the server (SSR) where `window` and
 * `fetch` don't exist. onMounted only runs in the browser, making it the
 * safe place to fetch data or access browser APIs.
 *
 * async/await inside onMounted:
 * - We pass an async arrow function so we can use `await` inside it.
 * - `try/catch/finally` handles errors gracefully.
 * - `finally` runs regardless of success or failure — perfect for cleanup
 *   like setting `loading = false`.
 *
 * DATA LOADING ORDER:
 * 1. Fetch products first (we need them to enrich the cart data).
 * 2. Then fetch the cart, passing products so it can look up details.
 */
onMounted(async () => {
  try {
    const res = await fetch('https://fake-store-api.mock.beeceptor.com/api/products')

    // Always check `res.ok` — fetch() only rejects on network errors,
    // not on HTTP error responses like 404 or 500.
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    rawProducts.value = await res.json()

    // Now load the cart. We pass rawProducts so the cart can join
    // product details (name, image, price) to the cart's product_id + quantity.
    await loadCart(rawProducts.value)

  } catch (e) {
    error.value = 'Failed to load products. Please try again later.'
  } finally {
    // Always turn off the loading spinner, whether fetch succeeded or failed.
    loading.value = false
  }
})
</script>

<template>
  <!--
    CartDrawer is rendered here (at the top level) so it appears as an overlay
    on top of the entire page. It reads `isOpen` from the shared cart store,
    so any component can open it by setting `isOpen.value = true`.
  -->
  <CartDrawer />

  <!-- ── NAVBAR ──────────────────────────────────────── -->
  <!--
    `sticky top-0 z-10` — the navbar sticks to the top of the viewport as
    the user scrolls. z-10 ensures it appears above other content.
  -->
  <header class="sticky top-0 z-10 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">

      <!-- Hamburger menu — only visible on mobile (md:hidden hides it on medium+ screens) -->
      <SfButton variant="tertiary" square class="md:hidden">
        <SfIconMenu />
      </SfButton>

      <a href="/" class="text-xl font-bold text-primary-700 shrink-0">ShopVue</a>

      <!--
        Search input — hidden on mobile, shown on md+ screens.
        `v-model` binds the input value to `searchQuery` ref (two-way binding):
        - When user types, `searchQuery` updates automatically.
        - If you change `searchQuery` in code, the input reflects it too.

        `#prefix` is a named slot — it lets us inject content (the search icon)
        inside the SfInput component at a specific position.
      -->
      <div class="flex-1 hidden md:block max-w-xl">
        <SfInput v-model="searchQuery" placeholder="Search products..." class="w-full">
          <template #prefix>
            <SfIconSearch class="text-neutral-500" />
          </template>
        </SfInput>
      </div>

      <!-- Right side icons -->
      <div class="flex items-center gap-2 ml-auto">
        <!-- Mobile-only search icon -->
        <SfButton variant="tertiary" square>
          <SfIconSearch class="md:hidden" />
        </SfButton>

        <SfButton variant="tertiary" square>
          <SfIconPerson />
        </SfButton>

        <!--
          Cart button with badge.
          `class="relative"` — needed so the badge can be absolutely positioned
          relative to this button (not the whole page).

          Clicking the cart icon opens the drawer by setting `isOpen.value = true`.
          Because `isOpen` is shared from the store, CartDrawer reacts instantly.
        -->
        <SfButton variant="tertiary" square class="relative" @click="isOpen = true">
          <SfIconShoppingCart />
          <!--
            SfBadge — shows the cart item count.
            `v-if="cartCount > 0"` hides the badge when cart is empty.
            `:content="cartCount"` passes the count as a prop (note the `:` for dynamic binding).
          -->
          <SfBadge
            v-if="cartCount > 0"
            :content="cartCount"
            class="!bg-primary-700 outline outline-white outline-2 absolute -top-1 -right-1"
          />
        </SfButton>
      </div>
    </div>
  </header>

  <!-- ── HERO BANNER ─────────────────────────────────── -->
  <section class="bg-primary-700 text-white">
    <div class="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
      <div class="flex-1 text-center md:text-left">
        <p class="text-primary-200 text-sm font-medium uppercase tracking-widest mb-3">New Season Arrivals</p>
        <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Discover the <br />Latest Trends
        </h1>
        <p class="text-primary-100 text-lg mb-8">
          Shop thousands of products at unbeatable prices. Free shipping on orders over $50.
        </p>
        <div class="flex gap-3 justify-center md:justify-start">
          <!--
            `!` prefix in Tailwind (e.g. `!bg-white`) means `!important`.
            We use it here to override Storefront UI's default button colors.
          -->
          <SfButton size="lg" class="!bg-white !text-primary-700 hover:!bg-primary-50">
            Shop Now
          </SfButton>
          <SfButton size="lg" variant="secondary" class="!border-white !text-white hover:!bg-primary-600">
            Learn More
          </SfButton>
        </div>
      </div>
      <div class="flex-1 flex justify-center">
        <img
          src="https://placehold.co/480x320?text=Hero+Banner"
          alt="Hero Banner"
          class="rounded-2xl shadow-xl max-w-sm w-full"
        />
      </div>
    </div>
  </section>

  <!-- ── CATEGORY FILTER ─────────────────────────────── -->
  <!--
    SfChip — a clickable tag/pill for filtering.
    We use `:class` (dynamic class binding) to add an active style
    when this chip's category matches `activeCategory`.

    When clicked, we update `activeCategory`, which triggers the
    `products` computed to re-filter. Vue re-renders the grid automatically.
  -->
  <section class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex gap-2 flex-wrap">
      <SfChip
        v-for="category in categories"
        :key="category"
        :class="activeCategory === category ? 'bg-primary-100 border-primary-700' : ''"
        @click="activeCategory = category"
      >
        {{ category }}
      </SfChip>
    </div>
  </section>

  <!-- ── PRODUCTS GRID ────────────────────────────────── -->
  <section class="max-w-7xl mx-auto px-4 pb-16">
    <h2 class="text-2xl font-semibold mb-6">Featured Products</h2>

    <!--
      THREE STATES with v-if / v-else-if / v-else:
      1. Loading → show spinner
      2. Error   → show error message
      3. Success → show the product grid
      Only one of these three blocks renders at a time.
    -->

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-20">
      <SfLoaderCircular size="lg" />
    </div>

    <!-- Error state -->
    <p v-else-if="error" class="text-center text-red-500 py-20">{{ error }}</p>

    <!-- Success state: product grid -->
    <!--
      CSS Grid with responsive columns:
      - Mobile (default): 2 columns
      - md (768px+):      3 columns
      - lg (1024px+):     4 columns
    -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <!--
        `v-for` loops over the `products` computed array.
        `:key` must be unique per item — Vue uses it to efficiently update
        only the items that changed, instead of re-rendering all of them.
        Always use a stable ID (product_id), never the loop index, as the key.

        `group` — Tailwind's group utility. When you hover this div,
        child elements with `group-hover:` classes become visible (e.g. the wishlist button).
      -->
      <div
        v-for="product in products"
        :key="product.product_id"
        class="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
      >
        <!-- Product Image -->
        <div class="relative">
          <img :src="product.image" :alt="product.name" class="w-full aspect-square object-cover" />

          <!--
            Sale badge — only rendered when `product.badge` is not null.
            `:class` with an array — applies multiple conditional classes.
            The ternary (`condition ? 'a' : 'b'`) picks between two color schemes.
          -->
          <span
            v-if="product.badge"
            :class="[
              'absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full',
              product.badge === 'Sale' ? 'bg-secondary-700 text-white' : 'bg-primary-700 text-white',
            ]"
          >
            {{ product.badge }}
          </span>

          <!--
            Wishlist button — hidden by default (`opacity-0`),
            appears on hover via `group-hover:opacity-100`.
            The `group` class on the parent card enables this.
          -->
          <SfButton
            variant="tertiary"
            square
            size="sm"
            class="absolute top-2 right-2 !bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SfIconFavorite class="text-neutral-500" size="sm" />
          </SfButton>
        </div>

        <!-- Product Info -->
        <div class="p-3">
          <!-- Product name — `line-clamp-2` truncates at 2 lines with "..." -->
          <p class="text-sm text-neutral-700 font-medium leading-snug line-clamp-2 mb-1">
            {{ product.name }}
          </p>

          <!--
            SfRating — renders star icons.
            `:value` = current rating (number), `:max` = total stars.
          -->
          <div class="flex items-center gap-1 mb-2">
            <SfRating :value="product.rating" :max="5" size="xs" />
            <span class="text-xs text-neutral-500">({{ product.reviewCount }})</span>
          </div>

          <!-- Price row -->
          <div class="flex items-center gap-2 mb-3">
            <span class="font-bold text-neutral-900">${{ product.price.toFixed(2) }}</span>
            <!-- Original price with strikethrough — only shown when there is a discount -->
            <span v-if="product.originalPrice" class="text-sm text-neutral-400 line-through">
              ${{ product.originalPrice.toFixed(2) }}
            </span>
          </div>

          <!--
            Add to Cart button.
            `@click` calls handleAddToCart, which adds the product to the
            shared cart store and opens the CartDrawer.

            `#prefix` slot — places the icon before the button text.
          -->
          <SfButton size="sm" class="w-full" @click="handleAddToCart(product)">
            <template #prefix>
              <SfIconShoppingCart size="sm" />
            </template>
            Add to cart
          </SfButton>
        </div>
      </div>
    </div>
  </section>

  <!-- ── FOOTER ──────────────────────────────────────── -->
  <footer class="bg-neutral-800 text-neutral-300">
    <div class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="col-span-2 md:col-span-1">
        <p class="text-white text-lg font-bold mb-2">ShopVue</p>
        <p class="text-sm">Your one-stop shop for everything you need, delivered fast.</p>
      </div>
      <div>
        <p class="text-white font-semibold mb-3">Shop</p>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white transition-colors">New Arrivals</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Best Sellers</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Sale</a></li>
        </ul>
      </div>
      <div>
        <p class="text-white font-semibold mb-3">Support</p>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white transition-colors">FAQ</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Shipping</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Returns</a></li>
        </ul>
      </div>
      <div>
        <p class="text-white font-semibold mb-3">Company</p>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-neutral-700 text-center py-4 text-xs text-neutral-500">
      © 2026 ShopVue. All rights reserved.
    </div>
  </footer>
</template>
