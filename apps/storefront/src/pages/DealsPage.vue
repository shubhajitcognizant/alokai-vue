<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  SfButton,
  SfRating,
  SfChip,
  SfLoaderCircular,
  SfIconChevronRight,
  SfIconChevronLeft,
} from '@storefront-ui/vue'
import AddToCartButton from '../components/AddToCartButton.vue'

interface ApiProduct {
  id: string
  name: string
  description: string
  priceCents: number
  image: string
  category: string
  rating: { stars: number; count: number }
}

interface DealProduct {
  product_id: number
  name: string
  price: number
  originalPrice: number
  discount: number
  image: string
  category: string
  rating: number
  reviewCount: number
  badge: string
}

const DISCOUNT_TIERS = [10, 15, 20, 25, 30, 35, 40, 50]

const rawProducts = ref<ApiProduct[]>([])
const loading = ref(true)
const error = ref('')
const activeCategory = ref('All')

// Countdown timer state
const timeLeft = ref({ h: 5, m: 59, s: 59 })
let timerInterval: ReturnType<typeof setInterval> | null = null

function tickTimer() {
  if (timeLeft.value.s > 0) {
    timeLeft.value.s--
  } else if (timeLeft.value.m > 0) {
    timeLeft.value.m--
    timeLeft.value.s = 59
  } else if (timeLeft.value.h > 0) {
    timeLeft.value.h--
    timeLeft.value.m = 59
    timeLeft.value.s = 59
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

const dealCategories = computed(() => {
  const unique = [...new Set(rawProducts.value.map(p => p.category))]
  return ['All', 'Flash Deals', ...unique]
})

const dealProducts = computed<DealProduct[]>(() => {
  return rawProducts.value.map((p, i) => {
    const discount = DISCOUNT_TIERS[i % DISCOUNT_TIERS.length]
    const price = +(p.priceCents / 100).toFixed(2)
    const originalPrice = +(price / (1 - discount / 100)).toFixed(2)
    return {
      product_id: Number(p.id),
      name: p.name,
      price,
      originalPrice,
      discount,
      image: p.image,
      category: p.category,
      rating: Math.round(p.rating.stars),
      reviewCount: p.rating.count,
      badge: discount >= 40 ? 'Hot' : discount >= 25 ? 'Deal' : 'Sale',
    }
  })
})

const filtered = computed(() =>
  dealProducts.value.filter(p => {
    if (activeCategory.value === 'All') return true
    if (activeCategory.value === 'Flash Deals') return p.discount >= 40
    return p.category === activeCategory.value
  })
)

const flashDeals = computed(() =>
  dealProducts.value.filter(p => p.discount >= 30).slice(0, 4)
)

// Responsive visible count
const windowWidth = ref(window.innerWidth)
function onResize() { windowWidth.value = window.innerWidth }

const visibleCount = computed(() => {
  if (windowWidth.value < 640) return 2
  if (windowWidth.value < 1024) return 3
  return 4
})

// Product carousel
const carouselIndex = ref(0)
const carouselProducts = computed(() => dealProducts.value.slice(0, 16))
const carouselMaxIndex = computed(() => Math.max(0, carouselProducts.value.length - visibleCount.value))
function carouselPrev() { carouselIndex.value = Math.max(0, carouselIndex.value - 1) }
function carouselNext() { carouselIndex.value = Math.min(carouselMaxIndex.value, carouselIndex.value + 1) }

// All Deals carousel
const allDealsIndex = ref(0)
const allDealsMaxIndex = computed(() => Math.max(0, filtered.value.length - visibleCount.value))
function allDealsPrev() { allDealsIndex.value = Math.max(0, allDealsIndex.value - 1) }
function allDealsNext() { allDealsIndex.value = Math.min(allDealsMaxIndex.value, allDealsIndex.value + 1) }

watch(activeCategory, () => { allDealsIndex.value = 0 })

// Touch + mouse drag support
function useSwipe(onLeft: () => void, onRight: () => void) {
  let startX = 0
  let dragging = false
  return {
    onTouchStart: (e: TouchEvent) => { startX = e.touches[0].clientX },
    onTouchEnd:   (e: TouchEvent) => {
      const delta = startX - e.changedTouches[0].clientX
      if (Math.abs(delta) < 40) return
      if (delta > 0) onLeft(); else onRight()
    },
    onMouseDown: (e: MouseEvent) => { startX = e.clientX; dragging = true },
    onMouseUp:   (e: MouseEvent) => {
      if (!dragging) return
      dragging = false
      const delta = startX - e.clientX
      if (Math.abs(delta) < 40) return
      if (delta > 0) onLeft(); else onRight()
    },
    onMouseLeave: () => { dragging = false },
  }
}

const carouselSwipe = useSwipe(carouselNext, carouselPrev)
const allDealsSwipe = useSwipe(allDealsNext, allDealsPrev)

onMounted(async () => {
  window.addEventListener('resize', onResize)
  timerInterval = setInterval(tickTimer, 1000)
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (!res.ok) throw new Error()
    rawProducts.value = await res.json()
  } catch {
    error.value = 'Failed to load deals. Please try again later.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('resize', onResize)
})

function scrollToDeals() {
  document.getElementById('all-deals')?.scrollIntoView({ behavior: 'smooth' })
}

function viewAllFlash() {
  activeCategory.value = 'Flash Deals'
  document.getElementById('all-deals')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <!-- HERO BANNER -->
  <section class="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white">
    <div class="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <div class="flex flex-col md:flex-row items-center gap-8">
        <div class="flex-1 text-center md:text-left">
          <span class="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Limited Time Offers
          </span>
          <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-3">
            Today's Best<br>Deals & Offers
          </h1>
          <p class="text-white/80 text-lg mb-6">
            Save up to 50% on top products. New deals added every day.
          </p>
          <!-- Countdown -->
          <div class="inline-flex items-center gap-1 bg-white/15 border border-white/25 rounded-2xl px-5 py-3 mb-6">
            <span class="text-xs text-white/70 uppercase tracking-wide mr-2">Ends in</span>
            <div class="flex items-center gap-1">
              <div class="bg-white/20 rounded-lg px-2.5 py-1.5 text-center min-w-[2.5rem]">
                <span class="text-xl font-bold leading-none block">{{ pad(timeLeft.h) }}</span>
                <span class="text-[10px] text-white/60">HRS</span>
              </div>
              <span class="text-lg font-bold text-white/60">:</span>
              <div class="bg-white/20 rounded-lg px-2.5 py-1.5 text-center min-w-[2.5rem]">
                <span class="text-xl font-bold leading-none block">{{ pad(timeLeft.m) }}</span>
                <span class="text-[10px] text-white/60">MIN</span>
              </div>
              <span class="text-lg font-bold text-white/60">:</span>
              <div class="bg-white/20 rounded-lg px-2.5 py-1.5 text-center min-w-[2.5rem]">
                <span class="text-xl font-bold leading-none block">{{ pad(timeLeft.s) }}</span>
                <span class="text-[10px] text-white/60">SEC</span>
              </div>
            </div>
          </div>
          <div class="flex gap-3 justify-center md:justify-start">
            <SfButton
              size="lg"
              class="!bg-white !text-emerald-700 hover:!bg-emerald-50"
              @click="scrollToDeals"
            >
              Shop All Deals
            </SfButton>
          </div>
        </div>
        <!-- Stats cards -->
        <div class="flex-1 grid grid-cols-2 gap-3 w-full max-w-sm">
          <div class="bg-white/15 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p class="text-3xl font-bold">
              50%
            </p>
            <p class="text-white/70 text-sm mt-1">
              Max Discount
            </p>
          </div>
          <div class="bg-white/15 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p class="text-3xl font-bold">
              500+
            </p>
            <p class="text-white/70 text-sm mt-1">
              Products on Sale
            </p>
          </div>
          <div class="bg-white/15 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p class="text-3xl font-bold">
              Free
            </p>
            <p class="text-white/70 text-sm mt-1">
              Shipping $50+
            </p>
          </div>
          <div class="bg-white/15 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p class="text-3xl font-bold">
              24h
            </p>
            <p class="text-white/70 text-sm mt-1">
              Flash Deals
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="max-w-7xl mx-auto px-4 py-8 space-y-10">
    <!-- FLASH DEALS STRIP -->
    <section id="flash-deals">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-1 h-7 bg-emerald-600 rounded-full" />
          <h2 class="text-xl font-bold text-neutral-900">
            Flash Deals
          </h2>
          <span class="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
            40%+ OFF
          </span>
        </div>
        <button
          class="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          @click="viewAllFlash"
        >
          View all <SfIconChevronRight size="sm" />
        </button>
      </div>

      <div
        v-if="loading"
        class="flex justify-center py-10"
      >
        <SfLoaderCircular size="lg" />
      </div>
      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
        <div
          v-for="product in flashDeals"
          :key="product.product_id"
          class="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group relative"
        >
          <span class="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{{ product.discount }}%
          </span>
          <RouterLink :to="`/product/${product.product_id}`">
            <img
              :src="product.image"
              :alt="product.name"
              class="w-full aspect-square object-contain p-3 bg-neutral-50"
              @error="($event.target as HTMLImageElement).src = `https://placehold.co/300x300?text=${encodeURIComponent(product.name.split(' ')[0])}`"
            >
          </RouterLink>
          <div class="p-3">
            <RouterLink
              :to="`/product/${product.product_id}`"
              class="text-xs font-medium text-neutral-700 line-clamp-2 hover:text-emerald-700 transition-colors"
            >
              {{ product.name }}
            </RouterLink>
            <div class="flex items-center gap-1.5 mt-1.5">
              <span class="font-bold text-neutral-900">${{ product.price.toFixed(2) }}</span>
              <span class="text-xs text-neutral-400 line-through">${{ product.originalPrice.toFixed(2) }}</span>
            </div>
            <AddToCartButton
              :product="product"
              size="sm"
              class="mt-2 w-full"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- PRODUCT CAROUSEL -->
    <section id="top-picks">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-1 h-7 bg-emerald-600 rounded-full" />
          <h2 class="text-xl font-bold text-neutral-900">
            Top Picks for You
          </h2>
          <span class="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full hidden sm:inline">
            Up to 50% OFF
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all"
            :class="carouselIndex === 0
              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
              : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'"
            :disabled="carouselIndex === 0"
            @click="carouselPrev"
          >
            <SfIconChevronLeft size="sm" />
          </button>
          <button
            class="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all"
            :class="carouselIndex >= carouselMaxIndex
              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
              : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'"
            :disabled="carouselIndex >= carouselMaxIndex"
            @click="carouselNext"
          >
            <SfIconChevronRight size="sm" />
          </button>
        </div>
      </div>

      <div
        v-if="loading"
        class="flex justify-center py-10"
      >
        <SfLoaderCircular size="lg" />
      </div>

      <div
        v-else
        class="overflow-hidden"
        style="cursor: grab; user-select: none"
        @touchstart="carouselSwipe.onTouchStart"
        @touchend="carouselSwipe.onTouchEnd"
        @mousedown="carouselSwipe.onMouseDown"
        @mouseup="carouselSwipe.onMouseUp"
        @mouseleave="carouselSwipe.onMouseLeave"
      >
        <div
          class="flex gap-4 transition-transform duration-400 ease-in-out"
          :style="{ transform: `translateX(calc(-${carouselIndex} * (100% / ${visibleCount} + 1rem / ${visibleCount})))` }"
        >
          <div
            v-for="product in carouselProducts"
            :key="product.product_id"
            class="shrink-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group relative"
            :style="{ width: `calc(100% / ${visibleCount} - 0.75rem)` }"
          >
            <!-- Discount ribbon -->
            <div class="absolute top-0 left-0 z-10">
              <div
                class="text-white text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-2xl"
                :class="product.discount >= 40 ? 'bg-red-500' : 'bg-emerald-600'"
              >
                -{{ product.discount }}%
              </div>
            </div>

            <RouterLink :to="`/product/${product.product_id}`">
              <div class="bg-gradient-to-b from-emerald-50 to-white p-4 aspect-square flex items-center justify-center">
                <img
                  :src="product.image"
                  :alt="product.name"
                  class="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  @error="($event.target as HTMLImageElement).src = `https://placehold.co/300x300?text=${encodeURIComponent(product.name.split(' ')[0])}`"
                >
              </div>
            </RouterLink>

            <div class="p-3 border-t border-neutral-100">
              <RouterLink
                :to="`/product/${product.product_id}`"
                class="text-sm font-medium text-neutral-800 line-clamp-2 hover:text-emerald-700 transition-colors leading-snug"
              >
                {{ product.name }}
              </RouterLink>
              <SfRating
                :value="product.rating"
                :max="5"
                size="xs"
                class="mt-1.5"
              />
              <div class="flex items-baseline gap-2 mt-1.5">
                <span class="text-base font-bold text-neutral-900">${{ product.price.toFixed(2) }}</span>
                <span class="text-xs text-neutral-400 line-through">${{ product.originalPrice.toFixed(2) }}</span>
              </div>
              <div class="mt-1 mb-2.5">
                <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Save ${{ (product.originalPrice - product.price).toFixed(2) }}
                </span>
              </div>
              <AddToCartButton
                :product="product"
                size="sm"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Dot indicators -->
      <div
        v-if="carouselProducts.length > 0"
        class="flex justify-center gap-1.5 mt-5"
      >
        <button
          v-for="i in carouselMaxIndex + 1"
          :key="i"
          class="rounded-full transition-all"
          :class="carouselIndex === i - 1
            ? 'w-6 h-2 bg-emerald-600'
            : 'w-2 h-2 bg-neutral-300 hover:bg-emerald-400'"
          @click="carouselIndex = i - 1"
        />
      </div>
    </section>

    <!-- CATEGORY FILTER -->
    <section id="all-deals">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-1 h-7 bg-emerald-600 rounded-full" />
        <h2 class="text-xl font-bold text-neutral-900">
          All Deals
        </h2>
      </div>
      <div class="flex gap-2 flex-wrap mb-6">
        <SfChip
          v-for="cat in dealCategories"
          :key="cat"
          :class="activeCategory === cat
            ? 'bg-emerald-100 border-emerald-600 text-emerald-700'
            : 'hover:border-emerald-400'"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </SfChip>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-20"
      >
        <SfLoaderCircular size="lg" />
      </div>

      <!-- Error -->
      <p
        v-else-if="error"
        class="text-center text-red-500 py-20"
      >
        {{ error }}
      </p>

      <!-- All Deals carousel -->
      <template v-else>
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm text-neutral-500">
            {{ filtered.length }} deals found
          </p>
          <div class="flex items-center gap-2">
            <button
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all"
              :class="allDealsIndex === 0
                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'"
              :disabled="allDealsIndex === 0"
              @click="allDealsPrev"
            >
              <SfIconChevronLeft size="sm" />
            </button>
            <button
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all"
              :class="allDealsIndex >= allDealsMaxIndex
                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'"
              :disabled="allDealsIndex >= allDealsMaxIndex"
              @click="allDealsNext"
            >
              <SfIconChevronRight size="sm" />
            </button>
          </div>
        </div>

        <div
          class="overflow-hidden"
          style="cursor: grab; user-select: none"
          @touchstart="allDealsSwipe.onTouchStart"
          @touchend="allDealsSwipe.onTouchEnd"
          @mousedown="allDealsSwipe.onMouseDown"
          @mouseup="allDealsSwipe.onMouseUp"
          @mouseleave="allDealsSwipe.onMouseLeave"
        >
          <div
            class="flex gap-4 transition-transform duration-400 ease-in-out"
            :style="{ transform: `translateX(calc(-${allDealsIndex} * (100% / ${visibleCount} + 1rem / ${visibleCount})))` }"
          >
            <div
              v-for="product in filtered"
              :key="product.product_id"
              class="shrink-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group relative"
              :style="{ width: `calc(100% / ${visibleCount} - 0.75rem)` }"
            >
              <div class="absolute top-0 left-0 z-10">
                <div
                  class="text-white text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-2xl"
                  :class="product.badge === 'Hot' ? 'bg-red-500' : 'bg-emerald-600'"
                >
                  {{ product.badge }} -{{ product.discount }}%
                </div>
              </div>

              <RouterLink :to="`/product/${product.product_id}`">
                <div class="bg-gradient-to-b from-emerald-50 to-white p-4 aspect-square flex items-center justify-center">
                  <img
                    :src="product.image"
                    :alt="product.name"
                    class="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    @error="($event.target as HTMLImageElement).src = `https://placehold.co/300x300?text=${encodeURIComponent(product.name.split(' ')[0])}`"
                  >
                </div>
              </RouterLink>

              <div class="p-3 border-t border-neutral-100">
                <RouterLink
                  :to="`/product/${product.product_id}`"
                  class="text-sm font-medium text-neutral-800 line-clamp-2 hover:text-emerald-700 transition-colors leading-snug"
                >
                  {{ product.name }}
                </RouterLink>
                <SfRating
                  :value="product.rating"
                  :max="5"
                  size="xs"
                  class="mt-1.5"
                />
                <div class="flex items-baseline gap-2 mt-1.5">
                  <span class="text-sm font-bold text-neutral-900">${{ product.price.toFixed(2) }}</span>
                  <span class="text-xs text-neutral-400 line-through">${{ product.originalPrice.toFixed(2) }}</span>
                </div>
                <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1 inline-block">
                  Save ${{ (product.originalPrice - product.price).toFixed(2) }}
                </span>
                <AddToCartButton
                  :product="product"
                  size="sm"
                  class="mt-2.5 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Dots -->
        <div class="flex justify-center gap-1.5 mt-5">
          <button
            v-for="i in allDealsMaxIndex + 1"
            :key="i"
            class="rounded-full transition-all"
            :class="allDealsIndex === i - 1
              ? 'w-6 h-2 bg-emerald-600'
              : 'w-2 h-2 bg-neutral-300 hover:bg-emerald-400'"
            @click="allDealsIndex = i - 1"
          />
        </div>
      </template>
    </section>
  </div>
</template>

