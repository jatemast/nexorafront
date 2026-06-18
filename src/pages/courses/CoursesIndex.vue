<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import SelectButton from 'primevue/selectbutton'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const coursesStore = useCoursesStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const selectedCategory = ref(null)
const viewMode = ref('grid')

const viewModeOptions = [
  { label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
  { label: 'List', value: 'list', icon: 'pi pi-list' },
]

let searchTimer = null

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const courses = computed(() => coursesStore.courses)
const categories = computed(() => coursesStore.categories)
const loading = computed(() => coursesStore.loading)

const hasCourses = computed(() => courses.value.length > 0)
const hasCategories = computed(() => categories.value.length > 0)

const filteredCourses = computed(() => {
  let list = courses.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.instructor_name && c.instructor_name.toLowerCase().includes(q)),
    )
  }

  if (selectedCategory.value) {
    list = list.filter(
      (c) =>
        c.category_id === selectedCategory.value ||
        (c.category && c.category.id === selectedCategory.value),
    )
  }

  return list
})

const displayCourses = computed(() => filteredCourses.value)

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchInitialData() {
  loadError.value = ''
  try {
    await Promise.all([
      coursesStore.fetchAll(),
      coursesStore.fetchCategories(),
    ])
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to load courses.'
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
    // Client-side filtering; for server-side, call fetchAll with search param
  }, 300)
}

function selectCategory(categoryId) {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId
}

function navigateToCreate() {
  router.push({ name: 'CourseCreate' })
}

function navigateToDetail(id) {
  router.push({ name: 'CourseDetail', params: { id } })
}

function navigateToEdit(id) {
  router.push({ name: 'CourseEdit', params: { id } })
}

function confirmDelete(id, title) {
  confirm.require({
    message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    header: 'Delete Course',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(id, title),
  })
}

async function handleDelete(id, title) {
  try {
    await coursesStore.delete(id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Course "${title}" has been deleted.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to delete course.'
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: message,
      life: 6000,
    })
  }
}

function getStatusSeverity(status) {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'warn'
    case 'archived':
      return 'danger'
    default:
      return 'info'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'published':
      return 'Published'
    case 'draft':
      return 'Draft'
    case 'archived':
      return 'Archived'
    default:
      return status || 'Unknown'
  }
}

function courseImage(course) {
  if (course.image_url) return course.image_url
  if (course.image) return course.image
  return null
}

function truncateText(text, maxLength = 120) {
  if (!text) return ''
  const stripped = text.replace(/<[^>]*>/g, '')
  if (stripped.length <= maxLength) return stripped
  return stripped.substring(0, maxLength) + '...'
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
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="courses-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Courses
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Browse and manage all learning courses
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <SelectButton
          v-model="viewMode"
          :options="viewModeOptions"
          option-label="label"
          option-value="value"
          size="small"
          :allow-empty="false"
        >
          <template #option="{ option }">
            <i :class="option.icon" class="mr-1" />
            <span>{{ option.label }}</span>
          </template>
        </SelectButton>
        <Button
          icon="pi pi-plus"
          label="Create Course"
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
      <!-- Category Tabs Skeleton -->
      <div class="flex gap-2 flex-wrap">
        <Skeleton v-for="n in 5" :key="`cat-skel-${n}`" width="6rem" height="2.25rem" />
      </div>

      <!-- Search Skeleton -->
      <Skeleton width="100%" height="2.75rem" class="sm:!w-72" />

      <!-- Cards Skeleton -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="`card-skel-${n}`" class="card overflow-hidden">
          <Skeleton width="100%" height="10rem" class="!rounded-none" />
          <div class="p-4 space-y-3">
            <Skeleton width="70%" height="1.25rem" />
            <Skeleton width="100%" height="0.875rem" />
            <Skeleton width="100%" height="0.875rem" />
            <div class="flex items-center gap-2 pt-2">
              <Skeleton width="4rem" height="1.5rem" />
              <Skeleton width="4rem" height="1.5rem" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Category Filter Tabs -->
      <div v-if="hasCategories" class="flex gap-2 flex-wrap">
        <Button
          :label="'All'"
          :severity="!selectedCategory ? 'primary' : 'secondary'"
          :outlined="!!selectedCategory"
          size="small"
          @click="selectedCategory = null"
        />
        <Button
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :severity="selectedCategory === cat.id ? 'primary' : 'secondary'"
          :outlined="selectedCategory !== cat.id"
          size="small"
          @click="selectCategory(cat.id)"
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
            placeholder="Search courses by title, description..."
            class="w-full"
            @input="onSearchInput"
          />
        </IconField>
        <span class="text-sm text-surface-400 dark:text-surface-500">
          {{ displayCourses.length }} course{{ displayCourses.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty State: No Courses at All -->
      <div
        v-if="!hasCourses && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-book text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No courses yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Get started by creating your first course for the learning platform.
        </p>
        <Button
          icon="pi pi-plus"
          label="Create Course"
          severity="primary"
          @click="navigateToCreate"
        />
      </div>

      <!-- Empty State: No Results for Filter -->
      <div
        v-else-if="hasCourses && displayCourses.length === 0 && !loading"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-filter-slash text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No matching courses
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto">
          Try adjusting your search or category filter.
        </p>
      </div>

      <!-- Card Grid View -->
      <div
        v-if="viewMode === 'grid' && displayCourses.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
          v-for="course in displayCourses"
          :key="course.id"
          class="card overflow-hidden group cursor-pointer transition-shadow hover:shadow-lg"
          @click="navigateToDetail(course.id)"
        >
          <!-- Course Image -->
          <div class="relative h-40 bg-surface-100 dark:bg-surface-200 overflow-hidden">
            <img
              v-if="courseImage(course)"
              :src="courseImage(course)"
              :alt="course.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <i class="pi pi-image text-4xl text-surface-300 dark:text-surface-600" />
            </div>
            <!-- Status Badge -->
            <Tag
              :value="getStatusLabel(course.status)"
              :severity="getStatusSeverity(course.status)"
              class="!absolute !top-3 !right-3 !text-xs !font-medium"
            />
          </div>

          <!-- Card Content -->
          <div class="p-4">
            <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-600 line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ course.title }}
            </h3>
            <p class="text-xs text-surface-500 dark:text-surface-500 line-clamp-2 mb-3">
              {{ truncateText(course.description, 100) }}
            </p>

            <!-- Meta Info -->
            <div class="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500 mb-3">
              <span v-if="course.instructor_name" class="flex items-center gap-1">
                <i class="pi pi-user" />
                {{ course.instructor_name }}
              </span>
              <span v-if="course.category || course.category_name" class="flex items-center gap-1">
                <i class="pi pi-tag" />
                {{ course.category?.name || course.category_name }}
              </span>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-200">
              <span class="text-xs text-surface-400 dark:text-surface-500">
                {{ formatDate(course.created_at) }}
              </span>
              <div class="flex items-center gap-1" @click.stop>
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Edit'"
                  @click="navigateToEdit(course.id)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Delete'"
                  @click="confirmDelete(course.id, course.title)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List / Table View -->
      <div v-if="viewMode === 'list' && displayCourses.length > 0" class="card overflow-hidden">
        <DataTable
          :value="displayCourses"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="displayCourses.length > 10"
          :rows-per-page-options="[5, 10, 25]"
        >
          <Column header="Course" class="min-w-[280px]">
            <template #body="{ data }">
              <div class="flex items-center gap-3 cursor-pointer" @click="navigateToDetail(data.id)">
                <div class="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-200 overflow-hidden flex-shrink-0">
                  <img
                    v-if="courseImage(data)"
                    :src="courseImage(data)"
                    :alt="data.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <i class="pi pi-image text-lg text-surface-300 dark:text-surface-600" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-surface-800 dark:text-surface-600 truncate">
                    {{ data.title }}
                  </p>
                  <p class="text-xs text-surface-400 dark:text-surface-500 truncate">
                    {{ truncateText(data.description, 60) }}
                  </p>
                </div>
              </div>
            </template>
          </Column>
          <Column field="category" header="Category" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ data.category?.name || data.category_name || '—' }}
              </span>
            </template>
          </Column>
          <Column field="instructor_name" header="Instructor" class="min-w-[150px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ data.instructor_name || '—' }}
              </span>
            </template>
          </Column>
          <Column field="status" header="Status" class="min-w-[110px]">
            <template #body="{ data }">
              <Tag
                :value="getStatusLabel(data.status)"
                :severity="getStatusSeverity(data.status)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>
          <Column field="created_at" header="Created" class="min-w-[120px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>
          <Column header="Actions" class="min-w-[100px]">
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
                  @click="confirmDelete(data.id, data.title)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
