<script setup lang="ts">
import ToastNotification from './components/ToastNotification.vue'
import CartDrawer from './components/CartDrawer.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <CartDrawer />
  <AppHeader />
  <RouterView />
  <AppFooter />
  <ToastNotification />
</template>
