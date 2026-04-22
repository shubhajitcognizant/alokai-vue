<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  SfButton,
  SfRating,
  SfLoaderCircular,
  SfIconFavorite,
  SfIconArrowBack,
  SfIconLocalShipping,
  SfIconDelete,
  SfIconThumbUp,
} from '@storefront-ui/vue'
import {
  collection, addDoc, getDocs, query, orderBy, doc, updateDoc, increment,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useCart } from '../modules/cart/useCart'
import { useProducts } from '../modules/products/useProducts'
import { useWishlist } from '../composables/useWishlist'
import { useAuth } from '../modules/auth/useAuth'
import AddToCartButton from '../components/AddToCartButton.vue'
import { useMeta } from '../composables/useMeta'

interface ApiProduct {
  id: string
  name: string
  description: string
  priceCents: number
  image: string
  category: string
  subCategory?: string
  rating: { stars: number; count: number }
  keywords?: string[]
}

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  body: string
  createdAt: string
  helpful: number
}

const route  = useRoute()
const router = useRouter()
const { items: cartItems, removeItem, addItem } = useCart()
const { currentUser, isLoggedIn } = useAuth()
const { isWishlisted, toggle: toggleWishlist } = useWishlist()
const { products, loadProducts } = useProducts()

const loading    = ref(true)
const error      = ref('')
const product    = ref<ApiProduct | null>(null)
const quantity   = ref(1)

// — reviews —
const reviews         = ref<Review[]>([])
const reviewsLoading  = ref(false)
const submitting      = ref(false)
const reviewError     = ref('')
const reviewSuccess   = ref(false)
const newRating       = ref(0)
const newTitle        = ref('')
const newBody         = ref('')
const hoverStar       = ref(0)

const productTitle = computed(() => product.value?.name ?? 'Product')
const productDesc  = computed(() => product.value?.description ?? 'View product details at ShopVue.')
useMeta({ title: productTitle, description: productDesc })

const isInCart = computed(() =>
  !!cartItems.value.find(i => i.product_id === Number(product.value?.id))
)

const price = computed(() => {
  if (!product.value) return 0
  return +(product.value.priceCents / 100).toFixed(2)
})

const roundedRating = computed(() => {
  if (!product.value) return 0
  return Math.round(product.value.rating.stars)
})

// Related products: same category, different id, up to 6
const relatedProducts = computed(() => {
  if (!product.value) return []
  return products.value
    .filter(p => p.category === product.value!.category && p.product_id !== Number(product.value!.id))
    .slice(0, 6)
})

// Whether the current user already submitted a review
const alreadyReviewed = computed(() =>
  !!currentUser.value && reviews.value.some(r => r.userId === currentUser.value!.user_id)
)

const avgRating = computed(() => {
  if (!reviews.value.length) return null
  return (reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length).toFixed(1)
})

function handleWishlist() {
  if (!product.value) return
  const uid = currentUser.value?.isGuest ? undefined : currentUser.value?.user_id
  toggleWishlist({
    product_id: Number(product.value.id),
    name: product.value.name,
    price: price.value,
    image: product.value.image,
    category: product.value.category,
  }, uid)
}

function incrementQty() { quantity.value++ }
function decrementQty() { if (quantity.value > 1) quantity.value-- }

async function loadReviews(productId: string) {
  reviewsLoading.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'productReviews', productId, 'reviews'), orderBy('createdAt', 'desc'))
    )
    reviews.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))
  } catch {
    /* silent */
  } finally {
    reviewsLoading.value = false
  }
}

async function submitReview() {
  if (!currentUser.value || !product.value) return
  if (newRating.value === 0) { reviewError.value = 'Please select a star rating.'; return }
  if (!newBody.value.trim())  { reviewError.value = 'Please write a review.'; return }
  reviewError.value = ''
  submitting.value  = true
  try {
    const review = {
      userId:    currentUser.value.user_id,
      userName:  currentUser.value.username || currentUser.value.email || 'Customer',
      rating:    newRating.value,
      title:     newTitle.value.trim(),
      body:      newBody.value.trim(),
      createdAt: new Date().toISOString(),
      helpful:   0,
    }
    await addDoc(collection(db, 'productReviews', product.value.id, 'reviews'), review)
    reviews.value = [{ id: Date.now().toString(), ...review }, ...reviews.value]
    reviewSuccess.value = true
    newRating.value = 0
    newTitle.value  = ''
    newBody.value   = ''
    setTimeout(() => { reviewSuccess.value = false }, 3000)
  } catch {
    reviewError.value = 'Failed to submit review. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function markHelpful(review: Review) {
  if (!product.value) return
  try {
    review.helpful++
    await updateDoc(doc(db, 'productReviews', product.value.id, 'reviews', review.id), {
      helpful: increment(1),
    })
  } catch {
    review.helpful--
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const allProducts: ApiProduct[] = await res.json()
    const found = allProducts.find(p => p.id === route.params.id)
    if (!found) { error.value = 'Product not found.'; return }
    product.value = found
    await Promise.all([
      loadReviews(found.id),
      products.value.length ? Promise.resolve() : loadProducts(),
    ])
  } catch {
    error.value = 'Failed to load product. Please try again later.'
  } finally {
    loading.value = false
  }
})

// Reload when navigating between products (related product clicks)
watch(() => route.params.id, async (newId) => {
  if (!newId) return
  loading.value = true
  error.value   = ''
  product.value = null
  quantity.value = 1
  reviews.value  = []
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const allProducts: ApiProduct[] = await res.json()
    const found = allProducts.find(p => p.id === newId)
    if (!found) { error.value = 'Product not found.'; return }
    product.value = found
    await loadReviews(found.id)
  } catch {
    error.value = 'Failed to load product. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <SfButton
      variant="tertiary"
      class="mb-6"
      @click="router.back()"
    >
      <template #prefix>
        <SfIconArrowBack size="sm" />
      </template>
      Back to products
    </SfButton>

    <div
      v-if="loading"
      class="flex justify-center py-32"
    >
      <SfLoaderCircular size="lg" />
    </div>

    <p
      v-else-if="error"
      class="text-center text-red-500 py-32 text-lg"
    >
      {{ error }}
    </p>

    <template v-else-if="product">
      <!-- ── PRODUCT DETAIL ─────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <!-- Image -->
        <div>
          <div class="relative bg-neutral-100 rounded-2xl overflow-hidden aspect-square mb-3">
            <img
              :src="product.image"
              :alt="product.name"
              class="w-full h-full object-contain p-6"
            >
            <SfButton
              variant="tertiary"
              square
              class="absolute top-3 right-3 !bg-white shadow"
              :aria-label="isWishlisted(Number(product.id)) ? 'Remove from wishlist' : 'Add to wishlist'"
              @click="handleWishlist"
            >
              <SfIconFavorite :class="isWishlisted(Number(product.id)) ? 'text-red-500' : 'text-neutral-400'" />
            </SfButton>
          </div>
          <div class="flex gap-2">
            <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary-700">
              <img
                :src="product.image"
                :alt="product.name"
                class="w-full h-full object-cover"
              >
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2 text-sm text-neutral-500">
            <span>{{ product.category }}</span>
            <template v-if="product.subCategory">
              <span>·</span>
              <span>{{ product.subCategory }}</span>
            </template>
          </div>

          <h1 class="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">
            {{ product.name }}
          </h1>

          <div class="flex items-center gap-2">
            <SfRating
              :value="roundedRating"
              :max="5"
              size="sm"
            />
            <span class="text-sm font-medium text-neutral-700">{{ product.rating.stars.toFixed(1) }}</span>
            <span class="text-sm text-neutral-500">({{ product.rating.count }} review{{ product.rating.count !== 1 ? 's' : '' }})</span>
            <template v-if="reviews.length > 0">
              <span class="text-neutral-300">·</span>
              <span class="text-sm text-primary-700 font-medium">{{ reviews.length }} customer review{{ reviews.length !== 1 ? 's' : '' }}</span>
            </template>
          </div>

          <div class="bg-neutral-50 rounded-xl p-4">
            <span class="text-3xl font-bold text-neutral-900">${{ price.toFixed(2) }}</span>
          </div>

          <div>
            <h2 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-1">
              Description
            </h2>
            <p class="text-neutral-600 leading-relaxed text-sm">
              {{ product.description }}
            </p>
          </div>

          <div
            v-if="product.keywords?.length"
            class="flex flex-wrap gap-2"
          >
            <span
              v-for="kw in product.keywords"
              :key="kw"
              class="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full"
            >
              {{ kw }}
            </span>
          </div>

          <div class="flex items-center gap-3 mt-2">
            <div
              v-if="!isInCart"
              class="flex items-center border border-neutral-300 rounded-lg overflow-hidden"
            >
              <button
                class="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40"
                :disabled="quantity <= 1"
                @click="decrementQty"
              >
                −
              </button>
              <span class="w-10 text-center font-medium text-neutral-900">{{ quantity }}</span>
              <button
                class="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                @click="incrementQty"
              >
                +
              </button>
            </div>

            <SfButton
              v-else
              variant="tertiary"
              size="lg"
              class="!border !border-red-300 !text-red-500 hover:!bg-red-50"
              @click="removeItem(Number(product?.id))"
            >
              <template #prefix>
                <SfIconDelete />
              </template>
            </SfButton>

            <AddToCartButton
              :product="{
                product_id: Number(product?.id),
                name: product?.name ?? '',
                price: price,
                originalPrice: null,
                image: product?.image ?? ''
              }"
              :quantity="quantity"
              size="lg"
            />
          </div>

          <p class="text-xs text-neutral-500 flex items-center gap-1">
            <SfIconLocalShipping />
            Free shipping on orders over $50
          </p>
        </div>
      </div>

      <!-- ── RELATED PRODUCTS ───────────────────── -->
      <section
        v-if="relatedProducts.length"
        class="mt-14"
      >
        <h2 class="text-xl font-bold text-neutral-900 mb-5">
          Related Products
        </h2>
        <div class="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neutral-300">
          <RouterLink
            v-for="p in relatedProducts"
            :key="p.product_id"
            :to="`/product/${p.product_id}`"
            class="snap-start shrink-0 w-44 sm:w-52 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
          >
            <div class="bg-neutral-100 h-40 overflow-hidden">
              <img
                :src="p.image"
                :alt="p.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                @error="($event.target as HTMLImageElement).src = `https://placehold.co/208x160?text=${encodeURIComponent(p.name.split(' ')[0])}`"
              >
            </div>
            <div class="p-3 flex flex-col flex-1">
              <p class="text-xs text-neutral-400 mb-0.5">
                {{ p.category }}
              </p>
              <p class="text-sm font-medium text-neutral-800 line-clamp-2 flex-1 group-hover:text-primary-700 transition-colors">
                {{ p.name }}
              </p>
              <div class="flex items-center gap-1 mt-1 mb-2">
                <span class="text-xs text-amber-400">★</span>
                <span class="text-xs text-neutral-500">{{ p.rating.toFixed(1) }}</span>
              </div>
              <div class="flex items-center justify-between mt-auto">
                <span class="font-bold text-neutral-900 text-sm">${{ p.price.toFixed(2) }}</span>
                <SfButton
                  size="sm"
                  @click.prevent="addItem({ product_id: p.product_id, name: p.name, price: p.price, originalPrice: null, image: p.image })"
                >
                  Add
                </SfButton>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- ── REVIEWS ────────────────────────────── -->
      <section class="mt-14">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 class="text-xl font-bold text-neutral-900">
              Customer Reviews
            </h2>
            <div
              v-if="avgRating"
              class="flex items-center gap-2 mt-1"
            >
              <SfRating
                :value="Math.round(Number(avgRating))"
                :max="5"
                size="sm"
              />
              <span class="text-sm font-semibold text-neutral-700">{{ avgRating }} / 5</span>
              <span class="text-sm text-neutral-400">({{ reviews.length }} review{{ reviews.length !== 1 ? 's' : '' }})</span>
            </div>
          </div>
        </div>

        <!-- Review list -->
        <div
          v-if="reviewsLoading"
          class="flex justify-center py-10"
        >
          <SfLoaderCircular />
        </div>

        <div
          v-else-if="reviews.length === 0"
          class="bg-white rounded-2xl border border-neutral-200 shadow-sm py-10 text-center text-neutral-400 mb-6"
        >
          <p class="text-base font-medium">
            No reviews yet
          </p>
          <p class="text-sm mt-1">
            Be the first to review this product!
          </p>
        </div>

        <div
          v-else
          class="space-y-4 mb-8"
        >
          <div
            v-for="review in reviews"
            :key="review.id"
            class="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {{ review.userName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-sm font-semibold text-neutral-800">{{ review.userName }}</span>
                </div>
              </div>
              <span class="text-xs text-neutral-400 shrink-0">{{ formatDate(review.createdAt) }}</span>
            </div>

            <div class="flex items-center gap-1.5 mb-2 ml-10">
              <span
                v-for="star in 5"
                :key="star"
                class="text-base"
                :class="star <= review.rating ? 'text-amber-400' : 'text-neutral-200'"
              >★</span>
            </div>

            <p
              v-if="review.title"
              class="text-sm font-semibold text-neutral-800 mb-1 ml-10"
            >
              {{ review.title }}
            </p>
            <p class="text-sm text-neutral-600 leading-relaxed ml-10">
              {{ review.body }}
            </p>

            <div class="flex items-center gap-1 mt-3 ml-10">
              <button
                class="flex items-center gap-1 text-xs text-neutral-400 hover:text-primary-700 transition-colors"
                @click="markHelpful(review)"
              >
                <SfIconThumbUp class="w-3.5 h-3.5" />
                Helpful ({{ review.helpful }})
              </button>
            </div>
          </div>
        </div>

        <!-- Write a review -->
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h3 class="text-base font-semibold text-neutral-800 mb-4">
            Write a Review
          </h3>

          <!-- Not logged in -->
          <div
            v-if="!isLoggedIn"
            class="text-center py-6"
          >
            <p class="text-sm text-neutral-500 mb-3">
              You must be logged in to write a review.
            </p>
            <SfButton
              variant="secondary"
              size="sm"
              @click="router.push('/login')"
            >
              Log in to review
            </SfButton>
          </div>

          <!-- Already reviewed -->
          <div
            v-else-if="alreadyReviewed"
            class="text-center py-6"
          >
            <p class="text-sm text-neutral-500">
              You've already submitted a review for this product. Thank you!
            </p>
          </div>

          <!-- Review form -->
          <form
            v-else
            class="space-y-4"
            @submit.prevent="submitReview"
          >
            <!-- Star selector -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1.5">Your Rating *</label>
              <div class="flex gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  class="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
                  :class="star <= (hoverStar || newRating) ? 'text-amber-400' : 'text-neutral-300'"
                  @mouseenter="hoverStar = star"
                  @mouseleave="hoverStar = 0"
                  @click="newRating = star"
                >
                  ★
                </button>
                <span
                  v-if="newRating"
                  class="text-sm text-neutral-500 ml-2 self-center"
                >
                  {{ ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][newRating] }}
                </span>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Review Title</label>
              <input
                v-model="newTitle"
                type="text"
                placeholder="Summarize your experience"
                maxlength="100"
                class="w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 bg-white"
              >
            </div>

            <!-- Body -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Review *</label>
              <textarea
                v-model="newBody"
                rows="4"
                placeholder="Share your experience with this product…"
                maxlength="1000"
                class="w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 bg-white resize-none"
              />
              <p class="text-xs text-neutral-400 text-right mt-0.5">
                {{ newBody.length }}/1000
              </p>
            </div>

            <p
              v-if="reviewError"
              class="text-sm text-red-500"
            >
              {{ reviewError }}
            </p>
            <p
              v-if="reviewSuccess"
              class="text-sm text-green-600 font-medium"
            >
              ✓ Review submitted! Thank you.
            </p>

            <SfButton
              type="submit"
              :disabled="submitting"
              class="w-full sm:w-auto"
            >
              {{ submitting ? 'Submitting…' : 'Submit Review' }}
            </SfButton>
          </form>
        </div>
      </section>
    </template>
  </main>

  <footer class="bg-neutral-800 text-neutral-300 mt-16">
    <div class="border-t border-neutral-700 text-center py-4 text-xs text-neutral-500">
      © 2026 ShopVue. All rights reserved.
    </div>
  </footer>
</template>
