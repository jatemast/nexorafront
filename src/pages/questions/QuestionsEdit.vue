<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const questionsStore = useQuestionsStore()
const coursesStore = useCoursesStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const questionId = computed(() => route.params.id)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const submitted = ref(false)
const saving = ref(false)
const formError = ref('')
const loadError = ref('')

// Form fields
const type = ref('multiple_choice')
const questionText = ref('')
const categoryId = ref(null)
const difficulty = ref(null)
const courseId = ref(null)
const options = ref([
  { text: '', is_correct: false },
  { text: '', is_correct: false },
])
const correctAnswer = ref(null) // For true_false: true or false

const typeOptions = [
  { label: 'Multiple Choice', value: 'multiple_choice', icon: 'pi pi-list' },
  { label: 'True / False', value: 'true_false', icon: 'pi pi-check-square' },
  { label: 'Multiple Select', value: 'multiple_select', icon: 'pi pi-check-circle' },
]

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
]

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const categoryOptions = computed(() =>
  questionsStore.categories.map((c) => ({
    label: c.name,
    value: c.id,
  })),
)

const courseOptions = computed(() =>
  coursesStore.courses.map((c) => ({
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

  if (!questionText.value.trim()) {
    errs.questionText = 'Question text is required.'
  } else if (questionText.value.trim().length < 5) {
    errs.questionText = 'Question must be at least 5 characters.'
  }

  if (!categoryId.value) {
    errs.categoryId = 'Category is required.'
  }

  if (!difficulty.value) {
    errs.difficulty = 'Difficulty is required.'
  }

  if (type.value === 'multiple_choice' || type.value === 'multiple_select') {
    const filledOptions = options.value.filter((o) => o.text.trim())
    if (filledOptions.length < 2) {
      errs.options = 'At least 2 options are required.'
    } else {
      const hasEmptyOption = options.value.some(
        (o, i) => i < filledOptions.length && !o.text.trim(),
      )
      if (hasEmptyOption) {
        errs.options = 'All options must have text.'
      }
    }

    const correctCount = options.value.filter((o) => o.is_correct && o.text.trim()).length
    if (type.value === 'multiple_choice' && correctCount !== 1) {
      errs.correctAnswer = 'Exactly one correct answer must be selected.'
    }
    if (type.value === 'multiple_select' && correctCount < 1) {
      errs.correctAnswer = 'At least one correct answer must be selected.'
    }
  }

  if (type.value === 'true_false' && correctAnswer.value === null) {
    errs.correctAnswer = 'Please select the correct answer.'
  }

  return errs
})

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Options Management
// ---------------------------------------------------------------------------
function addOption() {
  options.value.push({ text: '', is_correct: false })
}

function removeOption(index) {
  if (options.value.length <= 2) return
  options.value.splice(index, 1)
}

watch(type, (newType) => {
  if (submitted.value) {
    submitted.value = false
  }
})

// ---------------------------------------------------------------------------
// Populate Form from Question Data
// ---------------------------------------------------------------------------
function populateForm(question) {
  if (!question) return

  type.value = question.type || 'multiple_choice'
  questionText.value = question.question_text || question.text || ''
  categoryId.value = question.category_id || question.question_category_id || null
  difficulty.value = question.difficulty || null
  courseId.value = question.course_id || null

  if (question.type === 'true_false') {
    // Determine correct answer from options or correct_answer field
    if (question.options && Array.isArray(question.options) && question.options.length >= 2) {
      const trueOpt = question.options.find(
        (o) => (o.text === 'True' || o.text === 'true') && o.is_correct,
      )
      correctAnswer.value = trueOpt ? true : false
    } else if (question.correct_answer !== undefined && question.correct_answer !== null) {
      correctAnswer.value = question.correct_answer === true || question.correct_answer === 'true' || question.correct_answer === 'True' || question.correct_answer === 1
    } else {
      correctAnswer.value = null
    }
    options.value = [
      { text: 'True', is_correct: correctAnswer.value === true },
      { text: 'False', is_correct: correctAnswer.value === false },
    ]
  } else {
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      options.value = question.options.map((opt) => ({
        text: opt.text || '',
        is_correct: !!opt.is_correct,
      }))
    } else {
      options.value = [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ]
    }

    // Handle correct_answers array for multiple_select
    if (question.type === 'multiple_select' && question.correct_answers && Array.isArray(question.correct_answers)) {
      options.value.forEach((opt) => {
        if (question.correct_answers.includes(opt.text)) {
          opt.is_correct = true
        }
      })
    }

    correctAnswer.value = null
  }
}

// ---------------------------------------------------------------------------
// Fetch Question Data
// ---------------------------------------------------------------------------
async function fetchQuestion() {
  pageLoading.value = true
  loadError.value = ''

  try {
    const question = await questionsStore.fetchOne(questionId.value)
    populateForm(question)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      questionsStore.error ||
      'Failed to load question data.'

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
      fetchQuestion(),
      questionsStore.fetchCategories(),
      coursesStore.fetchAll(),
    ])
  } catch {
    // Errors handled in fetchQuestion
  } finally {
    // pageLoading handled in fetchQuestion
  }
}

// ---------------------------------------------------------------------------
// Submit Handler
// ---------------------------------------------------------------------------
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
      type: type.value,
      question_text: questionText.value.trim(),
      category_id: categoryId.value,
      difficulty: difficulty.value,
      course_id: courseId.value || null,
    }

    if (type.value === 'true_false') {
      payload.options = [
        { text: 'True', is_correct: correctAnswer.value === true },
        { text: 'False', is_correct: correctAnswer.value === false },
      ]
      payload.correct_answer = correctAnswer.value
    } else {
      const validOptions = options.value
        .filter((o) => o.text.trim())
        .map((o) => ({
          text: o.text.trim(),
          is_correct: o.is_correct,
        }))
      payload.options = validOptions
      if (type.value === 'multiple_choice') {
        const correct = validOptions.find((o) => o.is_correct)
        payload.correct_answer = correct ? correct.text : null
      } else {
        payload.correct_answers = validOptions
          .filter((o) => o.is_correct)
          .map((o) => o.text)
      }
    }

    const updated = await questionsStore.update(questionId.value, payload)

    toast.add({
      severity: 'success',
      summary: 'Question Updated',
      detail: 'The question has been updated successfully.',
      life: 4000,
    })

    router.push({ name: 'Questions' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      questionsStore.error ||
      'Failed to update question.'

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
  router.push({ name: 'Questions' })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="questions-edit-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Edit Question
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Update question details and answer options
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Questions"
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
        <Skeleton width="10rem" height="8rem" />
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
          Failed to Load Question
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
          Question Details
        </h2>
        <p class="text-xs text-surface-400 dark:text-surface-500 -mt-4">
          Update the question information
        </p>

        <!-- Type Selector -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-2">
            Question Type <span class="text-error-500">*</span>
          </label>
          <SelectButton
            v-model="type"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
          >
            <template #option="{ option }">
              <i :class="option.icon" class="mr-1.5" />
              <span>{{ option.label }}</span>
            </template>
          </SelectButton>
        </div>

        <!-- Question Text -->
        <div>
          <label
            for="edit-question-text"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Question Text <span class="text-error-500">*</span>
          </label>
          <Textarea
            id="edit-question-text"
            v-model="questionText"
            placeholder="Enter the question text..."
            :invalid="!!formErrors.questionText"
            rows="4"
            class="w-full"
            auto-resize
          />
          <small
            v-if="formErrors.questionText"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.questionText }}
          </small>
        </div>

        <!-- Category -->
        <div>
          <label
            for="edit-category"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Category <span class="text-error-500">*</span>
          </label>
          <Select
            id="edit-category"
            v-model="categoryId"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            placeholder="Select a category"
            class="w-full sm:w-72"
            :invalid="!!formErrors.categoryId"
            show-clear
            filter
          />
          <small
            v-if="formErrors.categoryId"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.categoryId }}
          </small>
        </div>

        <!-- Difficulty -->
        <div>
          <label
            for="edit-difficulty"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Difficulty <span class="text-error-500">*</span>
          </label>
          <Select
            id="edit-difficulty"
            v-model="difficulty"
            :options="difficultyOptions"
            option-label="label"
            option-value="value"
            placeholder="Select difficulty"
            class="w-full sm:w-48"
            :invalid="!!formErrors.difficulty"
            show-clear
          />
          <small
            v-if="formErrors.difficulty"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.difficulty }}
          </small>
        </div>

        <!-- Course -->
        <div>
          <label
            for="edit-course"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Associated Course <span class="text-surface-400 font-normal">(optional)</span>
          </label>
          <Select
            id="edit-course"
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
        <!-- OPTIONS SECTION (multiple_choice / multiple_select)                -->
        <!-- ================================================================= -->
        <div v-if="type === 'multiple_choice' || type === 'multiple_select'" class="pt-4 border-t border-surface-100 dark:border-surface-200">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-600">
                Answer Options
              </h3>
              <p class="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                {{ type === 'multiple_choice' ? 'Select the single correct answer' : 'Select all correct answers' }}
              </p>
            </div>
            <Button
              icon="pi pi-plus"
              label="Add Option"
              severity="secondary"
              size="small"
              @click="addOption"
            />
          </div>

          <small
            v-if="formErrors.options"
            class="text-error-500 dark:text-error-400 text-xs mb-3 block"
          >
            {{ formErrors.options }}
          </small>

          <small
            v-if="formErrors.correctAnswer"
            class="text-error-500 dark:text-error-400 text-xs mb-3 block"
          >
            {{ formErrors.correctAnswer }}
          </small>

          <div class="space-y-3">
            <div
              v-for="(option, index) in options"
              :key="index"
              class="flex items-start gap-3 p-3 border border-surface-200 dark:border-surface-200 rounded-lg"
            >
              <div class="flex-shrink-0 pt-2">
                <RadioButton
                  v-if="type === 'multiple_choice'"
                  :model-value="option.is_correct"
                  :value="true"
                  :name="'edit-correct-answer'"
                  @update:model-value="() => {
                    options.forEach((o, i) => (o.is_correct = i === index))
                  }"
                />
                <Checkbox
                  v-else
                  v-model="option.is_correct"
                  :binary="true"
                />
              </div>

              <span class="flex-shrink-0 w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-200 text-surface-600 dark:text-surface-500 flex items-center justify-center text-xs font-semibold mt-1.5">
                {{ String.fromCharCode(65 + index) }}
              </span>

              <div class="flex-1">
                <InputText
                  v-model="option.text"
                  :placeholder="'Option ' + (index + 1)"
                  class="w-full"
                />
              </div>

              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                class="flex-shrink-0 mt-1"
                :disabled="options.length <= 2"
                v-tooltip.top="'Remove Option'"
                @click="removeOption(index)"
              />
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- TRUE / FALSE SECTION                                              -->
        <!-- ================================================================= -->
        <div v-if="type === 'true_false'" class="pt-4 border-t border-surface-100 dark:border-surface-200">
          <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-600 mb-1">
            Correct Answer
          </h3>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-4">
            Select whether the correct answer is True or False
          </p>

          <small
            v-if="formErrors.correctAnswer"
            class="text-error-500 dark:text-error-400 text-xs mb-3 block"
          >
            {{ formErrors.correctAnswer }}
          </small>

          <div class="flex gap-6">
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="correctAnswer"
                :value="true"
                input-id="edit-correct-true"
                name="edit-true-false-correct"
              />
              <label for="edit-correct-true" class="text-sm text-surface-700 dark:text-surface-600 cursor-pointer">
                True
              </label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="correctAnswer"
                :value="false"
                input-id="edit-correct-false"
                name="edit-true-false-correct"
              />
              <label for="edit-correct-false" class="text-sm text-surface-700 dark:text-surface-600 cursor-pointer">
                False
              </label>
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
          :label="saving ? 'Updating...' : 'Update Question'"
          severity="primary"
          :loading="saving"
          :disabled="saving"
          @click="handleSubmit"
        />
      </div>
    </template>
  </div>
</template>
