<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useMeta } from '../composables/useMeta'

useMeta({ title: 'Home', description: 'Shop the best products at ShopVue — free shipping on orders over $50.' })
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

const SLIDE_BG = 'from-green-800 via-emerald-700 to-teal-600'
const SLIDE_CTA = '!text-emerald-700'

const slides = [
  {
    tag: 'New Season Arrivals',
    caption: 'Season Sale — Up to 30% Off',
    title: 'Discover the\nLatest Trends',
    subtitle: 'Shop thousands of products at unbeatable prices. Free shipping on orders over $50.',
    cta: 'Shop Now',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=520&h=340&fit=crop',
    link: '/plp',
  },
  {
    tag: 'Limited Time Deal',
    caption: 'Big Deals — Top Brands Discounted',
    title: 'Up to 40% Off\nTop Brands',
    subtitle: "Exclusive discounts on electronics, fashion, and home goods. Don't miss out!",
    cta: 'View Deals',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=520&h=340&fit=crop',
    link: '/deals',
  },
  {
    tag: 'Free Delivery',
    caption: 'Free Delivery — Orders Over $50',
    title: 'Shop Smart,\nSave More',
    subtitle: 'Free delivery on every order over $50. Quality products, lightning-fast shipping.',
    cta: 'Start Shopping',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=520&h=340&fit=crop',
    link: '/plp',
  },
  {
    tag: 'Flash Sale',
    caption: 'Flash Sale — Today Only, 50% Off',
    title: 'Today Only\n50% Off All',
    subtitle: "Grab the biggest discounts of the year. Limited stock — hurry before it's gone!",
    cta: 'Grab Now',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=520&h=340&fit=crop',
    link: '/deals#flash-deals',
  },
  {
    tag: 'New Electronics',
    caption: 'Electronics & Gadgets — Latest Tech',
    title: 'Latest Gadgets\nArrived',
    subtitle: 'Explore the newest tech products with warranty, fast delivery, and great prices.',
    cta: 'Explore Now',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=520&h=340&fit=crop',
    link: { path: '/plp', query: { category: 'Electronics & Gadgets' } },
  },
  {
    tag: 'Fashion Week',
    caption: 'Fashion & Apparel — Trending Styles',
    title: 'Style Up\nThis Season',
    subtitle: 'Trendy outfits and accessories for every occasion. Look great, feel confident.',
    cta: 'Shop Fashion',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=520&h=340&fit=crop',
    link: { path: '/plp', query: { category: 'Fashion & Apparel' } },
  },
  {
    tag: 'Home & Living',
    caption: 'Home & Kitchen — Transform Your Space',
    title: 'Transform\nYour Space',
    subtitle: "Beautiful furniture and home decor at prices you'll love. Free assembly included.",
    cta: 'View Range',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=520&h=340&fit=crop',
    link: { path: '/plp', query: { category: 'Home & Kitchen' } },
  },
  {
    tag: 'Sports & Fitness',
    caption: 'Health & Fitness — Gear Up Today',
    title: 'Gear Up\nGet Active',
    subtitle: 'Premium sports equipment and fitness gear to help you reach your goals.',
    cta: 'Shop Sports',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=520&h=340&fit=crop',
    link: { path: '/plp', query: { category: 'Health & Fitness' } },
  },
  {
    tag: 'Beauty & Care',
    caption: 'Beauty & Personal Care — Glow Every Day',
    title: 'Glow Up\nEvery Day',
    subtitle: 'Top beauty and skincare brands at amazing prices. Look and feel your best.',
    cta: 'Shop Beauty',
    bg: SLIDE_BG, ctaColor: SLIDE_CTA,
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=520&h=340&fit=crop',
    link: { path: '/plp', query: { category: 'Beauty & Personal Care' } },
  },
]


const currentSlide = ref(0)
let autoplayTimer: ReturnType<typeof setInterval> | null = null
let touchStartX = 0

function nextSlide() { currentSlide.value = (currentSlide.value + 1) % slides.length }
function prevSlide() { currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length }
function goToSlide(i: number) { currentSlide.value = i }

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const diff = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 40) { if (diff > 0) nextSlide(); else prevSlide() }
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
  autoplayTimer = setInterval(nextSlide, 7000)
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

onUnmounted(() => { if (autoplayTimer) clearInterval(autoplayTimer) })
</script>

<template>
  <!-- HERO CAROUSEL -->
  <section
    class="relative overflow-hidden"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div
      class="flex transition-transform duration-500 ease-in-out"
      :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
    >
      <div
        v-for="(slide, i) in slides"
        :key="i"
        class="min-w-full bg-gradient-to-r text-white"
        :class="slide.bg"
      >
        <div class="max-w-7xl mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row items-center gap-8">
          <!-- Text card -->
          <div class="flex-1 text-center md:text-left">
            <span class="inline-block bg-white/20 text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              {{ slide.tag }}
            </span>
            <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-4 whitespace-pre-line">
              {{ slide.title }}
            </h1>
            <p class="text-white/80 text-lg mb-8">
              {{ slide.subtitle }}
            </p>
            <RouterLink
              v-slot="{ navigate }"
              :to="slide.link"
              custom
            >
              <SfButton
                size="lg"
                class="!bg-white hover:!bg-neutral-100"
                :class="slide.ctaColor"
                @click="navigate"
              >
                {{ slide.cta }}
              </SfButton>
            </RouterLink>
          </div>
          <!-- Image card -->
          <div class="flex-1 flex justify-center">
            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full">
              <img
                :src="slide.img"
                :alt="slide.tag"
                class="w-full h-52 object-cover"
              >
              <div class="px-4 py-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-white/70 shrink-0" />
                <p class="text-white text-sm font-medium truncate">
                  {{ slide.caption }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prev / Next arrows -->
    <button
      class="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
      @click="prevSlide"
    >
      <SfIconChevronLeft />
    </button>
    <button
      class="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
      @click="nextSlide"
    >
      <SfIconChevronRight />
    </button>

    <!-- Dot indicators -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
      <button
        v-for="(_, i) in slides"
        :key="i"
        class="w-2 h-2 rounded-full transition-all"
        :class="currentSlide === i ? 'bg-white scale-125' : 'bg-white/50'"
        @click="goToSlide(i)"
      />
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
                  class="w-full aspect-square object-contain p-4 rounded-t-md"
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
              class="w-full aspect-square object-contain p-4"
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
