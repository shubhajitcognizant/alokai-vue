<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '../modules/auth/useAuth'
import { ref, onMounted } from 'vue'
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
  SfSelect,
  SfRating,
} from '@storefront-ui/vue'
import FilterSlidePanel from '../components/FilterSlidepanel.vue';

const { isLoggedIn, currentUser, logout } = useAuth()
const router = useRouter()
const searchQuery = ref('')
const { isOpen, count: cartCount } = useCart()
const { products, loading, error, loadProducts } = useProducts()

onMounted(() => {
  loadProducts()
})

const options = ref([
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price low to high' },
  { label: 'Price: High to Low', value: 'price high to low' },
  { label: 'New Arrivals', value: 'new arrivals' },
  { label: 'Customer Rating', value: 'customer rating' },
  { label: 'Bestsellers', value: 'bestsellers' },
]);
const selected = ref(options.value[0].value);


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
  <section>
    <div class="flex flex-row  mx-auto px-5 py-8 gap-6">
      <div class="basis-1/3">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <FilterSlidePanel />
        </div>
      </div>
      <div class="basis-2/3">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="text-lg font-semibold">
              Product List
            </div>
            <div class="flex items-center gap-4">
              <div class="w-full">
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
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <div
              v-for="product in products"
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
              <SfButton
                variant="primary"
                class="mt-auto w-full"
              >
                Add to Cart
              </SfButton>
            </div>
          </div>
        </div> 
      </div>
    </div>
  </section>
</template>
