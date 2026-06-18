<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Button from 'primevue/button'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line, Doughnut } from 'vue-chartjs'

// ---------------------------------------------------------------------------
// Chart.js — Register required components
// ---------------------------------------------------------------------------
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------
const dashboardStore = useDashboardStore()
const toast = useToast()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')

// ---------------------------------------------------------------------------
// KPI Definitions
// ---------------------------------------------------------------------------
const kpiCards = computed(() => [
  {
    key: 'empleados-activos',
    label: 'Empleados Activos',
    value: dashboardStore.kpis.active_employees ?? 0,
    icon: 'pi pi-users',
    color: 'bg-primary-500',
    bgLight: 'bg-primary-50 dark:bg-primary-900/20',
    textColor: 'text-primary-600 dark:text-primary-400',
    description: 'Usuarios activos en la plataforma',
  },
  {
    key: 'cursos-activos',
    label: 'Cursos Activos',
    value: dashboardStore.kpis.total_courses ?? 0,
    icon: 'pi pi-book',
    color: 'bg-accent-500',
    bgLight: 'bg-accent-50 dark:bg-accent-900/20',
    textColor: 'text-accent-600 dark:text-accent-400',
    description: 'Cursos disponibles actualmente',
  },
  {
    key: 'aprobaciones',
    label: 'Aprobaciones',
    value: dashboardStore.kpis.total_enrollments ?? 0,
    icon: 'pi pi-check-circle',
    color: 'bg-success-500',
    bgLight: 'bg-success-50 dark:bg-success-900/20',
    textColor: 'text-success-600 dark:text-success-400',
    description: 'Inscripciones aprobadas',
  },
  {
    key: 'certificados',
    label: 'Certificados',
    value: dashboardStore.kpis.total_certificates ?? 0,
    icon: 'pi pi-verified',
    color: 'bg-warning-500',
    bgLight: 'bg-warning-50 dark:bg-warning-900/20',
    textColor: 'text-warning-600 dark:text-warning-400',
    description: 'Certificados emitidos',
  },
])

// ---------------------------------------------------------------------------
// Chart Data — Normalize API responses into chart.js format
// ---------------------------------------------------------------------------

/**
 * Safely normalizes chart data from the store into { labels, datasets }.
 * Handles multiple possible API response shapes.
 */
function normalizeChartData(raw, datasetLabel, borderColor, backgroundColor) {
  if (!raw) return null

  // Already in chart.js format: { labels: [], datasets: [] }
  if (raw.labels && raw.datasets) {
    return {
      labels: raw.labels,
      datasets: raw.datasets.map((ds, idx) => ({
        ...ds,
        borderColor: ds.borderColor || (idx === 0 ? borderColor : undefined),
        backgroundColor: ds.backgroundColor || (idx === 0 ? backgroundColor : undefined),
      })),
    }
  }

  // Simple key-value object: { "Enero": 10, "Febrero": 20, ... }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const keys = Object.keys(raw)
    const values = Object.values(raw)
    const allNumeric = values.every((v) => typeof v === 'number')
    if (allNumeric && keys.length > 0) {
      return {
        labels: keys,
        datasets: [
          {
            label: datasetLabel,
            data: values,
            borderColor,
            backgroundColor,
            fill: false,
            tension: 0.4,
          },
        ],
      }
    }
  }

  // Array of { label, value } objects
  if (Array.isArray(raw) && raw.length > 0 && raw[0].label !== undefined && raw[0].value !== undefined) {
    return {
      labels: raw.map((item) => item.label),
      datasets: [
        {
          label: datasetLabel,
          data: raw.map((item) => item.value),
          borderColor,
          backgroundColor,
          fill: false,
          tension: 0.4,
        },
      ],
    }
  }

  return null
}

const barChartData = computed(() => {
  return normalizeChartData(
    dashboardStore.chartData.completions_by_category,
    'Cursos Completados',
    '#3B82F6',
    'rgba(59, 130, 246, 0.6)',
  )
})

const lineChartData = computed(() => {
  return normalizeChartData(
    dashboardStore.chartData.monthly_enrollments,
    'Actividad en Plataforma',
    '#06B6D4',
    'rgba(6, 182, 212, 0.2)',
  )
})

const doughnutChartData = computed(() => {
  const raw = dashboardStore.chartData.score_distribution
  if (!raw) return null

  // Already in chart.js format
  if (raw.labels && raw.datasets) {
    return {
      labels: raw.labels,
      datasets: raw.datasets.map((ds) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(100, 116, 139, 0.8)',
        ],
        borderColor: ds.borderColor || '#ffffff',
        borderWidth: ds.borderWidth ?? 2,
      })),
    }
  }

  // Simple key-value
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const keys = Object.keys(raw)
    const values = Object.values(raw)
    const allNumeric = values.every((v) => typeof v === 'number')
    if (allNumeric && keys.length > 0) {
      return {
        labels: keys,
        datasets: [
          {
            data: values,
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(100, 116, 139, 0.8)',
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      }
    }
  }

  return null
})

// ---------------------------------------------------------------------------
// Chart.js Global Defaults — consistent premium styling
// ---------------------------------------------------------------------------
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: "'Inter', ui-sans-serif, system-ui, sans-serif",
        },
        color: '#64748b',
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(203, 213, 225, 0.3)',
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 11,
          family: "'Inter', ui-sans-serif, system-ui, sans-serif",
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(203, 213, 225, 0.3)',
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 11,
          family: "'Inter', ui-sans-serif, system-ui, sans-serif",
        },
      },
      beginAtZero: true,
    },
  },
}

const barChartOptions = computed(() => ({
  ...chartDefaults,
  plugins: {
    ...chartDefaults.plugins,
    title: {
      display: false,
    },
  },
}))

const lineChartOptions = computed(() => ({
  ...chartDefaults,
  plugins: {
    ...chartDefaults.plugins,
  },
}))

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12,
          family: "'Inter', ui-sans-serif, system-ui, sans-serif",
        },
        color: '#64748b',
      },
    },
  },
}))

// ---------------------------------------------------------------------------
// Recent Activity — computed helpers
// ---------------------------------------------------------------------------
const recentActivityItems = computed(() => dashboardStore.recentActivity || [])
const hasRecentActivity = computed(() => recentActivityItems.value.length > 0)
const hasAnyChartData = computed(
  () => barChartData.value !== null || lineChartData.value !== null || doughnutChartData.value !== null,
)

/**
 * Returns a human-readable time ago string from an ISO date or timestamp.
 */
function timeAgo(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput)
  if (isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Justo ahora'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Returns an icon class based on activity type or description keywords.
 */
function activityIcon(item) {
  const type = (item.type || item.action || item.description || '').toLowerCase()
  if (type.includes('curso') || type.includes('course') || type.includes('enroll')) return 'pi pi-book'
  if (type.includes('user') || type.includes('usuario') || type.includes('empleado') || type.includes('regist')) return 'pi pi-user-plus'
  if (type.includes('certif') || type.includes('diploma')) return 'pi pi-verified'
  if (type.includes('evalua') || type.includes('exam') || type.includes('test') || type.includes('grade')) return 'pi pi-check-square'
  if (type.includes('approv') || type.includes('aprob')) return 'pi pi-check-circle'
  return 'pi pi-circle-fill'
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------
async function loadDashboardData() {
  initialLoading.value = true
  loadError.value = ''

  try {
    await dashboardStore.fetchDashboard()
  } catch (err) {
    const message = err?.response?.data?.message || dashboardStore.error || 'No se pudieron cargar los datos del dashboard.'
    loadError.value = message
    toast.add({
      severity: 'error',
      summary: 'Error al cargar',
      detail: message,
      life: 6000,
    })
  } finally {
    initialLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="dashboard-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Dashboard
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Resumen general de la plataforma de aprendizaje
        </p>
      </div>
      <Button
        icon="pi pi-refresh"
        label="Actualizar"
        severity="secondary"
        size="small"
        :loading="dashboardStore.loading"
        @click="loadDashboardData"
      />
    </div>

    <!-- =================================================================== -->
    <!-- ERROR STATE                                                         -->
    <!-- =================================================================== -->
    <Message
      v-if="loadError && !initialLoading"
      severity="error"
      :closable="true"
      class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
    >
      {{ loadError }}
    </Message>

    <!-- ===================================================================== -->
    <!-- LOADING SKELETONS                                                     -->
    <!-- ===================================================================== -->
    <template v-if="initialLoading">
      <!-- KPI Skeletons -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="n in 4" :key="`kpi-skel-${n}`" class="card p-5">
          <div class="flex items-start justify-between">
            <div class="space-y-3 flex-1">
              <Skeleton width="60%" height="1rem" />
              <Skeleton width="40%" height="2rem" />
              <Skeleton width="80%" height="0.75rem" />
            </div>
            <Skeleton shape="circle" size="3rem" />
          </div>
        </div>
      </div>

      <!-- Chart Skeletons -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card p-5">
          <Skeleton width="35%" height="1.25rem" class="mb-4" />
          <Skeleton width="100%" height="16rem" />
        </div>
        <div class="card p-5">
          <Skeleton width="35%" height="1.25rem" class="mb-4" />
          <Skeleton width="100%" height="16rem" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card p-5 lg:col-span-2">
          <Skeleton width="35%" height="1.25rem" class="mb-4" />
          <Skeleton width="100%" height="16rem" />
        </div>
        <div class="card p-5">
          <Skeleton width="40%" height="1.25rem" class="mb-4" />
          <Skeleton width="100%" height="16rem" />
        </div>
      </div>

      <!-- Activity Feed Skeleton -->
      <div class="card p-5">
        <Skeleton width="30%" height="1.25rem" class="mb-4" />
        <div class="space-y-3">
          <div v-for="n in 5" :key="`act-skel-${n}`" class="flex items-start gap-3">
            <Skeleton shape="circle" size="2rem" />
            <div class="space-y-1.5 flex-1">
              <Skeleton width="70%" height="0.875rem" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===================================================================== -->
    <!-- MAIN DASHBOARD CONTENT                                                -->
    <!-- ===================================================================== -->
    <template v-else>
      <!-- ──────────────────────────────────────────────── -->
      <!-- KPI Cards                                         -->
      <!-- ──────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          v-for="kpi in kpiCards"
          :key="kpi.key"
          :pt="{
            root: { class: '!border-surface-200 dark:!border-surface-200 !shadow-sm hover:!shadow-md !rounded-xl !bg-surface-0 dark:!bg-surface-50' },
            body: { class: '!p-5' },
            content: { class: '!p-0' },
          }"
        >
          <template #content>
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-surface-500 dark:text-surface-500 uppercase tracking-wider mb-1">
                  {{ kpi.label }}
                </p>
                <p class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
                  {{ kpi.value.toLocaleString('es-CO') }}
                </p>
                <p class="text-xs text-surface-400 dark:text-surface-500 mt-1.5 truncate">
                  {{ kpi.description }}
                </p>
              </div>
              <div
                :class="[kpi.bgLight, 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ml-3']"
              >
                <i :class="[kpi.icon, kpi.textColor, 'text-xl']" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- ──────────────────────────────────────────────── -->
      <!-- Empty State: KPIs are all zero                    -->
      <!-- ──────────────────────────────────────────────── -->
      <div
        v-if="kpiCards.every((k) => k.value === 0) && !hasAnyChartData && !hasRecentActivity"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-chart-bar text-2xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-1">
          No hay datos disponibles
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto">
          Los indicadores del dashboard aparecerán aquí una vez que la plataforma registre actividad.
        </p>
      </div>

      <!-- ──────────────────────────────────────────────── -->
      <!-- Charts Section                                    -->
      <!-- ──────────────────────────────────────────────── -->
      <template v-if="hasAnyChartData">
        <!-- Row 1: Bar + Line charts side by side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Bar Chart: Course Completions -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                Completaciones de Cursos por Mes
              </h3>
              <i
                class="pi pi-chart-bar text-surface-400 dark:text-surface-500"
                v-tooltip.top="'Cursos completados mensualmente'"
              />
            </div>
            <div class="h-64">
              <Bar
                v-if="barChartData"
                :data="barChartData"
                :options="barChartOptions"
              />
              <div v-else class="flex items-center justify-center h-full">
                <div class="text-center">
                  <i class="pi pi-chart-bar text-3xl text-surface-300 dark:text-surface-400 mb-2" />
                  <p class="text-sm text-surface-400 dark:text-surface-500">
                    Sin datos de completaciones
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Line Chart: Platform Activity -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                Actividad Mensual en Plataforma
              </h3>
              <i
                class="pi pi-chart-line text-surface-400 dark:text-surface-500"
                v-tooltip.top="'Actividad de usuarios por mes'"
              />
            </div>
            <div class="h-64">
              <Line
                v-if="lineChartData"
                :data="lineChartData"
                :options="lineChartOptions"
              />
              <div v-else class="flex items-center justify-center h-full">
                <div class="text-center">
                  <i class="pi pi-chart-line text-3xl text-surface-300 dark:text-surface-400 mb-2" />
                  <p class="text-sm text-surface-400 dark:text-surface-500">
                    Sin datos de actividad
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: Doughnut Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-1">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                Distribución de Evaluaciones
              </h3>
              <i
                class="pi pi-chart-pie text-surface-400 dark:text-surface-500"
                v-tooltip.top="'Estado de evaluaciones'"
              />
            </div>
            <div class="h-64">
              <Doughnut
                v-if="doughnutChartData"
                :data="doughnutChartData"
                :options="doughnutChartOptions"
              />
              <div v-else class="flex items-center justify-center h-full">
                <div class="text-center">
                  <i class="pi pi-chart-pie text-3xl text-surface-300 dark:text-surface-400 mb-2" />
                  <p class="text-sm text-surface-400 dark:text-surface-500">
                    Sin datos de evaluaciones
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Spacer for alignment when doughnut is on the right -->
          <div class="hidden lg:block lg:col-span-2" />
        </div>
      </template>

      <!-- Empty State: No Charts -->
      <div
        v-else-if="!hasAnyChartData"
        class="card p-8 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-chart-bar text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-500 mb-1">
          Sin Datos de Gráficas
        </h3>
        <p class="text-xs text-surface-400 dark:text-surface-500 max-w-sm mx-auto">
          Las gráficas se mostrarán cuando haya suficiente información en la plataforma.
        </p>
      </div>

      <!-- ──────────────────────────────────────────────── -->
      <!-- Recent Activity Feed                              -->
      <!-- ──────────────────────────────────────────────── -->
      <div class="card">
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-600">
            Actividad Reciente
          </h3>
          <span
            v-if="hasRecentActivity"
            class="text-xs text-surface-400 dark:text-surface-500 bg-surface-50 dark:bg-surface-100 px-2 py-0.5 rounded-full"
          >
            {{ recentActivityItems.length }} acciones
          </span>
        </div>

        <!-- Activity List -->
        <div v-if="hasRecentActivity" class="divide-y divide-surface-100 dark:divide-surface-100">
          <div
            v-for="(item, idx) in recentActivityItems"
            :key="item.id || idx"
            class="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors"
          >
            <!-- Icon -->
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <i :class="[activityIcon(item), 'text-primary-600 dark:text-primary-400 text-sm']" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm text-surface-700 dark:text-surface-600 truncate">
                {{ item.description || item.title || item.action || 'Acción registrada' }}
              </p>
              <p class="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                {{ item.user || item.user_name || item.actor || '' }}
                <span v-if="item.user || item.user_name || item.actor"> &middot; </span>
                {{ timeAgo(item.created_at || item.timestamp || item.date) }}
              </p>
            </div>

            <!-- Optional badge / status -->
            <span
              v-if="item.status || item.type"
              class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-surface-100 dark:bg-surface-100 text-surface-600 dark:text-surface-500"
            >
              {{ item.status || item.type }}
            </span>
          </div>
        </div>

        <!-- Empty State: No Activity -->
        <div v-else class="px-5 pb-5 pt-3 text-center">
          <div class="flex justify-center mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
              <i class="pi pi-inbox text-lg text-surface-400 dark:text-surface-500" />
            </div>
          </div>
          <p class="text-sm text-surface-500 dark:text-surface-500">
            No hay actividad reciente para mostrar
          </p>
          <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
            Las acciones recientes aparecerán aquí cuando haya interacciones en la plataforma.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
