<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useMeta } from '../composables/useMeta'

useMeta({ title: 'Checkout', description: 'Enter your delivery address and complete your order.' })
import { SfButton, SfInput, SfIconChevronLeft, SfLoaderCircular } from '@storefront-ui/vue'
import { useCart } from '../modules/cart/useCart'
import { useAuth } from '../modules/auth/useAuth'
import { useCheckout } from '../composables/useCheckout'
import { useSavedAddresses, type SavedAddress } from '../composables/useSavedAddresses'

const router = useRouter()
const { items, subtotal, savings } = useCart()
const { currentUser, isGuest } = useAuth()
const { address } = useCheckout()
const { savedAddresses, load: loadAddresses, addAddress } = useSavedAddresses()

const total = () => +(subtotal.value).toFixed(2)
const saveAddressChecked = ref(false)
const loading = ref(true)
const errors = reactive<Record<string, string>>({})

// 'saved' = using a selected saved address, 'new' = entering manually
const addressMode = ref<'saved' | 'new'>('new')
const selectedAddressId = ref<string | null>(null)

onMounted(async () => {
  if (items.value.length === 0) { router.replace('/cart'); return }

  if (!isGuest.value && currentUser.value) {
    await loadAddresses(currentUser.value.user_id)
    if (savedAddresses.value.length > 0) {
      const def = savedAddresses.value.find(a => a.isDefault) ?? savedAddresses.value[0]
      selectSavedAddress(def)
      addressMode.value = 'saved'
    }
  }
  loading.value = false
})

function selectSavedAddress(addr: SavedAddress) {
  selectedAddressId.value = addr.id
  address.fullName = addr.fullName
  address.line1    = addr.line1
  address.line2    = addr.line2
  address.city     = addr.city
  address.state    = addr.state
  address.zip      = addr.zip
  address.country  = addr.country
  addressMode.value = 'saved'
}

function switchToNewAddress() {
  selectedAddressId.value = null
  address.fullName = ''
  address.line1    = ''
  address.line2    = ''
  address.city     = ''
  address.state    = ''
  address.zip      = ''
  address.country  = 'United States'
  addressMode.value = 'new'
}

function validate(): boolean {
  const required: (keyof typeof address)[] = ['fullName', 'line1', 'city', 'state', 'zip', 'country']
  let ok = true
  for (const key of required) {
    if (!address[key].trim()) { errors[key] = 'Required'; ok = false }
    else delete errors[key]
  }
  return ok
}

async function continueToPayment() {
  if (!validate()) return

  if (!isGuest.value && currentUser.value && addressMode.value === 'new' && saveAddressChecked.value) {
    try {
      await addAddress(currentUser.value.user_id, {
        label: 'Home',
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        isDefault: savedAddresses.value.length === 0,
      })
    } catch { /* silent */ }
  }

  router.push('/checkout/payment')
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-10">
    <div class="max-w-5xl mx-auto">
      <RouterLink
        to="/cart"
        class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 mb-6"
      >
        <SfIconChevronLeft size="sm" />
        Back to cart
      </RouterLink>

      <h1 class="text-2xl font-bold text-neutral-900 mb-8">
        Checkout
      </h1>

      <!-- Loading skeleton -->
      <div
        v-if="loading"
        class="flex justify-center py-20"
      >
        <SfLoaderCircular size="lg" />
      </div>

      <div
        v-else
        class="flex flex-col lg:flex-row gap-6 items-start"
      >
        <!-- LEFT — DELIVERY ADDRESS -->
        <div class="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-neutral-800 mb-5">
            Delivery Address
          </h2>

          <!-- ── Saved address picker (registered users with saved addresses) ── -->
          <div
            v-if="!isGuest && savedAddresses.length > 0"
            class="mb-5"
          >
            <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Choose a saved address
            </p>
            <div class="space-y-2">
              <label
                v-for="addr in savedAddresses"
                :key="addr.id"
                class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                :class="selectedAddressId === addr.id && addressMode === 'saved'
                  ? 'border-primary-700 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'"
              >
                <input
                  type="radio"
                  :value="addr.id"
                  :checked="selectedAddressId === addr.id && addressMode === 'saved'"
                  class="mt-0.5 accent-primary-700 shrink-0"
                  @change="selectSavedAddress(addr)"
                >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-neutral-800">{{ addr.label }}</span>
                    <span
                      v-if="addr.isDefault"
                      class="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700"
                    >Default</span>
                  </div>
                  <p class="text-xs text-neutral-600 mt-0.5">{{ addr.fullName }}</p>
                  <p class="text-xs text-neutral-500">
                    {{ addr.line1 }}{{ addr.line2 ? ', ' + addr.line2 : '' }},
                    {{ addr.city }}, {{ addr.state }} {{ addr.zip }}, {{ addr.country }}
                  </p>
                </div>
              </label>

              <!-- Enter new address option -->
              <label
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                :class="addressMode === 'new'
                  ? 'border-primary-700 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'"
              >
                <input
                  type="radio"
                  :checked="addressMode === 'new'"
                  class="accent-primary-700 shrink-0"
                  @change="switchToNewAddress"
                >
                <span class="text-sm font-semibold text-neutral-700">Enter a new address</span>
              </label>
            </div>
          </div>

          <!-- ── Manual address form (always shown for guests; shown for new address mode for registered) ── -->
          <div
            v-show="isGuest || !savedAddresses.length || addressMode === 'new'"
            class="grid grid-cols-1 gap-4"
          >
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Full Name *</label>
              <SfInput
                v-model="address.fullName"
                placeholder="Jane Smith"
                :invalid="!!errors.fullName"
                class="w-full"
              />
              <p
                v-if="errors.fullName"
                class="text-xs text-red-500 mt-1"
              >
                {{ errors.fullName }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Address Line 1 *</label>
              <SfInput
                v-model="address.line1"
                placeholder="123 Main Street"
                :invalid="!!errors.line1"
                class="w-full"
              />
              <p
                v-if="errors.line1"
                class="text-xs text-red-500 mt-1"
              >
                {{ errors.line1 }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">
                Address Line 2 <span class="text-neutral-400">(optional)</span>
              </label>
              <SfInput
                v-model="address.line2"
                placeholder="Apt, suite, floor…"
                class="w-full"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">City *</label>
                <SfInput
                  v-model="address.city"
                  placeholder="New York"
                  :invalid="!!errors.city"
                  class="w-full"
                />
                <p
                  v-if="errors.city"
                  class="text-xs text-red-500 mt-1"
                >
                  {{ errors.city }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">State / Province *</label>
                <SfInput
                  v-model="address.state"
                  placeholder="NY"
                  :invalid="!!errors.state"
                  class="w-full"
                />
                <p
                  v-if="errors.state"
                  class="text-xs text-red-500 mt-1"
                >
                  {{ errors.state }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">ZIP / Postal Code *</label>
                <SfInput
                  v-model="address.zip"
                  placeholder="10001"
                  :invalid="!!errors.zip"
                  class="w-full"
                />
                <p
                  v-if="errors.zip"
                  class="text-xs text-red-500 mt-1"
                >
                  {{ errors.zip }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">Country *</label>
                <SfInput
                  v-model="address.country"
                  placeholder="United States"
                  :invalid="!!errors.country"
                  class="w-full"
                />
                <p
                  v-if="errors.country"
                  class="text-xs text-red-500 mt-1"
                >
                  {{ errors.country }}
                </p>
              </div>
            </div>

            <!-- Save address toggle (registered users entering new address only) -->
            <label
              v-if="!isGuest && addressMode === 'new'"
              class="flex items-center gap-2 cursor-pointer mt-1"
            >
              <input
                v-model="saveAddressChecked"
                type="checkbox"
                class="w-4 h-4 rounded accent-primary-700"
              >
              <span class="text-sm text-neutral-600">Save address for future orders</span>
            </label>
          </div>

          <!-- Selected address summary (when using a saved address) -->
          <div
            v-if="!isGuest && savedAddresses.length > 0 && addressMode === 'saved' && selectedAddressId"
            class="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-700"
          >
            <p class="font-medium">
              {{ address.fullName }}
            </p>
            <p class="text-xs text-neutral-500 mt-0.5">
              {{ address.line1 }}{{ address.line2 ? ', ' + address.line2 : '' }},
              {{ address.city }}, {{ address.state }} {{ address.zip }}, {{ address.country }}
            </p>
          </div>

          <SfButton
            class="w-full mt-6"
            size="lg"
            @click="continueToPayment"
          >
            Continue to Payment
          </SfButton>
        </div>

        <!-- RIGHT — ORDER SUMMARY -->
        <div class="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
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
              <span>${{ total() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
