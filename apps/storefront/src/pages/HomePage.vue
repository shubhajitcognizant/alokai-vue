<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
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
  SfLink,
  SfIconChevronLeft,
  SfIconChevronRight,
  SfScrollable,
} from '@storefront-ui/vue'
import CartDrawer from '../components/CartDrawer.vue'
import { useCart } from '../modules/cart/useCart'
import { useRouter } from 'vue-router'
import { useAuth } from '../modules/auth/useAuth'
import 'vue3-carousel/carousel.css'
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'

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

const carouselConfig = {
  itemsToShow: 1,
  wrapAround: true
}

const { isOpen, addItem, count: cartCount, loadCart } = useCart()
const router = useRouter()
const { isLoggedIn, currentUser, logout } = useAuth()

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
      product_id: Number(p.id),
      name: p.name,
      price: +(p.priceCents / 100).toFixed(2),
      originalPrice: null,
      rating: Math.round(p.rating.stars),
      reviewCount: p.rating.count,
      image: p.image,
      badge: null,
    }))
})

function handleAddToCart(product: (typeof products.value)[0]) {
  addItem({
    product_id: product.product_id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
  })
  isOpen.value = true
}

onMounted(async () => {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    rawProducts.value = await res.json()
    await loadCart(rawProducts.value.map(p => ({
      product_id: Number(p.id),
      name: p.name,
      price: +(p.priceCents / 100).toFixed(2),
      discount: 0,
      image: p.image,
    })))
  } catch {
    error.value = 'Failed to load products. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <CartDrawer />

  <!-- NAVBAR -->
  <header class="sticky top-0 z-10 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">
      <SfButton
        variant="tertiary"
        square
        class="md:hidden"
      >
        <SfIconMenu />
      </SfButton>

      <a
        href="/"
        class="text-xl font-bold text-primary-700 shrink-0"
      >ShopVue</a>

      <div class="flex-1 hidden md:block max-w-xl">
        <SfInput
          v-model="searchQuery"
          placeholder="Search products..."
          class="w-full"
        >
          <template #prefix>
            <SfIconSearch class="text-neutral-500" />
          </template>
        </SfInput>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <SfButton
          variant="tertiary"
          square
        >
          <SfIconSearch class="md:hidden" />
        </SfButton>

        <div
          v-if="isLoggedIn"
          class="relative group"
        >
          <SfButton
            variant="tertiary"
            square
          >
            <SfIconPerson class="text-primary-700" />
          </SfButton>

          <!-- User dropdown -->
          <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
            <div class="px-4 py-3 border-b border-neutral-100">
              <p class="text-xs text-neutral-400">
                Logged in as
              </p>
              <p class="text-sm font-semibold text-neutral-800 truncate">
                {{ currentUser?.username }}
              </p>
            </div>
            <SfButton
              variant="tertiary"
              class="w-full !justify-start !text-red-500 hover:!bg-red-50"
              @click="logout"
            >
              Logout
            </SfButton>
          </div>
        </div>
        <div
          v-else
          class="relative group"
        >
          <SfButton
            variant="tertiary"
            square
          >
            <SfIconPerson />
          </SfButton>

          <!-- Guest dropdown -->
          <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
            <SfButton
              variant="tertiary"
              class="w-full !justify-start"
              @click="router.push('/login')"
            >
              Login
            </SfButton>
            <SfButton
              variant="tertiary"
              class="w-full !justify-start"
              @click="router.push('/signup')"
            >
              Sign Up
            </SfButton>
          </div>
        </div>

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

  <Carousel v-bind="carouselConfig">
    <Slide
      v-for="slide in 10"
      :key="slide"
    >
      <div class="carousel__item">
        {{ slide }}
      </div>
    </Slide>
    <template #addons>
      <Navigation />
      <Pagination />
    </template>
  </Carousel>

  <!-- HERO BANNER -->
  <section class="bg-primary-700 text-white">
    <div class="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
      <div class="flex-1 text-center md:text-left">
        <p class="text-primary-200 text-sm font-medium uppercase tracking-widest mb-3">
          New Season Arrivals
        </p>
        <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Discover the <br>Latest Trends
        </h1>
        <p class="text-primary-100 text-lg mb-8">
          Shop thousands of products at unbeatable prices. Free shipping on orders over $50.
        </p>
        <div class="flex gap-3 justify-center md:justify-start">
          <SfButton
            size="lg"
            class="!bg-white !text-primary-700 hover:!bg-primary-50"
          >
            Shop Now
          </SfButton>
          <SfButton
            size="lg"
            variant="secondary"
            class="!border-white !text-white hover:!bg-primary-600"
          >
            Learn More
          </SfButton>
        </div>
      </div>
      <div class="flex-1 flex justify-center">
        <img
          src="https://placehold.co/480x320?text=Hero+Banner"
          alt="Hero Banner"
          class="rounded-2xl shadow-xl max-w-sm w-full"
        >
      </div>
    </div>
  </section>

  <!-- HOT ON SALES SLIDER -->
  <section class="max-w-7xl mx-auto px-4 py-8 border-b border-neutral-200 [overflow-x:clip]">
    <div class="flex flex-col gap-2 flex-wrap justify-center">
      <h2 class="text-center text-4xl uppercase font-semibold mb-6">
        Hot On Sales
      </h2>

      <div
        v-if="loading"
        class="flex justify-center py-20"
      >
        <SfLoaderCircular size="lg" />
      </div>

      <p
        v-else-if="error"
        class="text-center text-red-500 py-20"
      >
        {{ error }}
      </p>

      <div
        v-else
        class="w-full"
      >
        <SfScrollable
          class="m-auto py-4 items-center w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          buttons-placement="floating"
          drag
        >
          <template #previousButton="defaultProps">
            <SfButton
              v-bind="defaultProps"
              class="absolute !rounded-full z-10 left-4 bg-white hidden md:block"
              :class="{ '!hidden': defaultProps.disabled }"
              variant="secondary"
              size="lg"
              square
            >
              <SfIconChevronLeft />
            </SfButton>
          </template>
          <div
            v-for="product in products"
            :key="product.product_id"
            class="first:ms-auto last:me-auto border border-neutral-200 shrink-0 rounded-md hover:shadow-lg w-[148px] lg:w-[192px]"
          >
            <div class="relative">
              <SfLink
                href="#"
                class="block"
              >
                <!-- product image placeholder -->
              </SfLink>
              <SfButton
                variant="tertiary"
                size="sm"
                square
                class="absolute bottom-0 right-0 mr-2 mb-2 bg-white ring-1 ring-inset ring-neutral-200 !rounded-full"
                aria-label="Add to wishlist"
              >
                <SfIconFavorite size="sm" />
              </SfButton>
            </div>
            <div class="p-2 border-t border-neutral-200 typography-text-sm">
              <SfLink
                href="#"
                variant="secondary"
                class="no-underline text-xs line-clamp-2"
              >
                {{ product.name }}
              </SfLink>
              <span class="block mt-1 font-bold text-sm">${{ product.price.toFixed(2) }}</span>
            </div>
          </div>
          <template #nextButton="defaultProps">
            <SfButton
              v-bind="defaultProps"
              class="absolute !rounded-full z-10 right-4 bg-white hidden md:block"
              :class="{ '!hidden': defaultProps.disabled }"
              variant="secondary"
              size="lg"
              square
            >
              <SfIconChevronRight />
            </SfButton>
          </template>
        </SfScrollable>
      </div>
    </div>
  </section>

  <!-- CATEGORY FILTER -->
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

  <!-- PRODUCTS GRID -->
  <section class="max-w-7xl mx-auto px-4 pb-16">
    <h2 class="text-2xl font-semibold mb-6">
      Featured Products
    </h2>

    <div
      v-if="loading"
      class="flex justify-center py-20"
    >
      <SfLoaderCircular size="lg" />
    </div>

    <p
      v-else-if="error"
      class="text-center text-red-500 py-20"
    >
      {{ error }}
    </p>

    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
    >
      <div
        v-for="product in products"
        :key="product.product_id"
        class="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
      >
        <!-- Product Image — clicking navigates to the detail page -->
        <RouterLink
          :to="`/product/${product.product_id}`"
          class="block"
        >
          <div class="relative">
            <img
              :src="product.image"
              :alt="product.name"
              class="w-full aspect-square object-cover"
            >
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
              <SfIconFavorite
                class="text-neutral-500"
                size="sm"
              />
            </SfButton>
          </div>
        </RouterLink>

        <div class="p-3">
          <!-- Product name — clicking navigates to the detail page -->
          <RouterLink
            :to="`/product/${product.product_id}`"
            class="text-sm text-neutral-700 font-medium leading-snug line-clamp-2 mb-1"
          >
            {{ product.name }}
          </RouterLink>
         
          <div class="flex items-center gap-1 mb-2">
            <SfRating
              :value="product.rating"
              :max="5"
              size="xs"
            />
            <span class="text-xs text-neutral-500">({{ product.reviewCount }})</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-bold text-neutral-900">${{ product.price.toFixed(2) }}</span>
          </div>
          <SfButton
            size="sm"
            class="w-full"
            @click="handleAddToCart(product)"
          >
            <template #prefix>
              <SfIconShoppingCart size="sm" />
            </template>
            Add to cart
          </SfButton>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-neutral-800 text-neutral-300">
    <div class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="col-span-2 md:col-span-1">
        <p class="text-white text-lg font-bold mb-2">
          ShopVue
        </p>
        <p class="text-sm">
          Your one-stop shop for everything you need, delivered fast.
        </p>
      </div>
      <div>
        <p class="text-white font-semibold mb-3">
          Shop
        </p>
        <ul class="space-y-2 text-sm">
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >New Arrivals</a>
          </li>
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >Best Sellers</a>
          </li>
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >Sale</a>
          </li>
        </ul>
      </div>
      <div>
        <p class="text-white font-semibold mb-3">
          Support
        </p>
        <ul class="space-y-2 text-sm">
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >FAQ</a>
          </li>
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >Shipping</a>
          </li>
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >Returns</a>
          </li>
        </ul>
      </div>
      <div>
        <p class="text-white font-semibold mb-3">
          Company
        </p>
        <ul class="space-y-2 text-sm">
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >About Us</a>
          </li>
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >Careers</a>
          </li>
          <li>
            <a
              href="#"
              class="hover:text-white transition-colors"
            >Contact</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-neutral-700 text-center py-4 text-xs text-neutral-500">
      © 2026 ShopVue. All rights reserved.
    </div>
  </footer>
</template>
