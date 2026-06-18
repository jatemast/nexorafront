<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
const name = ref('')
const lastname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const company = ref('')
const submitted = ref(false)
const loading = computed(() => authStore.loading)

// ---------------------------------------------------------------------------
// Company Options (placeholder — would come from API)
// ---------------------------------------------------------------------------
const companyOptions = ref([
  { label: 'Acme Corp', value: 'acme-corp' },
  { label: 'Globex Inc.', value: 'globex-inc' },
  { label: 'Initech', value: 'initech' },
  { label: 'Umbrella Corp', value: 'umbrella-corp' },
])

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const errors = computed(() => {
  const errs = {}
  if (submitted.value) {
    if (!name.value.trim()) {
      errs.name = 'First name is required.'
    } else if (name.value.trim().length < 2) {
      errs.name = 'First name must be at least 2 characters.'
    }

    if (!lastname.value.trim()) {
      errs.lastname = 'Last name is required.'
    } else if (lastname.value.trim().length < 2) {
      errs.lastname = 'Last name must be at least 2 characters.'
    }

    if (!email.value.trim()) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errs.email = 'Please enter a valid email address.'
    }

    if (!password.value) {
      errs.password = 'Password is required.'
    } else if (password.value.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value)) {
      errs.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    }

    if (!passwordConfirmation.value) {
      errs.passwordConfirmation = 'Please confirm your password.'
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
async function handleRegister() {
  submitted.value = true

  if (hasErrors.value) return

  try {
    const userData = {
      name: name.value.trim(),
      lastname: lastname.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    }

    if (company.value) {
      userData.company = company.value
    }

    const data = await authStore.register(userData)

    toast.add({
      severity: 'success',
      summary: 'Account created!',
      detail: 'Your account has been created successfully.',
      life: 4000,
    })

    // Redirect based on whether a token was returned (auto-login)
    if (data.access_token || data.token) {
      router.push({ name: 'Dashboard' })
    } else {
      router.push({ name: 'Login' })
    }
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Registration failed. Please try again.'

    toast.add({
      severity: 'error',
      summary: 'Registration Failed',
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
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Create your account
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Start your learning journey with Nexora
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
        <form @submit.prevent="handleRegister" novalidate class="space-y-5">
          <!-- Name + Lastname -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="reg-name"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                First name
              </label>
              <InputText
                id="reg-name"
                v-model="name"
                placeholder="John"
                :invalid="!!errors.name"
                class="w-full"
                autocomplete="given-name"
              />
              <small
                v-if="errors.name"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.name }}
              </small>
            </div>
            <div>
              <label
                for="reg-lastname"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Last name
              </label>
              <InputText
                id="reg-lastname"
                v-model="lastname"
                placeholder="Doe"
                :invalid="!!errors.lastname"
                class="w-full"
                autocomplete="family-name"
              />
              <small
                v-if="errors.lastname"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.lastname }}
              </small>
            </div>
          </div>

          <!-- Email -->
          <div>
            <label
              for="reg-email"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Email address
            </label>
            <InputText
              id="reg-email"
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

          <!-- Company -->
          <div>
            <label
              for="reg-company"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Company <span class="text-surface-400 font-normal">(optional)</span>
            </label>
            <Select
              id="reg-company"
              v-model="company"
              :options="companyOptions"
              option-label="label"
              option-value="value"
              placeholder="Select your company"
              show-clear
              class="w-full"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              for="reg-password"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Password
            </label>
            <Password
              id="reg-password"
              v-model="password"
              placeholder="Create a strong password"
              :invalid="!!errors.password"
              toggle-mask
              class="w-full"
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

          <!-- Confirm Password -->
          <div>
            <label
              for="reg-password-confirmation"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Confirm password
            </label>
            <Password
              id="reg-password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your password"
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
            :label="loading ? 'Creating account...' : 'Create account'"
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
              Already have an account?
            </span>
          </div>
        </div>

        <!-- Login Link -->
        <RouterLink
          :to="{ name: 'Login' }"
          class="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-300 dark:border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-100 hover:border-surface-400 dark:hover:border-surface-200 transition-all duration-200"
        >
          Sign in to your account
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
