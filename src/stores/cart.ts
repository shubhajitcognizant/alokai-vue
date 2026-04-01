/**
 * CART STORE — src/stores/cart.ts
 *
 * WHAT IS A STORE?
 * A store is a place where you keep shared data (state) that multiple components
 * need to access or modify. Instead of passing data down through many components
 * via props, you put it in a store and any component can use it directly.
 *
 * PATTERN USED HERE: "Composable Store" (also called a singleton composable)
 * - We define `items` and `isOpen` OUTSIDE the function so they are created
 *   only once and shared across every component that calls useCart().
 * - This is different from a regular composable where state would be re-created
 *   each time the function is called.
 * - For larger apps you would use Pinia (Vue's official state management library),
 *   but this pattern is perfect for learning and small projects.
 *
 * HOW VUE REACTIVITY WORKS:
 * - `ref()` wraps a value so Vue can track changes to it.
 * - When you change a ref, Vue automatically updates any template using it.
 * - You read/write the value via `.value` in <script>, but in <template> Vue
 *   unwraps it automatically so you just write `items` instead of `items.value`.
 */

import { ref, computed } from 'vue'

// ─────────────────────────────────────────────
// TYPE DEFINITION
// ─────────────────────────────────────────────

/**
 * TypeScript interface — defines the shape of a cart item.
 * `export` means other files can import this type too.
 * Using interfaces makes your code self-documenting and catches bugs early.
 */
export interface CartItem {
  product_id: number
  name: string
  price: number           // discounted price (what customer pays)
  originalPrice: number | null  // null means no discount
  image: string
  quantity: number
}

// ─────────────────────────────────────────────
// STATE (defined outside the function = shared / singleton)
// ─────────────────────────────────────────────

/**
 * `ref<CartItem[]>([])` — a reactive array of cart items.
 * The generic <CartItem[]> tells TypeScript what type of data this ref holds.
 * Starting value is an empty array [].
 */
const items = ref<CartItem[]>([])

/**
 * Controls whether the cart drawer (sidebar) is visible or hidden.
 * Any component can open/close the drawer by changing this value.
 */
const isOpen = ref(false)

// ─────────────────────────────────────────────
// ACTIONS (functions that modify state)
// ─────────────────────────────────────────────

/**
 * loadCart — Fetches the cart from the API and merges it with product data.
 *
 * WHY DO WE PASS `products` AS A PARAMETER?
 * The cart API only returns { product_id, quantity }. It doesn't include
 * the product name, price, or image. So we pass in the already-loaded
 * products list and look up each product by its ID to get the full details.
 *
 * `async/await` — used when a function does something that takes time (like
 * fetching data from a server). `await` pauses execution until the response
 * arrives, then continues. The `async` keyword is required on any function
 * that uses `await` inside it.
 */
async function loadCart(products: {
  product_id: number
  name: string
  price: number
  discount: number
  image: string
}[]) {
  try {
    // fetch() is the browser's built-in tool for making HTTP requests.
    // It returns a Promise, so we await it.
    const res = await fetch('https://fake-store-api.mock.beeceptor.com/api/carts')

    // If the server returned an error status (e.g. 404, 500), throw an error.
    // Without this check, fetch() alone won't throw on HTTP errors.
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    // .json() parses the response body as JSON. Also async, so we await it.
    const carts: { cart_id: number; user_id: number; items: { product_id: number; quantity: number }[] }[] = await res.json()

    // The API returns an array of carts. We use cart index 0 (first cart = logged-in user).
    // The `??` (nullish coalescing) operator returns [] if carts[0]?.items is null/undefined.
    const cartItems = carts[0]?.items ?? []

    // .map() transforms each cart item into a full CartItem with product details.
    items.value = cartItems.map((ci) => {
      // Find the matching product from our already-loaded products list.
      const product = products.find((p) => p.product_id === ci.product_id)

      // If no matching product found, return null (we'll filter these out below).
      if (!product) return null

      // Calculate the discounted price.
      // Example: price = $100, discount = 15 → 100 * (1 - 15/100) = $85.00
      // The `+` before the parentheses converts the string from toFixed() back to a number.
      const discountedPrice = product.discount > 0
        ? +(product.price * (1 - product.discount / 100)).toFixed(2)
        : product.price

      return {
        product_id: product.product_id,
        name: product.name,
        price: discountedPrice,
        originalPrice: product.discount > 0 ? product.price : null,
        image: product.image,
        quantity: ci.quantity,
      }

    // .filter(Boolean) removes any null values from the array.
    // `as CartItem[]` tells TypeScript the remaining items match our interface.
    }).filter(Boolean) as CartItem[]

  } catch {
    // If anything fails (network error, bad JSON, etc.), start with an empty cart.
    items.value = []
  }
}

/**
 * addItem — Adds a product to the cart.
 *
 * Logic:
 * - If the product is already in the cart → just increase its quantity.
 * - If it's new → push it to the array with quantity 1.
 *
 * The spread operator `{ ...product, quantity: 1 }` copies all properties
 * from `product` and adds a new `quantity` property.
 */
function addItem(product: {
  product_id: number
  name: string
  price: number
  originalPrice: number | null
  image: string
}) {
  // .find() returns the first item that matches the condition, or undefined.
  const existing = items.value.find((i) => i.product_id === product.product_id)

  if (existing) {
    // Product already in cart — increment quantity.
    existing.quantity++
  } else {
    // New product — add it with quantity 1.
    items.value.push({ ...product, quantity: 1 })
  }
}

/**
 * removeItem — Removes a product from the cart by its ID.
 *
 * .filter() returns a NEW array containing only items that do NOT match
 * the given product_id. Assigning this back replaces the old array.
 */
function removeItem(product_id: number) {
  items.value = items.value.filter((i) => i.product_id !== product_id)
}

/**
 * updateQty — Updates the quantity of a cart item.
 *
 * If quantity drops below 1, we remove the item entirely instead of
 * allowing 0 or negative quantities.
 */
function updateQty(product_id: number, qty: number) {
  if (qty < 1) {
    removeItem(product_id)
    return
  }
  const item = items.value.find((i) => i.product_id === product_id)
  if (item) item.quantity = qty
}

// ─────────────────────────────────────────────
// COMPUTED VALUES (derived/calculated from state)
// ─────────────────────────────────────────────

/**
 * `computed()` creates a value that is automatically recalculated whenever
 * its dependencies (items.value here) change. Think of it like a formula
 * in a spreadsheet — it updates itself whenever the inputs change.
 *
 * `.reduce()` is an array method that "folds" all items into a single value.
 * It takes a callback (sum, item) => newSum and a starting value (0).
 */

// Total number of individual items (e.g. 2 headphones + 1 phone = 3)
const count = computed(() =>
  items.value.reduce((sum, i) => sum + i.quantity, 0)
)

// Total price before any display adjustments (already uses discounted price)
const subtotal = computed(() =>
  items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

// Total amount saved due to discounts
const savings = computed(() =>
  items.value.reduce((sum, i) =>
    sum + (i.originalPrice ? (i.originalPrice - i.price) * i.quantity : 0),
  0)
)

// ─────────────────────────────────────────────
// PUBLIC API — what components can use
// ─────────────────────────────────────────────

/**
 * useCart — The composable function that components import.
 *
 * By returning everything from one function, components get a clean,
 * consistent interface. They destructure only what they need:
 *
 *   const { items, addItem, count } = useCart()
 *
 * Because `items`, `isOpen`, `count`, etc. are defined OUTSIDE this function,
 * every component that calls useCart() shares the same state.
 */
export function useCart() {
  return {
    items,       // reactive list of cart items
    isOpen,      // controls cart drawer visibility
    loadCart,    // fetch + populate cart from API
    addItem,     // add a product (or increase qty if already in cart)
    removeItem,  // remove a product completely
    updateQty,   // change the quantity of an existing item
    count,       // computed: total item count (for the badge)
    subtotal,    // computed: total cost of all items
    savings,     // computed: total discount savings
  }
}
