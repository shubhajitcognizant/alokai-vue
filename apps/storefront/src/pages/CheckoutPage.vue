<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js'
import { collection, addDoc } from 'firebase/firestore'
import { SfButton, SfLoaderCircular, SfIconChevronLeft } from '@storefront-ui/vue'
import { useCart } from '../modules/cart/useCart'
import { useAuth } from '../modules/auth/useAuth'
import { db } from '../firebase/config'

const router = useRouter()
const { items, subtotal, savings } = useCart()
const { currentUser } = useAuth()

const isProcessing = ref(false)
const paymentError = ref('')

// Stripe instances — set up after the component mounts
let stripe: Stripe | null = null
let cardElement: StripeCardElement | null = null

const total = computed(() => +(subtotal.value).toFixed(2))

onMounted(async () => {
  // Redirect away if cart is empty
  if (items.value.length === 0) {
    router.replace('/')
    return
  }

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
    // 1. Ask our middleware to create a Stripe PaymentIntent
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

    // 2. Confirm the payment on Stripe's side using the card element
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardElement } }
    )

    if (stripeError) {
      paymentError.value = stripeError.message ?? 'Payment failed.'
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // 3. Save the order to Firestore under users/{uid}/orders
      await addDoc(
        collection(db, 'users', currentUser.value.user_id, 'orders'),
        {
          stripePaymentId: paymentIntent.id,
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

      // 4. Clear cart and navigate to success
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
    <div class="max-w-2xl mx-auto">
      <!-- Back link -->
      <button
        class="flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 mb-6"
        @click="router.back()"
      >
        <SfIconChevronLeft size="sm" />
        Back to cart
      </button>

      <h1 class="text-2xl font-bold text-neutral-900 mb-8">
        Checkout
      </h1>

      <div class="grid grid-cols-1 gap-6">
        <!-- ORDER SUMMARY -->
        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
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

        <!-- PAYMENT FORM -->
        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 class="text-base font-semibold text-neutral-800 mb-2">
            Payment Details
          </h2>
          <p class="text-xs text-neutral-400 mb-5">
            Test card: <span class="font-mono">4242 4242 4242 4242</span> · any future date · any CVC
          </p>

          <!-- Stripe card element mounts here -->
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
      </div>
    </div>
  </div>
</template>
