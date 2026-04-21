<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  SfButton,
  SfRating,
  SfChip,
  SfLoaderCircular,
  SfIconFavorite,
  SfIconChevronLeft,
  SfIconChevronRight,
  SfScrollable,
} from '@storefront-ui/vue'
import 'vue3-carousel/carousel.css'
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'
import AddToCartButton from '../components/AddToCartButton.vue'


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

const activeCategory = ref('All')
const loading = ref(true)
const error = ref('')
const rawProducts = ref<ApiProduct[]>([])
const router = useRouter()


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
onMounted(async () => {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    rawProducts.value = await res.json()
  } catch {
    error.value = 'Failed to load products. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
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
              class="absolute !rounded-full z-5 left-4 bg-white hidden md:block"
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
              <RouterLink
                :to="`/product/${product.product_id}`"
                class="block"
              >
                <img
                  :src="product.image"
                  :alt="product.name"
                  class="w-full aspect-square object-cover rounded-t-md"
                  @error="($event.target as HTMLImageElement).src = `https://placehold.co/192x192?text=${encodeURIComponent(product.name.split(' ')[0])}`"
                >
              </RouterLink>
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
              <RouterLink
                :to="`/product/${product.product_id}`"
                class="text-xs line-clamp-2 text-neutral-700 hover:text-primary-700 transition-colors"
              >
                {{ product.name }}
              </RouterLink>
              <span class="block mt-1 font-bold text-sm">${{ product.price.toFixed(2) }}</span>
            </div>
          </div>
          <template #nextButton="defaultProps">
            <SfButton
              v-bind="defaultProps"
              class="absolute !rounded-full z-5 right-4 bg-white hidden md:block"
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
        v-for="product in products.slice(0, 4)"
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
          <AddToCartButton
            :product="{...product, product_id: product.product_id}"
            size="sm"
          />
        </div>
      </div>
    </div>
    <div
      v-if="!loading && !error"
      class="flex justify-center mt-8"
    >
      <SfButton
        variant="secondary"
        size="lg"
        @click="router.push(activeCategory === 'All' ? '/plp' : `/plp?category=${encodeURIComponent(activeCategory)}`)"
      >
        View All Products
      </SfButton>
    </div>
  </section>
</template>
