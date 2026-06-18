<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
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
const questionsStore = useQuestionsStore()
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
const selectedDifficulty = ref(null)
const selectedCourse = ref(null)

let searchTimer = null

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
]

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const questions = computed(() => questionsStore.questions)
const categories = computed(() => questionsStore.categories)
const courses = computed(() => coursesStore.courses)
const loading = computed(() => questionsStore.loading)

const hasQuestions = computed(() => questions.value.length > 0)
const hasCategories = computed(() => categories.value.length > 0)
const hasCourses = computed(() => courses.value.length > 0)

const filteredQuestions = computed(() => {
  let list = questions.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (qst) =>
        (qst.question_text && qst.question_text.toLowerCase().includes(q)) ||
        (qst.text && qst.text.toLowerCase().includes(q)),
    )
  }

  if (selectedCategory.value) {
    list = list.filter(
      (qst) =>
        qst.category_id === selectedCategory.value ||
        qst.question_category_id === selectedCategory.value,
    )
  }

  if (selectedDifficulty.value) {
    list = list.filter((qst) => qst.difficulty === selectedDifficulty.value)
  }

  if (selectedCourse.value) {
    list = list.filter(
      (qst) =>
        qst.course_id === selectedCourse.value ||
        (qst.course && qst.course.id === selectedCourse.value),
    )
  }

  return list
})

const displayQuestions = computed(() => filteredQuestions.value)

// ---------------------------------------------------------------------------
// Category options for Select
// ---------------------------------------------------------------------------
const categoryOptions = computed(() =>
  categories.value.map((c) => ({
    label: c.name,
    value: c.id,
  })),
)

const courseOptions = computed(() =>
  courses.value.map((c) => ({
    label: c.title || c.name,
    value: c.id,
  })),
)

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchInitialData() {
  loadError.value = ''
  try {
    await Promise.all([
      questionsStore.fetchAll(),
      questionsStore.fetchCategories(),
      coursesStore.fetchAll(),
    ])
  } catch (err) {
    const message =
      err.response?.data?.message ||
      questionsStore.error ||
      'Failed to load questions.'
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
  router.push({ name: 'QuestionCreate' })
}

function navigateToEdit(id) {
  router.push({ name: 'QuestionEdit', params: { id } })
}

function confirmDelete(id, text) {
  const preview = truncateText(text || `#${id}`, 60)
  confirm.require({
    message: `Are you sure you want to delete "${preview}"? This action cannot be undone.`,
    header: 'Delete Question',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(id, preview),
  })
}

async function handleDelete(id, preview) {
  try {
    await questionsStore.delete(id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Question "${preview}" has been deleted.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      questionsStore.error ||
      'Failed to delete question.'
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
  selectedCategory.value = null
  selectedDifficulty.value = null
  selectedCourse.value = null
}

function getTypeLabel(type) {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple Choice'
    case 'multiple_select':
      return 'Multiple Select'
    case 'true_false':
      return 'True / False'
    default:
      return type || 'Unknown'
  }
}

function getTypeSeverity(type) {
  switch (type) {
    case 'multiple_choice':
      return 'info'
    case 'multiple_select':
      return 'warn'
    case 'true_false':
      return 'success'
    default:
      return 'secondary'
  }
}

function getDifficultySeverity(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 'success'
    case 'medium':
      return 'warn'
    case 'hard':
      return 'danger'
    default:
      return 'secondary'
  }
}

function getDifficultyLabel(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 'Easy'
    case 'medium':
      return 'Medium'
    case 'hard':
      return 'Hard'
    default:
      return difficulty || '—'
  }
}

function categoryName(question) {
  if (question.category) return question.category.name
  if (question.question_category) return question.question_category.name
  const cat = categories.value.find(
    (c) => c.id === question.category_id || c.id === question.question_category_id,
  )
  return cat ? cat.name : '—'
}

function courseName(question) {
  if (question.course) return question.course.title || question.course.name
  const crs = courses.value.find(
    (c) => c.id === question.course_id,
  )
  return crs ? (crs.title || crs.name) : '—'
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

const hasActiveFilters = computed(
  () => selectedCategory.value || selectedDifficulty.value || selectedCourse.value,
)

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="questions-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Questions
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Browse and manage the question bank
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-plus"
          label="Create Question"
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
      <!-- Filters Skeleton -->
      <div class="flex gap-2 flex-wrap">
        <Skeleton v-for="n in 5" :key="`cat-skel-${n}`" width="6rem" height="2.25rem" />
      </div>
      <Skeleton width="100%" height="2.75rem" class="sm:!w-72" />

      <!-- Table Skeleton -->
      <div class="card overflow-hidden">
        <div class="space-y-3 p-4">
          <div v-for="n in 8" :key="`row-skel-${n}`" class="flex items-center gap-4">
            <Skeleton width="35%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="12%" height="1.25rem" />
            <Skeleton width="12%" height="1.25rem" />
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
      <!-- Filters Row -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <!-- Category Filter -->
        <div v-if="hasCategories" class="flex gap-2 flex-wrap">
          <Button
            :label="'All Categories'"
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
            @click="selectedCategory = selectedCategory === cat.id ? null : cat.id"
          />
        </div>

        <!-- Difficulty Filter -->
        <Select
          v-model="selectedDifficulty"
          :options="difficultyOptions"
          option-label="label"
          option-value="value"
          placeholder="All Difficulties"
          class="w-full sm:w-44"
          show-clear
          size="small"
        />

        <!-- Course Filter -->
        <Select
          v-if="hasCourses"
          v-model="selectedCourse"
          :options="courseOptions"
          option-label="label"
          option-value="value"
          placeholder="All Courses"
          class="w-full sm:w-48"
          show-clear
          filter
          size="small"
        />

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
            placeholder="Search questions..."
            class="w-full"
            @input="onSearchInput"
          />
        </IconField>
        <span class="text-sm text-surface-400 dark:text-surface-500">
          {{ displayQuestions.length }} question{{ displayQuestions.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty State: No Questions at All -->
      <div
        v-if="!hasQuestions && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-question-circle text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No questions yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Get started by creating your first question for the question bank.
        </p>
        <Button
          icon="pi pi-plus"
          label="Create Question"
          severity="primary"
          @click="navigateToCreate"
        />
      </div>

      <!-- Empty State: No Results for Filter -->
      <div
        v-else-if="hasQuestions && displayQuestions.length === 0 && !loading"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-filter-slash text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No matching questions
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto mb-4">
          Try adjusting your search or filters.
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
      <div v-if="displayQuestions.length > 0" class="card overflow-hidden">
        <DataTable
          :value="displayQuestions"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="displayQuestions.length > 10"
          :rows-per-page-options="[5, 10, 25, 50]"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          current-page-report-template="Showing {first} to {last} of {totalRecords}"
        >
          <!-- Question Text -->
          <Column header="Question" class="min-w-[280px]">
            <template #body="{ data }">
              <div class="min-w-0 cursor-pointer" @click="navigateToEdit(data.id)">
                <p class="text-sm font-medium text-surface-800 dark:text-surface-600 line-clamp-2">
                  {{ truncateText(data.question_text || data.text, 100) }}
                </p>
              </div>
            </template>
          </Column>

          <!-- Type -->
          <Column field="type" header="Type" class="min-w-[140px]">
            <template #body="{ data }">
              <Tag
                :value="getTypeLabel(data.type)"
                :severity="getTypeSeverity(data.type)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- Category -->
          <Column field="category_id" header="Category" :sortable="true" class="min-w-[140px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ categoryName(data) }}
              </span>
            </template>
          </Column>

          <!-- Difficulty -->
          <Column field="difficulty" header="Difficulty" :sortable="true" class="min-w-[110px]">
            <template #body="{ data }">
              <Tag
                :value="getDifficultyLabel(data.difficulty)"
                :severity="getDifficultySeverity(data.difficulty)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- Course -->
          <Column field="course_id" header="Course" class="min-w-[160px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ courseName(data) }}
              </span>
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
                  @click="confirmDelete(data.id, data.question_text || data.text)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
