<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  SfButton,
  SfInput,
  SfBadge,
  SfIconMenu,
  SfIconSearch,
  SfIconPerson,
  SfIconShoppingCart,
  SfIconClose,
} from '@storefront-ui/vue'
import { useAuth } from '../modules/auth/useAuth'
import { useCart } from '../modules/cart/useCart'
import { useWishlist } from '../composables/useWishlist'

interface ApiProduct {
  id: string
  name: string
  priceCents: number
  image: string
  category: string
}

const router = useRouter()
const { currentUser, isLoggedIn, logout } = useAuth()
const { count: cartCount, isOpen } = useCart()
const { count: wishlistCount } = useWishlist()

const searchQuery = ref('')
const isMobileMenuOpen = ref(false)
const mobileSearchOpen = ref(false)
const userMenuOpen = ref(false)
const rawProducts = ref<ApiProduct[]>([])

// Promo bar with animation
const promos = [
  { message: 'Free shipping on orders over $50 — Use code ', bold: 'SHOPVUE', to: '/plp' },
  { message: 'Members get exclusive deals — ', bold: 'Sign up today!', to: '/signup' },
]
const currentPromoIndex = ref(0)
const promoVisible = ref(true)
let promoInterval: ReturnType<typeof setInterval> | null = null

function rotatePromo() {
  promoVisible.value = false
  setTimeout(() => {
    currentPromoIndex.value = (currentPromoIndex.value + 1) % promos.length
    promoVisible.value = true
  }, 400)
}

const navLinks = [
 { label: 'Home', to: '/' },
  { label: 'Shop', to: '/plp' },
  { label: 'Deals', to: '/deals' },
  { label: 'Categories', to: '/plp' },
]

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return rawProducts.value
    .filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
    .slice(0, 6)
    .map((p) => ({
      product_id: Number(p.id),
      name: p.name,
      price: +(p.priceCents / 100).toFixed(2),
      image: p.image,
      category: p.category,
    }))
})

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searchQuery.value = ''
  mobileSearchOpen.value = false
  router.push({ path: '/search', query: { q } })
}

onMounted(async () => {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (res.ok) rawProducts.value = await res.json()
  } catch { /* silent — search just won't show results */ }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-user-menu]')) userMenuOpen.value = false
  })

  promoInterval = setInterval(rotatePromo, 4000)
})

onUnmounted(() => {
  if (promoInterval) clearInterval(promoInterval)
})
</script>

<template>
  <!-- Promo bar -->
  <div class="bg-primary-700 text-white text-xs text-center py-2 px-4 overflow-hidden h-8 flex items-center justify-center">
    <Transition name="promo">
      <RouterLink
        v-if="promoVisible"
        :key="currentPromoIndex"
        :to="promos[currentPromoIndex].to"
        class="hover:underline"
      >
        {{ promos[currentPromoIndex].message }}<span class="font-semibold">{{ promos[currentPromoIndex].bold }}</span>
      </RouterLink>
    </Transition>
  </div>

  <header class="sticky top-0 z-20 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">
      <!-- Mobile menu toggle -->
      <SfButton
        variant="tertiary"
        square
        class="md:hidden"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <SfIconClose v-if="isMobileMenuOpen" />
        <SfIconMenu v-else />
      </SfButton>

      <!-- Logo -->
      <RouterLink
        to="/"
        class="text-xl font-bold text-primary-700 shrink-0"
      >
        ShopVue
      </RouterLink>

      <!-- Desktop nav links -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-700 ml-2">
        <RouterLink
          v-for="link in navLinks"
          :key="link.label"
          :to="link.to"
          class="hover:text-primary-700 transition-colors"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- Desktop search bar -->
      <div class="flex-1 hidden md:block max-w-xl ml-auto relative">
        <form @submit.prevent="submitSearch">
          <SfInput
            v-model="searchQuery"
            placeholder="Search products..."
            class="w-full"
          >
            <template #prefix>
              <SfIconSearch
                class="text-neutral-500 cursor-pointer"
                @click="submitSearch"
              />
            </template>
          </SfInput>
        </form>

        <!-- Desktop search dropdown -->
        <div
          v-if="searchResults.length > 0"
          class="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden"
        >
          <RouterLink
            v-for="result in searchResults"
            :key="result.product_id"
            :to="`/product/${result.product_id}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
            @click="searchQuery = ''"
          >
            <img
              :src="result.image"
              :alt="result.name"
              class="w-10 h-10 rounded-lg object-cover shrink-0"
            >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-800 truncate">
                {{ result.name }}
              </p>
              <p class="text-xs text-neutral-400">
                {{ result.category }}
              </p>
            </div>
            <span class="text-sm font-semibold text-neutral-900 shrink-0">${{ result.price.toFixed(2) }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- Action icons -->
      <div class="flex items-center gap-1 ml-auto md:ml-0">
        <!-- Mobile search toggle -->
        <SfButton
          variant="tertiary"
          square
          class="md:hidden"
          @click="mobileSearchOpen = !mobileSearchOpen"
        >
          <SfIconSearch />
        </SfButton>

        <!-- User dropdown -->
        <div
          class="relative"
          data-user-menu
        >
          <SfButton
            variant="tertiary"
            square
            @click="userMenuOpen = !userMenuOpen"
          >
            <SfIconPerson :class="isLoggedIn ? 'text-primary-700' : ''" />
          </SfButton>

          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-30"
            :class="isLoggedIn ? 'w-52' : 'w-48'"
          >
            <template v-if="isLoggedIn">
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
                class="w-full !justify-start text-sm"
                @click="userMenuOpen = false; router.push('/account')"
              >
                My Profile
              </SfButton>
              <SfButton
                variant="tertiary"
                class="w-full !justify-start text-sm"
                @click="userMenuOpen = false; router.push('/account/orders')"
              >
                Order History
              </SfButton>
              <SfButton
                variant="tertiary"
                class="w-full !justify-start !text-red-500 hover:!bg-red-50 text-sm"
                @click="userMenuOpen = false; logout()"
              >
                Logout
              </SfButton>
            </template>
            <template v-else>
              <SfButton
                variant="tertiary"
                class="w-full !justify-start text-sm"
                @click="userMenuOpen = false; router.push('/login')"
              >
                Login
              </SfButton>
              <SfButton
                variant="tertiary"
                class="w-full !justify-start text-sm"
                @click="userMenuOpen = false; router.push('/signup')"
              >
                Sign Up
              </SfButton>
            </template>
          </div>
        </div>

        <!-- Wishlist -->
        <SfButton
          v-if="isLoggedIn"
          variant="tertiary"
          square
          class="relative"
          aria-label="Wishlist"
          @click="router.push('/wishlist')"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <SfBadge
            v-if="wishlistCount > 0"
            :content="wishlistCount"
            class="!bg-red-500 outline outline-white outline-2 absolute -top-1 -right-1"
          />
        </SfButton>

        <!-- Cart -->
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

    <!-- Mobile search bar -->
    <div
      v-if="mobileSearchOpen"
      class="md:hidden px-4 pb-3 border-t border-neutral-100"
    >
      <div class="relative">
        <form @submit.prevent="submitSearch">
          <SfInput
            v-model="searchQuery"
            placeholder="Search products..."
            class="w-full"
            autofocus
          >
            <template #prefix>
              <SfIconSearch class="text-neutral-500" />
            </template>
            <template #suffix>
              <SfButton
                variant="tertiary"
                square
                size="sm"
                @click="mobileSearchOpen = false; searchQuery = ''"
              >
                <SfIconClose size="sm" />
              </SfButton>
            </template>
          </SfInput>

          <!-- Mobile search dropdown -->
          <div
            v-if="searchResults.length > 0"
            class="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <RouterLink
              v-for="result in searchResults"
              :key="result.product_id"
              :to="`/product/${result.product_id}`"
              class="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
              @click="searchQuery = ''; mobileSearchOpen = false"
            >
              <img
                :src="result.image"
                :alt="result.name"
                class="w-10 h-10 rounded-lg object-cover shrink-0"
              >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-800 truncate">
                  {{ result.name }}
                </p>
                <p class="text-xs text-neutral-400">
                  {{ result.category }}
                </p>
              </div>
              <span class="text-sm font-semibold text-neutral-900 shrink-0">${{ result.price.toFixed(2) }}</span>
            </RouterLink>
          </div>
        </form>
      </div>
    </div>

    <!-- Mobile nav menu -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden border-t border-neutral-100 bg-white px-4 py-4"
    >
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.label"
          :to="link.to"
          class="text-sm font-medium text-neutral-700 hover:text-primary-700 py-2 transition-colors"
          @click="isMobileMenuOpen = false"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
