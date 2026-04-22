<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { SfButton } from '@storefront-ui/vue'
import { useWishlist } from '../composables/useWishlist'
import { useCart } from '../modules/cart/useCart'
import { useAuth } from '../modules/auth/useAuth'
import { useMeta } from '../composables/useMeta'

const router = useRouter()
const { currentUser } = useAuth()
const { items, load, remove } = useWishlist()
const { addItem, items: cartItems } = useCart()

useMeta({ title: 'Wishlist', description: 'Your saved products on ShopVue.' })

onMounted(() => load(currentUser.value?.isGuest ? undefined : currentUser.value?.user_id))

function isInCart(productId: number) {
  return cartItems.value.some(i => i.product_id === productId)
}

function handleAdd(item: typeof items.value[0]) {
  addItem({ product_id: item.product_id, name: item.name, price: item.price, originalPrice: null, image: item.image })
}

function handleRemove(productId: number) {
  const uid = currentUser.value?.isGuest ? undefined : currentUser.value?.user_id
  remove(productId, uid)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-10">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center shrink-0">
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">
            Wishlist
          </h1>
          <p class="text-sm text-neutral-400">
            {{ items.length }} saved item{{ items.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="items.length === 0"
        class="bg-white rounded-2xl border border-neutral-200 shadow-sm py-24 text-center"
      >
        <svg
          class="w-14 h-14 text-neutral-200 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p class="text-neutral-500 font-medium mb-1">
          Your wishlist is empty
        </p>
        <p class="text-sm text-neutral-400 mb-6">
          Save items you love to find them easily later.
        </p>
        <SfButton
          variant="secondary"
          @click="router.push('/plp')"
        >
          Browse Products
        </SfButton>
      </div>

      <!-- Wishlist grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="item in items"
          :key="item.product_id"
          class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
        >
          <RouterLink
            :to="`/product/${item.product_id}`"
            class="relative"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="w-full h-48 object-cover bg-neutral-100"
              @error="($event.target as HTMLImageElement).src = `https://placehold.co/300x192?text=${encodeURIComponent(item.name.split(' ')[0])}`"
            >
          </RouterLink>

          <div class="p-4 flex flex-col flex-1">
            <p class="text-xs text-neutral-400 mb-0.5">
              {{ item.category }}
            </p>
            <RouterLink
              :to="`/product/${item.product_id}`"
              class="text-sm font-semibold text-neutral-800 line-clamp-2 hover:text-primary-700 mb-3 flex-1"
            >
              {{ item.name }}
            </RouterLink>

            <div class="flex items-center justify-between mb-3">
              <span class="text-base font-bold text-neutral-900">${{ item.price.toFixed(2) }}</span>
            </div>

            <div class="flex gap-2">
              <SfButton
                class="flex-1"
                size="sm"
                :variant="isInCart(item.product_id) ? 'secondary' : 'primary'"
                @click="isInCart(item.product_id) ? router.push('/cart') : handleAdd(item)"
              >
                {{ isInCart(item.product_id) ? 'In Cart' : 'Add to Cart' }}
              </SfButton>
              <button
                class="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors"
                title="Remove from wishlist"
                @click="handleRemove(item.product_id)"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
