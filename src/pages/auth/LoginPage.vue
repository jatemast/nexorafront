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
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

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
      errs.email = 'El correo electrónico es requerido.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errs.email = 'Por favor, introduce una dirección de correo válida.'
    }
    if (!password.value) {
      errs.password = 'La contraseña es requerida.'
    } else if (password.value.length < 6) {
      errs.password = 'La contraseña debe tener al menos 6 caracteres.'
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
      summary: '¡Bienvenido de nuevo!',
      detail: 'Has iniciado sesión exitosamente.',
      life: 3000,
    })

    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Fallo de inicio de sesión. Verifica tus credenciales e intenta de nuevo.'

    toast.add({
      severity: 'error',
      summary: 'Fallo de inicio de sesión',
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
  <div class="flex min-h-screen">
    <!-- Left Pane (Blue Gradient) -->
    <div
      class="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-blue-700 flex-col justify-between p-12 text-white"
    >
      <!-- Logo and Tagline -->
      <div>
        <div class="flex items-center mb-6">
          <img src="/icons.svg" alt="Nexora Logo" class="h-8 w-8 mr-2" />
          <span class="text-3xl font-bold">NEXORA</span>
        </div>
        <h1 class="text-4xl font-bold mb-4">
          Inteligencia de Competencias <br />
          <span class="text-blue-300">que impulsa el desempeño</span>
        </h1>
        <p class="text-blue-100 text-lg leading-relaxed border-l-4 border-blue-300 pl-4">
          La plataforma de microlearning inteligente que transforma la capacitación en resultados
          medibles.
        </p>
      </div>

      <!-- Feature List -->
      <div class="space-y-6">
        <div class="flex items-start gap-4">
          <i class="pi pi-chart-line text-2xl text-blue-300 mt-1"></i>
          <div>
            <h3 class="text-xl font-semibold">Analítica avanzada</h3>
            <p class="text-blue-100">
              Toma decisiones basadas en datos y métricas en tiempo real.
            </p>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <i class="pi pi-graduation-cap text-2xl text-blue-300 mt-1"></i>
          <div>
            <h3 class="text-xl font-semibold">Microlearning inteligente</h3>
            <p class="text-blue-100">
              Capacitaciones cortas, efectivas y adaptadas a cada colaborador.
            </p>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <i class="pi pi-shield text-2xl text-blue-300 mt-1"></i>
          <div>
            <h3 class="text-xl font-semibold">Reduce riesgos</h3>
            <p class="text-blue-100">
              Identifica brechas y puntos ciegos para prevenir incidentes.
            </p>
          </div>
        </div>
      </div>

      <!-- Placeholder Charts (Visual only) -->
      <div class="relative w-full h-48 bg-blue-800/30 rounded-xl p-4 flex items-end justify-center">
        <div class="absolute inset-0 p-4">
          <div class="flex justify-between items-center text-sm text-blue-200 mb-2">
            <span class="font-medium">Brechas de Conocimiento</span>
            <span class="font-bold text-lg text-blue-50">72%</span>
          </div>
          <div class="h-24 w-full flex items-end gap-1">
            <div class="w-1/6 bg-blue-400 h-3/5 rounded-t-sm opacity-70"></div>
            <div class="w-1/6 bg-blue-400 h-4/5 rounded-t-sm opacity-80"></div>
            <div class="w-1/6 bg-blue-400 h-2/5 rounded-t-sm opacity-60"></div>
            <div class="w-1/6 bg-blue-400 h-full rounded-t-sm opacity-90"></div>
            <div class="w-1/6 bg-blue-400 h-1/5 rounded-t-sm opacity-50"></div>
            <div class="w-1/6 bg-blue-400 h-3/5 rounded-t-sm opacity-70"></div>
          </div>
        </div>
        <div class="absolute bottom-4 left-4 right-4 text-xs text-blue-200">
          <span class="font-medium">Cumplimiento</span>
          <div class="flex justify-between mt-2">
            <span class="font-medium">Tendencia de Aprendizaje</span>
          </div>
          <svg class="w-full h-10" viewBox="0 0 100 20" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="0,15 10,10 20,12 30,8 40,14 50,11 60,16 70,9 80,13 90,7 100,10" class="text-blue-300 opacity-70"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <!-- Right Pane (Login Form) -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white relative">
      <div class="max-w-md w-full">
        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Bienvenido de nuevo</h2>
          <p class="text-gray-500 text-lg">Inicia sesión para continuar en Nexora</p>
          <div class="flex items-center justify-center mt-6 mb-8">
            <img src="/icons.svg" alt="Nexora Logo" class="h-7 w-7 mr-2" />
            <span class="text-2xl font-bold text-gray-800">NEXORA</span>
          </div>
        </div>

        <!-- Server Error -->
        <Message v-if="serverError && submitted" severity="error" :closable="true" class="mb-4">
          {{ serverError }}
        </Message>

        <!-- Form -->
        <form @submit.prevent="handleLogin" novalidate class="space-y-6">
          <!-- Email -->
          <div>
            <label for="login-email" class="block text-base font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-user"></InputIcon>
              <InputText
                id="login-email"
                v-model="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                :invalid="!!errors.email"
                class="w-full p-3 text-lg"
                autocomplete="email"
              />
            </IconField>
            <small v-if="errors.email" class="text-red-500 text-sm mt-1 block">
              {{ errors.email }}
            </small>
          </div>

          <!-- Password -->
          <div>
            <label for="login-password" class="block text-base font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-lock"></InputIcon>
              <Password
                id="login-password"
                v-model="password"
                placeholder="Ingresa tu contraseña"
                :feedback="false"
                :invalid="!!errors.password"
                toggle-mask
                class="w-full"
                input-class="w-full p-3 text-lg"
                autocomplete="current-password"
              />
            </IconField>
            <small v-if="errors.password" class="text-red-500 text-sm mt-1 block">
              {{ errors.password }}
            </small>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center">
              <Checkbox id="remember-me" v-model="rememberMe" binary class="mr-2" />
              <label for="remember-me" class="text-gray-600 select-none">Recordarme</label>
            </div>
            <RouterLink :to="{ name: 'ForgotPassword' }" class="text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </RouterLink>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            :label="loading ? 'Iniciando sesión...' : 'Iniciar sesión'"
            :loading="loading"
            :disabled="loading"
            class="w-full py-3 text-lg font-semibold rounded-lg"
            severity="primary"
          />
        </form>

        <!-- OR Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white px-3 text-gray-500">o continúa con</span>
          </div>
        </div>

        <!-- Social Login -->
        <div class="flex gap-4 mb-8">
          <Button
            label="Google"
            icon="pi pi-google"
            severity="secondary"
            outlined
            class="flex-1 py-3 text-base rounded-lg"
          />
          <Button
            label="Microsoft"
            icon="pi pi-microsoft"
            severity="secondary"
            outlined
            class="flex-1 py-3 text-base rounded-lg"
          />
        </div>

        <!-- Register Link -->
        <p class="text-center text-gray-500 text-sm mb-8">
          ¿No tienes una cuenta?
          <RouterLink :to="{ name: 'Register' }" class="text-blue-600 hover:underline"
            >Solicita acceso</RouterLink
          >
        </p>

        <!-- Security Message -->
        <div class="flex items-center justify-center text-gray-400 text-xs">
          <i class="pi pi-shield text-base mr-2"></i>
          <span>Tu información está protegida con encriptación de nivel empresarial.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No scoped styles needed as PrimeVue and Tailwind handle most of it */
</style>
