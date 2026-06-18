<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import Popover from 'primevue/popover'
import Badge from 'primevue/badge'
import OverlayBadge from 'primevue/overlaybadge'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

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

onMounted(() => initDarkMode())

// ---------------------------------------------------------------------------
// Sidebar State
// ---------------------------------------------------------------------------
const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
  if (isMobile.value) {
    sidebarCollapsed.value = true
    mobileSidebarOpen.value = false
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false
}

let resizeTimer = null
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(checkMobile, 100)
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearTimeout(resizeTimer)
})

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
const searchQuery = ref('')

function handleSearch() {
  const query = searchQuery.value.trim()
  if (!query) return
  // Navigate to a global search or dispatch to appropriate module
  // For now, focus is on the UI — search can be wired to a global
  // search endpoint or in-component filtering later.
  searchQuery.value = ''
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
const notificationCount = ref(3)
const notificationsPopover = ref(null)
const notifications = ref([
  { id: 1, title: 'New course available', description: 'Advanced Vue.js patterns', time: '2m ago', read: false },
  { id: 2, title: 'Evaluation graded', description: 'JavaScript Fundamentals scored 92%', time: '1h ago', read: false },
  { id: 3, title: 'Certificate issued', description: 'React Mastery certificate generated', time: '3h ago', read: false },
])

function toggleNotifications(event) {
  notificationsPopover.value?.toggle(event)
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
  notificationCount.value = 0
}

// ---------------------------------------------------------------------------
// User Dropdown
// ---------------------------------------------------------------------------
const userMenuPopover = ref(null)

function toggleUserMenu(event) {
  userMenuPopover.value?.toggle(event)
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------
const navItems = [
  {
    label: 'Dashboard',
    to: { name: 'Dashboard' },
    icon: 'pi pi-th-large',
    match: ['Dashboard'],
  },
  {
    label: 'Empleados',
    to: { name: 'Employees' },
    icon: 'pi pi-users',
    match: ['Employees', 'EmployeeCreate', 'EmployeeEdit'],
  },
  {
    label: 'Cursos',
    to: { name: 'Courses' },
    icon: 'pi pi-book',
    match: ['Courses', 'CourseCreate', 'CourseDetail', 'CourseEdit', 'CourseCategories'],
  },
  {
    label: 'Microlearning',
    to: { name: 'Microlearning' },
    icon: 'pi pi-play-circle',
    match: ['Microlearning', 'MicrolearningCreate', 'MicrolearningAssign'],
  },
  {
    label: 'Banco Preguntas',
    to: { name: 'Questions' },
    icon: 'pi pi-question-circle',
    match: ['Questions', 'QuestionCreate', 'QuestionEdit', 'QuestionCategories'],
  },
  {
    label: 'Evaluaciones',
    to: { name: 'Evaluations' },
    icon: 'pi pi-check-square',
    match: ['Evaluations', 'EvaluationCreate', 'EvaluationEdit', 'EvaluationTake', 'EvaluationResults'],
  },
  {
    label: 'Certificados',
    to: { name: 'Certificates' },
    icon: 'pi pi-verified',
    match: ['Certificates', 'CertificateTemplates', 'CertificateTemplateCreate', 'CertificateTemplateEdit'],
  },
]

function isActive(item) {
  return item.match.includes(route.name)
}

// ---------------------------------------------------------------------------
// Computed: User Info
// ---------------------------------------------------------------------------
const userName = computed(() => authStore.user?.name || 'User')
const userEmail = computed(() => authStore.user?.email || 'user@nexora.com')
const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (name[0] || 'U').toUpperCase()
})

// ---------------------------------------------------------------------------
// Keyboard shortcut: Ctrl+K / Cmd+K for search focus
// ---------------------------------------------------------------------------
function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    document.getElementById('nexora-search-input')?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="nexora-layout">
    <!-- =================================================================== -->
    <!-- MOBILE SIDEBAR OVERLAY                                              -->
    <!-- =================================================================== -->
    <Transition name="sidebar-overlay">
      <div
        v-if="isMobile && mobileSidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        @click="closeMobileSidebar"
      />
    </Transition>

    <!-- =================================================================== -->
    <!-- SIDEBAR                                                             -->
    <!-- =================================================================== -->
    <aside
      :class="[
        'nexora-sidebar fixed left-0 top-0 z-50 flex h-full flex-col',
        'bg-surface-0 dark:bg-surface-50 border-r border-surface-200 dark:border-surface-200',
        'transition-all duration-300 ease-in-out',
        {
          'w-64': !sidebarCollapsed && !isMobile,
          'w-20': sidebarCollapsed && !isMobile,
          'w-64 translate-x-0': isMobile && mobileSidebarOpen,
          '-translate-x-full': isMobile && !mobileSidebarOpen,
        },
      ]"
    >
      <!-- Brand / Logo -->
      <div class="flex h-16 items-center gap-3 border-b border-surface-200 dark:border-surface-200 px-4 shrink-0">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shrink-0">
          <svg
            class="h-5 w-5"
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
        <Transition name="brand-fade">
          <span
            v-show="!sidebarCollapsed || isMobile"
            class="text-lg font-bold tracking-tight text-surface-900 dark:text-surface-950 whitespace-nowrap"
          >
            Nexora
          </span>
        </Transition>
        <!-- Collapse toggle (desktop only) -->
        <button
          v-if="!isMobile"
          class="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-100 dark:hover:text-surface-500 transition-colors shrink-0"
          @click="toggleSidebar"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <i :class="sidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" class="text-xs" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          :class="[
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive(item)
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm'
              : 'text-surface-600 dark:text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-100 hover:text-surface-900 dark:hover:text-surface-950',
          ]"
          @click="closeMobileSidebar"
        >
          <i
            :class="[
              item.icon,
              'text-lg shrink-0 transition-colors duration-200',
              isActive(item) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-400',
            ]"
          />
          <Transition name="brand-fade">
            <span v-show="!sidebarCollapsed || isMobile" class="whitespace-nowrap">{{ item.label }}</span>
          </Transition>
          <!-- Active indicator dot -->
          <span
            v-if="isActive(item)"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0"
            :class="{ 'hidden': sidebarCollapsed && !isMobile }"
          />
        </RouterLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="border-t border-surface-200 dark:border-surface-200 p-3 shrink-0">
        <RouterLink
          :to="{ name: 'Profile' }"
          :class="[
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
            route.name === 'Profile'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-surface-600 dark:text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-100 hover:text-surface-900 dark:hover:text-surface-950',
          ]"
          @click="closeMobileSidebar"
        >
          <i
            :class="[
              'pi pi-cog text-lg shrink-0 transition-colors duration-200',
              route.name === 'Profile' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500',
            ]"
          />
          <Transition name="brand-fade">
            <span v-show="!sidebarCollapsed || isMobile" class="text-sm font-medium whitespace-nowrap">Settings</span>
          </Transition>
        </RouterLink>
      </div>
    </aside>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT AREA                                                   -->
    <!-- =================================================================== -->
    <div
      :class="[
        'nexora-main flex min-h-screen flex-col transition-all duration-300 ease-in-out',
        { 'lg:ml-64': !sidebarCollapsed, 'lg:ml-20': sidebarCollapsed },
      ]"
    >
      <!-- ================================================================= -->
      <!-- TOPBAR                                                            -->
      <!-- ================================================================= -->
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-200 dark:border-surface-200 bg-surface-0/80 dark:bg-surface-50/80 backdrop-blur-md px-4 lg:px-6"
      >
        <!-- Mobile hamburger + Brand -->
        <div class="flex items-center gap-3 lg:hidden">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-100 hover:text-surface-700 dark:hover:text-surface-500 transition-colors"
            @click="toggleSidebar"
            aria-label="Toggle menu"
          >
            <i :class="mobileSidebarOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg" />
          </button>
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <svg
              class="h-4 w-4"
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
        </div>

        <!-- Search -->
        <div class="relative hidden sm:flex flex-1 max-w-md">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
            <i class="pi pi-search text-sm" />
          </span>
          <InputText
            id="nexora-search-input"
            v-model="searchQuery"
            placeholder="Search... (Ctrl+K)"
            class="w-full !pl-10 !pr-16 !py-2 !text-sm !rounded-lg !bg-surface-50 dark:!bg-surface-100 !border-surface-200 dark:!border-surface-200 !text-surface-900 dark:!text-surface-950 placeholder:!text-surface-400 dark:placeholder:!text-surface-500 focus:!border-primary-400 focus:!shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
            @keyup.enter="handleSearch"
          />
          <kbd
            class="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-surface-300 dark:border-surface-300 bg-surface-100 dark:bg-surface-200 px-1.5 py-0.5 text-[10px] font-semibold text-surface-500 dark:text-surface-500"
          >
            <span class="text-xs">⌘</span>K
          </kbd>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1.5 ml-auto sm:gap-2">
          <!-- Mobile search toggle -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-100 hover:text-surface-700 dark:hover:text-surface-500 transition-colors sm:hidden"
            @click="document.getElementById('nexora-search-input')?.focus()"
            aria-label="Search"
          >
            <i class="pi pi-search text-base" />
          </button>

          <!-- Dark Mode Toggle -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-100 hover:text-surface-700 dark:hover:text-surface-500 transition-colors"
            @click="toggleDarkMode"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-base" />
          </button>

          <!-- Notifications -->
          <OverlayBadge :value="notificationCount" :severity="notificationCount > 0 ? 'danger' : undefined">
            <button
              class="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-100 hover:text-surface-700 dark:hover:text-surface-500 transition-colors"
              @click="toggleNotifications"
              aria-label="Notifications"
            >
              <i class="pi pi-bell text-base" />
            </button>
          </OverlayBadge>

          <!-- User Menu -->
          <button
            class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-surface-600 dark:text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors ml-1"
            @click="toggleUserMenu"
            aria-label="User menu"
          >
            <Avatar
              :label="userInitials"
              size="small"
              class="!bg-primary-600 !text-white !text-xs !font-semibold"
              shape="circle"
            />
            <span class="hidden sm:inline text-sm font-medium text-surface-700 dark:text-surface-600 max-w-[120px] truncate">
              {{ userName }}
            </span>
            <i class="pi pi-chevron-down hidden sm:block text-xs text-surface-400 dark:text-surface-500" />
          </button>
        </div>
      </header>

      <!-- ================================================================= -->
      <!-- PAGE CONTENT                                                      -->
      <!-- ================================================================= -->
      <main class="flex-1 p-4 lg:p-6">
        <RouterView />
      </main>

      <!-- ================================================================= -->
      <!-- FOOTER (subtle)                                                   -->
      <!-- ================================================================= -->
      <footer class="border-t border-surface-200 dark:border-surface-200 px-6 py-4">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-surface-400 dark:text-surface-500">
          <span>&copy; {{ new Date().getFullYear() }} Nexora Learning Platform. All rights reserved.</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>

    <!-- =================================================================== -->
    <!-- NOTIFICATIONS POPOVER                                               -->
    <!-- =================================================================== -->
    <Popover ref="notificationsPopover" class="!p-0 !w-80 !shadow-xl !border-surface-200 dark:!border-surface-200 !rounded-xl">
      <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-100 dark:border-surface-100">
        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-950">Notifications</h3>
        <button
          class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          @click="markAllRead"
        >
          Mark all read
        </button>
      </div>
      <div class="max-h-72 overflow-y-auto">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'flex gap-3 px-4 py-3 transition-colors border-b border-surface-50 dark:border-surface-50 last:border-0',
            notification.read
              ? 'bg-transparent'
              : 'bg-primary-50/40 dark:bg-primary-900/10',
          ]"
        >
          <div class="mt-0.5 shrink-0">
            <span
              v-if="!notification.read"
              class="block h-2 w-2 rounded-full bg-primary-500"
            />
            <span
              v-else
              class="block h-2 w-2 rounded-full bg-transparent"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-800 dark:text-surface-600 truncate">
              {{ notification.title }}
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-500 mt-0.5 line-clamp-2">
              {{ notification.description }}
            </p>
            <p class="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
              {{ notification.time }}
            </p>
          </div>
        </div>
      </div>
      <div class="p-3 border-t border-surface-100 dark:border-surface-100">
        <button
          class="w-full rounded-lg py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          View all notifications
        </button>
      </div>
    </Popover>

    <!-- =================================================================== -->
    <!-- USER MENU POPOVER                                                   -->
    <!-- =================================================================== -->
    <Popover ref="userMenuPopover" class="!p-0 !w-64 !shadow-xl !border-surface-200 dark:!border-surface-200 !rounded-xl">
      <div class="p-4 border-b border-surface-100 dark:border-surface-100">
        <div class="flex items-center gap-3">
          <Avatar
            :label="userInitials"
            size="large"
            class="!bg-primary-600 !text-white !font-semibold"
            shape="circle"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-950 truncate">
              {{ userName }}
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-500 truncate">
              {{ userEmail }}
            </p>
          </div>
        </div>
      </div>
      <div class="p-2">
        <RouterLink
          :to="{ name: 'Profile' }"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-surface-600 dark:text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-100 hover:text-surface-900 dark:hover:text-surface-950 transition-colors"
        >
          <i class="pi pi-user text-base text-surface-400 dark:text-surface-500" />
          <span>My Profile</span>
        </RouterLink>
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors mt-0.5"
          @click="handleLogout"
        >
          <i class="pi pi-sign-out text-base" />
          <span>Logout</span>
        </button>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
/* =========================================================================
   Sidebar Overlay Transition
   ========================================================================= */
.sidebar-overlay-enter-active,
.sidebar-overlay-leave-active {
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}

/* =========================================================================
   Brand Text Fade Transition
   ========================================================================= */
.brand-fade-enter-active,
.brand-fade-leave-active {
  transition:
    opacity 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-fade-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.brand-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* =========================================================================
   Sidebar Scrollbar
   ========================================================================= */
.nexora-sidebar {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.nexora-sidebar:hover {
  scrollbar-color: var(--color-surface-300) transparent;
}

/* =========================================================================
   Responsive Adjustments
   ========================================================================= */
@media (max-width: 640px) {
  .nexora-main {
    margin-left: 0 !important;
  }
}
</style>
