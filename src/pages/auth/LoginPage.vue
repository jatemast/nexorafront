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

    <!-- =========================================================
         LEFT PANE — Dark blue gradient with branding
    ========================================================== -->
    <div class="hidden lg:flex w-5/12 flex-col justify-between p-10 text-white login-left-pane">

      <!-- Logo -->
      <div>
        <div class="flex items-center gap-2 mb-6">
          <div class="login-logo-icon">
            <img src="/icons.svg" alt="Nexora Logo" class="h-5 w-5" />
          </div>
          <span class="text-2xl font-bold tracking-widest">NEXORA</span>
        </div>

        <h1 class="text-2xl font-bold leading-snug mb-2">
          Inteligencia de Competencias
        </h1>
        <p class="text-blue-400 font-semibold text-lg mb-4">que impulsa el desempeño</p>
        <p class="text-blue-200 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 max-w-xs">
          La plataforma de microlearning inteligente que transforma la capacitación en resultados medibles.
        </p>
      </div>

      <!-- Features -->
      <div class="space-y-5">
        <div class="flex items-start gap-3">
          <div class="login-feature-icon login-feature-icon--blue">
            <i class="pi pi-chart-line text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-semibold">Analítica avanzada</h3>
            <p class="text-blue-300 text-xs leading-relaxed mt-0.5">
              Toma decisiones basadas en datos y métricas en tiempo real.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="login-feature-icon login-feature-icon--green">
            <i class="pi pi-graduation-cap text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-semibold">Microlearning inteligente</h3>
            <p class="text-blue-300 text-xs leading-relaxed mt-0.5">
              Capacitaciones cortas, efectivas y adaptadas a cada colaborador.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="login-feature-icon login-feature-icon--purple">
            <i class="pi pi-shield text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-semibold">Reduce riesgos</h3>
            <p class="text-blue-300 text-xs leading-relaxed mt-0.5">
              Identifica brechas y puntos ciegos para prevenir incidentes.
            </p>
          </div>
        </div>
      </div>

      <!-- Dashboard preview card -->
      <div class="login-chart-card">
        <!-- Top row: donut + bars -->
        <div class="flex items-start gap-4 mb-3">
          <!-- Donut -->
          <div class="flex flex-col items-center gap-1">
            <div class="login-donut">
              <svg viewBox="0 0 56 56" class="w-14 h-14">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="8"
                  stroke-dasharray="98 40"
                  stroke-dashoffset="8"
                  transform="rotate(-90 28 28)"
                  stroke-linecap="round"
                />
              </svg>
              <span class="login-donut-label">72%</span>
            </div>
            <span class="text-blue-300 text-xs">Cumplimiento</span>
          </div>

          <!-- Bars -->
          <div class="flex-1">
            <p class="text-blue-200 text-xs font-medium mb-2">Brechas de Conocimiento</p>
            <div class="flex items-end gap-1 h-10">
              <div class="flex-1 rounded-t-sm bg-blue-900 opacity-70" style="height:55%"></div>
              <div class="flex-1 rounded-t-sm bg-blue-800 opacity-80" style="height:70%"></div>
              <div class="flex-1 rounded-t-sm bg-blue-900 opacity-60" style="height:40%"></div>
              <div class="flex-1 rounded-t-sm bg-blue-600" style="height:90%"></div>
              <div class="flex-1 rounded-t-sm bg-blue-700 opacity-65" style="height:55%"></div>
              <div class="flex-1 rounded-t-sm bg-blue-500" style="height:75%"></div>
              <div class="flex-1 rounded-t-sm bg-cyan-400" style="height:100%"></div>
              <div class="flex-1 rounded-t-sm bg-teal-400" style="height:80%"></div>
            </div>
          </div>
        </div>

        <!-- Trend line -->
        <div class="border-t border-white/10 pt-2">
          <p class="text-blue-300 text-xs mb-1">Tendencia de Aprendizaje</p>
          <svg class="w-full h-8" viewBox="0 0 220 30" preserveAspectRatio="none" fill="none">
            <polyline
              points="0,24 22,20 44,22 66,16 88,21 110,17 132,24 154,14 176,18 198,10 220,14"
              stroke="#3b82f6"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="198" cy="10" r="3" fill="#60a5fa"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- =========================================================
         RIGHT PANE — Login form
    ========================================================== -->
    <div class="w-full lg:w-7/12 flex items-center justify-center p-8 lg:p-12 bg-white">
      <div class="w-full max-w-sm">

        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-1">Bienvenido de nuevo</h2>
          <p class="text-gray-500 text-base">Inicia sesión para continuar en Nexora</p>
          <div class="flex items-center justify-center gap-2 mt-5 mb-8">
            <div class="login-logo-icon login-logo-icon--dark">
              <img src="/icons.svg" alt="Nexora Logo" class="h-4 w-4" />
            </div>
            <span class="text-xl font-bold text-gray-900 tracking-widest">NEXORA</span>
          </div>
        </div>

        <!-- Server Error -->
        <Message v-if="serverError && submitted" severity="error" :closable="true" class="mb-4">
          {{ serverError }}
        </Message>

        <!-- Form -->
        <form @submit.prevent="handleLogin" novalidate class="space-y-5">

          <!-- Email -->
          <div>
            <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-user" />
              <InputText
                id="login-email"
                v-model="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                :invalid="!!errors.email"
                class="w-full"
                autocomplete="email"
              />
            </IconField>
            <small v-if="errors.email" class="text-red-500 text-xs mt-1 block">
              {{ errors.email }}
            </small>
          </div>

          <!-- Password -->
          <div>
            <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-lock" />
              <Password
                id="login-password"
                v-model="password"
                placeholder="Ingresa tu contraseña"
                :feedback="false"
                :invalid="!!errors.password"
                toggle-mask
                class="w-full"
                input-class="w-full"
                autocomplete="current-password"
              />
            </IconField>
            <small v-if="errors.password" class="text-red-500 text-xs mt-1 block">
              {{ errors.password }}
            </small>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Checkbox id="remember-me" v-model="rememberMe" binary />
              <label for="remember-me" class="text-sm text-gray-600 select-none cursor-pointer">
                Recordarme
              </label>
            </div>
            <RouterLink
              :to="{ name: 'ForgotPassword' }"
              class="text-sm text-blue-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </RouterLink>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            :label="loading ? 'Iniciando sesión...' : 'Iniciar sesión'"
            :loading="loading"
            :disabled="loading"
            class="w-full login-submit-btn"
            severity="primary"
          />
        </form>

        <!-- OR Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-3 text-gray-400">o continúa con</span>
          </div>
        </div>

        <!-- Social Login -->
        <div class="flex gap-3 mb-6">
          <Button
            label="Google"
            severity="secondary"
            outlined
            class="flex-1 login-social-btn"
          >
            <template #icon>
              <svg class="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </template>
          </Button>
          <Button
            label="Microsoft"
            severity="secondary"
            outlined
            class="flex-1 login-social-btn"
          >
            <template #icon>
              <svg class="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
              </svg>
            </template>
          </Button>
        </div>

        <!-- Register Link -->
        <p class="text-center text-gray-500 text-sm mb-6">
          ¿No tienes una cuenta?
          <RouterLink :to="{ name: 'Register' }" class="text-blue-600 hover:underline font-medium">
            Solicita acceso
          </RouterLink>
        </p>

        <!-- Security Message -->
        <div class="flex items-center justify-center gap-1.5 text-gray-400 text-xs">
          <i class="pi pi-shield text-sm"></i>
          <span>Tu información está protegida con encriptación de nivel empresarial.</span>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   LEFT PANE — dark gradient background
============================================================ */
.login-left-pane {
  background: linear-gradient(160deg, #070f1f 0%, #0c1e3d 35%, #0e2d5a 65%, #163d7a 100%);
  position: relative;
  overflow: hidden;
}

/* Subtle glow at the bottom */
.login-left-pane::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 220px;
  background: radial-gradient(ellipse at 50% 110%, rgba(59, 130, 246, 0.22) 0%, transparent 70%);
  pointer-events: none;
}

/* ============================================================
   Logo icon pill
============================================================ */
.login-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-logo-icon--dark {
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

/* ============================================================
   Feature icon badges
============================================================ */
.login-feature-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-feature-icon--blue {
  background: rgba(37, 99, 235, 0.35);
  color: #93c5fd;
}

.login-feature-icon--green {
  background: rgba(22, 163, 74, 0.35);
  color: #6ee7b7;
}

.login-feature-icon--purple {
  background: rgba(124, 58, 237, 0.35);
  color: #c4b5fd;
}

/* ============================================================
   Chart preview card
============================================================ */
.login-chart-card {
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 16px;
  position: relative;
  z-index: 1;
}

/* ============================================================
   Donut chart overlay label
============================================================ */
.login-donut {
  position: relative;
  width: 56px;
  height: 56px;
}

.login-donut-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

/* ============================================================
   Submit button — full blue, pill shape
============================================================ */
.login-submit-btn.p-button {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  border-radius: 8px !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
  font-size: 0.9375rem !important;
  font-weight: 600 !important;
  justify-content: center !important;
}

.login-submit-btn.p-button:hover:not(:disabled) {
  background-color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}

.login-submit-btn.p-button:disabled {
  opacity: 0.7 !important;
}

/* ============================================================
   Social buttons — outlined, centered content
============================================================ */
.login-social-btn.p-button {
  border-radius: 8px !important;
  border-color: #d1d5db !important;
  color: #374151 !important;
  padding-top: 0.6rem !important;
  padding-bottom: 0.6rem !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  justify-content: center !important;
}

.login-social-btn.p-button:hover {
  background-color: #f9fafb !important;
}
</style>