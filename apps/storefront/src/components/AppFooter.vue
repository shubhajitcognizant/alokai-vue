<script setup lang="ts">
import { ref } from 'vue'
import { SfButton } from '@storefront-ui/vue'

const newsletterEmail = ref('')

const shopLinks = [
  { label: 'New Arrivals', href: '#' },
  { label: 'Best Sellers', href: '#' },
  { label: 'Sale', href: '#' },
  { label: 'All Products', href: '#' },
]

const supportLinks = [
  { label: 'FAQ', href: '#' },
  { label: 'Shipping Policy', href: '#' },
  { label: 'Returns & Exchanges', href: '#' },
  { label: 'Track Order', href: '#' },
]

const companyLinks = [
  { label: 'About Us', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Blog', href: '#' },
]

function handleNewsletter() {
  if (newsletterEmail.value) {
    newsletterEmail.value = ''
  }
}
</script>

<template>
  <footer class="bg-neutral-800 text-neutral-300">
    <!-- Newsletter section -->
    <div class="border-b border-neutral-700">
      <div class="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p class="text-white text-lg font-semibold">
            Stay in the loop
          </p>
          <p class="text-sm mt-1">
            Get the latest deals and new arrivals straight to your inbox.
          </p>
        </div>
        <div class="flex gap-2 w-full md:w-auto md:min-w-[520px]">
          <span class="flex items-center gap-2 px-4 bg-white rounded-xl text-neutral-500 hover:ring-primary-700 focus-within:caret-primary-700 active:caret-primary-700 active:ring-primary-700 active:ring-2 focus-within:ring-primary-700 focus-within:ring-2 ring-inset ring-1 ring-neutral-300 focus-within:outline focus-within:outline-offset h-[40px] flex-1">
            <input
              v-model="newsletterEmail"
              class="min-w-[80px] w-full text-base outline-hidden appearance-none text-neutral-900 disabled:cursor-not-allowed disabled:bg-transparent read-only:bg-transparent flex-1"
              size="1"
              type="email"
              placeholder="Enter your email"
            >
          </span>
          <SfButton
            class="shrink-0"
            @click="handleNewsletter"
          >
            Subscribe
          </SfButton>
        </div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <!-- Brand column -->
      <div class="col-span-2 md:col-span-1">
        <p class="text-white text-xl font-bold mb-3">
          ShopVue
        </p>
        <p class="text-sm leading-relaxed mb-6">
          Your one-stop shop for everything you need, delivered fast and hassle-free.
        </p>
        <!-- Social icons -->
        <div class="flex items-center gap-3">
          <a
            href="#"
            aria-label="Facebook"
            class="w-9 h-9 rounded-full bg-neutral-700 hover:bg-primary-700 flex items-center justify-center transition-colors"
          >
            <svg
              class="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="Instagram"
            class="w-9 h-9 rounded-full bg-neutral-700 hover:bg-primary-700 flex items-center justify-center transition-colors"
          >
            <svg
              class="w-4 h-4 stroke-current fill-none"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                ry="5"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
              />
              <circle
                cx="17.5"
                cy="6.5"
                r="0.5"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            href="#"
            aria-label="Twitter / X"
            class="w-9 h-9 rounded-full bg-neutral-700 hover:bg-primary-700 flex items-center justify-center transition-colors"
          >
            <svg
              class="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Shop links -->
      <div>
        <p class="text-white font-semibold mb-4">
          Shop
        </p>
        <ul class="space-y-2.5 text-sm">
          <li
            v-for="link in shopLinks"
            :key="link.label"
          >
            <a
              :href="link.href"
              class="hover:text-white transition-colors"
            >{{ link.label }}</a>
          </li>
        </ul>
      </div>

      <!-- Support links -->
      <div>
        <p class="text-white font-semibold mb-4">
          Support
        </p>
        <ul class="space-y-2.5 text-sm">
          <li
            v-for="link in supportLinks"
            :key="link.label"
          >
            <a
              :href="link.href"
              class="hover:text-white transition-colors"
            >{{ link.label }}</a>
          </li>
        </ul>
      </div>

      <!-- Company links + contact -->
      <div>
        <p class="text-white font-semibold mb-4">
          Company
        </p>
        <ul class="space-y-2.5 text-sm">
          <li
            v-for="link in companyLinks"
            :key="link.label"
          >
            <a
              :href="link.href"
              class="hover:text-white transition-colors"
            >{{ link.label }}</a>
          </li>
        </ul>
        <div class="mt-6 space-y-1.5 text-sm text-neutral-400">
          <p>support@shopvue.com</p>
          <p>1-800-SHOPVUE</p>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-neutral-700">
      <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <p>© 2026 ShopVue. All rights reserved.</p>
        <div class="flex items-center gap-4">
          <a
            href="#"
            class="hover:text-neutral-300 transition-colors"
          >Privacy Policy</a>
          <a
            href="#"
            class="hover:text-neutral-300 transition-colors"
          >Terms of Service</a>
          <a
            href="#"
            class="hover:text-neutral-300 transition-colors"
          >Cookie Policy</a>
        </div>
        <div class="flex items-center gap-3">
          <!-- Visa -->
          <div class="bg-white rounded-xl px-4 py-2 flex items-center justify-center h-10 min-w-[64px]">
            <span
              class="font-extrabold text-lg tracking-tight"
              style="color:#1A1F71;font-family:Arial,sans-serif"
            >VISA</span>
          </div>
          <!-- Mastercard -->
          <div class="bg-white rounded-xl px-3 py-2 flex items-center justify-center h-10">
            <svg
              width="40"
              height="26"
              viewBox="0 0 40 26"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="13"
                cy="13"
                r="13"
                fill="#EB001B"
              />
              <circle
                cx="27"
                cy="13"
                r="13"
                fill="#F79E1B"
              />
              <path
                d="M20 4.26a13 13 0 0 1 0 17.48A13 13 0 0 1 20 4.26z"
                fill="#FF5F00"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
