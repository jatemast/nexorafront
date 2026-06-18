<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const submitted = ref(false)
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
    if (!password.value) {
      errs.password = 'Password is required.'
    } else if (password.value.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }
  }
  return errs
})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)
const serverError = computed(() => authStore.error)

// ---------------------------------------------------------------------------
// Submit Handler
// ---------------------------------------------------------------------------
async function handleLogin() {
  submitted.value = true

  if (hasErrors.value) return

  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
    })

    if (rememberMe.value) {
      localStorage.setItem('nexora-remember-email', email.value)
    } else {
      localStorage.removeItem('nexora-remember-email')
    }

    toast.add({
      severity: 'success',
      summary: 'Welcome back!',
      detail: 'You have successfully logged in.',
      life: 3000,
    })

    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Login failed. Please check your credentials and try again.'

    toast.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: message,
      life: 6000,
    })
  }
}

// ---------------------------------------------------------------------------
// Load remembered email on mount
// ---------------------------------------------------------------------------
const rememberedEmail = localStorage.getItem('nexora-remember-email')
if (rememberedEmail) {
  email.value = rememberedEmail
  rememberMe.value = true
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
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Welcome back
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Sign in to your Nexora account to continue
        </p>
      </div>

      <!-- Card -->
      <div class="card p-6 sm:p-8">
        <!-- Server Error -->
        <Message
          v-if="serverError && submitted"
          severity="error"
          :closable="true"
          class="mb-4"
        >
          {{ serverError }}
        </Message>

        <!-- Form -->
        <form @submit.prevent="handleLogin" novalidate class="space-y-5">
          <!-- Email -->
          <div>
            <label
              for="login-email"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Email address
            </label>
            <InputText
              id="login-email"
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

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label
                for="login-password"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600"
              >
                Password
              </label>
              <RouterLink
                :to="{ name: 'ForgotPassword' }"
                class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </RouterLink>
            </div>
            <Password
              id="login-password"
              v-model="password"
              placeholder="Enter your password"
              :feedback="false"
              :invalid="!!errors.password"
              toggle-mask
              class="w-full"
              autocomplete="current-password"
            />
            <small
              v-if="errors.password"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ errors.password }}
            </small>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              v-model="rememberMe"
              binary
            />
            <label
              for="remember-me"
              class="text-sm text-surface-600 dark:text-surface-500 cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            :label="loading ? 'Signing in...' : 'Sign in'"
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
              Don't have an account?
            </span>
          </div>
        </div>

        <!-- Register Link -->
        <RouterLink
          :to="{ name: 'Register' }"
          class="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-300 dark:border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-100 hover:border-surface-400 dark:hover:border-surface-200 transition-all duration-200"
        >
          Create an account
          <i class="pi pi-arrow-right text-xs" />
        </RouterLink>
      </div>

      <!-- Footer -->
      <p class="text-center text-xs text-surface-400 dark:text-surface-500 mt-8">
        &copy; {{ new Date().getFullYear() }} Nexora Learning Platform. All rights reserved.
      </p>
    </div>
  </div>
</template>
