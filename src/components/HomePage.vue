<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

interface ApiProduct {
  product_id: number
  name: string
  description: string
  price: number
  image: string
  discount: number
  availability: boolean
  brand: string
  category: string
  rating: number
  reviews?: { user_id: number; rating: number; comment: string }[]
}

const cartCount = ref(0)
const searchQuery = ref('')
const activeCategory = ref('All')
const loading = ref(true)
const error = ref('')
const rawProducts = ref<ApiProduct[]>([])

const categories = computed(() => {
  const unique = [...new Set(rawProducts.value.map((p) => p.category))]
  return ['All', ...unique]
})

const products = computed(() => {
  return rawProducts.value
    .filter((p) => activeCategory.value === 'All' || p.category === activeCategory.value)
    .map((p) => ({
      id: p.product_id,
      name: p.name,
      price: p.discount > 0 ? +(p.price * (1 - p.discount / 100)).toFixed(2) : p.price,
      originalPrice: p.discount > 0 ? p.price : null,
      rating: Math.round(p.rating),
      reviewCount: p.reviews?.length ?? 0,
      image: p.image,
      badge: p.discount > 0 ? 'Sale' : null,
    }))
})

onMounted(async () => {
  try {
    const res = await fetch('https://fake-store-api.mock.beeceptor.com/api/products')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    rawProducts.value = await res.json()
  } catch (e) {
    error.value = 'Failed to load products. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <!-- Navbar -->
  <header class="sticky top-0 z-10 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">
      <SfButton variant="tertiary" square class="md:hidden">
        <SfIconMenu />
      </SfButton>

      <a href="/" class="text-xl font-bold text-primary-700 shrink-0">ShopVue</a>

      <div class="flex-1 hidden md:block max-w-xl">
        <SfInput v-model="searchQuery" placeholder="Search products..." class="w-full">
          <template #prefix>
            <SfIconSearch class="text-neutral-500" />
          </template>
        </SfInput>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <SfButton variant="tertiary" square>
          <SfIconSearch class="md:hidden" />
        </SfButton>
        <SfButton variant="tertiary" square>
          <SfIconPerson />
        </SfButton>
        <SfButton variant="tertiary" square class="relative">
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

  <!-- Hero Banner -->
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

  <!-- Category Filter -->
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

  <!-- Products Grid -->
  <section class="max-w-7xl mx-auto px-4 pb-16">
    <h2 class="text-2xl font-semibold mb-6">Featured Products</h2>

    <div v-if="loading" class="flex justify-center py-20">
      <SfLoaderCircular size="lg" />
    </div>

    <p v-else-if="error" class="text-center text-red-500 py-20">{{ error }}</p>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <div
        v-for="product in products"
        :key="product.id"
        class="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
      >
        <!-- Product Image -->
        <div class="relative">
          <img :src="product.image" :alt="product.name" class="w-full aspect-square object-cover" />
          <span
            v-if="product.badge"
            :class="[
              'absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full',
              product.badge === 'Sale' ? 'bg-secondary-700 text-white' : 'bg-primary-700 text-white',
            ]"
          >
            {{ product.badge }}
          </span>
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
          <p class="text-sm text-neutral-700 font-medium leading-snug line-clamp-2 mb-1">
            {{ product.name }}
          </p>
          <div class="flex items-center gap-1 mb-2">
            <SfRating :value="product.rating" :max="5" size="xs" />
            <span class="text-xs text-neutral-500">({{ product.reviewCount }})</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-bold text-neutral-900">${{ product.price.toFixed(2) }}</span>
            <span v-if="product.originalPrice" class="text-sm text-neutral-400 line-through">
              ${{ product.originalPrice.toFixed(2) }}
            </span>
          </div>
          <SfButton size="sm" class="w-full" @click="cartCount++">
            <template #prefix>
              <SfIconShoppingCart size="sm" />
            </template>
            Add to cart
          </SfButton>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
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
