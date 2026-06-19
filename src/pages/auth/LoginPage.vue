<script setup>
import { ref, computed, onMounted } from 'vue'
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
// Dark Mode
// ---------------------------------------------------------------------------
const isDark = ref(false)

function initDarkMode() {
  const stored = localStorage.getItem('nexora-theme')
  if (stored === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else if (stored === 'light') {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
}

function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('nexora-theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  initDarkMode()
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const errors = computed(() => {
  const errs = {}
  if (submitted.value) {
    if (!email.value.trim()) {
      errs.email = 'El correo electrónico es requerido.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errs.email = 'Por favor, introduce una dirección válida.'
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
      summary: 'Error',
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
  <div class="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
    <!-- =========================================================
         LEFT PANE — Dark blue gradient with branding
    ========================================================== -->
    <div 
      class="hidden lg:flex w-[45%] relative flex-col justify-between p-10 text-white" 
      style="background: radial-gradient(120% 100% at 50% 100%, #083b82 0%, #071f45 50%, #030b17 100%);"
    >
      <!-- Wavy background effect at bottom -->
      <div 
        class="absolute bottom-0 left-0 w-full h-[45%] opacity-30 pointer-events-none" 
        style="background: url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'><path fill=\'%233b82f6\' fill-opacity=\'0.4\' d=\'M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,144C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'></path></svg>') no-repeat bottom; background-size: cover;">
      </div>
      <!-- Dots decoration -->
      <div class="absolute top-[50%] right-[10%] w-32 h-32 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40"></div>

      <div class="relative z-10 flex flex-col h-full justify-between max-w-lg mx-auto w-full">
        <!-- Logo & Header -->
        <div>
          <div class="flex items-center gap-4 mb-8">
            <!-- Massive N Logo -->
            <div class="relative w-12 h-14">
              <div class="absolute left-0 top-0 w-3.5 h-full bg-blue-400 rounded-sm"></div>
              <div class="absolute right-0 top-0 w-3.5 h-full bg-blue-700 rounded-sm"></div>
              <div class="absolute left-1 top-0 w-3.5 h-[115%] bg-blue-500 rounded-sm origin-top-left transform -rotate-[32deg] shadow-[2px_0_5px_rgba(0,0,0,0.3)]"></div>
            </div>
            <span class="text-[34px] font-bold tracking-[0.15em] text-white mt-1">NEXORA</span>
          </div>

          <h1 class="text-[28px] font-bold leading-tight mb-1 text-white">Inteligencia de Competencias</h1>
          <p class="text-[20px] font-semibold text-blue-300 mb-6">que impulsa el desempeño</p>
          
          <div class="border-l-4 border-blue-600 pl-4 mb-8">
            <p class="text-blue-100/80 text-[14px] leading-relaxed">
              La plataforma de microlearning inteligente que transforma la capacitación en resultados medibles.
            </p>
          </div>

          <!-- Features -->
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-[44px] h-[44px] rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <i class="pi pi-chart-line text-lg text-white"></i>
              </div>
              <div>
                <h3 class="text-[14px] font-bold text-white mb-0.5">Analítica avanzada</h3>
                <p class="text-blue-200/70 text-[12px]">Toma decisiones basadas en datos y métricas en tiempo real.</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="w-[44px] h-[44px] rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(5,150,105,0.3)]">
                <i class="pi pi-graduation-cap text-lg text-white"></i>
              </div>
              <div>
                <h3 class="text-[14px] font-bold text-white mb-0.5">Microlearning inteligente</h3>
                <p class="text-blue-200/70 text-[12px]">Capacitaciones cortas, efectivas y adaptadas a cada colaborador.</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="w-[44px] h-[44px] rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                <i class="pi pi-shield text-lg text-white"></i>
              </div>
              <div>
                <h3 class="text-[14px] font-bold text-white mb-0.5">Reduce riesgos</h3>
                <p class="text-blue-200/70 text-[12px]">Identifica brechas y puntos ciegos para prevenir incidentes.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Glass Panel Dashboard Mockup -->
        <div class="mt-8 bg-white/[0.04] border border-white/[0.08] backdrop-blur-md rounded-2xl p-5 shadow-2xl relative">
          
          <div class="flex items-stretch gap-8 mb-6">
            <!-- Donut -->
            <div class="w-28 flex flex-col items-center justify-center">
              <div class="relative w-[84px] h-[84px] flex items-center justify-center mb-3">
                <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="72, 100" stroke-linecap="round" />
                </svg>
                <span class="absolute text-[22px] font-bold text-white">72%</span>
              </div>
              <span class="text-[10px] text-blue-200/80 uppercase tracking-wider font-semibold">Cumplimiento</span>
            </div>

            <!-- Vertical Divider -->
            <div class="w-px bg-white/10 my-1"></div>

            <!-- Bars -->
            <div class="flex-1 flex flex-col justify-between">
              <span class="text-[10px] text-blue-200/80 uppercase tracking-wider font-semibold">Brechas de Conocimiento</span>
              <div class="flex items-end justify-between h-[76px] w-full gap-2 mt-2">
                <div class="w-full bg-[#1e3a8a] rounded-t-sm" style="height: 45%"></div>
                <div class="w-full bg-[#1d4ed8] rounded-t-sm" style="height: 65%"></div>
                <div class="w-full bg-[#1e40af] rounded-t-sm" style="height: 35%"></div>
                <div class="w-full bg-[#2563eb] rounded-t-sm" style="height: 85%"></div>
                <div class="w-full bg-[#3b82f6] rounded-t-sm" style="height: 55%"></div>
                <div class="w-full bg-[#06b6d4] rounded-t-sm" style="height: 70%"></div>
                <div class="w-full bg-[#0ea5e9] rounded-t-sm" style="height: 95%"></div>
                <div class="w-full bg-[#2dd4bf] rounded-t-sm" style="height: 80%"></div>
              </div>
            </div>
          </div>

          <div class="w-full h-px bg-white/10 mb-4"></div>

          <!-- Line chart -->
          <div class="mt-4 bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
            <span class="text-[11px] text-white font-semibold">Tendencia de Aprendizaje</span>
            <div class="relative h-16 w-full mt-3">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-full overflow-visible">
                <!-- Grid Lines -->
                <g stroke="rgba(255,255,255,0.05)" stroke-width="0.5">
                  <line x1="10" y1="0" x2="10" y2="30" />
                  <line x1="20" y1="0" x2="20" y2="30" />
                  <line x1="30" y1="0" x2="30" y2="30" />
                  <line x1="40" y1="0" x2="40" y2="30" />
                  <line x1="50" y1="0" x2="50" y2="30" />
                  <line x1="60" y1="0" x2="60" y2="30" />
                  <line x1="70" y1="0" x2="70" y2="30" />
                  <line x1="80" y1="0" x2="80" y2="30" />
                  <line x1="90" y1="0" x2="90" y2="30" />
                </g>

                <!-- Smooth Line -->
                <path d="M 5 26 C 10 26, 12 18, 18 18 C 24 18, 25 21, 30 21 C 38 21, 38 10, 45 10 C 50 10, 52 17, 58 17 C 65 17, 65 6, 72 6 C 78 6, 78 12, 85 12 C 92 12, 92 4, 98 4" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round" />
                
                <!-- Data Points -->
                <circle cx="5" cy="26" r="1.2" fill="#3b82f6" />
                <circle cx="18" cy="18" r="1.2" fill="#3b82f6" />
                <circle cx="30" cy="21" r="1.2" fill="#3b82f6" />
                <circle cx="45" cy="10" r="1.2" fill="#3b82f6" />
                <circle cx="58" cy="17" r="1.2" fill="#3b82f6" />
                <circle cx="72" cy="6" r="1.2" fill="#3b82f6" />
                <circle cx="85" cy="12" r="1.2" fill="#3b82f6" />
                
                <!-- Last point with glow -->
                <circle cx="98" cy="4" r="4.5" fill="#3b82f6" opacity="0.35" style="filter: blur(1.5px);" />
                <circle cx="98" cy="4" r="1.5" fill="#3b82f6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =========================================================
         RIGHT PANE — Login form (Card on light grey bg)
    ========================================================== -->
    <div class="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12 relative z-0">
      
      <!-- Theme Toggle Button -->
      <button 
        @click="toggleDarkMode" 
        class="absolute top-6 right-6 lg:top-8 lg:right-8 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md transition-all z-10"
        :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      >
        <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
      </button>

      <!-- Card Container -->
      <div class="w-full max-w-[440px] bg-white dark:bg-[#1e293b] rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800">

        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-[28px] font-bold text-gray-900 dark:text-white mb-2">Bienvenido de nuevo</h2>
          <p class="text-gray-500 dark:text-gray-400 text-[15px]">Inicia sesión para continuar en Nexora</p>
          
          <div class="flex items-center justify-center gap-2 mt-8 mb-6">
            <!-- Small N logo -->
            <div class="relative w-7 h-8">
              <div class="absolute left-0 top-0 w-1.5 h-full bg-blue-500 rounded-sm"></div>
              <div class="absolute right-0 top-0 w-1.5 h-full bg-blue-800 rounded-sm"></div>
              <div class="absolute left-1 top-0 w-1.5 h-[115%] bg-blue-600 rounded-sm origin-top-left transform -rotate-[32deg] shadow-sm"></div>
            </div>
            <span class="text-[22px] font-bold tracking-widest text-[#0f172a] dark:text-white mt-1">NEXORA</span>
          </div>
          <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
        </div>

        <!-- Server Error -->
        <Message v-if="serverError && submitted" severity="error" :closable="true" class="mb-5 text-sm">
          {{ serverError }}
        </Message>

        <!-- Form -->
        <form @submit.prevent="handleLogin" novalidate class="space-y-5">

          <!-- Email -->
          <div>
            <label for="login-email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <div class="relative">
              <i class="pi pi-user absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10 text-[15px]"></i>
              <InputText
                id="login-email"
                v-model="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                :class="['w-full pl-[38px] py-3 rounded-lg border text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500', errors.email ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600']"
                autocomplete="email"
              />
            </div>
            <small v-if="errors.email" class="text-red-500 text-xs mt-1.5 block font-medium">
              {{ errors.email }}
            </small>
          </div>

          <!-- Password -->
          <div>
            <label for="login-password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <i class="pi pi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10 text-[15px]"></i>
              <Password
                id="login-password"
                v-model="password"
                placeholder="Ingresa tu contraseña"
                :feedback="false"
                toggle-mask
                class="w-full"
                :input-class="`w-full pl-[38px] pr-10 py-3 rounded-lg border text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`"
                autocomplete="current-password"
              />
            </div>
            <small v-if="errors.password" class="text-red-500 text-xs mt-1.5 block font-medium">
              {{ errors.password }}
            </small>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-2">
              <Checkbox id="remember" v-model="rememberMe" binary inputId="remember" />
              <label for="remember" class="text-[13px] font-medium text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                Recordarme
              </label>
            </div>
            <RouterLink
              :to="{ name: 'ForgotPassword' }"
              class="text-[13px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
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
            class="w-full bg-[#1d4ed8] hover:bg-[#1e40af] border-none rounded-lg py-3.5 text-[15px] font-bold shadow-[0_4px_12px_rgba(29,78,216,0.25)] transition-all mt-3"
          />
        </form>

        <!-- OR Divider -->
        <div class="relative my-7">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-slate-700"></div>
          </div>
          <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span class="bg-white dark:bg-[#1e293b] px-4 text-gray-400 dark:text-gray-500">o continúa con</span>
          </div>
        </div>

        <!-- Social Login -->
        <div class="flex gap-3 mb-8">
          <button type="button" class="flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-[13px] font-semibold text-gray-700 dark:text-gray-300">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button type="button" class="flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-[13px] font-semibold text-gray-700 dark:text-gray-300">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
              <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
            </svg>
            Microsoft
          </button>
        </div>

        <!-- Register Link -->
        <p class="text-center text-gray-500 dark:text-gray-400 text-[13px] mb-1">
          ¿No tienes una cuenta?
          <RouterLink :to="{ name: 'Register' }" class="text-blue-600 hover:text-blue-800 font-bold hover:underline ml-1">
            Solicita acceso
          </RouterLink>
        </p>
      </div>

      <!-- Security Message outside the card -->
      <div class="absolute bottom-8 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-[11px] font-medium">
        <i class="pi pi-shield text-[13px]"></i>
        <span>Tu información está protegida con encriptación de nivel empresarial.</span>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Override PrimeVue Input Focus Ring globally inside form */
:deep(.p-password-input) {
  padding-left: 2.5rem !important;
}
:deep(.p-inputtext:enabled:focus) {
  box-shadow: none !important;
  border-color: transparent !important;
}

/* Checkbox visibility */
:deep(.p-checkbox-box) {
  border: 2px solid #cbd5e1 !important; /* slate-300 */
  background-color: #ffffff !important;
  transition: all 0.2s;
  border-radius: 4px;
}
:deep(.p-checkbox-box.p-highlight) {
  background-color: #1d4ed8 !important; /* blue-700 */
  border-color: #1d4ed8 !important;
}
.dark :deep(.p-checkbox-box) {
  border-color: #475569 !important; /* slate-600 */
  background-color: #0f172a !important; /* slate-900 */
}
.dark :deep(.p-checkbox-box.p-highlight) {
  background-color: #3b82f6 !important; /* blue-500 */
  border-color: #3b82f6 !important;
}
:deep(.p-checkbox-icon) {
  color: white !important;
}
</style>