<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { useAuth } from '../modules/auth/useAuth'
import { db } from '../firebase/config'
import { SfIconPackage } from '@storefront-ui/vue'

interface OrderItem {
  product_id: number
  name: string
  price: number
  image: string
  quantity: number
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
const orders = ref<Order[]>([])
const loading = ref(true)

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
    orders.value = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order))
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
</script>

<template>
  <div class="min-h-screen bg-neutral-100 px-4 py-12">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-2 mb-6">
        <SfIconPackage class="text-primary-700" />
        <h1 class="text-xl font-bold text-neutral-800">
          Order History
        </h1>
      </div>

      <div
        v-if="loading"
        class="text-center py-12 text-neutral-400"
      >
        Loading orders…
      </div>

      <div
        v-else-if="orders.length === 0"
        class="text-center py-12 text-neutral-400"
      >
        No orders placed yet.
      </div>

      <div
        v-for="order in orders"
        v-else
        :key="order.id"
        class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-4"
      >
        <!-- Order header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs text-neutral-400">
              Order date
            </p>
            <p class="text-sm font-semibold text-neutral-800">
              {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-neutral-400">
              Total
            </p>
            <p class="text-sm font-bold text-primary-700">
              ${{ order.total.toFixed(2) }}
            </p>
          </div>
          <span class="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full capitalize">
            {{ order.status }}
          </span>
        </div>

        <!-- Order items -->
        <ul class="space-y-3">
          <li
            v-for="item in order.items"
            :key="item.product_id"
            class="flex gap-3 items-center"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="w-14 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
              @error="($event.target as HTMLImageElement).src = `https://placehold.co/56x56?text=${encodeURIComponent(item.name.split(' ')[0])}`"
            >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-800 line-clamp-1">
                {{ item.name }}
              </p>
              <p class="text-xs text-neutral-400">
                Qty {{ item.quantity }} · ${{ item.price.toFixed(2) }} each
              </p>
            </div>
            <p class="text-sm font-semibold text-neutral-700 shrink-0">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
