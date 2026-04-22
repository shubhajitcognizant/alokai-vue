<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { SfButton, SfIconChevronLeft, SfLoaderCircular } from '@storefront-ui/vue'
import { useProducts } from '../modules/products/useProducts'
import { useCart } from '../modules/cart/useCart'
import { useMeta } from '../composables/useMeta'

const route  = useRoute()
const router = useRouter()
const { products, loading, loadProducts } = useProducts()
const { addItem, items: cartItems } = useCart()

const sortOption = ref<'relevance' | 'price-asc' | 'price-desc' | 'rating'>('relevance')
const selectedCategory = ref('All')

const query = computed(() => (route.query.q as string ?? '').trim().toLowerCase())

useMeta({
  title: computed(() => query.value ? `Search: ${route.query.q}` : 'Search'),
  description: computed(() => `Search results for "${route.query.q}" on ShopVue.`),
})

onMounted(async () => {
  if (!products.value.length) await loadProducts()
})

// Reset filters when query changes
watch(query, () => {
  sortOption.value = 'relevance'
  selectedCategory.value = 'All'
})

const filtered = computed(() => {
  if (!query.value) return []
  return products.value.filter(p =>
    p.name.toLowerCase().includes(query.value) ||
    p.category.toLowerCase().includes(query.value) ||
    p.description?.toLowerCase().includes(query.value)
  )
})

const categories = computed(() => {
  const cats = new Set(filtered.value.map(p => p.category))
  return ['All', ...Array.from(cats).sort()]
})

const categoryFiltered = computed(() =>
  selectedCategory.value === 'All'
    ? filtered.value
    : filtered.value.filter(p => p.category === selectedCategory.value)
)

const sorted = computed(() => {
  const list = [...categoryFiltered.value]
  if (sortOption.value === 'price-asc')  return list.sort((a, b) => a.price - b.price)
  if (sortOption.value === 'price-desc') return list.sort((a, b) => b.price - a.price)
  if (sortOption.value === 'rating')     return list.sort((a, b) => b.rating - a.rating)
  return list
})

function isInCart(productId: number) {
  return cartItems.value.some(i => i.product_id === productId)
}

function handleAdd(p: typeof products.value[0]) {
  addItem({ product_id: p.product_id, name: p.name, price: p.price, originalPrice: null, image: p.image })
}

const newQuery = ref('')
function submitSearch() {
  const q = newQuery.value.trim()
  if (q) router.push({ path: '/search', query: { q } })
}

// Sync input with current query
watch(() => route.query.q, (q) => { newQuery.value = q as string ?? '' }, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-10">
    <div class="max-w-6xl mx-auto">
      <!-- Back + search bar row -->
      <div class="flex items-center gap-3 mb-6">
        <RouterLink
          to="/plp"
          class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 shrink-0"
        >
          <SfIconChevronLeft size="sm" />
          All Products
        </RouterLink>

        <form
          class="flex-1 flex gap-2"
          @submit.prevent="submitSearch"
        >
          <input
            v-model="newQuery"
            type="search"
            placeholder="Search products…"
            class="flex-1 text-sm px-4 py-2.5 rounded-xl border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 bg-white"
          >
          <SfButton
            type="submit"
            size="sm"
          >
            Search
          </SfButton>
        </form>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-24"
      >
        <SfLoaderCircular size="lg" />
      </div>

      <template v-else>
        <!-- No query -->
        <div
          v-if="!query"
          class="text-center py-24 text-neutral-400"
        >
          <p class="text-lg font-medium">
            Enter a search term above
          </p>
        </div>

        <!-- No results -->
        <div
          v-else-if="filtered.length === 0"
          class="bg-white rounded-2xl border border-neutral-200 shadow-sm py-20 text-center"
        >
          <p class="text-lg font-semibold text-neutral-700 mb-2">
            No results for "{{ route.query.q }}"
          </p>
          <p class="text-sm text-neutral-400 mb-6">
            Try a different keyword or browse all products.
          </p>
          <SfButton
            variant="secondary"
            @click="router.push('/plp')"
          >
            Browse All Products
          </SfButton>
        </div>

        <template v-else>
          <!-- Result count + sort -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p class="text-sm text-neutral-600">
              <span class="font-semibold text-neutral-900">{{ sorted.length }}</span>
              result{{ sorted.length !== 1 ? 's' : '' }} for
              <span class="font-semibold text-neutral-900">"{{ route.query.q }}"</span>
            </p>

            <select
              v-model="sortOption"
              class="text-sm px-3 py-2 rounded-lg border border-neutral-300 bg-white outline-none focus:ring-2 focus:ring-primary-700"
            >
              <option value="relevance">
                Most Relevant
              </option>
              <option value="price-asc">
                Price: Low to High
              </option>
              <option value="price-desc">
                Price: High to Low
              </option>
              <option value="rating">
                Highest Rated
              </option>
            </select>
          </div>

          <!-- Category filter pills -->
          <div
            v-if="categories.length > 2"
            class="flex flex-wrap gap-2 mb-5"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              class="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
              :class="selectedCategory === cat
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-700 hover:text-primary-700'"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Product grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="p in sorted"
              :key="p.product_id"
              class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <RouterLink :to="`/product/${p.product_id}`">
                <img
                  :src="p.image"
                  :alt="p.name"
                  class="w-full h-44 object-cover bg-neutral-100"
                  @error="($event.target as HTMLImageElement).src = `https://placehold.co/200x176?text=${encodeURIComponent(p.name.split(' ')[0])}`"
                >
              </RouterLink>
              <div class="p-3 flex flex-col flex-1">
                <p class="text-xs text-neutral-400 mb-0.5">
                  {{ p.category }}
                </p>
                <RouterLink
                  :to="`/product/${p.product_id}`"
                  class="text-sm font-medium text-neutral-800 line-clamp-2 mb-1 hover:text-primary-700 flex-1"
                >
                  {{ p.name }}
                </RouterLink>
                <div class="flex items-center gap-1 mb-2">
                  <span class="text-xs text-amber-400">★</span>
                  <span class="text-xs text-neutral-500">{{ p.rating.toFixed(1) }}</span>
                </div>
                <div class="flex items-center justify-between mt-auto">
                  <span class="font-bold text-neutral-900">${{ p.price.toFixed(2) }}</span>
                  <SfButton
                    size="sm"
                    :variant="isInCart(p.product_id) ? 'secondary' : 'primary'"
                    @click="isInCart(p.product_id) ? router.push('/cart') : handleAdd(p)"
                  >
                    {{ isInCart(p.product_id) ? 'In Cart' : 'Add' }}
                  </SfButton>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
