<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { SfButton, SfIconChevronLeft, SfLoaderCircular, SfIconPackage } from '@storefront-ui/vue'
import { useAuth } from '../modules/auth/useAuth'
import { useCart } from '../modules/cart/useCart'
import { db } from '../firebase/config'
import { useMeta } from '../composables/useMeta'

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
  address?: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
  }
}

const route  = useRoute()
const router = useRouter()
const { currentUser } = useAuth()
const { addItem, isOpen } = useCart()

const order   = ref<Order | null>(null)
const loading = ref(true)
const error   = ref('')
const reordered = ref(false)

useMeta({
  title: computed(() => order.value ? `Order #${order.value.id.slice(0, 8).toUpperCase()}` : 'Order Detail'),
})

onMounted(async () => {
  if (!currentUser.value) return
  try {
    const snap = await getDoc(
      doc(db, 'users', currentUser.value.user_id, 'orders', route.params.id as string)
    )
    if (!snap.exists()) { error.value = 'Order not found.'; return }
    order.value = { id: snap.id, ...snap.data() } as Order
  } catch {
    error.value = 'Failed to load order. Please try again.'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function totalItems(o: Order) {
  return o.items.reduce((s, i) => s + i.quantity, 0)
}

async function setRating(item: OrderItem, stars: number) {
  if (!currentUser.value || !order.value) return
  item.rating = stars
  await updateDoc(
    doc(db, 'users', currentUser.value.user_id, 'orders', order.value.id),
    { items: order.value.items.map(i => i.product_id === item.product_id ? { ...i, rating: stars } : i) }
  )
}

function reorder() {
  if (!order.value) return
  order.value.items.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      addItem({ product_id: item.product_id, name: item.name, price: item.price, originalPrice: null, image: item.image })
    }
  })
  isOpen.value = true
  reordered.value = true
  setTimeout(() => { reordered.value = false }, 2500)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-10">
    <div class="max-w-3xl mx-auto">
      <RouterLink
        to="/account/orders"
        class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 mb-6"
      >
        <SfIconChevronLeft size="sm" />
        Back to Orders
      </RouterLink>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-24"
      >
        <SfLoaderCircular size="lg" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="bg-white rounded-2xl border border-neutral-200 shadow-sm py-20 text-center"
      >
        <SfIconPackage class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p class="text-neutral-500 font-medium">
          {{ error }}
        </p>
        <SfButton
          variant="secondary"
          class="mt-4"
          @click="router.push('/account/orders')"
        >
          Back to Orders
        </SfButton>
      </div>

      <template v-else-if="order">
        <!-- Header card -->
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-4">
          <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">
                Order ID
              </p>
              <p class="text-sm font-mono font-semibold text-neutral-800">
                #{{ order.id.slice(0, 8).toUpperCase() }}
              </p>
            </div>
            <span
              class="text-xs font-semibold px-3 py-1 rounded-full capitalize"
              :class="order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'"
            >{{ order.status }}</span>
          </div>

          <div class="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-neutral-100">
            <div>
              <p class="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">
                Date
              </p>
              <p class="text-sm font-semibold text-neutral-800">
                {{ formatDate(order.createdAt) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">
                Items
              </p>
              <p class="text-sm font-semibold text-neutral-800">
                {{ totalItems(order) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">
                Shipping
              </p>
              <p class="text-sm font-semibold text-green-600">
                Free
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">
                Total
              </p>
              <p class="text-sm font-bold text-primary-700">
                ${{ order.total.toFixed(2) }}
              </p>
            </div>
          </div>

          <!-- Delivery address (if stored on order) -->
          <div
            v-if="order.address"
            class="px-5 py-4 border-b border-neutral-100"
          >
            <p class="text-xs text-neutral-400 uppercase tracking-wide mb-1">
              Delivered to
            </p>
            <p class="text-sm font-medium text-neutral-800">
              {{ order.address.fullName }}
            </p>
            <p class="text-xs text-neutral-500">
              {{ order.address.line1 }}{{ order.address.line2 ? ', ' + order.address.line2 : '' }},
              {{ order.address.city }}, {{ order.address.state }} {{ order.address.zip }}, {{ order.address.country }}
            </p>
          </div>

          <!-- Payment reference -->
          <div class="px-5 py-3">
            <p class="text-xs text-neutral-400">
              Payment ref: <span class="font-mono text-neutral-500">{{ order.stripePaymentId }}</span>
            </p>
          </div>
        </div>

        <!-- Items card -->
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-4">
          <div class="px-5 py-4 border-b border-neutral-100">
            <h2 class="text-sm font-semibold text-neutral-800">
              Items ordered
            </h2>
          </div>

          <ul class="divide-y divide-neutral-100 px-5">
            <li
              v-for="item in order.items"
              :key="item.product_id"
              class="flex gap-4 py-4 items-start"
            >
              <RouterLink :to="`/product/${item.product_id}`">
                <img
                  :src="item.image"
                  :alt="item.name"
                  class="w-16 h-16 object-cover rounded-xl bg-neutral-100 shrink-0"
                  @error="($event.target as HTMLImageElement).src = `https://placehold.co/64x64?text=${encodeURIComponent(item.name.split(' ')[0])}`"
                >
              </RouterLink>
              <div class="flex-1 min-w-0">
                <RouterLink
                  :to="`/product/${item.product_id}`"
                  class="text-sm font-semibold text-neutral-800 line-clamp-1 hover:text-primary-700"
                >
                  {{ item.name }}
                </RouterLink>
                <p class="text-xs text-neutral-400 mt-0.5 mb-2">
                  Qty {{ item.quantity }} · ${{ item.price.toFixed(2) }} each
                </p>
                <div class="flex items-center gap-0.5">
                  <button
                    v-for="star in 5"
                    :key="star"
                    class="text-base leading-none transition-colors hover:scale-110"
                    :class="star <= (item.rating ?? 0) ? 'text-amber-400' : 'text-neutral-300'"
                    @click="setRating(item, star)"
                  >
                    ★
                  </button>
                  <span class="text-xs text-neutral-400 ml-1.5">
                    {{ item.rating ? `${item.rating}/5` : 'Rate item' }}
                  </span>
                </div>
              </div>
              <p class="text-sm font-bold text-neutral-800 shrink-0 mt-1">
                ${{ (item.price * item.quantity).toFixed(2) }}
              </p>
            </li>
          </ul>

          <!-- Total row -->
          <div class="px-5 py-4 border-t border-neutral-100 flex justify-between">
            <span class="text-sm font-medium text-neutral-500">Order total</span>
            <span class="font-bold text-neutral-900">${{ order.total.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          <SfButton @click="reorder">
            {{ reordered ? '✓ Added to cart' : '↺ Reorder all items' }}
          </SfButton>
          <SfButton
            variant="secondary"
            @click="router.push('/account/orders')"
          >
            Back to Orders
          </SfButton>
        </div>
      </template>
    </div>
  </div>
</template>
