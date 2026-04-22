<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SfButton, SfInput, SfIconPerson, SfLoaderCircular } from '@storefront-ui/vue'
import { useAuth } from '../modules/auth/useAuth'
import { useMeta } from '../composables/useMeta'

useMeta({ title: 'Create Account', description: 'Sign up for a ShopVue account and enjoy free shipping on orders over $50.' })

const route  = useRoute()
const router = useRouter()
const { register, loginError, loginLoading } = useAuth()

const redirectTo = computed(() => {
  const r = route.query.redirect as string | undefined
  return r && r.startsWith('/') ? r : '/'
})

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  const ok = await register(email.value, password.value, username.value)
  if (ok) {
    success.value = true
    setTimeout(() => router.push(redirectTo.value), 1500)
  } else {
    error.value = loginError.value
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
    <div class="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
      <!-- Header -->
      <div class="flex flex-col items-center mb-6">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
          <SfIconPerson class="text-primary-700 text-2xl" />
        </div>
        <h1 class="text-xl font-bold text-neutral-900">
          Create your account
        </h1>
        <p class="text-sm text-neutral-500 mt-1">
          Join ShopVue and start shopping.
        </p>
      </div>

      <!-- Success state -->
      <div
        v-if="success"
        class="text-center py-4"
      >
        <p class="text-green-600 font-medium">
          Account created! Redirecting to login…
        </p>
      </div>

      <!-- Form -->
      <form
        v-else
        class="flex flex-col gap-4"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label
            class="block text-sm font-medium text-neutral-700 mb-1"
            for="username"
          >
            Username
          </label>
          <SfInput
            id="username"
            v-model="username"
            placeholder="Enter your user name"
            required
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-neutral-700 mb-1"
            for="email"
          >
            Email
          </label>
          <SfInput
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            required
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-neutral-700 mb-1"
            for="password"
          >
            Password
          </label>
          <SfInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Password"
            required
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-neutral-700 mb-1"
            for="confirm"
          >
            Confirm Password
          </label>
          <SfInput
            id="confirm"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm password"
            required
            class="w-full"
          />
        </div>

        <p
          v-if="error"
          class="text-sm text-red-600"
        >
          {{ error }}
        </p>

        <SfButton
          type="submit"
          class="w-full mt-2"
          :disabled="loginLoading"
        >
          <SfLoaderCircular
            v-if="loginLoading"
            size="sm"
            class="mr-2"
          />
          {{ loginLoading ? 'Creating account…' : 'Sign Up' }}
        </SfButton>

        <p class="text-center text-sm text-neutral-500">
          Already have an account?
          <a
            class="text-primary-700 font-medium hover:underline cursor-pointer"
            @click="router.push('/login')"
          >
            Sign in
          </a>
        </p>
      </form>
    </div>
  </div>
</template>
