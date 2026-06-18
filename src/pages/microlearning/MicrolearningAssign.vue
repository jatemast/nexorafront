<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMicrolearningStore } from '@/stores/microlearning'
import { useEmployeesStore } from '@/stores/employees'
import { useToast } from 'primevue/usetoast'
import api from '@/services/api'
import Button from 'primevue/button'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Calendar from 'primevue/calendar'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Card from 'primevue/card'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const microlearningStore = useMicrolearningStore()
const employeesStore = useEmployeesStore()
const toast = useToast()
const router = useRouter()

// ---------------------------------------------------------------------------
// State — Data loading
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')

// ---------------------------------------------------------------------------
// Options data
// ---------------------------------------------------------------------------
const microlearningOptions = computed(() =>
  microlearningStore.microlearningItems.map((item) => ({
    label: item.title,
    value: item.id,
    type: item.type,
  }))
)

const employeeOptions = computed(() =>
  employeesStore.employees.map((emp) => ({
    label: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email,
    value: emp.id,
  }))
)

const areaOptions = ref([])
const positionOptions = ref([])

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
const formSubmitted = ref(false)
const saving = ref(false)

const formMicrolearningId = ref(null)
const formEmployeeIds = ref([])
const formAreaIds = ref([])
const formPositionIds = ref([])
const formDueDate = ref(null)

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const formErrors = computed(() => {
  const errs = {}
  if (!formSubmitted.value) return errs

  if (!formMicrolearningId.value) {
    errs.microlearning_id = 'Please select a microlearning item.'
  }

  const hasEmployee = formEmployeeIds.value.length > 0
  const hasArea = formAreaIds.value.length > 0
  const hasPosition = formPositionIds.value.length > 0

  if (!hasEmployee && !hasArea && !hasPosition) {
    errs.assignees = 'Please select at least one employee, area, or position.'
  }

  if (!formDueDate.value) {
    errs.due_date = 'Due date is required.'
  } else if (formDueDate.value instanceof Date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(formDueDate.value)
    due.setHours(0, 0, 0, 0)
    if (due < today) {
      errs.due_date = 'Due date cannot be in the past.'
    }
  }

  return errs
})

const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------
async function fetchPageData() {
  loadError.value = ''
  initialLoading.value = true

  try {
    // Fetch microlearning items and employees in parallel
    const promises = [
      microlearningStore.fetchAll({ per_page: 100 }),
      employeesStore.fetchAll({ per_page: 500 }),
      fetchAreas(),
      fetchPositions(),
    ]

    await Promise.all(promises)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      'Failed to load required data. Please try again.'
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

async function fetchAreas() {
  try {
    const { data } = await api.get('/areas', { params: { per_page: 200 } })
    const items = data.data || data
    areaOptions.value = (Array.isArray(items) ? items : []).map((area) => ({
      label: area.name || area.title || `Area #${area.id}`,
      value: area.id,
    }))
  } catch {
    // Areas may not be available in all environments
    areaOptions.value = []
  }
}

async function fetchPositions() {
  try {
    const { data } = await api.get('/positions', { params: { per_page: 200 } })
    const items = data.data || data
    positionOptions.value = (Array.isArray(items) ? items : []).map((pos) => ({
      label: pos.name || pos.title || `Position #${pos.id}`,
      value: pos.id,
    }))
  } catch {
    // Positions may not be available in all environments
    positionOptions.value = []
  }
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------
async function handleSubmit() {
  formSubmitted.value = true

  if (hasFormErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the form errors before saving.',
      life: 5000,
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      microlearning_id: formMicrolearningId.value,
      user_ids: formEmployeeIds.value,
      due_date: formDueDate.value instanceof Date
        ? formDueDate.value.toISOString()
        : formDueDate.value,
    }

    if (formAreaIds.value.length > 0) {
      payload.area_ids = formAreaIds.value
    }

    if (formPositionIds.value.length > 0) {
      payload.position_ids = formPositionIds.value
    }

    await microlearningStore.assign(payload)

    // Get the title for the success message
    const selectedItem = microlearningStore.microlearningItems.find(
      (m) => m.id === formMicrolearningId.value
    )
    const itemTitle = selectedItem?.title || 'content'

    const assigneeCount =
      formEmployeeIds.value.length +
      formAreaIds.value.length +
      formPositionIds.value.length

    toast.add({
      severity: 'success',
      summary: 'Assignment Created',
      detail: `"${itemTitle}" has been assigned to ${assigneeCount} recipient(s).`,
      life: 4000,
    })

    router.push({ name: 'Microlearning' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      microlearningStore.error ||
      'Failed to create the assignment.'

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 6000,
    })
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------
function handleCancel() {
  router.push({ name: 'Microlearning' })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTypeIcon(type) {
  const icons = {
    video: 'pi pi-video',
    article: 'pi pi-file',
    quiz: 'pi pi-question-circle',
  }
  return icons[type] || 'pi pi-file'
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchPageData()
})
</script>

<template>
  <div class="microlearning-assign-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Assign Microlearning Content
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Assign microlearning items to employees, areas, or positions with a due date
        </p>
      </div>

      <Button
        icon="pi pi-arrow-left"
        label="Back to List"
        severity="secondary"
        size="small"
        @click="handleCancel"
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

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="initialLoading">
      <div class="card p-6 space-y-5">
        <Skeleton width="30%" height="1.5rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="30%" height="1.5rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="20%" height="1.5rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="20%" height="1.5rem" />
        <Skeleton width="100%" height="2.75rem" />
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- FORM CARD                                                           -->
    <!-- =================================================================== -->
    <template v-else>
      <Card
        class="!rounded-xl !shadow-sm !border-surface-200 dark:!border-surface-200"
        :pt="{
          body: { class: '!p-6' },
        }"
      >
        <form @submit.prevent="handleSubmit" novalidate class="space-y-6">
          <!-- Microlearning Content Dropdown -->
          <div>
            <label
              for="ml-select"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Microlearning Content <span class="text-error-500">*</span>
            </label>
            <Select
              id="ml-select"
              v-model="formMicrolearningId"
              :options="microlearningOptions"
              option-label="label"
              option-value="value"
              placeholder="Select content to assign..."
              :invalid="!!formErrors.microlearning_id"
              class="w-full max-w-xl"
              filter
              :filter-fields="['label']"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <i
                    :class="getTypeIcon(
                      microlearningOptions.find(o => o.value === slotProps.value)?.type
                    )"
                    class="text-surface-500 text-sm"
                  />
                  <span>{{ microlearningOptions.find(o => o.value === slotProps.value)?.label }}</span>
                </div>
                <span v-else class="text-surface-400">
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-3">
                  <i :class="getTypeIcon(slotProps.option.type)" class="text-surface-400 text-sm" />
                  <div>
                    <div class="text-sm font-medium">{{ slotProps.option.label }}</div>
                    <div class="text-xs text-surface-400 capitalize">{{ slotProps.option.type }}</div>
                  </div>
                </div>
              </template>
            </Select>
            <small
              v-if="formErrors.microlearning_id"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ formErrors.microlearning_id }}
            </small>
          </div>

          <!-- Employees Multi-Select -->
          <div>
            <label
              for="ml-employees"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Employees
            </label>
            <MultiSelect
              id="ml-employees"
              v-model="formEmployeeIds"
              :options="employeeOptions"
              option-label="label"
              option-value="value"
              placeholder="Select employees..."
              :max-selected-labels="3"
              :invalid="!!formErrors.assignees && formEmployeeIds.length === 0 && formAreaIds.length === 0 && formPositionIds.length === 0"
              class="w-full max-w-xl"
              filter
              :filter-fields="['label']"
              display="chip"
            />
            <small class="text-surface-400 text-xs mt-1 block">
              Search and select the employees to assign this content to.
            </small>
          </div>

          <!-- Areas Multi-Select -->
          <div v-if="areaOptions.length > 0">
            <label
              for="ml-areas"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Areas
            </label>
            <MultiSelect
              id="ml-areas"
              v-model="formAreaIds"
              :options="areaOptions"
              option-label="label"
              option-value="value"
              placeholder="Select areas..."
              :max-selected-labels="3"
              class="w-full max-w-xl"
              filter
              :filter-fields="['label']"
              display="chip"
            />
            <small class="text-surface-400 text-xs mt-1 block">
              Assign to entire areas (all members will receive this content).
            </small>
          </div>

          <!-- Positions Multi-Select -->
          <div v-if="positionOptions.length > 0">
            <label
              for="ml-positions"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Positions
            </label>
            <MultiSelect
              id="ml-positions"
              v-model="formPositionIds"
              :options="positionOptions"
              option-label="label"
              option-value="value"
              placeholder="Select positions..."
              :max-selected-labels="3"
              class="w-full max-w-xl"
              filter
              :filter-fields="['label']"
              display="chip"
            />
            <small class="text-surface-400 text-xs mt-1 block">
              Assign to employees by position or role.
            </small>
          </div>

          <!-- Assignee Validation Error -->
          <small
            v-if="formErrors.assignees"
            class="text-error-500 dark:text-error-400 text-xs block -mt-3"
          >
            {{ formErrors.assignees }}
          </small>

          <!-- Due Date -->
          <div>
            <label
              for="ml-due-date"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Due Date <span class="text-error-500">*</span>
            </label>
            <Calendar
              id="ml-due-date"
              v-model="formDueDate"
              show-time
              hour-format="12"
              placeholder="Select due date..."
              :min-date="new Date()"
              :invalid="!!formErrors.due_date"
              class="w-full max-w-sm"
            />
            <small
              v-if="formErrors.due_date"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ formErrors.due_date }}
            </small>
            <small v-else class="text-surface-400 text-xs mt-1 block">
              The deadline by which recipients must complete this content.
            </small>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-200">
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              :disabled="saving"
              @click="handleCancel"
            />
            <Button
              type="submit"
              :label="saving ? 'Assigning...' : 'Assign Content'"
              severity="primary"
              :loading="saving"
              :disabled="saving"
              icon="pi pi-user-plus"
            />
          </div>
        </form>
      </Card>
    </template>
  </div>
</template>
