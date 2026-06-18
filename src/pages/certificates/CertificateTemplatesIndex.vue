<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificatesStore } from '@/stores/certificates'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const certificatesStore = useCertificatesStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const deletingId = ref(null)

let searchTimer = null

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const templates = computed(() => certificatesStore.templates)
const loading = computed(() => certificatesStore.loading)
const hasTemplates = computed(() => templates.value.length > 0)

const filteredTemplates = computed(() => {
  let list = templates.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)),
    )
  }

  return list
})

const displayTemplates = computed(() => filteredTemplates.value)
const hasActiveFilters = computed(() => !!searchQuery.value.trim())

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchInitialData() {
  loadError.value = ''
  try {
    await certificatesStore.fetchTemplates()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      'Failed to load certificate templates.'
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

function clearSearch() {
  searchQuery.value = ''
}

function navigateToCreate() {
  router.push({ name: 'CertificateTemplateCreate' })
}

function navigateToEdit(id) {
  router.push({ name: 'CertificateTemplateEdit', params: { id } })
}

function navigateToCertificates() {
  router.push({ name: 'Certificates' })
}

function confirmDelete(id, name) {
  confirm.require({
    message: `Are you sure you want to delete the template "${name}"? This action cannot be undone.`,
    header: 'Delete Template',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(id, name),
  })
}

async function handleDelete(id, name) {
  deletingId.value = id
  try {
    await certificatesStore.deleteTemplate(id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Template "${name}" has been deleted.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      'Failed to delete template.'
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
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="certificate-templates-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Certificate Templates
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Design and manage templates for certificates
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-arrow-left"
          label="Back to Certificates"
          severity="secondary"
          size="small"
          @click="navigateToCertificates"
        />
        <Button
          icon="pi pi-plus"
          label="Create Template"
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
      <Skeleton width="100%" height="2.75rem" class="sm:!w-72" />

      <div class="card overflow-hidden">
        <div class="space-y-3 p-4">
          <div v-for="n in 8" :key="`row-skel-${n}`" class="flex items-center gap-4">
            <Skeleton width="25%" height="1.25rem" />
            <Skeleton width="35%" height="1.25rem" />
            <Skeleton width="12%" height="1.25rem" />
            <Skeleton width="4rem" height="2rem" />
            <Skeleton width="4rem" height="2rem" />
            <Skeleton width="4rem" height="2rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Search Bar -->
      <div class="flex items-center gap-3 flex-wrap">
        <IconField class="w-full sm:w-80">
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            v-model="searchQuery"
            placeholder="Search templates..."
            class="w-full"
            @input="onSearchInput"
          />
        </IconField>

        <Button
          v-if="hasActiveFilters"
          icon="pi pi-times"
          label="Clear"
          severity="secondary"
          text
          size="small"
          @click="clearSearch"
        />

        <span class="text-sm text-surface-400 dark:text-surface-500">
          {{ displayTemplates.length }} template{{ displayTemplates.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty State: No Templates at All -->
      <div
        v-if="!hasTemplates && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-palette text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No templates yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Create your first certificate template to define the look and feel of issued certificates.
        </p>
        <Button
          icon="pi pi-plus"
          label="Create Template"
          severity="primary"
          @click="navigateToCreate"
        />
      </div>

      <!-- Empty State: No Results for Filter -->
      <div
        v-else-if="hasTemplates && displayTemplates.length === 0 && !loading"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-filter-slash text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No matching templates
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto mb-4">
          Try adjusting your search criteria.
        </p>
        <Button
          icon="pi pi-times"
          label="Clear Search"
          severity="secondary"
          size="small"
          @click="clearSearch"
        />
      </div>

      <!-- Data Table -->
      <div v-if="displayTemplates.length > 0" class="card overflow-hidden">
        <DataTable
          :value="displayTemplates"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="displayTemplates.length > 10"
          :rows-per-page-options="[5, 10, 25, 50]"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          current-page-report-template="Showing {first} to {last} of {totalRecords}"
        >
          <!-- Template Name -->
          <Column header="Template Name" class="min-w-[200px]">
            <template #body="{ data }">
              <div class="cursor-pointer" @click="navigateToEdit(data.id)">
                <p class="text-sm font-medium text-surface-800 dark:text-surface-600">
                  {{ data.name || 'Untitled Template' }}
                </p>
              </div>
            </template>
          </Column>

          <!-- Description -->
          <Column header="Description" class="min-w-[280px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500 line-clamp-2">
                {{ truncateText(data.description) }}
              </span>
            </template>
          </Column>

          <!-- Created Date -->
          <Column header="Created" field="created_at" :sortable="true" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" class="min-w-[150px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
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
                  :loading="deletingId === data.id"
                  @click="confirmDelete(data.id, data.name || 'Untitled Template')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
