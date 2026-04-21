<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js'
import { collection, addDoc } from 'firebase/firestore'
import { SfButton, SfLoaderCircular, SfIconChevronLeft } from '@storefront-ui/vue'
import { useCart } from '../modules/cart/useCart'
import { useAuth } from '../modules/auth/useAuth'
import { useCheckout } from '../composables/useCheckout'
import { db } from '../firebase/config'

const router = useRouter()
const { items, subtotal, savings } = useCart()
const { currentUser } = useAuth()
const { address } = useCheckout()

const isProcessing = ref(false)
const paymentError = ref('')

let stripe: Stripe | null = null
let cardElement: StripeCardElement | null = null

const total = computed(() => +(subtotal.value).toFixed(2))

onMounted(async () => {
  // Guard: must come from the address step
  if (items.value.length === 0) { router.replace('/cart'); return }
  if (!address.fullName.trim()) { router.replace('/checkout'); return }

  stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
  if (!stripe) return

  const elements = stripe.elements()
  cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#1a1a2e',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        '::placeholder': { color: '#a3a3a3' },
      },
      invalid: { color: '#ef4444' },
    },
  })
  cardElement.mount('#stripe-card-element')
})

onBeforeUnmount(() => {
  cardElement?.destroy()
})

async function handlePay() {
  if (!stripe || !cardElement || !currentUser.value) return

  isProcessing.value = true
  paymentError.value = ''

  try {
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(total.value * 100) }),
    })
    const { clientSecret, error: serverError } = await res.json()

    if (serverError || !clientSecret) {
      paymentError.value = serverError ?? 'Could not initiate payment.'
      return
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardElement } }
    )

    if (stripeError) {
      paymentError.value = stripeError.message ?? 'Payment failed.'
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      await addDoc(
        collection(db, 'users', currentUser.value.user_id, 'orders'),
        {
          stripePaymentId: paymentIntent.id,
          deliveryAddress: { ...address },
          items: items.value.map((i) => ({
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            originalPrice: i.originalPrice,
            image: i.image,
            quantity: i.quantity,
          })),
          total: total.value,
          createdAt: new Date().toISOString(),
          status: 'paid',
        }
      )

      items.value = []
      router.push('/order-success')
    }
  } catch {
    paymentError.value = 'Something went wrong. Please try again.'
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-10">
    <div class="max-w-5xl mx-auto">
      <RouterLink
        to="/checkout"
        class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 mb-6"
      >
        <SfIconChevronLeft size="sm" />
        Back to delivery address
      </RouterLink>

      <h1 class="text-2xl font-bold text-neutral-900 mb-8">
        Payment
      </h1>

      <div class="flex flex-col lg:flex-row gap-6 items-start">
        <!-- LEFT — PAYMENT FORM -->
        <div class="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-neutral-800 mb-2">
            Card Details
          </h2>
          <p class="text-xs text-neutral-400 mb-5">
            Test card: <span class="font-mono">4242 4242 4242 4242</span> · any future date · any CVC
          </p>

          <div
            id="stripe-card-element"
            class="border border-neutral-300 rounded-xl px-4 py-3 mb-4 focus-within:border-primary-500 transition-colors"
          />

          <p
            v-if="paymentError"
            class="text-sm text-red-500 mb-3"
          >
            {{ paymentError }}
          </p>

          <SfButton
            class="w-full"
            size="lg"
            :disabled="isProcessing"
            @click="handlePay"
          >
            <SfLoaderCircular
              v-if="isProcessing"
              size="sm"
              class="mr-2"
            />
            {{ isProcessing ? 'Processing…' : `Pay $${total}` }}
          </SfButton>

          <p class="text-center text-xs text-neutral-400 mt-3">
            Secured by Stripe · No real charges in test mode
          </p>
        </div>

        <!-- RIGHT — ORDER SUMMARY + ADDRESS -->
        <div class="w-full lg:w-80 shrink-0 space-y-4">
          <!-- Order Summary -->
          <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <h2 class="text-base font-semibold text-neutral-800 mb-4">
              Order Summary
            </h2>

            <ul class="space-y-3 mb-4">
              <li
                v-for="item in items"
                :key="item.product_id"
                class="flex gap-3 items-center"
              >
                <img
                  :src="item.image"
                  :alt="item.name"
                  class="w-12 h-12 object-cover rounded-lg bg-neutral-100 shrink-0"
                  @error="($event.target as HTMLImageElement).src = `https://placehold.co/48x48?text=${encodeURIComponent(item.name.split(' ')[0])}`"
                >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-neutral-800 line-clamp-1">
                    {{ item.name }}
                  </p>
                  <p class="text-xs text-neutral-400">
                    Qty {{ item.quantity }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-neutral-900 shrink-0">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </p>
              </li>
            </ul>

            <div class="border-t border-neutral-100 pt-4 space-y-2 text-sm">
              <div class="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>
              <div
                v-if="savings > 0"
                class="flex justify-between text-green-600"
              >
                <span>Savings</span>
                <span>-${{ savings.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-neutral-500">
                <span>Shipping</span>
                <span class="text-green-600">Free</span>
              </div>
              <div class="flex justify-between font-bold text-neutral-900 text-base pt-2 border-t border-neutral-100">
                <span>Total</span>
                <span>${{ total }}</span>
              </div>
            </div>
          </div>

          <!-- Delivery Address summary -->
          <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-base font-semibold text-neutral-800">
                Delivering to
              </h2>
              <RouterLink
                to="/checkout"
                class="text-xs text-primary-700 hover:underline"
              >
                Edit
              </RouterLink>
            </div>
            <p class="text-sm font-medium text-neutral-800">
              {{ address.fullName }}
            </p>
            <p class="text-sm text-neutral-500 mt-0.5">
              {{ address.line1 }}<span v-if="address.line2">, {{ address.line2 }}</span>
            </p>
            <p class="text-sm text-neutral-500">
              {{ address.city }}, {{ address.state }} {{ address.zip }}
            </p>
            <p class="text-sm text-neutral-500">
              {{ address.country }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
