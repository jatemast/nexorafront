<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeesStore } from '@/stores/employees'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ImportExcel from '@/pages/employees/ImportExcel.vue'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const employeesStore = useEmployeesStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const importing = ref(false)
const importDialogVisible = ref(false)

// Pagination & Sorting
const page = ref(1)
const perPage = ref(10)
const totalRecords = ref(0)
const sortField = ref('created_at')
const sortOrder = ref(-1)

// Column Filters
const filterName = ref('')
const filterEmail = ref('')
const filterPosition = ref('')
const filterArea = ref('')
const filterStatus = ref(null)

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

// Toggle status tracking
const togglingId = ref(null)

// Delete confirmation target
const deletingId = ref(null)
const deletingName = ref('')

// View employee details dialog
const viewDialogVisible = ref(false)
const viewingEmployee = ref(null)
const viewingLoading = ref(false)

// Debounce timer for search
let searchTimer = null

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const employees = computed(() => employeesStore.employees)
const hasEmployees = computed(() => employees.value.length > 0)
const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() ||
    filterName.value.trim() ||
    filterEmail.value.trim() ||
    filterPosition.value.trim() ||
    filterArea.value.trim() ||
    filterStatus.value !== null,
)

/**
 * Returns the filtered list of employees (client-side fallback).
 * Real filtering is done server-side via API params.
 */
const filteredEmployees = computed(() => {
  let list = employees.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (e) =>
        (e.first_name && e.first_name.toLowerCase().includes(q)) ||
        (e.last_name && e.last_name.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.document_number && e.document_number.toLowerCase().includes(q)) ||
        (e.user?.name && e.user.name.toLowerCase().includes(q)) ||
        (e.user?.lastname && e.user.lastname.toLowerCase().includes(q)),
    )
  }

  if (filterName.value.trim()) {
    const q = filterName.value.trim().toLowerCase()
    list = list.filter(
      (e) =>
        (e.first_name && e.first_name.toLowerCase().includes(q)) ||
        (e.last_name && e.last_name.toLowerCase().includes(q)) ||
        (e.user?.name && e.user.name.toLowerCase().includes(q)) ||
        (e.user?.lastname && e.user.lastname.toLowerCase().includes(q)),
    )
  }

  if (filterEmail.value.trim()) {
    const q = filterEmail.value.trim().toLowerCase()
    list = list.filter((e) => e.email && e.email.toLowerCase().includes(q))
  }

  if (filterPosition.value.trim()) {
    const q = filterPosition.value.trim().toLowerCase()
    list = list.filter(
      (e) =>
        (e.position && e.position.toLowerCase().includes(q)) ||
        (e.position?.name && e.position.name.toLowerCase().includes(q)),
    )
  }

  if (filterArea.value.trim()) {
    const q = filterArea.value.trim().toLowerCase()
    list = list.filter(
      (e) =>
        (e.area && e.area.toLowerCase().includes(q)) ||
        (e.area_info?.name && e.area_info.name.toLowerCase().includes(q)),
    )
  }

  if (filterStatus.value !== null) {
    list = list.filter((e) => e.status === filterStatus.value)
  }

  return list
})

const displayEmployees = computed(() => filteredEmployees.value)
const loading = computed(() => employeesStore.loading)

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

function buildParams() {
  const params = {
    page: page.value,
    per_page: perPage.value,
    sort_by: sortField.value,
    sort_order: sortOrder.value === 1 ? 'asc' : 'desc',
  }

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }
  if (filterName.value.trim()) {
    params.name = filterName.value.trim()
  }
  if (filterEmail.value.trim()) {
    params.email = filterEmail.value.trim()
  }
  if (filterPosition.value.trim()) {
    params.position = filterPosition.value.trim()
  }
  if (filterArea.value.trim()) {
    params.area = filterArea.value.trim()
  }
  if (filterStatus.value !== null) {
    params.status = filterStatus.value
  }

  return params
}

async function fetchEmployees() {
  loadError.value = ''
  try {
    const params = buildParams()
    const result = await employeesStore.fetchAll(params)

    // Handle paginated responses
    if (result && result.meta) {
      totalRecords.value = result.meta.total || result.meta.count || 0
    } else if (result && result.total !== undefined) {
      totalRecords.value = result.total
    } else {
      totalRecords.value = employees.value.length
    }
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to load employees.'
    loadError.value = message
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 6000,
    })
  } finally {
    initialLoading.value = false
  }
}

function onPageChange(event) {
  page.value = event.page + 1
  perPage.value = event.rows
  fetchEmployees()
}

function onSort(event) {
  sortField.value = event.sortField
  sortOrder.value = event.sortOrder
  fetchEmployees()
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchEmployees()
  }, 400)
}

function onFilterChange() {
  page.value = 1
  fetchEmployees()
}

function clearAllFilters() {
  searchQuery.value = ''
  filterName.value = ''
  filterEmail.value = ''
  filterPosition.value = ''
  filterArea.value = ''
  filterStatus.value = null
  page.value = 1
  fetchEmployees()
}

function navigateToCreate() {
  router.push({ name: 'EmployeeCreate' })
}

function navigateToEdit(id) {
  router.push({ name: 'EmployeeEdit', params: { id } })
}

async function handleExport() {
  try {
    toast.add({
      severity: 'info',
      summary: 'Exporting',
      detail: 'Preparing employee data for download...',
      life: 3000,
    })
    await employeesStore.exportExcel(buildParams())
    toast.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: 'Employee data has been exported successfully.',
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to export employees.'
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: message,
      life: 6000,
    })
  }
}

function openImportDialog() {
  importDialogVisible.value = true
}

function confirmDelete(id, name) {
  deletingId.value = id
  deletingName.value = name

  confirm.require({
    message: `¿Está seguro de que desea eliminar a "${name}"? Esta acción utiliza borrado lógico y se puede restaurar.`,
    header: 'Eliminar Empleado',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(id),
    reject: () => {
      deletingId.value = null
      deletingName.value = ''
    },
  })
}

async function handleDelete(id) {
  try {
    await employeesStore.delete(id)
    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: `Empleado "${deletingName.value}" eliminado exitosamente.`,
      life: 4000,
    })
    deletingId.value = null
    deletingName.value = ''
    page.value = 1
    fetchEmployees()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to delete employee.'
    toast.add({
      severity: 'error',
      summary: 'Error al eliminar',
      detail: message,
      life: 6000,
    })
    deletingId.value = null
    deletingName.value = ''
  }
}

async function toggleStatus(employee) {
  togglingId.value = employee.id
  try {
    await employeesStore.toggleStatus(employee.id, employee.status)
    const newStatus = employee.status === 'active' ? 'inactive' : 'active'
    toast.add({
      severity: 'success',
      summary: 'Estado actualizado',
      detail: `Empleado ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente.`,
      life: 3000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to toggle employee status.'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    })
  } finally {
    togglingId.value = null
  }
}

async function viewDetails(employee) {
  viewingEmployee.value = employee
  viewDialogVisible.value = true
  viewingLoading.value = true
  try {
    await employeesStore.fetchOne(employee.id)
    viewingEmployee.value = employeesStore.employee
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to load employee details.'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    })
  } finally {
    viewingLoading.value = false
  }
}

function closeViewDialog() {
  viewDialogVisible.value = false
  viewingEmployee.value = null
}

function onImportSuccess() {
  importDialogVisible.value = false
  importing.value = false
  page.value = 1
  fetchEmployees()
}

function onImportError() {
  importing.value = false
}

function getStatusSeverity(status) {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'danger'
    case 'pending':
      return 'warn'
    default:
      return 'info'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'pending':
      return 'Pending'
    default:
      return status || 'Unknown'
  }
}

function employeeInitials(employee) {
  const fn = employee.first_name || employee.name || ''
  const ln = employee.last_name || employee.lastname || ''
  return (fn.charAt(0) + ln.charAt(0)).toUpperCase() || '?'
}

function formatSalary(salary) {
  if (salary == null) return '—'
  const num = Number(salary)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Watchers
// ---------------------------------------------------------------------------
watch([filterName, filterEmail, filterPosition, filterArea, filterStatus], () => {
  onFilterChange()
})

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchEmployees()
})
</script>

<template>
  <div class="employees-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Empleados
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Gestiona todos los empleados de la plataforma
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <Button
          icon="pi pi-download"
          label="Exportar"
          severity="secondary"
          size="small"
          :disabled="!hasEmployees || loading"
          @click="handleExport"
        />
        <Button
          icon="pi pi-upload"
          label="Importar"
          severity="secondary"
          size="small"
          @click="openImportDialog"
        />
        <Button
          icon="pi pi-plus"
          label="Nuevo Empleado"
          severity="primary"
          size="small"
          @click="navigateToCreate"
        />
      </div>
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

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="initialLoading">
      <!-- Toolbar Skeleton -->
      <div class="card p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <Skeleton width="100%" height="2.5rem" class="sm:!w-72" />
          <Skeleton width="100%" height="2.5rem" class="sm:!w-44" />
          <Skeleton width="100%" height="2.5rem" class="sm:!w-44" />
          <Skeleton width="100%" height="2.5rem" class="sm:!w-44" />
          <Skeleton width="100%" height="2.5rem" class="sm:!w-36" />
        </div>
      </div>

      <!-- Table Skeleton -->
      <div class="card overflow-hidden">
        <div class="p-4 space-y-3">
          <div v-for="n in 8" :key="`row-skel-${n}`" class="flex items-center gap-4">
            <Skeleton shape="circle" size="2.5rem" />
            <div class="flex-1 space-y-1.5">
              <Skeleton width="60%" height="1rem" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
            <Skeleton width="15%" height="1rem" />
            <Skeleton width="15%" height="1rem" />
            <Skeleton width="10%" height="1rem" />
            <Skeleton width="5rem" height="2rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Toolbar: Search + Filters -->
      <div class="card p-4">
        <div class="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
          <!-- Search -->
          <IconField class="w-full sm:w-72">
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText
              v-model="searchQuery"
              placeholder="Search employees..."
              class="w-full"
              @input="onSearchInput"
            />
          </IconField>

          <!-- Filters -->
          <InputText
            v-model="filterName"
            placeholder="Filter by name..."
            class="w-full sm:w-44"
          />
          <InputText
            v-model="filterEmail"
            placeholder="Filter by email..."
            class="w-full sm:w-44"
          />
          <InputText
            v-model="filterPosition"
            placeholder="Filter by position..."
            class="w-full sm:w-44"
          />
          <InputText
            v-model="filterArea"
            placeholder="Filter by area..."
            class="w-full sm:w-36"
          />
          <Select
            v-model="filterStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Status"
            class="w-full sm:w-36"
          />

          <!-- Clear Filters -->
          <Button
            v-if="hasActiveFilters"
            icon="pi pi-times"
            label="Clear"
            severity="secondary"
            size="small"
            text
            @click="clearAllFilters"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!hasEmployees && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-users text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No employees found
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Get started by adding your first employee to the platform.
        </p>
        <Button
          icon="pi pi-plus"
          label="Add Employee"
          severity="primary"
          @click="navigateToCreate"
        />
      </div>

      <!-- Empty State: No Results -->
      <div
        v-else-if="displayEmployees.length === 0 && !loading"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-filter-slash text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No matching results
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto">
          Try adjusting your search or filter criteria.
        </p>
      </div>

      <!-- Data Table -->
      <div v-if="hasEmployees" class="card overflow-hidden">
        <DataTable
          :value="displayEmployees"
          :loading="loading"
          :paginator="true"
          :rows="perPage"
          :total-records="totalRecords"
          :rows-per-page-options="[5, 10, 25, 50]"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :lazy="true"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          current-page-report-template="Showing {first} to {last} of {totalRecords}"
          data-key="id"
          removable-sort
          striped-rows
          @page="onPageChange"
          @sort="onSort"
        >
          <!-- Employee Avatar + Name -->
          <Column header="Empleado" :sortable="true" sort-field="first_name" class="min-w-[220px]">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <Avatar
                  :label="employeeInitials(data)"
                  size="normal"
                  shape="circle"
                  class="!bg-primary-100 dark:!bg-primary-900/30 !text-primary-700 dark:!text-primary-400 !text-xs !font-semibold"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-surface-800 dark:text-surface-600 truncate">
                    {{ data.first_name }} {{ data.last_name }}
                  </p>
                  <p class="text-xs text-surface-400 dark:text-surface-500 truncate">
                    {{ data.document_number }} — {{ data.email }}
                  </p>
                </div>
              </div>
            </template>
            <template #filter>
              <InputText
                v-model="filterName"
                placeholder="Search name..."
                class="w-full"
                @input="onSearchInput"
              />
            </template>
          </Column>

          <!-- Documento -->
          <Column field="document_number" header="Documento" :sortable="true" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-700 dark:text-surface-600 font-mono">
                {{ data.document_number || '—' }}
              </span>
            </template>
          </Column>

          <!-- Cargo -->
          <Column field="position" header="Cargo" :sortable="true" class="min-w-[140px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-700 dark:text-surface-600">
                {{ data.position?.name || data.position || '—' }}
              </span>
            </template>
          </Column>

          <!-- Departamento -->
          <Column field="department" header="Depto" :sortable="true" class="min-w-[120px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-700 dark:text-surface-600">
                {{ data.department || '—' }}
              </span>
            </template>
          </Column>

          <!-- Teléfono -->
          <Column field="phone" header="Teléfono" :sortable="true" class="min-w-[140px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-700 dark:text-surface-600 font-mono">
                {{ data.phone || '—' }}
              </span>
            </template>
          </Column>

          <!-- Fecha Contratación -->
          <Column field="hire_date" header="Contratación" :sortable="true" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-700 dark:text-surface-600">
                {{ formatDate(data.hire_date) }}
              </span>
            </template>
          </Column>

          <!-- Estado -->
          <Column field="status" header="Estado" :sortable="true" class="min-w-[110px]">
            <template #body="{ data }">
              <Tag
                :value="getStatusLabel(data.status)"
                :severity="getStatusSeverity(data.status)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- Acciones -->
          <Column header="Acciones" class="min-w-[210px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Ver información completa'"
                  @click="viewDetails(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Editar'"
                  @click="navigateToEdit(data.id)"
                />
                <Button
                  v-if="data.status === 'active'"
                  icon="pi pi-ban"
                  severity="warn"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Desactivar'"
                  :loading="togglingId === data.id"
                  @click="toggleStatus(data)"
                />
                <Button
                  v-else
                  icon="pi pi-check-circle"
                  severity="success"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Activar'"
                  :loading="togglingId === data.id"
                  @click="toggleStatus(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Eliminar'"
                  :loading="deletingId === data.id"
                  @click="confirmDelete(data.id, `${data.first_name || ''} ${data.last_name || ''}`.trim())"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- EMPLOYEE DETAIL DIALOG                                               -->
    <!-- =================================================================== -->
    <Dialog
      v-model:visible="viewDialogVisible"
      :header="viewingEmployee ? `Empleado: ${viewingEmployee.first_name || ''} ${viewingEmployee.last_name || ''}` : 'Detalles del Empleado'"
      :modal="true"
      :closable="true"
      :draggable="false"
      class="w-full max-w-2xl"
      :pt="{
        root: { class: '!rounded-2xl !shadow-2xl !border-surface-200 dark:!border-surface-200' },
        header: { class: '!text-lg !font-semibold !text-surface-900 dark:!text-surface-950 !px-6 !pt-6 !pb-4' },
        content: { class: '!px-6 !pb-6' },
      }"
      @hide="closeViewDialog"
    >
      <div v-if="viewingLoading" class="flex items-center justify-center py-12">
        <i class="pi pi-spin pi-spinner text-2xl text-primary-500" />
      </div>
      <div v-else-if="viewingEmployee" class="space-y-6">
        <!-- Personal Info -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-500 uppercase tracking-wide">
            <i class="pi pi-user mr-2" />Información Personal
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Nombre</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.first_name || '—' }} {{ viewingEmployee.last_name || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Documento</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.document_type || '' }} {{ viewingEmployee.document_number || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Email</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.email || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Teléfono</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.phone || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Género</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.gender || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Fecha de Nacimiento</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ formatDate(viewingEmployee.birth_date) }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Dirección</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.address || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Ciudad</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.city || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Employment Info -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-500 uppercase tracking-wide">
            <i class="pi pi-briefcase mr-2" />Información Laboral
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Cargo</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.position?.name || viewingEmployee.position || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Departamento</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.department || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Área</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.area || viewingEmployee.area_info?.name || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Estado</span>
              <p>
                <Tag
                  :value="getStatusLabel(viewingEmployee.status)"
                  :severity="getStatusSeverity(viewingEmployee.status)"
                  class="!text-xs !font-medium"
                />
              </p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Fecha de Contratación</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ formatDate(viewingEmployee.hire_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Emergency Contact -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-500 uppercase tracking-wide">
            <i class="pi pi-phone mr-2" />Contacto de Emergencia
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Nombre</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.emergency_contact || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-surface-400 dark:text-surface-500">Teléfono</span>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">{{ viewingEmployee.emergency_phone || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="viewingEmployee.notes" class="space-y-3">
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-500 uppercase tracking-wide">
            <i class="pi pi-pencil mr-2" />Notas
          </h3>
          <p class="text-sm text-surface-600 dark:text-surface-500 bg-surface-50 dark:bg-surface-100 rounded-lg p-3">
            {{ viewingEmployee.notes }}
          </p>
        </div>
      </div>
      <div v-else class="flex items-center justify-center py-12">
        <p class="text-sm text-surface-500 dark:text-surface-500">No se pudo cargar la información del empleado.</p>
      </div>
    </Dialog>

    <!-- =================================================================== -->
    <!-- IMPORT DIALOG                                                       -->
    <!-- =================================================================== -->
    <Dialog
      v-model:visible="importDialogVisible"
      header="Import Employees from Excel"
      :modal="true"
      :closable="!importing"
      :draggable="false"
      class="w-full max-w-2xl"
      :pt="{
        root: { class: '!rounded-2xl !shadow-2xl !border-surface-200 dark:!border-surface-200' },
        header: { class: '!text-lg !font-semibold !text-surface-900 dark:!text-surface-950 !px-6 !pt-6 !pb-4' },
        content: { class: '!px-6 !pb-6' },
      }"
    >
      <ImportExcel
        @success="onImportSuccess"
        @error="onImportError"
      />
    </Dialog>
  </div>
</template>
