<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { SfButton, SfInput, SfLoaderCircular } from '@storefront-ui/vue'
import { useAuth } from '../modules/auth/useAuth'

const router = useRouter()
const { resetPassword } = useAuth()

const email    = ref('')
const loading  = ref(false)
const errorMsg = ref('')
const sent     = ref(false)

// Resend cooldown — 60 seconds after first send
const cooldown    = ref(0)
let   cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown() {
  cooldown.value = 60
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

async function handleSubmit() {
  if (!email.value.trim()) { errorMsg.value = 'Please enter your email address.'; return }
  loading.value  = true
  errorMsg.value = ''
  const result = await resetPassword(email.value.trim())
  loading.value = false
  if (result.success) {
    sent.value = true
    startCooldown()
  } else {
    errorMsg.value = result.error ?? 'Something went wrong.'
  }
}

async function handleResend() {
  if (cooldown.value > 0) return
  loading.value  = true
  errorMsg.value = ''
  const result = await resetPassword(email.value.trim())
  loading.value = false
  if (result.success) {
    startCooldown()
  } else {
    errorMsg.value = result.error ?? 'Failed to resend. Please try again.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
      <!-- Success state -->
      <div
        v-if="sent"
        class="text-center"
      >
        <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg
            class="w-7 h-7 text-green-600"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-neutral-900 mb-2">
          Check your inbox
        </h1>
        <p class="text-sm text-neutral-500 mb-3">
          We sent a password reset link to
          <span class="font-semibold text-neutral-700">{{ email }}</span>.
          Follow the link to reset your password.
        </p>

        <!-- Spam note -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left mb-5">
          <p class="text-xs font-semibold text-amber-700 mb-1">
            Don't see it?
          </p>
          <ul class="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
            <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>The email may take a few minutes to arrive</li>
          </ul>
        </div>

        <p
          v-if="errorMsg"
          class="text-sm text-red-500 mb-3"
        >
          {{ errorMsg }}
        </p>

        <!-- Resend button -->
        <SfButton
          variant="secondary"
          class="w-full mb-3"
          :disabled="cooldown > 0 || loading"
          @click="handleResend"
        >
          <SfLoaderCircular
            v-if="loading"
            size="sm"
            class="mr-2"
          />
          {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email' }}
        </SfButton>

        <SfButton
          class="w-full"
          @click="router.push('/login')"
        >
          Back to Login
        </SfButton>
      </div>

      <!-- Form state -->
      <template v-else>
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-neutral-900">
            Forgot password?
          </h1>
          <p class="text-sm text-neutral-500 mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">Email address</label>
            <SfInput
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full"
              required
            />
          </div>

          <p
            v-if="errorMsg"
            class="text-sm text-red-500"
          >
            {{ errorMsg }}
          </p>

          <SfButton
            type="submit"
            class="w-full"
            size="lg"
            :disabled="loading"
          >
            <SfLoaderCircular
              v-if="loading"
              size="sm"
              class="mr-2"
            />
            {{ loading ? 'Sending…' : 'Send Reset Link' }}
          </SfButton>

          <SfButton
            variant="tertiary"
            class="w-full"
            @click="router.push('/login')"
          >
            Back to Login
          </SfButton>
        </form>
      </template>
    </div>
  </div>
</template>
