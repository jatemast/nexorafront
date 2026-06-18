<template>
  <div class="db-page">

    <!-- Header -->
    <div class="db-header">
      <div>
        <h1 class="db-title">Panel Maestro</h1>
        <p class="db-subtitle">Administración global de la plataforma Nexora</p>
      </div>
      <div class="db-date-badge">
        <i class="pi pi-calendar"></i>
        {{ currentMonthLabel }}
      </div>
    </div>

    <!-- Impersonation Banner -->
    <div v-if="authStore.isImpersonating" class="impersonation-banner">
      <div class="impersonation-banner__left">
        <span class="impersonation-banner__icon">
          <i class="pi pi-eye"></i>
        </span>
        <div>
          <p class="impersonation-banner__title">
            Estás viendo como: {{ authStore.impersonatingCompany?.company_name }}
          </p>
          <p class="impersonation-banner__sub">Los datos mostrados pertenecen a esta empresa.</p>
        </div>
      </div>
      <button class="impersonation-banner__btn" @click="stopImpersonating">
        <i class="pi pi-sign-out"></i> Volver al Panel Maestro
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div v-for="kpi in kpisList" :key="kpi.key" class="kpi-card">
        <span class="kpi-card__icon" :style="{ background: kpi.bgColor }">
          <i :class="kpi.icon" :style="{ color: kpi.color }"></i>
        </span>
        <div>
          <p class="kpi-card__value">{{ kpi.value.toLocaleString() }}</p>
          <p class="kpi-card__label">{{ kpi.label }}</p>
        </div>
      </div>
    </div>

    <!-- Top Companies Table -->
    <div class="db-card">
      <div class="db-card__head">
        <h2 class="db-card__title">Empresas destacadas</h2>
        <router-link to="/admin/companies" class="db-card__link">
          Ver todas <i class="pi pi-arrow-right"></i>
        </router-link>
      </div>
      <div class="db-table-wrap">
        <table class="db-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th class="text-center">Usuarios</th>
              <th class="text-center">Empleados</th>
              <th class="text-center">Cursos</th>
              <th class="text-center">Certificados</th>
              <th class="text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="company in masterDashboard.top_companies"
              :key="company.id"
              class="db-table__row"
            >
              <td>
                <div class="company-cell">
                  <div
                    class="company-cell__avatar"
                    :style="{ backgroundColor: companyColor(company.id) }"
                  >
                    {{ company.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="company-cell__name">{{ company.name }}</p>
                    <p class="company-cell__slug">{{ company.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="text-center">{{ company.users_count }}</td>
              <td class="text-center">{{ company.employees_count }}</td>
              <td class="text-center">{{ company.courses_count }}</td>
              <td class="text-center">{{ company.certificates_count }}</td>
              <td class="text-center">
                <button class="impersonate-btn" @click="impersonateCompany(company)">
                  <i class="pi pi-eye"></i> Ver como
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Registrations Chart -->
    <div class="db-card">
      <div class="db-card__head">
        <h2 class="db-card__title">Registro de empresas — últimos 12 meses</h2>
      </div>
      <div class="chart-area">
        <div v-if="hasRegistrations" class="chart-bars">
          <div
            v-for="(count, month) in masterDashboard.registrations_by_month"
            :key="month"
            class="chart-col"
          >
            <span class="chart-col__val">{{ count }}</span>
            <div class="chart-col__bar" :style="{ height: barHeight(count) }"></div>
            <span class="chart-col__lbl">{{ formatMonth(month) }}</span>
          </div>
        </div>
        <p v-else class="chart-empty">No hay datos de registro disponibles.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
const companyColor = (id) => colors[id % colors.length]

const masterDashboard = computed(() => adminStore.masterDashboard)

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

const hasRegistrations = computed(() => {
  const data = masterDashboard.value.registrations_by_month
  return data && Object.keys(data).length > 0
})

const kpisList = computed(() => [
  {
    key: 'total_companies',
    label: 'Total empresas',
    value: masterDashboard.value.kpis?.total_companies ?? 0,
    icon: 'pi pi-building',
    color: '#2563eb',
    bgColor: '#eff6ff',
  },
  {
    key: 'active_companies',
    label: 'Activas',
    value: masterDashboard.value.kpis?.active_companies ?? 0,
    icon: 'pi pi-check-circle',
    color: '#16a34a',
    bgColor: '#f0fdf4',
  },
  {
    key: 'total_users',
    label: 'Usuarios',
    value: masterDashboard.value.kpis?.total_users ?? 0,
    icon: 'pi pi-users',
    color: '#7c3aed',
    bgColor: '#faf5ff',
  },
  {
    key: 'total_courses',
    label: 'Cursos',
    value: masterDashboard.value.kpis?.total_courses ?? 0,
    icon: 'pi pi-book',
    color: '#d97706',
    bgColor: '#fffbeb',
  },
  {
    key: 'total_employees',
    label: 'Empleados',
    value: masterDashboard.value.kpis?.total_employees ?? 0,
    icon: 'pi pi-id-card',
    color: '#a21caf',
    bgColor: '#fdf4ff',
  },
  {
    key: 'total_evaluations',
    label: 'Evaluaciones',
    value: masterDashboard.value.kpis?.total_evaluations ?? 0,
    icon: 'pi pi-file-edit',
    color: '#0891b2',
    bgColor: '#ecfeff',
  },
  {
    key: 'total_certificates',
    label: 'Certificados',
    value: masterDashboard.value.kpis?.total_certificates ?? 0,
    icon: 'pi pi-verified',
    color: '#65a30d',
    bgColor: '#f7fee7',
  },
  {
    key: 'inactive_companies',
    label: 'Inactivas',
    value: masterDashboard.value.kpis?.inactive_companies ?? 0,
    icon: 'pi pi-ban',
    color: '#e11d48',
    bgColor: '#fff1f2',
  },
])

function barHeight(count) {
  const max = Math.max(...Object.values(masterDashboard.value.registrations_by_month || {}), 1)
  return `${(count / max) * 100}%`
}

function formatMonth(month) {
  const [, m] = month.split('-')
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

<style scoped>
/* ============================================================
   Page layout
============================================================ */
.db-page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

/* ============================================================
   Header
============================================================ */
.db-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.db-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.db-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 3px;
}

.db-date-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e0f2fe;
  color: #075985;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  text-transform: capitalize;
}

/* ============================================================
   Impersonation banner
============================================================ */
.impersonation-banner {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.impersonation-banner__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.impersonation-banner__icon {
  width: 38px;
  height: 38px;
  background: #fef3c7;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
  font-size: 16px;
  flex-shrink: 0;
}

.impersonation-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin: 0;
}

.impersonation-banner__sub {
  font-size: 12px;
  color: #b45309;
  margin: 2px 0 0;
}

.impersonation-banner__btn {
  background: #d97706;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: background 0.15s;
}

.impersonation-banner__btn:hover {
  background: #b45309;
}

/* ============================================================
   KPI grid
============================================================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kpi-card {
  background: white;
  border-radius: 12px;
  border: 0.5px solid #e2e8f0;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.kpi-card__value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin: 0;
}

.kpi-card__label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin: 4px 0 0;
}

/* ============================================================
   Shared card shell
============================================================ */
.db-card {
  background: white;
  border-radius: 12px;
  border: 0.5px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 20px;
}

.db-card__head {
  padding: 16px 20px;
  border-bottom: 0.5px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.db-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.db-card__link {
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.db-card__link:hover {
  text-decoration: underline;
}

/* ============================================================
   Table
============================================================ */
.db-table-wrap {
  overflow-x: auto;
}

.db-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.db-table thead tr {
  background: #f8fafc;
}

.db-table th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.db-table th.text-center {
  text-align: center;
}

.db-table td {
  padding: 13px 16px;
  color: #334155;
  border-top: 0.5px solid #f1f5f9;
  vertical-align: middle;
}

.db-table td.text-center {
  text-align: center;
  font-weight: 600;
}

.db-table__row:hover td {
  background: #f8fafc;
}

/* Company cell */
.company-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.company-cell__avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.company-cell__name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.company-cell__slug {
  font-size: 11px;
  color: #94a3b8;
  margin: 2px 0 0;
}

/* Impersonate button */
.impersonate-btn {
  background: #eff6ff;
  color: #1d4ed8;
  border: none;
  border-radius: 7px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.15s;
}

.impersonate-btn:hover {
  background: #dbeafe;
}

/* ============================================================
   Registrations chart
============================================================ */
.chart-area {
  padding: 20px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
}

.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}

.chart-col__val {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.chart-col__bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: #2563eb;
  min-height: 4px;
  transition: height 0.3s ease;
}

.chart-col__lbl {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

.chart-empty {
  font-size: 13px;
  color: #94a3b8;
}
</style>