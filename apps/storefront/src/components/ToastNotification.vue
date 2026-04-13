<script setup lang="ts">
import { useToast } from '../composables/useToast'
const { toasts } = useToast()
</script>

<template>
  <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none items-center">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center gap-3 bg-neutral-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg pointer-events-auto w-72"
      >
        <img
          v-if="toast.image"
          :src="toast.image"
          class="w-10 h-10 rounded-md object-cover shrink-0"
        >
        <span class="line-clamp-2">{{ toast.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
