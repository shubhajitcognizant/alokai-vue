<script setup lang="ts">
import { useAuth } from '../modules/auth/useAuth'
import { SfIconPerson } from '@storefront-ui/vue'

const { currentUser } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-12">
    <div class="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
      <div class="flex items-center gap-2 mb-6">
        <SfIconPerson class="text-primary-700" />
        <h1 class="text-xl font-bold text-neutral-800">
          User Details
        </h1>
      </div>
      <div class="space-y-4">
        <div class="border border-neutral-200 rounded-xl p-4">
          <p class="text-xs text-neutral-400 mb-1">
            Username
          </p>
          <p class="font-medium text-neutral-800">
            {{ currentUser?.username }}
          </p>
        </div>
        <div class="border border-neutral-200 rounded-xl p-4">
          <p class="text-xs text-neutral-400 mb-1">
            Email
          </p>
          <p class="font-medium text-neutral-800">
            {{ currentUser?.email }}
          </p>
        </div>
        <div class="border border-neutral-200 rounded-xl p-4">
          <p class="text-xs text-neutral-400 mb-1">
            User ID
          </p>
          <p class="font-medium text-neutral-800">
            {{ currentUser?.user_id }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
