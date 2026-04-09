<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth } from '../modules/auth/useAuth'
import { SfIconPackage } from '@storefront-ui/vue'

interface OrderItem {
  product_id: number
  quantity: number
  name?: string
  price?: number
  image?: string
}

interface Product {
  product_id: number
  name: string
  price: number
  image: string
}
const { currentUser } = useAuth()
const order = ref<OrderItem[]>([])

onMounted(async () => {
  if (!currentUser.value) return
  const cartRes = await fetch(`https://fake-store-api.mock.beeceptor.com/api/carts/${currentUser.value.user_id}`)
  const cartData = await cartRes.json()
  const cart = Array.isArray(cartData) ? cartData[0] : cartData
  if (!cart?.items) return

  const productRes = await fetch('https://fake-store-api.mock.beeceptor.com/api/products')
  const products = await productRes.json()

  order.value = cart.items.map((item: OrderItem) => {
    const product = products.find((p: Product) => p.product_id === item.product_id)
    return { ...item, name: product?.name, price: product?.price, image: product?.image }
  })
})
</script>

<template>
  <div class="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-12">
    <div class="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
      <div class="flex items-center gap-2 mb-6">
        <SfIconPackage class="text-primary-700" />
        <h1 class="text-xl font-bold text-neutral-800">
          Order List
        </h1>
      </div>

      <div
        v-if="order.length === 0"
        class="text-center py-8 text-neutral-400"
      >
        No orders placed yet.
      </div>

      <div
        v-for="item in order"
        v-else
        :key="item.product_id"
        class="flex gap-4 items-center border border-neutral-200 rounded-xl p-4 mb-4 hover:shadow-sm transition-shadow"
      >
        <img
          :src="item.image"
          :alt="item.name"
          class="w-20 h-20 object-cover rounded-lg bg-neutral-100 shrink-0"
        >
        <div class="flex-1">
          <p class="font-semibold text-neutral-800">
            {{ item.name }}
          </p>
          <p class="text-sm text-neutral-500 mt-1">
            Qty: {{ item.quantity }}
          </p>
        </div>
        <p class="font-bold text-primary-700">
          ${{ item.price }}
        </p>
      </div>
    </div>
  </div>
</template>
