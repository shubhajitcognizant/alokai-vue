<script setup lang="ts">
import { SfButton, SfIconShoppingCart, SfIconCheckCircle } from '@storefront-ui/vue'
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

const { addItem, items: cartItems } = useCart()
const { showToast } = useToast()

const isInCart = () => !!cartItems.value.find(i => i.product_id === props.product.product_id)

function handleClick() {
  if (isInCart()) return
  const qty = props.quantity ?? 1
  for (let i = 0; i < qty; i++) {
    addItem({
      product_id: props.product.product_id,
      name: props.product.name,
      price: props.product.price,
      originalPrice: props.product.originalPrice,
      image: props.product.image,
    })
  }
  showToast(`Added to cart — ${props.product.name}`, props.product.image)
}
</script>

<template>
  <SfButton
    :size="size ?? 'sm'"
    class="w-full"
    :variant="isInCart() ? 'secondary' : 'primary'"
    :disabled="isInCart()"
    @click="handleClick"
  >
    <template #prefix>
      <SfIconCheckCircle
        v-if="isInCart()"
        :size="size ?? 'sm'"
      />
      <SfIconShoppingCart
        v-else
        :size="size ?? 'sm'"
      />
    </template>
    {{ isInCart() ? 'Added to cart' : 'Add to cart' }}
  </SfButton>
</template>
