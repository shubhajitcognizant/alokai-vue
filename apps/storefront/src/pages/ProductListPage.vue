<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../modules/auth/useAuth'
import { ref, computed, onMounted, watch } from 'vue'
import { useCart } from '../modules/cart/useCart';
import { useProducts } from '../modules/products/useProducts';
import {
  SfButton,
  SfBadge,
  SfInput,
  SfIconShoppingCart,
  SfIconSearch,
  SfIconMenu,
  SfIconPerson,
  SfIconChevronLeft,
  SfIconChevronRight,
  SfSelect,
  SfRating,
} from '@storefront-ui/vue'
import FilterSlidePanel from '../components/FilterSlidepanel.vue';
import AddToCartButton from '../components/AddToCartButton.vue';

const { isLoggedIn, currentUser, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const { isOpen, count: cartCount } = useCart()
const { products, loading, error, loadProducts } = useProducts()

onMounted(() => {
  loadProducts()
})

const activeRating = ref('');
const activeCategory = ref((route.query.category as string) ?? '');
const activePriceMin = ref(0);
const activePriceMax = ref(Infinity);

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const ratingOk = !activeRating.value || Math.round(p.rating) >= Number(activeRating.value);
    const categoryOk = !activeCategory.value || p.category === activeCategory.value;
    const priceOk = p.price >= activePriceMin.value && p.price <= activePriceMax.value;
    return ratingOk && categoryOk && priceOk;
  });
});

const options = [
  { id: 'sort1', label: 'Relevance', value: 'relevance' },
  { id: 'sort2', label: 'Price: Low to High', value: 'price low to high' },
  { id: 'sort3', label: 'Price: High to Low', value: 'price high to low' },
  { id: 'sort5', label: 'Customer Rating', value: 'customer rating' },
];
const selected = ref('relevance');

const displayProducts = computed(() => {
  const list = [...filteredProducts.value];
  switch (selected.value) {
    case 'price low to high': return list.sort((a, b) => a.price - b.price);
    case 'price high to low': return list.sort((a, b) => b.price - a.price);
    case 'customer rating':   return list.sort((a, b) => b.rating - a.rating);
    default:                  return list;
  }
});

const PAGE_SIZE = 10;
const currentPage = ref(1);

const totalPages = computed(() => Math.ceil(displayProducts.value.length / PAGE_SIZE));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return displayProducts.value.slice(start, start + PAGE_SIZE);
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const range: number[] = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    range.push(i);
  }
  return range;
});

watch(displayProducts, () => { currentPage.value = 1; });


</script>

<template>  
  <CartDrawer />
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
              class="w-full justify-start! text-red-500! hover:bg-red-50!"
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
              class="w-full justify-start!"
              @click="router.push('/login')"
            >
              Login
            </SfButton>
            <SfButton
              variant="tertiary"
              class="w-full justify-start!"
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
            class="bg-primary-700! outline outline-white outline-2 absolute -top-1 -right-1"
          />
        </SfButton>
      </div>
    </div>
  </header>
  <section>
    <div class="flex flex-row  mx-auto px-5 py-8 gap-6">
      <div class="basis-1/3">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <FilterSlidePanel
            :products="products"
            :initial-category="activeCategory"
            @apply-filters="({ rating, category, priceMin, priceMax }) => { activeRating = rating; activeCategory = category; activePriceMin = priceMin; activePriceMax = priceMax || Infinity; }"
          />
        </div>
      </div>
      <div class="basis-2/3">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <div class="text-lg font-semibold">
              {{ activeCategory ? activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) : 'Products' }}
            </div>
            <div class="flex items-center gap-4">
              <p
                v-if="!loading && !error"
                class="text-sm text-neutral-500 whitespace-nowrap"
              >
                Showing {{ displayProducts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0 }}–{{ Math.min(currentPage * PAGE_SIZE, displayProducts.length) }} of {{ displayProducts.length }} products
              </p>
              <SfSelect
                v-model="selected"
                aria-label="Sort by"
              >
                <option
                  v-for="{ value, label } in options"
                  :key="value"
                  :value="value"
                >
                  {{ label }}
                </option>
              </SfSelect>
            </div>
          </div>
          <div
            v-if="loading"
            class="text-center py-12 text-neutral-500"
          >
            Loading products...
          </div>
          <div
            v-else-if="error"
            class="text-center py-12 text-red-500"
          >
            {{ error }}
          </div>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div
                v-for="product in paginatedProducts"
                :key="product.product_id"
                class="border border-neutral-200 rounded-lg p-4 flex flex-col gap-1"
              >
                <img
                  :src="product.image"
                  :alt="product.name"
                  class="w-full h-32 object-cover rounded-md bg-neutral-100"
                >
                <h2 class="text-sm font-semibold text-center line-clamp-2 mb-2 mt-2">
                  {{ product.name }}
                </h2>
                <div class="flex items-center gap-1">
                  <SfRating
                    :value="product.rating"
                    :max="5"
                    size="xs"
                  />
                  <span class="text-xs text-neutral-500">({{ product.reviewCount }})</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-primary-700 font-bold">
                    ${{ product.price.toFixed(2) }}
                  </span>
                </div>
                <AddToCartButton
                  :product="{ ...product, originalPrice: null }"
                  class="mt-auto w-full"
                />
              </div>
            </div>
            <div
              v-if="totalPages > 1"
              class="flex items-center justify-center gap-1 mt-8"
            >
              <SfButton
                variant="tertiary"
                size="sm"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <SfIconChevronLeft size="sm" />
              </SfButton>
              <SfButton
                v-if="pageNumbers[0] > 1"
                variant="tertiary"
                size="sm"
                @click="currentPage = 1"
              >
                1
              </SfButton>
              <span
                v-if="pageNumbers[0] > 2"
                class="px-1 text-neutral-400"
              >…</span>
              <SfButton
                v-for="n in pageNumbers"
                :key="n"
                :variant="n === currentPage ? 'primary' : 'tertiary'"
                size="sm"
                @click="currentPage = n"
              >
                {{ n }}
              </SfButton>
              <span
                v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1"
                class="px-1 text-neutral-400"
              >…</span>
              <SfButton
                v-if="pageNumbers[pageNumbers.length - 1] < totalPages"
                variant="tertiary"
                size="sm"
                @click="currentPage = totalPages"
              >
                {{ totalPages }}
              </SfButton>
              <SfButton
                variant="tertiary"
                size="sm"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                <SfIconChevronRight size="sm" />
              </SfButton>
            </div>
          </template>
        </div> 
      </div>
    </div>
  </section>
</template>
