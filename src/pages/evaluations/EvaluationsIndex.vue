<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEvaluationsStore } from '@/stores/evaluations'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const evaluationsStore = useEvaluationsStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const selectedStatus = ref(null)

let searchTimer = null

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
]

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const evaluations = computed(() => evaluationsStore.evaluations)
const loading = computed(() => evaluationsStore.loading)

const hasEvaluations = computed(() => evaluations.value.length > 0)

const filteredEvaluations = computed(() => {
  let list = evaluations.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.replace(/<[^>]*>/g, '').toLowerCase().includes(q)),
    )
  }

  if (selectedStatus.value) {
    list = list.filter((e) => e.status === selectedStatus.value)
  }

  return list
})

const displayEvaluations = computed(() => filteredEvaluations.value)

const hasActiveFilters = computed(() => !!selectedStatus.value)

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchInitialData() {
  loadError.value = ''
  try {
    await evaluationsStore.fetchAll()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to load evaluations.'
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

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    // Client-side filtering
  }, 300)
}

function navigateToCreate() {
  router.push({ name: 'EvaluationCreate' })
}

function navigateToEdit(id) {
  router.push({ name: 'EvaluationEdit', params: { id } })
}

function navigateToTake(id) {
  router.push({ name: 'EvaluationTake', params: { id } })
}

function navigateToResults(attemptId) {
  router.push({ name: 'EvaluationResults', params: { id: attemptId } })
}

function confirmDelete(id, title) {
  confirm.require({
    message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    header: 'Delete Evaluation',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(id, title),
  })
}

async function handleDelete(id, title) {
  try {
    await evaluationsStore.delete(id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Evaluation "${title}" has been deleted.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to delete evaluation.'
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: message,
      life: 6000,
    })
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedStatus.value = null
}

function getStatusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
    case 'archived':
      return 'Archived'
    default:
      return status || 'Unknown'
  }
}

function getStatusSeverity(status) {
  switch (status) {
    case 'draft':
      return 'warn'
    case 'active':
      return 'success'
    case 'completed':
      return 'info'
    case 'archived':
      return 'danger'
    default:
      return 'secondary'
  }
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

function truncateText(text, maxLength = 100) {
  if (!text) return '—'
  const stripped = text.replace(/<[^>]*>/g, '')
  if (stripped.length <= maxLength) return stripped
  return stripped.substring(0, maxLength) + '...'
}

function questionsCount(evaluation) {
  if (evaluation.questions_count !== undefined && evaluation.questions_count !== null) {
    return evaluation.questions_count
  }
  if (evaluation.questions && Array.isArray(evaluation.questions)) {
    return evaluation.questions.length
  }
  return 0
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="evaluations-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Evaluations
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Manage evaluations and assessments for learners
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-plus"
          label="Create Evaluation"
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
      <div class="flex gap-2 flex-wrap">
        <Skeleton v-for="n in 4" :key="`status-skel-${n}`" width="6rem" height="2.25rem" />
      </div>
      <Skeleton width="100%" height="2.75rem" class="sm:!w-72" />

      <div class="card overflow-hidden">
        <div class="space-y-3 p-4">
          <div v-for="n in 8" :key="`row-skel-${n}`" class="flex items-center gap-4">
            <Skeleton width="30%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="12%" height="1.25rem" />
            <Skeleton width="5rem" height="2rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Filters Row -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <!-- Status Filter -->
        <div class="flex gap-2 flex-wrap">
          <Button
            label="All Statuses"
            :severity="!selectedStatus ? 'primary' : 'secondary'"
            :outlined="!!selectedStatus"
            size="small"
            @click="selectedStatus = null"
          />
          <Button
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :severity="selectedStatus === opt.value ? 'primary' : 'secondary'"
            :outlined="selectedStatus !== opt.value"
            size="small"
            @click="selectedStatus = selectedStatus === opt.value ? null : opt.value"
          />
        </div>

        <!-- Clear Filters -->
        <Button
          v-if="hasActiveFilters"
          icon="pi pi-times"
          label="Clear"
          severity="secondary"
          text
          size="small"
          @click="clearFilters"
        />
      </div>

      <!-- Search Bar -->
      <div class="flex items-center gap-3 flex-wrap">
        <IconField class="w-full sm:w-80">
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            v-model="searchQuery"
            placeholder="Search evaluations..."
            class="w-full"
            @input="onSearchInput"
          />
        </IconField>
        <span class="text-sm text-surface-400 dark:text-surface-500">
          {{ displayEvaluations.length }} evaluation{{ displayEvaluations.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty State: No Evaluations at All -->
      <div
        v-if="!hasEvaluations && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-check-square text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No evaluations yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Create your first evaluation to assess learner knowledge and progress.
        </p>
        <Button
          icon="pi pi-plus"
          label="Create Evaluation"
          severity="primary"
          @click="navigateToCreate"
        />
      </div>

      <!-- Empty State: No Results for Filter -->
      <div
        v-else-if="hasEvaluations && displayEvaluations.length === 0 && !loading"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-filter-slash text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No matching evaluations
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto mb-4">
          Try adjusting your search or status filter.
        </p>
        <Button
          icon="pi pi-times"
          label="Clear Filters"
          severity="secondary"
          size="small"
          @click="clearFilters"
        />
      </div>

      <!-- Data Table -->
      <div v-if="displayEvaluations.length > 0" class="card overflow-hidden">
        <DataTable
          :value="displayEvaluations"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="displayEvaluations.length > 10"
          :rows-per-page-options="[5, 10, 25, 50]"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          current-page-report-template="Showing {first} to {last} of {totalRecords}"
        >
          <!-- Title -->
          <Column header="Title" class="min-w-[240px]">
            <template #body="{ data }">
              <div class="min-w-0 cursor-pointer" @click="navigateToEdit(data.id)">
                <p class="text-sm font-medium text-surface-800 dark:text-surface-600 line-clamp-1">
                  {{ data.title || 'Untitled Evaluation' }}
                </p>
                <p class="text-xs text-surface-400 dark:text-surface-500 line-clamp-1 mt-0.5">
                  {{ truncateText(data.description, 60) }}
                </p>
              </div>
            </template>
          </Column>

          <!-- Questions -->
          <Column header="Questions" class="min-w-[100px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ questionsCount(data) }}
              </span>
            </template>
          </Column>

          <!-- Passing Score -->
          <Column field="passing_score" header="Passing Score" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ data.passing_score != null ? data.passing_score + '%' : '—' }}
              </span>
            </template>
          </Column>

          <!-- Time Limit -->
          <Column field="time_limit" header="Time Limit" class="min-w-[120px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ data.time_limit ? data.time_limit + ' min' : '—' }}
              </span>
            </template>
          </Column>

          <!-- Status -->
          <Column field="status" header="Status" :sortable="true" class="min-w-[120px]">
            <template #body="{ data }">
              <Tag
                :value="getStatusLabel(data.status)"
                :severity="getStatusSeverity(data.status)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- Created -->
          <Column field="created_at" header="Created" :sortable="true" class="min-w-[120px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" class="min-w-[160px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-play"
                  severity="primary"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Take Evaluation'"
                  @click="navigateToTake(data.id)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Edit'"
                  @click="navigateToEdit(data.id)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Delete'"
                  @click="confirmDelete(data.id, data.title || 'Untitled')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
