<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SfButton, SfLoaderCircular, SfIconPackage } from '@storefront-ui/vue'
import { useAuth } from '../modules/auth/useAuth'
import { useCart } from '../modules/cart/useCart'
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

type Tab = 'account' | 'orders' | 'address'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { addItem, isOpen } = useCart()

const activeTab = ref<Tab>('account')

// ── Orders ───────────────────────────────────────────────────────────────────
interface OrderItem {
  product_id: number
  name: string
  price: number
  image: string
  quantity: number
  rating?: number
}

interface Order {
  id: string
  stripePaymentId: string
  items: OrderItem[]
  total: number
  createdAt: string
  status: string
}

const orders = ref<Order[]>([])
const ordersLoading = ref(true)
const reorderedId = ref<string | null>(null)

onMounted(async () => {
  if (!currentUser.value || currentUser.value.isGuest) {
    ordersLoading.value = false
    return
  }
  try {
    const snap = await getDocs(
      query(
        collection(db, 'users', currentUser.value.user_id, 'orders'),
        orderBy('createdAt', 'desc')
      )
    )
    orders.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
  } catch {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
})

function totalItems(order: Order) {
  return order.items.reduce((s, i) => s + i.quantity, 0)
}

async function reorder(order: Order) {
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      addItem({ product_id: item.product_id, name: item.name, price: item.price, originalPrice: null, image: item.image })
    }
  }
  isOpen.value = true
  reorderedId.value = order.id
  setTimeout(() => { reorderedId.value = null }, 2000)
}

async function setRating(order: Order, item: OrderItem, stars: number) {
  if (!currentUser.value) return
  item.rating = stars
  const orderRef = doc(db, 'users', currentUser.value.user_id, 'orders', order.id)
  const updatedItems = order.items.map((i) =>
    i.product_id === item.product_id ? { ...i, rating: stars } : i
  )
  await updateDoc(orderRef, { items: updatedItems })
}

// ── Address ───────────────────────────────────────────────────────────────────
const address = ref({ street: '', city: '', state: '', zip: '', country: '' })
const addressSaved = ref(false)

function saveAddress() {
  addressSaved.value = true
  setTimeout(() => { addressSaved.value = false }, 2000)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function handleLogout() {
  logout()
  router.push('/')
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const navItems: { key: Tab | 'logout'; label: string; short: string }[] = [
  { key: 'account', label: 'MY ACCOUNT', short: 'Account' },
  { key: 'orders',  label: 'MY ORDERS',  short: 'Orders'  },
  { key: 'address', label: 'MY ADDRESS', short: 'Address' },
  { key: 'logout',  label: 'LOG OUT',    short: 'Logout'  },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6 md:py-10">
    <!-- ── MOBILE: compact profile strip ─────────────────────────── -->
    <div class="md:hidden mb-3">
      <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-primary-700 to-primary-500 px-4 py-4 flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-base font-bold select-none shrink-0">
            {{ getInitials(currentUser?.username) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-white font-semibold text-sm leading-tight truncate">
              {{ currentUser?.username }}
            </p>
            <p class="text-primary-200 text-xs truncate">
              {{ currentUser?.email }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
      <!-- ── Sidebar ─────────────────────────────────────────────── -->
      <aside class="w-full md:w-56 md:shrink-0 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <!-- Desktop: avatar header (hidden on mobile) -->
        <div class="hidden md:flex bg-gradient-to-br from-primary-700 to-primary-500 px-6 py-6 flex-col items-center gap-2">
          <div class="w-16 h-16 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold select-none">
            {{ getInitials(currentUser?.username) }}
          </div>
          <p class="text-white font-semibold text-sm text-center leading-tight">
            {{ currentUser?.username }}
          </p>
          <p class="text-primary-200 text-xs text-center truncate max-w-full">
            {{ currentUser?.email }}
          </p>
        </div>

        <!-- Mobile: horizontal tab bar (hidden on desktop) -->
        <div class="flex md:hidden border-b border-neutral-100">
          <template
            v-for="item in navItems"
            :key="item.key"
          >
            <button
              v-if="item.key !== 'logout'"
              class="flex-1 flex flex-col items-center gap-1 pt-3 pb-2.5 text-xs font-medium transition-colors border-b-2 -mb-px"
              :class="activeTab === item.key
                ? 'text-primary-700 border-primary-700'
                : 'text-neutral-500 border-transparent hover:text-neutral-800'"
              @click="activeTab = (item.key as Tab)"
            >
              <!-- Account -->
              <svg
                v-if="item.key === 'account'"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <!-- Orders -->
              <svg
                v-else-if="item.key === 'orders'"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                /><path d="M3 9h18M9 21V9" />
              </svg>
              <!-- Address -->
              <svg
                v-else-if="item.key === 'address'"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle
                  cx="12"
                  cy="9"
                  r="2.5"
                />
              </svg>
              {{ item.short }}
            </button>
            <button
              v-else
              class="flex-1 flex flex-col items-center gap-1 pt-3 pb-2.5 text-xs font-medium transition-colors border-b-2 -mb-px text-red-500 border-transparent hover:bg-red-50"
              @click="handleLogout"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              {{ item.short }}
            </button>
          </template>
        </div>

        <!-- Desktop: vertical nav (hidden on mobile) -->
        <nav class="hidden md:block py-2">
          <template
            v-for="item in navItems"
            :key="item.key"
          >
            <button
              v-if="item.key !== 'logout'"
              class="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors text-left"
              :class="activeTab === item.key
                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'"
              @click="activeTab = (item.key as Tab)"
            >
              <svg
                v-if="item.key === 'account'"
                class="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <svg
                v-else-if="item.key === 'orders'"
                class="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                /><path d="M3 9h18M9 21V9" />
              </svg>
              <svg
                v-else-if="item.key === 'address'"
                class="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle
                  cx="12"
                  cy="9"
                  r="2.5"
                />
              </svg>
              {{ item.label }}
            </button>
            <button
              v-else
              class="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left mt-1 border-t border-neutral-100"
              @click="handleLogout"
            >
              <svg
                class="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              {{ item.label }}
            </button>
          </template>
        </nav>
      </aside>

      <!-- ── Content panel ───────────────────────────────────────── -->
      <div class="flex-1 min-w-0 w-full">
        <!-- MY ACCOUNT ────────────────────────────────────────────── -->
        <div
          v-if="activeTab === 'account'"
          class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-neutral-100">
            <h2 class="text-base font-semibold text-neutral-800">
              Account Details
            </h2>
            <p class="text-xs text-neutral-400 mt-0.5">
              Your registered account information
            </p>
          </div>

          <div class="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Username
              </p>
              <p class="text-sm font-semibold text-neutral-800 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-200 truncate">
                {{ currentUser?.username || '—' }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Email
              </p>
              <p class="text-sm font-semibold text-neutral-800 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-200 truncate">
                {{ currentUser?.email || '—' }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Account Type
              </p>
              <div class="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-200">
                <span class="text-sm font-semibold text-neutral-800 capitalize">
                  {{ currentUser?.isGuest ? 'Guest' : 'Registered' }}
                </span>
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="currentUser?.isGuest ? 'bg-neutral-100 text-neutral-500' : 'bg-green-100 text-green-700'"
                >
                  {{ currentUser?.isGuest ? 'Guest' : 'Active' }}
                </span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                User ID
              </p>
              <p class="text-xs font-mono text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-200 truncate">
                {{ currentUser?.user_id || '—' }}
              </p>
            </div>
          </div>

          <div class="px-5 pb-5">
            <div class="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-700">
              To update your account, contact
              <span class="font-semibold">support@shopvue.com</span>
            </div>
          </div>
        </div>

        <!-- MY ORDERS ─────────────────────────────────────────────── -->
        <div
          v-else-if="activeTab === 'orders'"
          class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-neutral-100">
            <h2 class="text-base font-semibold text-neutral-800">
              Order History
            </h2>
            <p class="text-xs text-neutral-400 mt-0.5">
              All your past purchases
            </p>
          </div>

          <div
            v-if="ordersLoading"
            class="flex justify-center py-16"
          >
            <SfLoaderCircular size="lg" />
          </div>

          <div
            v-else-if="!orders.length"
            class="flex flex-col items-center gap-3 py-16 text-neutral-400"
          >
            <SfIconPackage class="text-neutral-300 w-12 h-12" />
            <p class="text-sm font-medium">
              No orders yet
            </p>
            <SfButton
              variant="secondary"
              size="sm"
              @click="router.push('/')"
            >
              Start Shopping
            </SfButton>
          </div>

          <div
            v-else
            class="divide-y divide-neutral-100"
          >
            <div
              v-for="order in orders"
              :key="order.id"
              class="p-4 md:p-5"
            >
              <!-- Order meta row -->
              <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    :class="order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'"
                  >{{ order.status }}</span>
                  <span class="text-xs text-neutral-400">{{ new Date(order.createdAt).toLocaleDateString() }}</span>
                  <span class="text-xs text-neutral-400">{{ totalItems(order) }} item{{ totalItems(order) !== 1 ? 's' : '' }}</span>
                </div>
                <span class="text-sm font-bold text-neutral-900">${{ order.total.toFixed(2) }}</span>
              </div>

              <!-- Items -->
              <div class="space-y-3 mb-3">
                <div
                  v-for="item in order.items"
                  :key="item.product_id"
                  class="flex gap-3 items-start"
                >
                  <img
                    :src="item.image"
                    :alt="item.name"
                    class="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-neutral-100 shrink-0"
                  >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-neutral-800 line-clamp-1">
                      {{ item.name }}
                    </p>
                    <p class="text-xs text-neutral-500 mb-1">
                      Qty {{ item.quantity }} · ${{ item.price.toFixed(2) }}
                    </p>
                    <!-- Stars always below name (works on all screen sizes) -->
                    <div class="flex gap-0.5">
                      <button
                        v-for="star in 5"
                        :key="star"
                        class="text-base leading-none transition-colors"
                        :class="(item.rating ?? 0) >= star ? 'text-amber-400' : 'text-neutral-300'"
                        @click="setRating(order, item, star)"
                      >
                        ★
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reorder -->
              <div class="flex justify-end">
                <SfButton
                  variant="secondary"
                  size="sm"
                  @click="reorder(order)"
                >
                  {{ reorderedId === order.id ? '✓ Added to cart' : 'Reorder' }}
                </SfButton>
              </div>
            </div>
          </div>
        </div>

        <!-- MY ADDRESS ────────────────────────────────────────────── -->
        <div
          v-else-if="activeTab === 'address'"
          class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-neutral-100">
            <h2 class="text-base font-semibold text-neutral-800">
              Shipping Address
            </h2>
            <p class="text-xs text-neutral-400 mt-0.5">
              Manage your default delivery address
            </p>
          </div>

          <div class="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2 space-y-1">
              <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Street Address</label>
              <input
                v-model="address.street"
                class="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 text-neutral-900 bg-white"
                placeholder="123 Main St, Apt 4B"
              >
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">City</label>
              <input
                v-model="address.city"
                class="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 text-neutral-900 bg-white"
                placeholder="New York"
              >
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">State / Province</label>
              <input
                v-model="address.state"
                class="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 text-neutral-900 bg-white"
                placeholder="NY"
              >
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">ZIP / Postal Code</label>
              <input
                v-model="address.zip"
                class="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 text-neutral-900 bg-white"
                placeholder="10001"
              >
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Country</label>
              <input
                v-model="address.country"
                class="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 text-neutral-900 bg-white"
                placeholder="United States"
              >
            </div>
          </div>

          <div class="px-5 pb-5 flex flex-wrap items-center gap-3">
            <SfButton @click="saveAddress">
              {{ addressSaved ? '✓ Saved!' : 'Save Address' }}
            </SfButton>
            <p class="text-xs text-neutral-400">
              Saved locally for this session.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
