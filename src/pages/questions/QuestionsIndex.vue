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
const courseCategoryIds = ref([])
const courseFilterLoading = ref(false)

let searchTimer = null

const difficultyOptions = [
  { label: 'Fácil', value: 'easy' },
  { label: 'Medio', value: 'medium' },
  { label: 'Difícil', value: 'hard' },
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

  if (selectedCourse.value && courseCategoryIds.value.length > 0) {
    list = list.filter((qst) => courseCategoryIds.value.includes(qst.category_id))
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
      'Error al cargar las preguntas.'
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

async function onCourseFilterChange(courseId) {
  selectedCourse.value = courseId
  courseCategoryIds.value = []

  if (!courseId) return

  courseFilterLoading.value = true
  try {
    // Fetch course detail to get evaluations with question_categories
    await coursesStore.fetchOne(courseId)
    const course = coursesStore.course
    const evaluations = course?._evaluationsWithQuestions || course?.evaluations || []

    // Extract question category IDs from evaluation's question_categories slugs
    const categorySlugs = []
    for (const ev of evaluations) {
      const cats = typeof ev.question_categories === 'string'
        ? JSON.parse(ev.question_categories)
        : ev.question_categories || []
      categorySlugs.push(...cats)
    }

    // Match slugs to loaded categories
    const allCategories = questionsStore.categories
    if (allCategories.length === 0) {
      await questionsStore.fetchCategories()
    }
    const matchedIds = questionsStore.categories
      .filter(c => categorySlugs.includes(c.slug))
      .map(c => c.id)

    courseCategoryIds.value = matchedIds
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar el banco de preguntas del curso.',
      life: 4000,
    })
  } finally {
    courseFilterLoading.value = false
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
    message: `¿Está seguro de que desea eliminar "${preview}"? Esta acción no se puede deshacer.`,
    header: 'Eliminar Pregunta',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(id, preview),
  })
}

async function handleDelete(id, preview) {
  try {
    await questionsStore.delete(id)
    toast.add({
      severity: 'success',
      summary: 'Eliminada',
      detail: `Pregunta "${preview}" eliminada exitosamente.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      questionsStore.error ||
      'Error al eliminar la pregunta.'
    toast.add({
      severity: 'error',
      summary: 'Error',
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
  courseCategoryIds.value = []
}

function getTypeLabel(type) {
  switch (type) {
    case 'multiple_choice':
      return 'Opción Múltiple'
    case 'multiple_select':
      return 'Selección Múltiple'
    case 'true_false':
      return 'Verdadero / Falso'
    default:
      return type || 'Desconocido'
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
      return 'Fácil'
    case 'medium':
      return 'Medio'
    case 'hard':
      return 'Difícil'
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
  // If a course filter is active, show that course's name
  if (selectedCourse.value) {
    const crs = courses.value.find(c => c.id === selectedCourse.value)
    if (crs) return crs.title || crs.name
  }
  // Otherwise show the category (since questions link to courses via categories)
  return categoryName(question)
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
          Banco de Preguntas
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Explora y gestiona el banco de preguntas
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-plus"
          label="Crear Pregunta"
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
            :label="'Todas'"
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
          placeholder="Dificultad"
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
          placeholder="Todos los Cursos"
          class="w-full sm:w-48"
          show-clear
          filter
          size="small"
          :loading="courseFilterLoading"
          @change="onCourseFilterChange(selectedCourse)"
        />

        <!-- Clear Filters -->
        <Button
          v-if="hasActiveFilters"
          icon="pi pi-times"
          label="Limpiar"
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
            placeholder="Buscar preguntas..."
            class="w-full"
            @input="onSearchInput"
          />
        </IconField>
        <span class="text-sm text-surface-400 dark:text-surface-500">
          {{ displayQuestions.length }} pregunta{{ displayQuestions.length !== 1 ? 's' : '' }}
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
          No hay preguntas aún
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Comienza creando tu primera pregunta para el banco de preguntas.
        </p>
        <Button
          icon="pi pi-plus"
          label="Crear Pregunta"
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
          Sin resultados
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto mb-4">
          Intenta ajustar tu búsqueda o filtros.
        </p>
        <Button
          icon="pi pi-times"
          label="Limpiar Filtros"
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
          <Column header="Pregunta" class="min-w-[280px]">
            <template #body="{ data }">
              <div class="min-w-0 cursor-pointer" @click="navigateToEdit(data.id)">
                <p class="text-sm font-medium text-surface-800 dark:text-surface-600 line-clamp-2">
                  {{ truncateText(data.question_text || data.text, 100) }}
                </p>
              </div>
            </template>
          </Column>

          <!-- Type -->
          <Column field="type" header="Tipo" class="min-w-[140px]">
            <template #body="{ data }">
              <Tag
                :value="getTypeLabel(data.type)"
                :severity="getTypeSeverity(data.type)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- Category -->
          <Column field="category_id" header="Categoría" :sortable="true" class="min-w-[140px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ categoryName(data) }}
              </span>
            </template>
          </Column>

          <!-- Difficulty -->
          <Column field="difficulty" header="Dificultad" :sortable="true" class="min-w-[110px]">
            <template #body="{ data }">
              <Tag
                :value="getDifficultyLabel(data.difficulty)"
                :severity="getDifficultySeverity(data.difficulty)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- Course -->
          <Column field="course_id" header="Curso / Categoría" class="min-w-[160px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-500">
                {{ courseName(data) }}
              </span>
            </template>
          </Column>

          <!-- Created -->
          <Column field="created_at" header="Creado" :sortable="true" class="min-w-[120px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Acciones" class="min-w-[100px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
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
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Eliminar'"
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
