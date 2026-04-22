<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../modules/auth/useAuth'
import { useCart } from '../modules/cart/useCart'
import { db } from '../firebase/config'
import { SfIconPackage, SfButton } from '@storefront-ui/vue'
import { useMeta } from '../composables/useMeta'

useMeta({ title: 'Order History', description: 'View and manage all your past orders.' })

const router = useRouter()

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

const { currentUser } = useAuth()
const { addItem, isOpen } = useCart()
const orders = ref<Order[]>([])
const loading = ref(true)
const reorderedId = ref<string | null>(null)

onMounted(async () => {
  if (!currentUser.value || currentUser.value.isGuest) {
    loading.value = false
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
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function totalItems(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

function reorder(order: Order) {
  order.items.forEach(item => {
    addItem({
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      originalPrice: null,
      image: item.image,
    })
  })
  reorderedId.value = order.id
  isOpen.value = true
  setTimeout(() => { reorderedId.value = null }, 2000)
}

async function setRating(order: Order, item: OrderItem, stars: number) {
  item.rating = stars
  if (!currentUser.value) return
  try {
    await updateDoc(
      doc(db, 'users', currentUser.value.user_id, 'orders', order.id),
      {
        items: order.items.map(i =>
          i.product_id === item.product_id ? { ...i, rating: stars } : i
        ),
      }
    )
  } catch { /* silent */ }
}
</script>

<template>
  <div class="bg-neutral-50 px-4 py-10">
    <div class="max-w-3xl mx-auto">
      <!-- Page title -->
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center shrink-0">
          <SfIconPackage class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">
            Order History
          </h1>
          <p class="text-sm text-neutral-400">
            Track and manage your past orders
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="text-center py-16 text-neutral-400"
      >
        Loading orders…
      </div>

      <!-- Empty state -->
      <div
        v-else-if="orders.length === 0"
        class="bg-white rounded-2xl border border-neutral-200 py-20 text-center"
      >
        <SfIconPackage class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p class="text-neutral-500 font-medium">
          No orders placed yet
        </p>
        <p class="text-sm text-neutral-400 mt-1">
          Your order history will appear here.
        </p>
      </div>

      <!-- Order cards -->
      <div
        v-for="order in orders"
        v-else
        :key="order.id"
        class="bg-white rounded-2xl border border-neutral-200 shadow-sm mb-4 overflow-hidden"
      >
        <!-- Order meta bar -->
        <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p class="text-xs text-neutral-400 uppercase tracking-wide">
              Order date
            </p>
            <p class="text-sm font-semibold text-neutral-800">
              {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-neutral-400 uppercase tracking-wide">
              Total items
            </p>
            <p class="text-sm font-semibold text-neutral-800">
              {{ totalItems(order) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-neutral-400 uppercase tracking-wide">
              Total cost
            </p>
            <p class="text-sm font-bold text-primary-700">
              ${{ order.total.toFixed(2) }}
            </p>
          </div>
          <span class="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
            {{ order.status }}
          </span>
        </div>

        <!-- Items list -->
        <ul class="divide-y divide-neutral-100 px-5">
          <li
            v-for="item in order.items"
            :key="item.product_id"
            class="flex gap-4 py-4 items-start"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="w-16 h-16 object-cover rounded-xl bg-neutral-100 shrink-0"
              @error="($event.target as HTMLImageElement).src = `https://placehold.co/64x64?text=${encodeURIComponent(item.name.split(' ')[0])}`"
            >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-neutral-800 line-clamp-1 mb-0.5">
                {{ item.name }}
              </p>
              <p class="text-xs text-neutral-400 mb-2">
                Qty {{ item.quantity }} · ${{ item.price.toFixed(2) }} each
              </p>
              <!-- Star rating -->
              <div class="flex items-center gap-0.5">
                <button
                  v-for="star in 5"
                  :key="star"
                  class="text-base leading-none transition-colors hover:scale-110"
                  :class="star <= (item.rating ?? 0) ? 'text-yellow-400' : 'text-neutral-300'"
                  @click="setRating(order, item, star)"
                >
                  ★
                </button>
                <span
                  v-if="item.rating"
                  class="text-xs text-neutral-400 ml-1.5"
                >{{ item.rating }}/5</span>
                <span
                  v-else
                  class="text-xs text-neutral-300 ml-1.5"
                >Rate this item</span>
              </div>
            </div>
            <p class="text-sm font-bold text-neutral-800 shrink-0 mt-1">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </p>
          </li>
        </ul>

        <!-- Footer row -->
        <div class="px-5 py-3 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
          <p class="text-xs text-neutral-400">
            Order #{{ order.id.slice(0, 8).toUpperCase() }}
          </p>
          <div class="flex gap-2">
            <SfButton
              variant="tertiary"
              size="sm"
              @click="router.push(`/orders/${order.id}`)"
            >
              View Details
            </SfButton>
            <SfButton
              variant="secondary"
              size="sm"
              @click="reorder(order)"
            >
              {{ reorderedId === order.id ? '✓ Added to cart' : '↺ Reorder' }}
            </SfButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
