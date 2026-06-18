<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEvaluationsStore } from '@/stores/evaluations'
import { useQuestionsStore } from '@/stores/questions'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const evaluationsStore = useEvaluationsStore()
const questionsStore = useQuestionsStore()
const coursesStore = useCoursesStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const evaluationId = computed(() => route.params.id)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const submitted = ref(false)
const saving = ref(false)
const formError = ref('')
const loadError = ref('')

// Form fields
const title = ref('')
const description = ref('')
const selectedQuestionIds = ref([])
const timeLimit = ref(30)
const passingScore = ref(60)
const maxAttempts = ref(3)
const courseId = ref(null)
const status = ref('draft')

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
]

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const questions = computed(() => questionsStore.questions)
const courses = computed(() => coursesStore.courses)
const questionsCount = computed(() => selectedQuestionIds.value.length)

const questionOptions = computed(() =>
  questions.value.map((q) => ({
    label: `${truncateText(q.question_text || q.text, 80)}`,
    value: q.id,
    type: q.type,
    difficulty: q.difficulty,
    category: q.category?.name || q.question_category?.name || '',
  })),
)

const courseOptions = computed(() =>
  courses.value.map((c) => ({
    label: c.title || c.name,
    value: c.id,
  })),
)

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const formErrors = computed(() => {
  const errs = {}
  if (!submitted.value) return errs

  if (!title.value.trim()) {
    errs.title = 'Title is required.'
  } else if (title.value.trim().length < 3) {
    errs.title = 'Title must be at least 3 characters.'
  }

  if (!description.value.trim()) {
    errs.description = 'Description is required.'
  }

  if (selectedQuestionIds.value.length === 0) {
    errs.questions = 'At least one question must be selected.'
  }

  if (timeLimit.value == null || timeLimit.value < 1) {
    errs.timeLimit = 'Time limit must be at least 1 minute.'
  } else if (timeLimit.value > 480) {
    errs.timeLimit = 'Time limit cannot exceed 480 minutes (8 hours).'
  }

  if (passingScore.value == null || passingScore.value < 1) {
    errs.passingScore = 'Passing score must be at least 1%.'
  } else if (passingScore.value > 100) {
    errs.passingScore = 'Passing score cannot exceed 100%.'
  }

  if (maxAttempts.value == null || maxAttempts.value < 1) {
    errs.maxAttempts = 'Max attempts must be at least 1.'
  } else if (maxAttempts.value > 50) {
    errs.maxAttempts = 'Max attempts cannot exceed 50.'
  }

  if (!status.value) {
    errs.status = 'Status is required.'
  }

  return errs
})

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Populate Form from Evaluation Data
// ---------------------------------------------------------------------------
function populateForm(evaluation) {
  if (!evaluation) return

  title.value = evaluation.title || ''
  description.value = evaluation.description || ''
  timeLimit.value = evaluation.time_limit ?? 30
  passingScore.value = evaluation.passing_score ?? 60
  maxAttempts.value = evaluation.max_attempts ?? 3
  courseId.value = evaluation.course_id ?? null
  status.value = evaluation.status || 'draft'

  // Determine selected question IDs
  if (evaluation.questions && Array.isArray(evaluation.questions)) {
    selectedQuestionIds.value = evaluation.questions.map((q) =>
      typeof q === 'object' ? q.id : q,
    )
  } else if (evaluation.question_ids && Array.isArray(evaluation.question_ids)) {
    selectedQuestionIds.value = evaluation.question_ids
  } else {
    selectedQuestionIds.value = []
  }
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchEvaluation() {
  pageLoading.value = true
  loadError.value = ''

  try {
    const evaluation = await evaluationsStore.fetchOne(evaluationId.value)
    populateForm(evaluation)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to load evaluation data.'

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

async function fetchInitialData() {
  try {
    await Promise.all([
      fetchEvaluation(),
      questionsStore.fetchAll(),
      coursesStore.fetchAll(),
    ])
  } catch {
    // Errors handled in fetchEvaluation
  }
}

function truncateText(text, maxLength = 80) {
  if (!text) return ''
  const stripped = text.replace(/<[^>]*>/g, '')
  if (stripped.length <= maxLength) return stripped
  return stripped.substring(0, maxLength) + '...'
}

function getTypeIcon(type) {
  switch (type) {
    case 'multiple_choice':
      return 'pi pi-list'
    case 'multiple_select':
      return 'pi pi-check-square'
    case 'true_false':
      return 'pi pi-check-circle'
    default:
      return 'pi pi-question-circle'
  }
}

function getDifficultyBadgeClass(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'hard':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'text-surface-500 bg-surface-100 dark:bg-surface-800'
  }
}

async function handleSubmit() {
  submitted.value = true
  formError.value = ''

  if (hasErrors.value) {
    const firstError = Object.values(formErrors.value)[0]
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: firstError,
      life: 5000,
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      title: title.value.trim(),
      description: description.value.trim(),
      question_ids: selectedQuestionIds.value,
      questions_count: questionsCount.value,
      time_limit: timeLimit.value,
      passing_score: passingScore.value,
      max_attempts: maxAttempts.value,
      course_id: courseId.value || null,
      status: status.value,
    }

    const updated = await evaluationsStore.update(evaluationId.value, payload)

    toast.add({
      severity: 'success',
      summary: 'Evaluation Updated',
      detail: 'The evaluation has been updated successfully.',
      life: 4000,
    })

    router.push({ name: 'Evaluations' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to update evaluation.'

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
  router.push({ name: 'Evaluations' })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="evaluations-edit-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Edit Evaluation
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Update evaluation details and configuration
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Evaluations"
        severity="secondary"
        size="small"
        @click="handleCancel"
      />
    </div>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="pageLoading">
      <div class="card p-6 sm:p-8 space-y-5">
        <Skeleton width="30%" height="1.25rem" class="mb-1" />
        <Skeleton width="50%" height="0.875rem" class="mb-4" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="100%" height="8rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
      <div class="flex justify-end">
        <Skeleton width="8rem" height="2.5rem" />
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
          Failed to Load Evaluation
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          {{ loadError }}
        </p>
        <div class="flex items-center justify-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Retry"
            severity="primary"
            @click="fetchInitialData"
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
    <!-- EDIT FORM                                                           -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Form Error -->
      <Message
        v-if="formError"
        severity="error"
        :closable="true"
        class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
      >
        {{ formError }}
      </Message>

      <div class="card p-6 sm:p-8 space-y-6">
        <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
          Evaluation Details
        </h2>
        <p class="text-xs text-surface-400 dark:text-surface-500 -mt-4">
          Update the evaluation information
        </p>

        <!-- Title -->
        <div>
          <label
            for="edit-eval-title"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Title <span class="text-error-500">*</span>
          </label>
          <InputText
            id="edit-eval-title"
            v-model="title"
            placeholder="e.g., JavaScript Fundamentals Assessment"
            class="w-full"
            :invalid="!!formErrors.title"
          />
          <small
            v-if="formErrors.title"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.title }}
          </small>
        </div>

        <!-- Description -->
        <div>
          <label
            for="edit-eval-description"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Description <span class="text-error-500">*</span>
          </label>
          <Textarea
            id="edit-eval-description"
            v-model="description"
            placeholder="Describe the evaluation purpose, topics covered, and instructions..."
            :invalid="!!formErrors.description"
            rows="5"
            class="w-full"
            auto-resize
          />
          <small
            v-if="formErrors.description"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.description }}
          </small>
          <small class="text-surface-400 dark:text-surface-500 text-xs mt-1 block">
            You can use HTML tags for rich text formatting.
          </small>
        </div>

        <!-- Status -->
        <div>
          <label
            for="edit-eval-status"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Status <span class="text-error-500">*</span>
          </label>
          <Select
            id="edit-eval-status"
            v-model="status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Select status"
            class="w-full sm:w-48"
            :invalid="!!formErrors.status"
          />
          <small
            v-if="formErrors.status"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.status }}
          </small>
        </div>

        <!-- Course -->
        <div>
          <label
            for="edit-eval-course"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Associated Course <span class="text-surface-400 font-normal">(optional)</span>
          </label>
          <Select
            id="edit-eval-course"
            v-model="courseId"
            :options="courseOptions"
            option-label="label"
            option-value="value"
            placeholder="Select a course (optional)"
            class="w-full sm:w-72"
            show-clear
            filter
          />
        </div>

        <!-- ================================================================= -->
        <!-- QUESTIONS SECTION                                                  -->
        <!-- ================================================================= -->
        <div class="pt-4 border-t border-surface-100 dark:border-surface-200">
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-600 mb-1">
              Select Questions
            </h3>
            <p class="text-xs text-surface-400 dark:text-surface-500">
              Choose questions from the question bank to include in this evaluation
            </p>
          </div>

          <small
            v-if="formErrors.questions"
            class="text-error-500 dark:text-error-400 text-xs mb-3 block"
          >
            {{ formErrors.questions }}
          </small>

          <!-- MultiSelect for Questions -->
          <div class="mb-4">
            <MultiSelect
              v-model="selectedQuestionIds"
              :options="questionOptions"
              option-label="label"
              option-value="value"
              placeholder="Search and select questions..."
              class="w-full"
              :filter="true"
              filter-placeholder="Search questions..."
              :max-selected-labels="5"
              :show-toggle-all="true"
              display="chip"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i :class="getTypeIcon(option.type)" class="text-sm text-surface-500" />
                  <span class="flex-1 text-sm">{{ option.label }}</span>
                  <span
                    v-if="option.difficulty"
                    class="text-xs px-1.5 py-0.5 rounded font-medium"
                    :class="getDifficultyBadgeClass(option.difficulty)"
                  >
                    {{ option.difficulty }}
                  </span>
                </div>
              </template>
            </MultiSelect>
          </div>

          <!-- Selected Count -->
          <div class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-500">
            <i class="pi pi-info-circle" />
            <span>
              <strong>{{ questionsCount }}</strong> question{{ questionsCount !== 1 ? 's' : '' }} selected
            </span>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- CONFIGURATION SECTION                                              -->
        <!-- ================================================================= -->
        <div class="pt-4 border-t border-surface-100 dark:border-surface-200">
          <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-600 mb-1">
            Configuration
          </h3>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-4">
            Set the evaluation parameters and rules
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Questions Count (read-only) -->
            <div>
              <label
                for="edit-eval-qcount"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Questions Count
              </label>
              <InputNumber
                id="edit-eval-qcount"
                :model-value="questionsCount"
                :min="0"
                disabled
                class="w-full"
                fluid
              />
              <small class="text-surface-400 dark:text-surface-500 text-xs mt-1 block">
                Auto-updated based on selected questions
              </small>
            </div>

            <!-- Time Limit (minutes) -->
            <div>
              <label
                for="edit-eval-timelimit"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Time Limit (minutes) <span class="text-error-500">*</span>
              </label>
              <InputNumber
                id="edit-eval-timelimit"
                v-model="timeLimit"
                :min="1"
                :max="480"
                suffix=" min"
                class="w-full"
                :invalid="!!formErrors.timeLimit"
                fluid
              />
              <small
                v-if="formErrors.timeLimit"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ formErrors.timeLimit }}
              </small>
            </div>

            <!-- Passing Score % -->
            <div>
              <label
                for="edit-eval-passing"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Passing Score (%) <span class="text-error-500">*</span>
              </label>
              <InputNumber
                id="edit-eval-passing"
                v-model="passingScore"
                :min="1"
                :max="100"
                suffix="%"
                class="w-full"
                :invalid="!!formErrors.passingScore"
                fluid
              />
              <small
                v-if="formErrors.passingScore"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ formErrors.passingScore }}
              </small>
            </div>

            <!-- Max Attempts -->
            <div>
              <label
                for="edit-eval-attempts"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Max Attempts <span class="text-error-500">*</span>
              </label>
              <InputNumber
                id="edit-eval-attempts"
                v-model="maxAttempts"
                :min="1"
                :max="50"
                class="w-full"
                :invalid="!!formErrors.maxAttempts"
                fluid
              />
              <small
                v-if="formErrors.maxAttempts"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ formErrors.maxAttempts }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- FORM ACTIONS                                                         -->
      <!-- =================================================================== -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <Button
          label="Cancel"
          severity="secondary"
          :disabled="saving"
          @click="handleCancel"
        />
        <Button
          icon="pi pi-check"
          :label="saving ? 'Updating...' : 'Update Evaluation'"
          severity="primary"
          :loading="saving"
          :disabled="saving"
          @click="handleSubmit"
        />
      </div>
    </template>
  </div>
</template>
