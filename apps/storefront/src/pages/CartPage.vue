<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useMeta } from '../composables/useMeta'
import { usePromo } from '../composables/usePromo'

useMeta({ title: 'Shopping Cart', description: 'Review your cart and proceed to checkout.' })

const { appliedCode, promoDescription, calcDiscount, applyCode, removeCode } = usePromo()
const promoInput = ref('')
const promoError = ref('')
const promoSuccess = ref('')

function handleApplyPromo() {
  promoError.value = ''
  promoSuccess.value = ''
  const result = applyCode(promoInput.value)
  if (result.success) {
    promoSuccess.value = result.message
    promoInput.value = ''
  } else {
    promoError.value = result.message
  }
}
import {
  SfButton,
  SfIconAdd,
  SfIconRemove,
  SfIconDelete,
  SfIconShoppingCart,
  SfIconChevronLeft,
} from '@storefront-ui/vue'
import { useCart } from '../modules/cart/useCart'
import { useAuth } from '../modules/auth/useAuth'

const router = useRouter()
const { items, removeItem, updateQty, subtotal, savings } = useCart()
const { isLoggedIn } = useAuth()

const promoDiscount = computed(() => calcDiscount(subtotal.value))
const total = computed(() => +(subtotal.value - promoDiscount.value).toFixed(2))

function handleCheckout() {
  if (isLoggedIn.value) {
    router.push('/checkout')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-10">
    <div class="max-w-5xl mx-auto">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 mb-6"
      >
        <SfIconChevronLeft size="sm" />
        Continue Shopping
      </RouterLink>

      <h1 class="text-2xl font-bold text-neutral-900 mb-8">
        Shopping Cart
        <span
          v-if="items.length"
          class="text-lg font-normal text-neutral-400 ml-2"
        >({{ items.length }} {{ items.length === 1 ? 'item' : 'items' }})</span>
      </h1>

      <!-- EMPTY STATE -->
      <div
        v-if="items.length === 0"
        class="flex flex-col items-center justify-center py-24 gap-4 text-neutral-400"
      >
        <SfIconShoppingCart class="w-16 h-16 text-neutral-300" />
        <p class="text-lg font-medium text-neutral-500">
          Your cart is empty
        </p>
        <SfButton
          variant="secondary"
          @click="router.push('/')"
        >
          Start Shopping
        </SfButton>
      </div>

      <!-- CART CONTENT -->
      <div
        v-else
        class="flex flex-col lg:flex-row gap-6 items-start"
      >
        <!-- ITEMS LIST -->
        <div class="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-sm divide-y divide-neutral-100">
          <div
            v-for="item in items"
            :key="item.product_id"
            class="flex gap-4 p-4 sm:p-6"
          >
            <!-- Image -->
            <RouterLink :to="`/product/${item.product_id}`">
              <img
                :src="item.image"
                :alt="item.name"
                class="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl object-cover bg-neutral-100"
                @error="($event.target as HTMLImageElement).src = `https://placehold.co/96x96?text=${encodeURIComponent(item.name.split(' ')[0])}`"
              >
            </RouterLink>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <RouterLink
                :to="`/product/${item.product_id}`"
                class="text-sm font-medium text-neutral-800 line-clamp-2 hover:text-primary-700 transition-colors"
              >
                {{ item.name }}
              </RouterLink>

              <div class="flex items-center gap-2 mt-1 mb-3">
                <span class="font-bold text-neutral-900">${{ item.price.toFixed(2) }}</span>
                <span
                  v-if="item.originalPrice"
                  class="text-xs text-neutral-400 line-through"
                >
                  ${{ item.originalPrice.toFixed(2) }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <SfButton
                  variant="tertiary"
                  square
                  size="sm"
                  class="!border !border-neutral-300"
                  @click="updateQty(item.product_id, item.quantity - 1)"
                >
                  <SfIconRemove size="sm" />
                </SfButton>
                <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                <SfButton
                  variant="tertiary"
                  square
                  size="sm"
                  class="!border !border-neutral-300"
                  @click="updateQty(item.product_id, item.quantity + 1)"
                >
                  <SfIconAdd size="sm" />
                </SfButton>
              </div>
            </div>

            <!-- Line total + remove -->
            <div class="flex flex-col items-end justify-between shrink-0">
              <span class="font-semibold text-neutral-900">
                ${{ (item.price * item.quantity).toFixed(2) }}
              </span>
              <SfButton
                variant="tertiary"
                square
                size="sm"
                class="!text-red-400 hover:!text-red-600"
                @click="removeItem(item.product_id)"
              >
                <SfIconDelete size="sm" />
              </SfButton>
            </div>
          </div>
        </div>

        <!-- ORDER SUMMARY -->
        <div class="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-3">
          <h2 class="text-base font-semibold text-neutral-800 mb-4">
            Order Summary
          </h2>

          <div class="flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>

          <div
            v-if="savings > 0"
            class="flex justify-between text-sm text-green-600"
          >
            <span>Savings</span>
            <span>-${{ savings.toFixed(2) }}</span>
          </div>

          <div class="flex justify-between text-sm text-neutral-600">
            <span>Shipping</span>
            <span class="text-green-600">Free</span>
          </div>

          <!-- Promo code input -->
          <div class="pt-1">
            <div
              v-if="appliedCode"
              class="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm"
            >
              <span class="text-green-700 font-medium">{{ promoDescription }}</span>
              <button
                class="text-xs text-neutral-400 hover:text-red-500 ml-2"
                @click="removeCode"
              >
                Remove
              </button>
            </div>
            <form
              v-else
              class="flex gap-2"
              @submit.prevent="handleApplyPromo"
            >
              <input
                v-model="promoInput"
                placeholder="Promo code"
                class="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 uppercase"
              >
              <SfButton
                type="submit"
                size="sm"
                variant="secondary"
              >
                Apply
              </SfButton>
            </form>
            <p
              v-if="promoError"
              class="text-xs text-red-500 mt-1"
            >
              {{ promoError }}
            </p>
            <p
              v-if="promoSuccess"
              class="text-xs text-green-600 mt-1"
            >
              ✓ {{ promoSuccess }}
            </p>
          </div>

          <!-- Promo discount row -->
          <div
            v-if="appliedCode && promoDiscount > 0"
            class="flex justify-between text-sm text-green-600"
          >
            <span>Promo ({{ appliedCode }})</span>
            <span>-${{ promoDiscount.toFixed(2) }}</span>
          </div>

          <div class="flex justify-between font-bold text-neutral-900 text-base pt-3 border-t border-neutral-200">
            <span>Total</span>
            <span>${{ total }}</span>
          </div>

          <SfButton
            class="w-full !mt-4"
            size="lg"
            @click="handleCheckout"
          >
            Proceed to Checkout
          </SfButton>

          <RouterLink
            to="/"
            class="block text-center text-sm text-neutral-500 hover:text-primary-700 mt-2 transition-colors"
          >
            Continue Shopping
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
