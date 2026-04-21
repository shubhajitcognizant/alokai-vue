<script setup lang="ts">
import { computed } from 'vue'
import { SfButton, SfIconShoppingCart, SfIconAdd, SfIconRemove } from '@storefront-ui/vue'
import { useCart } from '../modules/cart/useCart'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  product: {
    product_id: number
    name: string
    price: number
    originalPrice: number | null
    image: string
  }
  size?: 'sm' | 'base' | 'lg'
  quantity?: number
}>()

const { addItem, updateQty, items: cartItems } = useCart()
const { showToast } = useToast()

const cartItem = computed(() =>
  cartItems.value.find(i => i.product_id === props.product.product_id)
)

function handleAdd() {
  if (cartItem.value) {
    updateQty(props.product.product_id, cartItem.value.quantity + 1)
  } else {
    addItem({
      product_id: props.product.product_id,
      name: props.product.name,
      price: props.product.price,
      originalPrice: props.product.originalPrice,
      image: props.product.image,
    })
    showToast(`Added to cart — ${props.product.name}`, props.product.image)
  }
}

function handleRemove() {
  if (!cartItem.value) return
  updateQty(props.product.product_id, cartItem.value.quantity - 1)
}
</script>

<template>
  <!-- Counter — shown when product is in cart -->
  <div
    v-if="cartItem"
    class="flex items-center justify-between w-full border border-neutral-300 rounded-md overflow-hidden"
  >
    <SfButton
      variant="tertiary"
      :size="size ?? 'sm'"
      square
      class="!rounded-none"
      @click="handleRemove"
    >
      <SfIconRemove :size="size ?? 'sm'" />
    </SfButton>

    <span class="flex-1 text-center text-sm font-semibold text-neutral-900">
      {{ cartItem.quantity }}
    </span>

    <SfButton
      variant="tertiary"
      :size="size ?? 'sm'"
      square
      class="!rounded-none"
      @click="handleAdd"
    >
      <SfIconAdd :size="size ?? 'sm'" />
    </SfButton>
  </div>

  <!-- Add to Cart button — shown when product is not in cart -->
  <SfButton
    v-else
    :size="size ?? 'sm'"
    class="w-full"
    @click="handleAdd"
  >
    <template #prefix>
      <SfIconShoppingCart :size="size ?? 'sm'" />
    </template>
    Add to cart
  </SfButton>
</template>
