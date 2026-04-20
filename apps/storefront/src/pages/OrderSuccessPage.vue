<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SfButton, SfIconCheckCircle } from '@storefront-ui/vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-md w-full max-w-md p-10 text-center">
      <SfIconCheckCircle class="text-green-500 w-16 h-16 mx-auto mb-4" />

      <h1 class="text-2xl font-bold text-neutral-900 mb-2">
        Payment Successful!
      </h1>
      <p class="text-neutral-500 mb-8">
        Thank you for your order. You can view your order details in the order history.
      </p>

      <div class="flex flex-col gap-3">
        <SfButton
          class="w-full"
          size="lg"
          @click="router.push('/orders')"
        >
          View Order History
        </SfButton>
        <SfButton
          variant="tertiary"
          class="w-full"
          @click="router.push('/')"
        >
          Continue Shopping
        </SfButton>
      </div>
    </div>
  </div>
</template>
