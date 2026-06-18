import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Aura from '@primevue/themes/aura'

import './style.css'
import App from './App.vue'

const app = createApp(App)

// State Management — Pinia
const pinia = createPinia()
app.use(pinia)

// Routing
app.use(router)

// PrimeVue with Custom Theme (Nexora palette)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primevue',
        order: 'tailwindcss, primevue',
      },
      darkModeSelector: '.dark',
    },
  },
})

// PrimeVue Services
app.use(ToastService)
app.use(ConfirmationService)

// Dark Mode Support
const initDarkMode = () => {
  const storedTheme = localStorage.getItem('nexora-theme')
  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (storedTheme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    // System preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }

  // Listen for system preference changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem('nexora-theme')) {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
}

initDarkMode()

app.mount('#app')
