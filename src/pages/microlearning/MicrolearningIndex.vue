<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMicrolearningStore } from '@/stores/microlearning'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { useDebounceFn } from '@vueuse/core'

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------
const microlearningStore = useMicrolearningStore()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const deletingId = ref(null)
const searchQuery = ref('')
const typeFilter = ref(null)

const typeOptions = [
  { label: 'All Types', value: null },
  { label: 'Video', value: 'video' },
  { label: 'Article', value: 'article' },
  { label: 'Quiz', value: 'quiz' },
]

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const items = computed(() => microlearningStore.microlearningItems)
const loading = computed(() => microlearningStore.loading)
const hasItems = computed(() => items.value.length > 0)

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------
async function fetchItems() {
  loadError.value = ''
  try {
    const params = {}
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (typeFilter.value) {
      params.type = typeFilter.value
    }
    await microlearningStore.fetchAll(params)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      microlearningStore.error ||
      'Failed to load microlearning items.'
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

const debouncedSearch = useDebounceFn(() => {
  fetchItems()
}, 400)

// Re-fetch when filters change
watch([searchQuery, typeFilter], () => {
  debouncedSearch()
})

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
function confirmDelete(item) {
  confirm.require({
    message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
    header: 'Delete Microlearning Item',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(item),
  })
}

async function handleDelete(item) {
  deletingId.value = item.id
  try {
    await microlearningStore.delete(item.id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `"${item.title}" has been deleted successfully.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      microlearningStore.error ||
      'Failed to delete microlearning item.'
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    deletingId.value = null
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function formatDuration(minutes) {
  if (minutes == null || minutes === '') return '—'
  const mins = Number(minutes)
  if (isNaN(mins)) return '—'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

function typeSeverity(type) {
  const map = {
    video: 'info',
    article: 'success',
    quiz: 'warn',
  }
  return map[type] || 'secondary'
}

function typeIcon(type) {
  const map = {
    video: 'pi pi-video',
    article: 'pi pi-file',
    quiz: 'pi pi-question-circle',
  }
  return map[type] || 'pi pi-file'
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchItems()
})
</script>

<template>
  <div class="microlearning-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Microlearning
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Manage short-form learning content — videos, articles, and quizzes
        </p>
      </div>

      <router-link :to="{ name: 'MicrolearningCreate' }">
        <Button
          icon="pi pi-plus"
          label="Add Content"
          severity="primary"
          size="small"
        />
      </router-link>
    </div>

    <!-- =================================================================== -->
    <!-- FILTERS BAR                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 max-w-sm">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm" />
        <InputText
          v-model="searchQuery"
          placeholder="Search by title..."
          class="w-full !pl-9"
        />
      </div>
      <Select
        v-model="typeFilter"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        placeholder="Filter by type"
        class="w-full sm:w-48"
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
      <div class="card p-4">
        <div class="space-y-3">
          <div v-for="n in 6" :key="n" class="flex items-center gap-4">
            <Skeleton width="30%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="15%" height="1.25rem" />
            <Skeleton width="5rem" height="2rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Empty State -->
      <div
        v-if="!hasItems && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-microchip-ai text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No microlearning content yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Create short-form videos, articles, or quizzes to engage your learners with bite-sized content.
        </p>
        <router-link :to="{ name: 'MicrolearningCreate' }">
          <Button
            icon="pi pi-plus"
            label="Add Content"
            severity="primary"
          />
        </router-link>
      </div>

      <!-- Data Table -->
      <div v-if="hasItems" class="card overflow-hidden">
        <DataTable
          :value="items"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="items.length > 10"
          :rows-per-page-options="[5, 10, 25]"
        >
          <!-- Title -->
          <Column field="title" header="Title" :sortable="true" class="min-w-[220px]">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <span
                  class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  :class="[
                    data.type === 'video'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : data.type === 'article'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                  ]"
                >
                  <i :class="typeIcon(data.type)" class="text-sm" />
                </span>
                <span class="text-sm font-medium text-surface-800 dark:text-surface-600">
                  {{ data.title }}
                </span>
              </div>
            </template>
          </Column>

          <!-- Type -->
          <Column field="type" header="Type" :sortable="true" class="min-w-[100px]">
            <template #body="{ data }">
              <Tag
                :value="data.type"
                :severity="typeSeverity(data.type)"
                class="!text-xs !font-medium capitalize"
              />
            </template>
          </Column>

          <!-- Duration -->
          <Column header="Duration" class="min-w-[100px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ formatDuration(data.duration) }}
              </span>
            </template>
          </Column>

          <!-- Scheduled At -->
          <Column field="scheduled_at" header="Scheduled" :sortable="true" class="min-w-[140px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.scheduled_at) }}
              </span>
            </template>
          </Column>

          <!-- Created At -->
          <Column field="created_at" header="Created" :sortable="true" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" class="min-w-[100px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <router-link :to="{ name: 'MicrolearningAssign' }">
                  <Button
                    icon="pi pi-user-plus"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    v-tooltip.top="'Assign'"
                  />
                </router-link>
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Delete'"
                  :loading="deletingId === data.id"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
