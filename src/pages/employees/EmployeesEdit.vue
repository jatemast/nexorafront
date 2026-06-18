<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeesStore } from '@/stores/employees'
import { useToast } from 'primevue/usetoast'
import api from '@/services/api'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const employeesStore = useEmployeesStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const submitted = ref(false)
const saving = ref(false)
const loadError = ref('')
const formError = ref('')

// Form Fields
const name = ref('')
const lastname = ref('')
const email = ref('')
const phone = ref('')
const position = ref('')
const area = ref('')
const companyId = ref(null)
const status = ref('active')
const hireDate = ref(null)
const salary = ref(null)
const documentType = ref(null)
const documentNumber = ref('')

// Employee ID from route
const employeeId = computed(() => route.params.id)

// Dropdown Options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
]

const documentTypeOptions = [
  { label: 'CC - Cédula de Ciudadanía', value: 'CC' },
  { label: 'CE - Cédula de Extranjería', value: 'CE' },
  { label: 'TI - Tarjeta de Identidad', value: 'TI' },
  { label: 'NIT - Número de Identificación Tributaria', value: 'NIT' },
  { label: 'PAS - Pasaporte', value: 'PAS' },
]

const companies = ref([])
const companiesLoading = ref(false)

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const errors = computed(() => {
  const errs = {}
  if (!submitted.value) return errs

  if (!name.value.trim()) {
    errs.name = 'Name is required.'
  } else if (name.value.trim().length < 2) {
    errs.name = 'Name must be at least 2 characters.'
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

  if (phone.value && !/^\+?[\d\s\-()]{7,15}$/.test(phone.value)) {
    errs.phone = 'Please enter a valid phone number.'
  }

  if (!position.value.trim()) {
    errs.position = 'Position is required.'
  }

  if (!area.value.trim()) {
    errs.area = 'Area is required.'
  }

  if (documentType.value && !documentNumber.value.trim()) {
    errs.documentNumber = 'Document number is required when document type is selected.'
  }

  return errs
})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)

// ---------------------------------------------------------------------------
// Company Fetching
// ---------------------------------------------------------------------------
async function fetchCompanies() {
  companiesLoading.value = true
  try {
    const { data } = await api.get('/companies')
    companies.value = (data.data || data || []).map((c) => ({
      label: c.name || c.business_name || c.company_name || `Company #${c.id}`,
      value: c.id,
    }))
  } catch {
    companies.value = []
  } finally {
    companiesLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Populate Form from Employee Data
// ---------------------------------------------------------------------------
function populateForm(employee) {
  if (!employee) return

  name.value = employee.name || ''
  lastname.value = employee.lastname || ''
  email.value = employee.email || ''
  phone.value = employee.phone || ''
  position.value = employee.position || ''
  area.value = employee.area || ''
  companyId.value = employee.company_id || null
  status.value = employee.status || 'active'
  hireDate.value = employee.hire_date ? new Date(employee.hire_date) : null
  salary.value = employee.salary != null ? Number(employee.salary) : null
  documentType.value = employee.document_type || null
  documentNumber.value = employee.document_number || ''
}

// ---------------------------------------------------------------------------
// Fetch Employee Data
// ---------------------------------------------------------------------------
async function fetchEmployee() {
  pageLoading.value = true
  loadError.value = ''

  try {
    const employee = await employeesStore.fetchOne(employeeId.value)
    populateForm(employee)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to load employee data.'

    loadError.value = message

    toast.add({
      severity: 'error',
      summary: 'Load Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    pageLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Submit Handler
// ---------------------------------------------------------------------------
async function handleSubmit() {
  submitted.value = true
  formError.value = ''

  if (hasErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the form errors before submitting.',
      life: 5000,
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      name: name.value.trim(),
      lastname: lastname.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim() || undefined,
      position: position.value.trim(),
      area: area.value.trim(),
      company_id: companyId.value || undefined,
      status: status.value,
      hire_date: hireDate.value
        ? new Date(hireDate.value).toISOString().split('T')[0]
        : undefined,
      salary: salary.value !== null && salary.value !== undefined
        ? Number(salary.value)
        : undefined,
      document_type: documentType.value || undefined,
      document_number: documentNumber.value.trim() || undefined,
    }

    const updated = await employeesStore.update(employeeId.value, payload)

    toast.add({
      severity: 'success',
      summary: 'Employee Updated',
      detail: `${updated.name} ${updated.lastname} has been updated successfully.`,
      life: 4000,
    })

    router.push({ name: 'Employees' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      employeesStore.error ||
      'Failed to update employee.'

    formError.value = message

    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'Employees' })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(async () => {
  await Promise.all([fetchEmployee(), fetchCompanies()])
})
</script>

<template>
  <div class="employees-edit-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Edit Employee
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Update employee information
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Employees"
        severity="secondary"
        size="small"
        @click="handleCancel"
      />
    </div>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="pageLoading">
      <div class="card p-6 sm:p-8 space-y-8">
        <!-- Section Skeleton 1 -->
        <div>
          <Skeleton width="30%" height="1.25rem" class="mb-1" />
          <Skeleton width="50%" height="0.875rem" class="mb-5" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton v-for="n in 6" :key="`sk1-${n}`" width="100%" height="2.75rem" />
          </div>
        </div>

        <!-- Section Skeleton 2 -->
        <div>
          <Skeleton width="30%" height="1.25rem" class="mb-1" />
          <Skeleton width="50%" height="0.875rem" class="mb-5" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton v-for="n in 6" :key="`sk2-${n}`" width="100%" height="2.75rem" />
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <Skeleton width="10rem" height="2.5rem" />
          <Skeleton width="6rem" height="2.5rem" />
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- LOAD ERROR                                                          -->
    <!-- =================================================================== -->
    <template v-else-if="loadError">
      <div class="card p-10 text-center">
        <div class="flex justify-center mb-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/20">
            <i class="pi pi-exclamation-triangle text-2xl text-error-500 dark:text-error-400" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          Failed to Load Employee
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          {{ loadError }}
        </p>
        <div class="flex items-center justify-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Retry"
            severity="primary"
            @click="fetchEmployee"
          />
          <Button
            icon="pi pi-arrow-left"
            label="Go Back"
            severity="secondary"
            @click="handleCancel"
          />
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- FORM ERROR                                                          -->
    <!-- =================================================================== -->
    <Message
      v-if="formError && !pageLoading"
      severity="error"
      :closable="true"
      class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
    >
      {{ formError }}
    </Message>

    <!-- =================================================================== -->
    <!-- FORM CARD                                                            -->
    <!-- =================================================================== -->
    <div v-if="!pageLoading && !loadError" class="card p-6 sm:p-8">
      <form @submit.prevent="handleSubmit" novalidate>
        <!-- Section: Personal Information -->
        <div class="mb-8">
          <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
            Personal Information
          </h2>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-5">
            Basic details about the employee
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name -->
            <div>
              <label
                for="edit-name"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                First Name <span class="text-error-500">*</span>
              </label>
              <InputText
                id="edit-name"
                v-model="name"
                placeholder="e.g. John"
                :invalid="!!errors.name"
                class="w-full"
              />
              <small
                v-if="errors.name"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.name }}
              </small>
            </div>

            <!-- Lastname -->
            <div>
              <label
                for="edit-lastname"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Last Name <span class="text-error-500">*</span>
              </label>
              <InputText
                id="edit-lastname"
                v-model="lastname"
                placeholder="e.g. Doe"
                :invalid="!!errors.lastname"
                class="w-full"
              />
              <small
                v-if="errors.lastname"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.lastname }}
              </small>
            </div>

            <!-- Email -->
            <div>
              <label
                for="edit-email"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Email Address <span class="text-error-500">*</span>
              </label>
              <InputText
                id="edit-email"
                v-model="email"
                type="email"
                placeholder="e.g. john.doe@company.com"
                :invalid="!!errors.email"
                class="w-full"
              />
              <small
                v-if="errors.email"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.email }}
              </small>
            </div>

            <!-- Phone -->
            <div>
              <label
                for="edit-phone"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Phone Number <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <InputText
                id="edit-phone"
                v-model="phone"
                type="tel"
                placeholder="e.g. +57 300 123 4567"
                :invalid="!!errors.phone"
                class="w-full"
              />
              <small
                v-if="errors.phone"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.phone }}
              </small>
            </div>

            <!-- Document Type -->
            <div>
              <label
                for="edit-doctype"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Document Type <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <Select
                id="edit-doctype"
                v-model="documentType"
                :options="documentTypeOptions"
                option-label="label"
                option-value="value"
                placeholder="Select document type"
                class="w-full"
                show-clear
              />
            </div>

            <!-- Document Number -->
            <div>
              <label
                for="edit-docnum"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Document Number <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <InputText
                id="edit-docnum"
                v-model="documentNumber"
                placeholder="e.g. 1234567890"
                :invalid="!!errors.documentNumber"
                class="w-full"
              />
              <small
                v-if="errors.documentNumber"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.documentNumber }}
              </small>
            </div>
          </div>
        </div>

        <!-- Section: Employment Details -->
        <div class="mb-8">
          <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
            Employment Details
          </h2>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-5">
            Work-related information
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Position -->
            <div>
              <label
                for="edit-position"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Position <span class="text-error-500">*</span>
              </label>
              <InputText
                id="edit-position"
                v-model="position"
                placeholder="e.g. Software Engineer"
                :invalid="!!errors.position"
                class="w-full"
              />
              <small
                v-if="errors.position"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.position }}
              </small>
            </div>

            <!-- Area -->
            <div>
              <label
                for="edit-area"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Area / Department <span class="text-error-500">*</span>
              </label>
              <InputText
                id="edit-area"
                v-model="area"
                placeholder="e.g. Technology"
                :invalid="!!errors.area"
                class="w-full"
              />
              <small
                v-if="errors.area"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ errors.area }}
              </small>
            </div>

            <!-- Company -->
            <div>
              <label
                for="edit-company"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Company <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <Select
                id="edit-company"
                v-model="companyId"
                :options="companies"
                option-label="label"
                option-value="value"
                placeholder="Select a company"
                class="w-full"
                :loading="companiesLoading"
                show-clear
                filter
              />
            </div>

            <!-- Status -->
            <div>
              <label
                for="edit-status"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Status
              </label>
              <Select
                id="edit-status"
                v-model="status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="Select status"
                class="w-full"
              />
            </div>

            <!-- Hire Date -->
            <div>
              <label
                for="edit-hire-date"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Hire Date <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <DatePicker
                id="edit-hire-date"
                v-model="hireDate"
                placeholder="Select hire date"
                class="w-full"
                show-icon
                :max-date="new Date()"
              />
            </div>

            <!-- Salary -->
            <div>
              <label
                for="edit-salary"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Salary <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <InputNumber
                id="edit-salary"
                v-model="salary"
                placeholder="e.g. 3000000"
                mode="currency"
                currency="COP"
                locale="es-CO"
                :min="0"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-2 border-t border-surface-100 dark:border-surface-100">
          <Button
            type="submit"
            :label="saving ? 'Updating...' : 'Update Employee'"
            :loading="saving"
            :disabled="saving"
            severity="primary"
            icon="pi pi-check"
          />
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            :disabled="saving"
            @click="handleCancel"
          />
        </div>
      </form>
    </div>
  </div>
</template>
