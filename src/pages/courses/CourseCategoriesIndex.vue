<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------
const coursesStore = useCoursesStore()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const saving = ref(false)

// Dialog state
const dialogVisible = ref(false)
const dialogMode = ref('create') // 'create' | 'edit'
const dialogTitle = computed(() =>
  dialogMode.value === 'create' ? 'Create Category' : 'Edit Category',
)
const editingCategoryId = ref(null)

// Form state
const formName = ref('')
const formDescription = ref('')
const formSubmitted = ref(false)

// Delete tracking
const deletingId = ref(null)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const categories = computed(() => coursesStore.categories)
const loading = computed(() => coursesStore.loading)
const hasCategories = computed(() => categories.value.length > 0)

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const formErrors = computed(() => {
  const errs = {}
  if (!formSubmitted.value) return errs

  if (!formName.value.trim()) {
    errs.name = 'Category name is required.'
  } else if (formName.value.trim().length < 2) {
    errs.name = 'Name must be at least 2 characters.'
  }

  return errs
})

const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------
async function fetchCategories() {
  loadError.value = ''
  try {
    await coursesStore.fetchCategories()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to load categories.'
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

// ---------------------------------------------------------------------------
// Dialog Management
// ---------------------------------------------------------------------------
function openCreateDialog() {
  dialogMode.value = 'create'
  editingCategoryId.value = null
  formName.value = ''
  formDescription.value = ''
  formSubmitted.value = false
  dialogVisible.value = true
}

function openEditDialog(category) {
  dialogMode.value = 'edit'
  editingCategoryId.value = category.id
  formName.value = category.name || ''
  formDescription.value = category.description || ''
  formSubmitted.value = false
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  formSubmitted.value = false
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------
async function handleSave() {
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
      name: formName.value.trim(),
      description: formDescription.value.trim() || undefined,
    }

    if (dialogMode.value === 'create') {
      await coursesStore.createCategory(payload)
      toast.add({
        severity: 'success',
        summary: 'Category Created',
        detail: `"${payload.name}" has been created successfully.`,
        life: 4000,
      })
    } else {
      await coursesStore.updateCategory(editingCategoryId.value, payload)
      toast.add({
        severity: 'success',
        summary: 'Category Updated',
        detail: `"${payload.name}" has been updated successfully.`,
        life: 4000,
      })
    }

    closeDialog()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      `Failed to ${dialogMode.value === 'create' ? 'create' : 'update'} category.`

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

function confirmDelete(category) {
  confirm.require({
    message: `Are you sure you want to delete "${category.name}"? This action cannot be undone. Courses in this category will need to be reassigned.`,
    header: 'Delete Category',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(category),
  })
}

async function handleDelete(category) {
  deletingId.value = category.id
  try {
    await coursesStore.deleteCategory(category.id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Category "${category.name}" has been deleted.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to delete category.'
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

function courseCount(category) {
  if (category.courses_count !== undefined) return category.courses_count
  if (category.courses && Array.isArray(category.courses)) return category.courses.length
  return '—'
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="course-categories-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Course Categories
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Manage course categories for the learning platform
        </p>
      </div>

      <Button
        icon="pi pi-plus"
        label="Add Category"
        severity="primary"
        size="small"
        @click="openCreateDialog"
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
            <Skeleton width="40%" height="1.25rem" />
            <Skeleton width="30%" height="1.25rem" />
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
        v-if="!hasCategories && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-tags text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No categories yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Create your first course category to start organizing your courses.
        </p>
        <Button
          icon="pi pi-plus"
          label="Add Category"
          severity="primary"
          @click="openCreateDialog"
        />
      </div>

      <!-- Data Table -->
      <div v-if="hasCategories" class="card overflow-hidden">
        <DataTable
          :value="categories"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="categories.length > 10"
          :rows-per-page-options="[5, 10, 25]"
        >
          <!-- Name -->
          <Column field="name" header="Name" :sortable="true" class="min-w-[200px]">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center">
                  <i class="pi pi-tag text-sm" />
                </span>
                <span class="text-sm font-medium text-surface-800 dark:text-surface-600">
                  {{ data.name }}
                </span>
              </div>
            </template>
          </Column>

          <!-- Description -->
          <Column field="description" header="Description" class="min-w-[250px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ data.description || '—' }}
              </span>
            </template>
          </Column>

          <!-- Courses Count -->
          <Column header="Courses" class="min-w-[100px]">
            <template #body="{ data }">
              <Tag
                :value="String(courseCount(data))"
                severity="info"
                class="!text-xs !font-medium"
              />
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
          <Column header="Actions" class="min-w-[120px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Edit'"
                  @click="openEditDialog(data)"
                />
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

    <!-- =================================================================== -->
    <!-- CREATE / EDIT DIALOG                                                -->
    <!-- =================================================================== -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogTitle"
      :modal="true"
      :closable="!saving"
      :draggable="false"
      :style="{ width: '500px' }"
      :pt="{
        root: { class: '!rounded-2xl !shadow-2xl !border-surface-200 dark:!border-surface-200' },
        header: { class: '!text-lg !font-semibold !text-surface-900 dark:!text-surface-950 !px-6 !pt-6 !pb-4' },
        content: { class: '!px-6 !pb-6' },
      }"
    >
      <form @submit.prevent="handleSave" novalidate class="space-y-5">
        <!-- Name -->
        <div>
          <label
            for="cat-name"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Category Name <span class="text-error-500">*</span>
          </label>
          <InputText
            id="cat-name"
            v-model="formName"
            placeholder="e.g. Technology"
            :invalid="!!formErrors.name"
            class="w-full"
            autofocus
          />
          <small
            v-if="formErrors.name"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.name }}
          </small>
        </div>

        <!-- Description -->
        <div>
          <label
            for="cat-description"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Description <span class="text-surface-400 font-normal">(optional)</span>
          </label>
          <Textarea
            id="cat-description"
            v-model="formDescription"
            placeholder="Brief description of this category..."
            rows="3"
            class="w-full"
            auto-resize
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-surface-100 dark:border-surface-200">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            :disabled="saving"
            @click="closeDialog"
          />
          <Button
            type="submit"
            :label="saving ? 'Saving...' : dialogMode === 'create' ? 'Create Category' : 'Update Category'"
            severity="primary"
            :loading="saving"
            :disabled="saving"
            icon="pi pi-check"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>
