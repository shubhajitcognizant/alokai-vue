<script setup lang="ts">
import { useAuth } from '../modules/auth/useAuth'
import { SfButton } from '@storefront-ui/vue'
import { useRouter } from 'vue-router'

const { currentUser, logout } = useAuth()
const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <div class="bg-neutral-50 px-4 py-10">
    <div class="max-w-2xl mx-auto space-y-5">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-neutral-400">
        <a
          href="/"
          class="hover:text-primary-700 transition-colors"
        >Home</a>
        <span>›</span>
        <span class="text-neutral-700 font-medium">My Profile</span>
      </nav>

      <!-- Profile hero card -->
      <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <!-- Cover strip -->
        <div class="h-24 bg-gradient-to-r from-primary-700 to-primary-500" />

        <!-- Avatar + name -->
        <div class="px-6 pb-6">
          <div class="flex items-end justify-between -mt-10 mb-4">
            <div class="w-20 h-20 rounded-2xl bg-primary-700 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold select-none">
              {{ getInitials(currentUser?.username) }}
            </div>
            <SfButton
              variant="secondary"
              size="sm"
              @click="handleLogout"
            >
              Logout
            </SfButton>
          </div>
          <h1 class="text-xl font-bold text-neutral-900">
            {{ currentUser?.username }}
          </h1>
          <p class="text-sm text-neutral-400 mt-0.5">
            {{ currentUser?.email }}
          </p>
        </div>
      </div>

      <!-- Account details card -->
      <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div class="px-6 py-4 border-b border-neutral-100">
          <h2 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Account Details
          </h2>
        </div>
        <div class="divide-y divide-neutral-100">
          <div class="flex items-center justify-between px-6 py-4">
            <div>
              <p class="text-xs text-neutral-400 mb-0.5">
                Username
              </p>
              <p class="text-sm font-medium text-neutral-800">
                {{ currentUser?.username }}
              </p>
            </div>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <div>
              <p class="text-xs text-neutral-400 mb-0.5">
                Email address
              </p>
              <p class="text-sm font-medium text-neutral-800">
                {{ currentUser?.email }}
              </p>
            </div>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <div>
              <p class="text-xs text-neutral-400 mb-0.5">
                Account type
              </p>
              <p class="text-sm font-medium text-neutral-800 capitalize">
                {{ currentUser?.isGuest ? 'Guest' : 'Registered' }}
              </p>
            </div>
            <span
              class="text-xs font-semibold px-2.5 py-1 rounded-full"
              :class="currentUser?.isGuest ? 'bg-neutral-100 text-neutral-500' : 'bg-green-100 text-green-700'"
            >
              {{ currentUser?.isGuest ? 'Guest' : 'Active' }}
            </span>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <div>
              <p class="text-xs text-neutral-400 mb-0.5">
                User ID
              </p>
              <p class="text-sm font-mono text-neutral-500">
                {{ currentUser?.user_id }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick links card -->
      <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div class="px-6 py-4 border-b border-neutral-100">
          <h2 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Quick Actions
          </h2>
        </div>
        <div class="divide-y divide-neutral-100">
          <button
            class="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors text-left"
            @click="router.push('/orders')"
          >
            <span class="text-sm font-medium text-neutral-800">Order History</span>
            <span class="text-neutral-400 text-lg">›</span>
          </button>
          <button
            class="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors text-left"
            @click="router.push('/')"
          >
            <span class="text-sm font-medium text-neutral-800">Continue Shopping</span>
            <span class="text-neutral-400 text-lg">›</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
