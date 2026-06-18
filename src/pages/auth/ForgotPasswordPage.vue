<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const authStore = useAuthStore()
const toast = useToast()

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
const email = ref('')
const submitted = ref(false)
const success = ref(false)
const loading = computed(() => authStore.loading)

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const errors = computed(() => {
  const errs = {}
  if (submitted.value) {
    if (!email.value.trim()) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errs.email = 'Please enter a valid email address.'
    }
  }
  return errs
})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)
const serverError = computed(() => authStore.error)

// ---------------------------------------------------------------------------
// Submit Handler
// ---------------------------------------------------------------------------
async function handleSendResetLink() {
  submitted.value = true

  if (hasErrors.value) return

  try {
    const data = await authStore.forgotPassword(email.value.trim())

    success.value = true

    toast.add({
      severity: 'success',
      summary: 'Reset link sent!',
      detail:
        data?.message ||
        'If an account with that email exists, a password reset link has been sent.',
      life: 6000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Failed to send reset link. Please try again.'

    toast.add({
      severity: 'error',
      summary: 'Request Failed',
      detail: message,
      life: 6000,
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white mb-4">
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Forgot your password?
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <!-- Card -->
      <div class="card p-6 sm:p-8">
        <!-- Success State -->
        <div v-if="success" class="text-center">
          <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30 mb-4">
            <i class="pi pi-check-circle text-3xl text-success-600 dark:text-success-400" />
          </div>
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-950 mb-2">
            Check your email
          </h2>
          <p class="text-sm text-surface-500 dark:text-surface-500 mb-6">
            If an account exists for
            <strong class="text-surface-700 dark:text-surface-600">{{ email }}</strong>,
            you will receive a password reset link shortly.
          </p>
          <Button
            label="Send again"
            severity="secondary"
            class="w-full mb-3"
            @click="success = false"
          />
          <RouterLink
            :to="{ name: 'Login' }"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-300 dark:border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-100 hover:border-surface-400 dark:hover:border-surface-200 transition-all duration-200"
          >
            <i class="pi pi-arrow-left text-xs" />
            Back to sign in
          </RouterLink>
        </div>

        <!-- Form State -->
        <template v-else>
          <!-- Server Error -->
          <Message
            v-if="serverError && submitted"
            severity="error"
            :closable="true"
            class="mb-4"
          >
            {{ serverError }}
          </Message>

          <form @submit.prevent="handleSendResetLink" novalidate class="space-y-5">
            <!-- Email -->
            <div>
              <label
                for="forgot-email"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Email address
              </label>
              <InputText
                id="forgot-email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                :invalid="!!errors.email"
                class="w-full"
                autocomplete="email"
              />
              <small
                v-if="errors.email"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.email }}
              </small>
            </div>

            <!-- Submit -->
            <Button
              type="submit"
              :label="loading ? 'Sending reset link...' : 'Send reset link'"
              :loading="loading"
              :disabled="loading"
              class="w-full"
              severity="primary"
              size="large"
            />
          </form>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-surface-200 dark:border-surface-200" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-surface-0 dark:bg-surface-50 px-3 text-surface-400 dark:text-surface-500">
                Remember your password?
              </span>
            </div>
          </div>

          <!-- Login Link -->
          <RouterLink
            :to="{ name: 'Login' }"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-300 dark:border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-100 hover:border-surface-400 dark:hover:border-surface-200 transition-all duration-200"
          >
            <i class="pi pi-arrow-left text-xs" />
            Back to sign in
          </RouterLink>
        </template>
      </div>

      <!-- Footer -->
      <p class="text-center text-xs text-surface-400 dark:text-surface-500 mt-8">
        &copy; {{ new Date().getFullYear() }} Nexora Learning Platform. All rights reserved.
      </p>
    </div>
  </div>
</template>
