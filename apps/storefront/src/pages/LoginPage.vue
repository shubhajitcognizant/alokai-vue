<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SfButton, SfInput, SfIconPerson, SfLoaderCircular } from '@storefront-ui/vue'
import { useAuth } from '../modules/auth/useAuth'

const { loginError, loginLoading, login } = useAuth()

onMounted(() => {
  loginError.value = ''
})

const router = useRouter()

const email = ref('')
const password = ref('')

async function handleSubmit() {
  const success = await login(email.value, password.value)
  if (success) router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

      <div class="flex items-center gap-2 mb-6">
        <SfIconPerson class="text-primary-700" />
        <h1 class="text-2xl font-bold">Login</h1>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <SfInput v-model="email" type="email" placeholder="Enter your email address" class="w-full" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Password</label>
          <SfInput v-model="password" type="password" placeholder="Password" class="w-full" required />
        </div>

        <p v-if="loginError" class="text-sm text-red-500">{{ loginError }}</p>

        <SfButton type="submit" class="w-full" size="lg" :disabled="loginLoading">
          <SfLoaderCircular v-if="loginLoading" size="sm" class="mr-2" />
          {{ loginLoading ? 'Loading...' : 'Log In' }}
        </SfButton>

        <SfButton variant="tertiary" class="w-full" @click="router.push('/')">
          Back to Shop
        </SfButton>
      </form>

    </div>
  </div>
</template>
