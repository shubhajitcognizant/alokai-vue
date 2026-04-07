<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  SfButton,
  SfBadge,
  SfRating,
  SfLoaderCircular,
  SfIconShoppingCart,
  SfIconFavorite,
  SfIconArrowBack,
  SfIconPerson,
  SfIconLocalShipping
} from '@storefront-ui/vue'
import CartDrawer from '../components/CartDrawer.vue'
import { useCart } from '../modules/cart/useCart'

interface ApiProduct {
  id: string
  name: string
  description: string
  priceCents: number
  image: string
  category: string
  subCategory?: string
  rating: { stars: number; count: number }
  keywords?: string[]
}

const route = useRoute()
const router = useRouter()
const { isOpen, addItem, count: cartCount } = useCart()
const loading = ref(true)
const error = ref('')
const product = ref<ApiProduct | null>(null)
const quantity = ref(1)

const price = computed(() => {
  if (!product.value) return 0
  return +(product.value.priceCents / 100).toFixed(2)
})

const roundedRating = computed(() => {
  if (!product.value) return 0
  return Math.round(product.value.rating.stars)
})


function handleAddToCart() {
  if (!product.value) return
  for (let i = 0; i < quantity.value; i++) {
    addItem({
      product_id: Number(product.value.id),
      name: product.value.name,
      price: price.value,
      originalPrice: null,
      image: product.value.image,
    })
  }
  isOpen.value = true
}

function incrementQty() { quantity.value++ }
function decrementQty() { if (quantity.value > 1) quantity.value-- }


onMounted(async () => {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const allProducts: ApiProduct[] = await res.json()

    // Route param is a string — compare against product.id directly
    const found = allProducts.find((p) => p.id === route.params.id)

    if (!found) {
      error.value = 'Product not found.'
      return
    }

    product.value = found
  } catch {
    error.value = 'Failed to load product. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <CartDrawer />

  <header class="sticky top-0 z-10 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">
      <a
        href="/"
        class="text-xl font-bold text-primary-700 shrink-0"
      >ShopVue</a>

      <div class="flex items-center gap-2 ml-auto">
        <SfButton
          variant="tertiary"
          square
        >
          <SfIconPerson />
        </SfButton>

        <SfButton
          variant="tertiary"
          square
          class="relative"
          @click="isOpen = true"
        >
          <SfIconShoppingCart />
          <SfBadge
            v-if="cartCount > 0"
            :content="cartCount"
            class="!bg-primary-700 outline outline-white outline-2 absolute -top-1 -right-1"
          />
        </SfButton>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    <SfButton
      variant="tertiary"
      class="mb-6"
      @click="router.back()"
    >
      <template #prefix>
        <SfIconArrowBack size="sm" />
      </template>
      Back to products
    </SfButton>

    <div
      v-if="loading"
      class="flex justify-center py-32"
    >
      <SfLoaderCircular size="lg" />
    </div>

    <p
      v-else-if="error"
      class="text-center text-red-500 py-32 text-lg"
    >
      {{ error }}
    </p>

    <div
      v-else-if="product"
      class="grid grid-cols-1 lg:grid-cols-2 gap-10"
    >
      <div>
        <div class="relative bg-neutral-100 rounded-2xl overflow-hidden aspect-square mb-3">
          <img
            :src="product.image"
            :alt="product.name"
            class="w-full h-full object-contain p-6"
          >

          <SfButton
            variant="tertiary"
            square
            class="absolute top-3 right-3 !bg-white shadow"
          >
            <SfIconFavorite class="text-neutral-500" />
          </SfButton>
        </div>

        <div class="flex gap-2">
          <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary-700">
            <img
              :src="product.image"
              :alt="product.name"
              class="w-full h-full object-cover"
            >
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 text-sm text-neutral-500">
          <span>{{ product.category }}</span>
          <template v-if="product.subCategory">
            <span>·</span>
            <span>{{ product.subCategory }}</span>
          </template>
        </div>

        <h1 class="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">
          {{ product.name }}
        </h1>

        <div class="flex items-center gap-2">
          <SfRating
            :value="roundedRating"
            :max="5"
            size="sm"
          />
          <span class="text-sm font-medium text-neutral-700">{{ product.rating.stars.toFixed(1) }}</span>
          <span class="text-sm text-neutral-500">({{ product.rating.count }} review{{ product.rating.count !== 1 ? 's' : '' }})</span>
        </div>

        <div class="bg-neutral-50 rounded-xl p-4">
          <span class="text-3xl font-bold text-neutral-900">${{ price.toFixed(2) }}</span>
        </div>

        <div>
          <h2 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-1">
            Description
          </h2>
          <p class="text-neutral-600 leading-relaxed text-sm">
            {{ product.description }}
          </p>
        </div>

        <!-- Keywords -->
        <div
          v-if="product.keywords?.length"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="kw in product.keywords"
            :key="kw"
            class="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full"
          >
            {{ kw }}
          </span>
        </div>

        <!-- Quantity selector + Add to cart -->
        <div class="flex items-center gap-3 mt-2">
          <div class="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
            <button
              class="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40"
              :disabled="quantity <= 1"
              @click="decrementQty"
            >
              −
            </button>
            <span class="w-10 text-center font-medium text-neutral-900">{{ quantity }}</span>
            <button
              class="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
              @click="incrementQty"
            >
              +
            </button>
          </div>

          <SfButton
            size="lg"
            class="flex-1"
            @click="handleAddToCart"
          >
            <template #prefix>
              <SfIconShoppingCart />
            </template>
            Add to cart
          </SfButton>
        </div>

        <!-- Delivery note -->
        <p class="text-xs text-neutral-500 flex items-center gap-1">
          <SfIconLocalShipping />
          Free shipping on orders over $50
        </p>
      </div>
    </div>
  </main>

  <!-- ── FOOTER ──────────────────────────────────────── -->
  <footer class="bg-neutral-800 text-neutral-300 mt-16">
    <div class="border-t border-neutral-700 text-center py-4 text-xs text-neutral-500">
      © 2026 ShopVue. All rights reserved.
    </div>
  </footer>
</template>
