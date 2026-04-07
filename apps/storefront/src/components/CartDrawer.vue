<!--
  CartDrawer.vue — Sliding cart sidebar component

  WHAT IS A COMPONENT?
  A component is a self-contained, reusable piece of UI. It has its own
  template (HTML), logic (script), and optionally styles (CSS).
  In Vue, every .vue file is a Single File Component (SFC).

  STRUCTURE OF A VUE SINGLE FILE COMPONENT:
  1. <script setup> — the logic (imports, data, functions)
  2. <template>     — the HTML structure
  3. <style>        — optional CSS (we use Tailwind here instead)

  WHAT IS <script setup>?
  `setup` is a shorthand for the Composition API. It runs before the component
  mounts and everything declared inside is automatically available in the template.
  You don't need to return anything — Vue handles that automatically.
-->

<script setup lang="ts">
/**
 * STOREFRONT UI COMPONENTS USED HERE:
 *
 * SfDrawer       — A slide-in panel (sidebar). Controlled by v-model (open/close).
 * SfButton       — Accessible button with variants: 'primary', 'secondary', 'tertiary'.
 * SfIconClose    — X icon for closing the drawer.
 * SfIconAdd      — + icon for increasing quantity.
 * SfIconRemove   — - icon for decreasing quantity.
 * SfIconDelete   — Trash icon for removing an item.
 * SfIconShoppingCart — Cart icon for empty state.
 *
 * All icons come from @storefront-ui/vue — no need to install a separate icon library.
 */
import {
  SfDrawer,
  SfButton,
  SfIconClose,
  SfIconAdd,
  SfIconRemove,
  SfIconDelete,
  SfIconShoppingCart,
} from '@storefront-ui/vue'

// Import our shared cart store composable.
// Destructure only the pieces this component needs.
import { useCart } from '../modules/cart/useCart'
import { useRouter } from 'vue-router'
import { useAuth } from '../modules/auth/useAuth'

const { items, isOpen, removeItem, updateQty, subtotal, savings } = useCart()
const { isLoggedIn } = useAuth()
const router = useRouter()

/**
 * total() — A simple function (not computed) since it's just a formatted
 * version of subtotal. In this project shipping is always free, so total === subtotal.
 * `.toFixed(2)` returns a string like "12.50", and `+` converts it back to a number.
 */
const total = () => +(subtotal.value).toFixed(2)

function handleCheckout() {
  isOpen.value = false
  if (isLoggedIn.value) {
    router.push('')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <!--
    SfDrawer — slides in from the right when `isOpen` is true.

    `v-model="isOpen"` is two-way binding:
    - Vue passes `isOpen` to the drawer as a prop (to show/hide it).
    - When the user clicks the backdrop, the drawer sets `isOpen = false`.
    This is shorthand for :modelValue="isOpen" @update:modelValue="isOpen = $event".

    `placement="right"` — drawer slides in from the right side.
    Tailwind classes control the width and layout of the drawer panel.
  -->
  <SfDrawer
    v-model="isOpen"
    placement="right"
    class="w-full max-w-md bg-white flex flex-col"
  >
    <!-- ── HEADER ─────────────────────────────────── -->
    <div class="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
      <!--
        `items.length` — the number of unique products in the cart
        (not total quantity — that would be `count` from the store).
      -->
      <h2 class="text-lg font-semibold">
        Shopping Cart ({{ items.length }})
      </h2>

      <!--
        `square` prop makes the button equal width & height (icon button).
        `variant="tertiary"` = ghost/transparent button style.
        Clicking sets isOpen to false, which triggers SfDrawer to close.
      -->
      <SfButton
        variant="tertiary"
        square
        @click="isOpen = false"
      >
        <SfIconClose />
      </SfButton>
    </div>

    <!-- ── EMPTY STATE ────────────────────────────── -->
    <!--
      `v-if` / `v-else` — conditional rendering.
      Vue removes the element from the DOM entirely when the condition is false.
      (Use `v-show` instead if you just want to hide it with CSS display:none.)
    -->
    <div
      v-if="items.length === 0"
      class="flex flex-col items-center justify-center flex-1 gap-4 text-neutral-500 py-20"
    >
      <SfIconShoppingCart class="w-16 h-16 text-neutral-300" />
      <p class="text-lg font-medium">
        Your cart is empty
      </p>
      <SfButton
        variant="secondary"
        @click="isOpen = false"
      >
        Continue Shopping
      </SfButton>
    </div>

    <!-- ── CART ITEMS + SUMMARY ───────────────────── -->
    <div
      v-else
      class="flex flex-col flex-1 overflow-hidden"
    >
      <!--
        CART ITEMS LIST
        `overflow-y-auto` — makes this area scrollable if items exceed the height.
        `divide-y` — adds a horizontal border between each <li> automatically.
      -->
      <ul class="flex-1 overflow-y-auto divide-y divide-neutral-100 px-4">
        <!--
          `v-for` — loops over the items array and renders one <li> per item.
          `:key` — a unique identifier Vue uses to track each item efficiently.
                   Always use a stable, unique value (like product_id), not the index.
        -->
        <li
          v-for="item in items"
          :key="item.product_id"
          class="flex gap-4 py-4"
        >
          <!-- Product Image -->
          <div class="w-20 h-20 shrink-0 bg-neutral-100 rounded-lg overflow-hidden">
            <!--
              @error — fires if the image URL fails to load (e.g. example.com images).
              We replace the broken src with a placeholder image as a fallback.
              `$event.target` is the <img> element that triggered the error.
              We cast it to HTMLImageElement so TypeScript knows it has a `.src` property.
              NOTE: HTML comments can only go between tags, never inside a tag's attributes.
            -->
            <img
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover"
              @error="($event.target as HTMLImageElement).src = `https://placehold.co/80x80?text=${encodeURIComponent(item.name.split(' ')[0])}`"
            >
          </div>

          <!-- Product Details -->
          <div class="flex-1 min-w-0">
            <!--
              `line-clamp-2` — Tailwind utility that limits text to 2 lines,
              adding "..." if it overflows. Prevents long names from breaking the layout.
            -->
            <p class="text-sm font-medium text-neutral-800 line-clamp-2 mb-1">
              {{ item.name }}
            </p>

            <!-- Price row: discounted price + crossed-out original price -->
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-bold text-neutral-900">${{ item.price.toFixed(2) }}</span>
              <!--
                `v-if="item.originalPrice"` — only renders if originalPrice is not null.
                null means no discount, so we hide the strikethrough price.
              -->
              <span
                v-if="item.originalPrice"
                class="text-xs text-neutral-400 line-through"
              >
                ${{ item.originalPrice.toFixed(2) }}
              </span>
            </div>

            <!-- Quantity Controls -->
            <div class="flex items-center gap-2">
              <!-- Decrease button: calls updateQty with current quantity - 1.
                   If qty reaches 0, the store's updateQty function calls removeItem automatically. -->
              <SfButton
                variant="tertiary"
                square
                size="sm"
                class="!border !border-neutral-300"
                @click="updateQty(item.product_id, item.quantity - 1)"
              >
                <SfIconRemove size="sm" />
              </SfButton>

              <!-- Current quantity display -->
              <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>

              <!-- Increase button -->
              <SfButton
                variant="tertiary"
                square
                size="sm"
                class="!border !border-neutral-300"
                @click="updateQty(item.product_id, item.quantity + 1)"
              >
                <SfIconAdd size="sm" />
              </SfButton>

              <!-- Delete button — `ml-auto` pushes it to the far right -->
              <SfButton
                variant="tertiary"
                square
                size="sm"
                class="ml-auto !text-red-400 hover:!text-red-600"
                @click="removeItem(item.product_id)"
              >
                <SfIconDelete size="sm" />
              </SfButton>
            </div>
          </div>
        </li>
      </ul>

      <!-- ── ORDER SUMMARY ──────────────────────────── -->
      <!--
        This section is pinned to the bottom of the drawer.
        The items list above it scrolls, but this stays fixed.
      -->
      <div class="border-t border-neutral-200 px-4 pt-4 pb-6 space-y-3">
        <!-- Subtotal row -->
        <div class="flex justify-between text-sm text-neutral-600">
          <span>Subtotal</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>

        <!-- Savings row — only shown if there are discounted items -->
        <div
          v-if="savings > 0"
          class="flex justify-between text-sm text-green-600"
        >
          <span>You save</span>
          <span>-${{ savings.toFixed(2) }}</span>
        </div>

        <!-- Shipping row -->
        <div class="flex justify-between text-sm text-neutral-600">
          <span>Shipping</span>
          <span class="text-green-600">Free</span>
        </div>

        <!-- Total row -->
        <div class="flex justify-between font-bold text-neutral-900 text-base pt-2 border-t border-neutral-200">
          <span>Total</span>
          <!--
            We call total() as a function (with parentheses) because it's a regular function,
            not a computed ref. A computed ref would be accessed as just `total` (no parentheses).
          -->
          <span>${{ total().toFixed(2) }}</span>
        </div>

        <!-- Primary CTA button -->
        <SfButton
          class="w-full mt-2"
          size="lg"
          @click="handleCheckout"
        >
          Proceed to Checkout
        </SfButton>

        <!-- Secondary action -->
        <SfButton
          variant="tertiary"
          class="w-full"
          @click="isOpen = false"
        >
          Continue Shopping
        </SfButton>
      </div>
    </div>
  </SfDrawer>
</template>
