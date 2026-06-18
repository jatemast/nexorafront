<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Panel Maestro</h1>
        <p class="text-gray-500">Administración global de la plataforma Nexora</p>
      </div>
    </div>

    <!-- Impersonation Banner -->
    <div
      v-if="authStore.isImpersonating"
      class="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-eye text-amber-600 text-xl"></i>
        <div>
          <p class="font-medium text-amber-800">
            Estás viendo como: {{ authStore.impersonatingCompany?.company_name }}
          </p>
          <p class="text-sm text-amber-600">Los datos mostrados pertenecen a esta empresa.</p>
        </div>
      </div>
      <button
        class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        @click="stopImpersonating"
      >
        <i class="pi pi-sign-out mr-2"></i> Volver al Panel Maestro
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div v-for="kpi in kpisList" :key="kpi.key" class="bg-white rounded-xl shadow-sm border p-5">
        <div class="flex items-center gap-3">
          <span :class="kpi.bgClass" class="w-10 h-10 rounded-lg flex items-center justify-center">
            <i :class="kpi.icon" :style="{ color: kpi.color }"></i>
          </span>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
            <p class="text-sm text-gray-500">{{ kpi.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Companies Table -->
    <div class="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h2 class="font-semibold text-gray-900">Empresas Destacadas</h2>
        <router-link to="/admin/companies" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Ver todas <i class="pi pi-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 font-medium text-gray-500">Empresa</th>
              <th class="text-center px-6 py-3 font-medium text-gray-500">Usuarios</th>
              <th class="text-center px-6 py-3 font-medium text-gray-500">Empleados</th>
              <th class="text-center px-6 py-3 font-medium text-gray-500">Cursos</th>
              <th class="text-center px-6 py-3 font-medium text-gray-500">Certificados</th>
              <th class="text-center px-6 py-3 font-medium text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="company in masterDashboard.top_companies"
              :key="company.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    :style="{ backgroundColor: companyColor(company.id) }"
                  >
                    {{ company.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ company.name }}</p>
                    <p class="text-xs text-gray-400">{{ company.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="text-center px-6 py-4">{{ company.users_count }}</td>
              <td class="text-center px-6 py-4">{{ company.employees_count }}</td>
              <td class="text-center px-6 py-4">{{ company.courses_count }}</td>
              <td class="text-center px-6 py-4">{{ company.certificates_count }}</td>
              <td class="text-center px-6 py-4">
                <button
                  class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  @click="impersonateCompany(company)"
                >
                  <i class="pi pi-eye mr-1"></i> Ver como
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Companies Registered Chart (placeholder) -->
    <div class="bg-white rounded-xl shadow-sm border p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Registro de Empresas (últimos 12 meses)</h2>
      <div v-if="hasRegistrations" class="flex items-end gap-2 h-48">
        <div
          v-for="(count, month) in masterDashboard.registrations_by_month"
          :key="month"
          class="flex-1 flex flex-col items-center gap-1"
        >
          <span class="text-xs font-medium text-gray-700">{{ count }}</span>
          <div
            class="w-full bg-blue-500 rounded-t-md transition-all"
            :style="{ height: barHeight(count) }"
          ></div>
          <span class="text-xs text-gray-400 mt-1">{{ formatMonth(month) }}</span>
        </div>
      </div>
      <p v-else class="text-gray-400 text-sm">No hay datos de registro disponibles.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
const companyColor = (id) => colors[id % colors.length]

const masterDashboard = computed(() => adminStore.masterDashboard)
const hasRegistrations = computed(() => {
  const data = masterDashboard.value.registrations_by_month
  return data && Object.keys(data).length > 0
})

const kpisList = computed(() => [
  {
    key: 'total_companies',
    label: 'Total Empresas',
    value: masterDashboard.value.kpis?.total_companies ?? 0,
    icon: 'pi pi-building',
    color: '#3B82F6',
    bgClass: 'bg-blue-50',
  },
  {
    key: 'active_companies',
    label: 'Activas',
    value: masterDashboard.value.kpis?.active_companies ?? 0,
    icon: 'pi pi-check-circle',
    color: '#10B981',
    bgClass: 'bg-green-50',
  },
  {
    key: 'total_users',
    label: 'Usuarios',
    value: masterDashboard.value.kpis?.total_users ?? 0,
    icon: 'pi pi-users',
    color: '#8B5CF6',
    bgClass: 'bg-purple-50',
  },
  {
    key: 'total_courses',
    label: 'Cursos',
    value: masterDashboard.value.kpis?.total_courses ?? 0,
    icon: 'pi pi-book',
    color: '#F59E0B',
    bgClass: 'bg-amber-50',
  },
  {
    key: 'total_employees',
    label: 'Empleados',
    value: masterDashboard.value.kpis?.total_employees ?? 0,
    icon: 'pi pi-id-card',
    color: '#EC4899',
    bgClass: 'bg-pink-50',
  },
  {
    key: 'total_evaluations',
    label: 'Evaluaciones',
    value: masterDashboard.value.kpis?.total_evaluations ?? 0,
    icon: 'pi pi-file-edit',
    color: '#06B6D4',
    bgClass: 'bg-cyan-50',
  },
  {
    key: 'total_certificates',
    label: 'Certificados',
    value: masterDashboard.value.kpis?.total_certificates ?? 0,
    icon: 'pi pi-verified',
    color: '#84CC16',
    bgClass: 'bg-lime-50',
  },
  {
    key: 'inactive_companies',
    label: 'Inactivas',
    value: masterDashboard.value.kpis?.inactive_companies ?? 0,
    icon: 'pi pi-ban',
    color: '#EF4444',
    bgClass: 'bg-red-50',
  },
])

function barHeight(count) {
  const max = Math.max(...Object.values(masterDashboard.value.registrations_by_month || {}), 1)
  return `${(count / max) * 100}%`
}

function formatMonth(month) {
  const [y, m] = month.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return months[parseInt(m) - 1]
}

async function impersonateCompany(company) {
  try {
    await authStore.impersonate(company.id)
    router.push('/dashboard')
  } catch (err) {
    console.error('Failed to impersonate:', err)
  }
}

async function stopImpersonating() {
  try {
    await authStore.stopImpersonating()
    router.push('/admin')
  } catch (err) {
    console.error('Failed to stop impersonating:', err)
  }
}

onMounted(async () => {
  await adminStore.fetchMasterDashboard()
  await adminStore.fetchCompanies({ per_page: 5 })
})
</script>
