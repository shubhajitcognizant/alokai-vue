<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SfButton } from '@storefront-ui/vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 text-center">
    <div class="mb-6 select-none">
      <span class="text-8xl font-black text-primary-100 leading-none">404</span>
    </div>

    <h1 class="text-2xl font-bold text-neutral-900 mb-2">
      Page not found
    </h1>
    <p class="text-sm text-neutral-500 max-w-xs mb-8">
      The page you're looking for doesn't exist or has been moved.
    </p>

    <div class="flex flex-col sm:flex-row gap-3">
      <SfButton
        size="lg"
        @click="router.push('/')"
      >
        Go to Homepage
      </SfButton>
      <SfButton
        variant="secondary"
        size="lg"
        @click="router.push('/plp')"
      >
        Browse Products
      </SfButton>
      <SfButton
        variant="tertiary"
        size="lg"
        @click="router.back()"
      >
        Go Back
      </SfButton>
    </div>

    <div class="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-neutral-400">
      <button
        class="hover:text-primary-700 transition-colors"
        @click="router.push('/login')"
      >
        Login
      </button>
      <button
        class="hover:text-primary-700 transition-colors"
        @click="router.push('/cart')"
      >
        Cart
      </button>
      <button
        class="hover:text-primary-700 transition-colors"
        @click="router.push('/orders')"
      >
        Orders
      </button>
      <button
        class="hover:text-primary-700 transition-colors"
        @click="router.push('/account')"
      >
        Account
      </button>
    </div>
  </div>
</template>
