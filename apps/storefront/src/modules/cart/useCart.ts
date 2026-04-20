import { ref, computed, watch } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

// ─────────────────────────────────────────────
// TYPE DEFINITION
// ─────────────────────────────────────────────

export interface CartItem {
  product_id: number
  name: string
  price: number           // discounted price (what customer pays)
  originalPrice: number | null  // null means no discount
  image: string
  quantity: number
}

// ─────────────────────────────────────────────
// STATE (singleton — shared across all components)
// ─────────────────────────────────────────────

const CART_KEY = 'shopvue_cart'

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = sessionStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

const items = ref<CartItem[]>(loadCartFromStorage())
const isOpen = ref(false)

// Always mirror cart to sessionStorage for guests and as a local cache.
// For logged-in users, also push to Firestore carts/{uid}.
watch(items, async (val) => {
  sessionStorage.setItem(CART_KEY, JSON.stringify(val))
  const uid = auth.currentUser?.uid
  if (uid) {
    try {
      await setDoc(doc(db, 'carts', uid), { items: val })
    } catch {
      // Silently ignore — cart is still safe in sessionStorage
    }
  }
}, { deep: true })

// ─────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────

/**
 * loadCart — Loads the cart for the current user.
 *
 * For logged-in users: fetches from Firestore `carts/{uid}`.
 * For guests: cart is already restored from sessionStorage on module init.
 *
 * `products` is kept as an optional param so call-sites that pass it don't break,
 * but Firestore carts store full item data so no product lookup is needed.
 */
async function loadCart() {
  const uid = auth.currentUser?.uid
  if (!uid) return

  try {
    const cartDoc = await getDoc(doc(db, 'carts', uid))
    if (cartDoc.exists()) {
      items.value = (cartDoc.data().items ?? []) as CartItem[]
    } else {
      items.value = []
    }
  } catch {
    items.value = []
  }
}

/**
 * addItem — Adds a product to the cart (or increments qty if already present).
 */
function addItem(product: {
  product_id: number
  name: string
  price: number
  originalPrice: number | null
  image: string
}) {
  const existing = items.value.find((i) => i.product_id === product.product_id)
  if (existing) {
    existing.quantity++
  } else {
    items.value.push({ ...product, quantity: 1 })
  }
}

/**
 * removeItem — Removes a product from the cart by ID.
 */
function removeItem(product_id: number) {
  items.value = items.value.filter((i) => i.product_id !== product_id)
}

/**
 * updateQty — Updates the quantity of a cart item; removes it if qty < 1.
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
// COMPUTED VALUES
// ─────────────────────────────────────────────

const count = computed(() =>
  items.value.reduce((sum, i) => sum + i.quantity, 0)
)

const subtotal = computed(() =>
  items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

const savings = computed(() =>
  items.value.reduce((sum, i) =>
    sum + (i.originalPrice ? (i.originalPrice - i.price) * i.quantity : 0),
  0)
)

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

export function useCart() {
  return {
    items,
    isOpen,
    loadCart,
    addItem,
    removeItem,
    updateQty,
    count,
    subtotal,
    savings,
  }
}
