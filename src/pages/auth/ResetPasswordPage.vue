<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Password from 'primevue/password'
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
const token = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const submitted = ref(false)
const loading = computed(() => authStore.loading)
const tokenMissing = ref(false)

// ---------------------------------------------------------------------------
// Extract token from URL query params on mount
// ---------------------------------------------------------------------------
onMounted(() => {
  token.value = (route.query.token || '').toString().trim()

  if (!token.value) {
    tokenMissing.value = true
    toast.add({
      severity: 'error',
      summary: 'Invalid Reset Link',
      detail: 'The password reset link is missing a valid token. Please request a new one.',
      life: 7000,
    })
  }
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const errors = computed(() => {
  const errs = {}
  if (submitted.value) {
    if (!password.value) {
      errs.password = 'New password is required.'
    } else if (password.value.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value)) {
      errs.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    }

    if (!passwordConfirmation.value) {
      errs.passwordConfirmation = 'Please confirm your new password.'
    } else if (password.value !== passwordConfirmation.value) {
      errs.passwordConfirmation = 'Passwords do not match.'
    }
  }
  return errs
})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)
const serverError = computed(() => authStore.error)

// ---------------------------------------------------------------------------
// Password Strength Indicator
// ---------------------------------------------------------------------------
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { level: 0, label: '', color: '' }

  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++

  if (score <= 2)
    return { level: 1, label: 'Weak', color: 'bg-error-500' }
  if (score <= 3)
    return { level: 2, label: 'Fair', color: 'bg-warning-500' }
  if (score <= 4)
    return { level: 3, label: 'Good', color: 'bg-accent-500' }
  return { level: 4, label: 'Strong', color: 'bg-success-500' }
})

// ---------------------------------------------------------------------------
// Submit Handler
// ---------------------------------------------------------------------------
async function handleResetPassword() {
  submitted.value = true

  if (hasErrors.value) return

  if (!token.value) {
    toast.add({
      severity: 'error',
      summary: 'Missing Token',
      detail: 'No reset token found. Please request a new password reset link.',
      life: 6000,
    })
    return
  }

  try {
    const data = await authStore.resetPassword(
      token.value,
      password.value,
      passwordConfirmation.value,
    )

    toast.add({
      severity: 'success',
      summary: 'Password Reset!',
      detail:
        data?.message ||
        'Your password has been reset successfully. You can now sign in with your new password.',
      life: 5000,
    })

    // Redirect to login after a brief delay
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, 1500)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Failed to reset password. The link may have expired. Please request a new one.'

    toast.add({
      severity: 'error',
      summary: 'Reset Failed',
      detail: message,
      life: 7000,
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
          Reset your password
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Choose a strong new password for your account
        </p>
      </div>

      <!-- Card -->
      <div class="card p-6 sm:p-8">
        <!-- Token Missing Warning -->
        <Message
          v-if="tokenMissing"
          severity="warn"
          :closable="true"
          class="mb-4"
        >
          This page requires a valid reset token. Please use the link from your email or
          <RouterLink
            :to="{ name: 'ForgotPassword' }"
            class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            request a new one
          </RouterLink>.
        </Message>

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
        <form @submit.prevent="handleResetPassword" novalidate class="space-y-5">
          <!-- New Password -->
          <div>
            <label
              for="reset-password"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              New password
            </label>
            <Password
              id="reset-password"
              v-model="password"
              placeholder="Enter new password"
              :invalid="!!errors.password"
              toggle-mask
              class="w-full"
              autocomplete="new-password"
            />
            <!-- Strength Bar -->
            <div
              v-if="password"
              class="mt-2"
            >
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  :class="[
                    'h-1 flex-1 rounded-full transition-colors duration-200',
                    i <= passwordStrength.level
                      ? passwordStrength.color
                      : 'bg-surface-200 dark:bg-surface-200',
                  ]"
                />
              </div>
              <p
                v-if="passwordStrength.label"
                :class="[
                  'text-xs mt-1',
                  {
                    'text-error-500 dark:text-error-400': passwordStrength.level === 1,
                    'text-warning-500 dark:text-warning-400': passwordStrength.level === 2,
                    'text-accent-500 dark:text-accent-400': passwordStrength.level === 3,
                    'text-success-500 dark:text-success-400': passwordStrength.level === 4,
                  },
                ]"
              >
                {{ passwordStrength.label }}
              </p>
            </div>
            <small
              v-if="errors.password"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ errors.password }}
            </small>
          </div>

          <!-- Confirm New Password -->
          <div>
            <label
              for="reset-password-confirmation"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Confirm new password
            </label>
            <Password
              id="reset-password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm new password"
              :feedback="false"
              :invalid="!!errors.passwordConfirmation"
              toggle-mask
              class="w-full"
              autocomplete="new-password"
            />
            <small
              v-if="errors.passwordConfirmation"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ errors.passwordConfirmation }}
            </small>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            :label="loading ? 'Resetting password...' : 'Reset password'"
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
      </div>

      <!-- Footer -->
      <p class="text-center text-xs text-surface-400 dark:text-surface-500 mt-8">
        &copy; {{ new Date().getFullYear() }} Nexora Learning Platform. All rights reserved.
      </p>
    </div>
  </div>
</template>
