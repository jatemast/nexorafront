<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEvaluationsStore } from '@/stores/evaluations'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const evaluationsStore = useEvaluationsStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

const evaluationId = computed(() => route.params.id)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const loadError = ref('')
const starting = ref(false)
const submitting = ref(false)
const attemptStarted = ref(false)

// Quiz state
const currentQuestionIndex = ref(0)
const answers = ref({})
const timeRemaining = ref(0) // seconds
const timerInterval = ref(null)
const showSubmitDialog = ref(false)
const showInstructions = ref(true)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const attempt = computed(() => evaluationsStore.attempt)
const evaluation = computed(() => attempt.value?.evaluation || null)
const questions = computed(() => {
  if (attempt.value?.questions && Array.isArray(attempt.value.questions)) {
    return attempt.value.questions
  }
  if (evaluation.value?.questions && Array.isArray(evaluation.value.questions)) {
    return evaluation.value.questions
  }
  return []
})

const totalQuestions = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)

const answeredCount = computed(() => {
  return Object.keys(answers.value).filter(
    (key) => answers.value[key] !== null && answers.value[key] !== undefined && answers.value[key] !== '',
  ).length
})

const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)

const isFirstQuestion = computed(() => currentQuestionIndex.value === 0)
const isLastQuestion = computed(() => currentQuestionIndex.value === totalQuestions.value - 1)

const progressPercent = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((answeredCount.value / totalQuestions.value) * 100)
})

const formattedTimeRemaining = computed(() => {
  const mins = Math.floor(timeRemaining.value / 60)
  const secs = timeRemaining.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const timeWarning = computed(() => timeRemaining.value <= 300 && timeRemaining.value > 0) // 5 min warning
const timeDanger = computed(() => timeRemaining.value <= 60 && timeRemaining.value > 0) // 1 min danger

// ---------------------------------------------------------------------------
// Question helpers
// ---------------------------------------------------------------------------
function questionType(question) {
  return question?.type || 'multiple_choice'
}

function isRadioType(question) {
  const type = questionType(question)
  return type === 'multiple_choice' || type === 'true_false'
}

function isCheckboxType(question) {
  return questionType(question) === 'multiple_select'
}

function currentAnswer(questionId) {
  return answers.value[questionId] ?? null
}

function isQuestionAnswered(questionId) {
  const answer = answers.value[questionId]
  if (answer === null || answer === undefined || answer === '') return false
  if (Array.isArray(answer) && answer.length === 0) return false
  return true
}

function questionNumber(index) {
  return index + 1
}

// ---------------------------------------------------------------------------
// Answer handling
// ---------------------------------------------------------------------------
function selectRadioAnswer(questionId, value) {
  answers.value[questionId] = value
}

function toggleCheckboxAnswer(questionId, value) {
  if (!Array.isArray(answers.value[questionId])) {
    answers.value[questionId] = []
  }
  const arr = answers.value[questionId]
  const idx = arr.indexOf(value)
  if (idx === -1) {
    arr.push(value)
  } else {
    arr.splice(idx, 1)
  }
}

function isCheckboxSelected(questionId, value) {
  const arr = answers.value[questionId]
  if (!Array.isArray(arr)) return false
  return arr.includes(value)
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function goToQuestion(index) {
  if (index >= 0 && index < totalQuestions.value) {
    currentQuestionIndex.value = index
  }
}

function goToPrevious() {
  if (!isFirstQuestion.value) {
    currentQuestionIndex.value--
  }
}

function goToNext() {
  if (!isLastQuestion.value) {
    currentQuestionIndex.value++
  }
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------
function startTimer() {
  const timeLimitMinutes = evaluation.value?.time_limit || attempt.value?.time_limit || 30
  timeRemaining.value = timeLimitMinutes * 60

  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(timerInterval.value)
      timerInterval.value = null
      handleTimeUp()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function handleTimeUp() {
  toast.add({
    severity: 'warn',
    summary: 'Time is Up',
    detail: 'Your time has expired. Your answers will be submitted automatically.',
    life: 5000,
  })
  submitAttempt()
}

// ---------------------------------------------------------------------------
// Start & Submit
// ---------------------------------------------------------------------------
async function handleStartAttempt() {
  starting.value = true
  loadError.value = ''

  try {
    await evaluationsStore.startAttempt(evaluationId.value)
    attemptStarted.value = true
    showInstructions.value = false

    // Initialize answers
    questions.value.forEach((q) => {
      answers.value[q.id] = questionType(q) === 'multiple_select' ? [] : null
    })

    startTimer()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to start evaluation attempt.'

    loadError.value = message

    toast.add({
      severity: 'error',
      summary: 'Start Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    starting.value = false
    pageLoading.value = false
  }
}

function openSubmitDialog() {
  showSubmitDialog.value = true
}

function cancelSubmit() {
  showSubmitDialog.value = false
}

async function submitAttempt() {
  showSubmitDialog.value = false
  submitting.value = true

  try {
    // Format answers for submission
    const answersPayload = {
      answers: Object.entries(answers.value).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer: answer,
      })),
      time_spent: (evaluation.value?.time_limit || attempt.value?.time_limit || 30) * 60 - timeRemaining.value,
    }

    const results = await evaluationsStore.submitAttempt(attempt.value.id, answersPayload)

    stopTimer()

    toast.add({
      severity: 'success',
      summary: 'Evaluation Submitted',
      detail: 'Your answers have been submitted successfully.',
      life: 4000,
    })

    router.push({ name: 'EvaluationResults', params: { id: attempt.value.id } })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to submit evaluation.'

    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    submitting.value = false
  }
}

function handleExit() {
  router.push({ name: 'Evaluations' })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  // Start the attempt immediately (shows instructions first)
  pageLoading.value = false
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <div class="evaluation-take-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Take Evaluation
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          {{ evaluation?.title || 'Loading...' }}
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Evaluations"
        severity="secondary"
        size="small"
        @click="handleExit"
        :disabled="submitting"
      />
    </div>

    <!-- =================================================================== -->
    <!-- ERROR STATE                                                         -->
    <!-- =================================================================== -->
    <Message
      v-if="loadError"
      severity="error"
      :closable="true"
      class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
    >
      {{ loadError }}
    </Message>

    <!-- =================================================================== -->
    <!-- INSTRUCTIONS SCREEN                                                 -->
    <!-- =================================================================== -->
    <template v-if="!attemptStarted && !loadError">
      <div class="card p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
        <div class="text-center">
          <div class="flex justify-center mb-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <i class="pi pi-book text-2xl text-primary-500 dark:text-primary-400" />
            </div>
          </div>
          <h2 class="text-xl font-bold text-surface-800 dark:text-surface-600 mb-2">
            Evaluation Instructions
          </h2>
          <p class="text-sm text-surface-500 dark:text-surface-500">
            Please read the following instructions carefully before starting
          </p>
        </div>

        <Divider />

        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <i class="pi pi-clock text-primary-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-surface-700 dark:text-surface-600">Time Limit</p>
              <p class="text-xs text-surface-500 dark:text-surface-500">
                You will have a time limit to complete all questions. The timer will start once you begin.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-list text-primary-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-surface-700 dark:text-surface-600">Question Types</p>
              <p class="text-xs text-surface-500 dark:text-surface-500">
                You may encounter multiple choice, multiple select, and true/false questions.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-arrow-right text-primary-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-surface-700 dark:text-surface-600">Navigation</p>
              <p class="text-xs text-surface-500 dark:text-surface-500">
                You can navigate between questions using the Previous and Next buttons or the question sidebar.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-primary-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-surface-700 dark:text-surface-600">Submission</p>
              <p class="text-xs text-surface-500 dark:text-surface-500">
                Click "Submit" when you're done. Unanswered questions will be marked as incorrect.
              </p>
            </div>
          </div>
        </div>

        <Divider />

        <div class="text-center">
          <Button
            icon="pi pi-play"
            label="Start Evaluation"
            severity="primary"
            size="large"
            :loading="starting"
            @click="handleStartAttempt"
          />
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- QUIZ INTERFACE                                                      -->
    <!-- =================================================================== -->
    <template v-if="attemptStarted">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Main Quiz Area -->
        <div class="flex-1 min-w-0">
          <!-- Top Bar: Progress + Timer -->
          <div class="card p-4 mb-4">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <!-- Progress -->
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-surface-700 dark:text-surface-600">
                  Question {{ questionNumber(currentQuestionIndex) }} of {{ totalQuestions }}
                </span>
                <div class="w-32 h-2 bg-surface-100 dark:bg-surface-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all duration-300"
                    :style="{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }"
                  />
                </div>
              </div>

              <!-- Timer -->
              <div
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold"
                :class="{
                  'bg-surface-100 dark:bg-surface-200 text-surface-700 dark:text-surface-600': !timeWarning && !timeDanger,
                  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400': timeWarning && !timeDanger,
                  'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400': timeDanger,
                }"
              >
                <i class="pi pi-clock" />
                <span>{{ formattedTimeRemaining }}</span>
              </div>
            </div>

            <!-- Global Progress -->
            <div class="mt-3 flex items-center gap-2">
              <div class="flex-1 h-1.5 bg-surface-100 dark:bg-surface-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-green-500 rounded-full transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>
              <span class="text-xs text-surface-400 dark:text-surface-500">
                {{ answeredCount }}/{{ totalQuestions }} answered
              </span>
            </div>
          </div>

          <!-- Current Question Card -->
          <div v-if="currentQuestion" class="card p-6 sm:p-8">
            <!-- Question Text -->
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-medium text-surface-500 dark:text-surface-500 bg-surface-100 dark:bg-surface-200 px-2 py-0.5 rounded">
                  {{ questionNumber(currentQuestionIndex) }}
                </span>
                <Tag
                  v-if="currentQuestion.difficulty"
                  :value="currentQuestion.difficulty"
                  :severity="currentQuestion.difficulty === 'easy' ? 'success' : currentQuestion.difficulty === 'medium' ? 'warn' : 'danger'"
                  class="!text-xs"
                />
              </div>
              <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 leading-relaxed">
                {{ currentQuestion.question_text || currentQuestion.text || 'No question text available' }}
              </h2>
            </div>

            <Divider />

            <!-- Answer Options -->
            <div class="space-y-3">
              <!-- Radio type (multiple_choice / true_false) -->
              <template v-if="isRadioType(currentQuestion)">
                <div
                  v-for="(option, idx) in (currentQuestion.options || [])"
                  :key="idx"
                  class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-100/5"
                  :class="{
                    'border-primary-300 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/10': currentAnswer(currentQuestion.id) === (option.text || option),
                    'border-surface-200 dark:border-surface-200': currentAnswer(currentQuestion.id) !== (option.text || option),
                  }"
                  @click="selectRadioAnswer(currentQuestion.id, option.text || option)"
                >
                  <RadioButton
                    :model-value="currentAnswer(currentQuestion.id)"
                    :value="option.text || option"
                    :name="`question-${currentQuestion.id}`"
                    @update:model-value="(val) => selectRadioAnswer(currentQuestion.id, val)"
                  />
                  <label class="text-sm text-surface-700 dark:text-surface-600 cursor-pointer flex-1">
                    {{ option.text || option }}
                  </label>
                </div>
              </template>

              <!-- Checkbox type (multiple_select) -->
              <template v-if="isCheckboxType(currentQuestion)">
                <div
                  v-for="(option, idx) in (currentQuestion.options || [])"
                  :key="idx"
                  class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-100/5"
                  :class="{
                    'border-primary-300 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/10': isCheckboxSelected(currentQuestion.id, option.text || option),
                    'border-surface-200 dark:border-surface-200': !isCheckboxSelected(currentQuestion.id, option.text || option),
                  }"
                  @click="toggleCheckboxAnswer(currentQuestion.id, option.text || option)"
                >
                  <Checkbox
                    :model-value="isCheckboxSelected(currentQuestion.id, option.text || option)"
                    :binary="true"
                    @update:model-value="() => toggleCheckboxAnswer(currentQuestion.id, option.text || option)"
                  />
                  <label class="text-sm text-surface-700 dark:text-surface-600 cursor-pointer flex-1">
                    {{ option.text || option }}
                  </label>
                </div>
              </template>
            </div>

            <!-- No options fallback -->
            <div
              v-if="!currentQuestion.options || currentQuestion.options.length === 0"
              class="p-4 bg-surface-50 dark:bg-surface-100 rounded-lg text-sm text-surface-500 dark:text-surface-500 text-center"
            >
              No options available for this question.
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-between mt-4">
            <Button
              icon="pi pi-chevron-left"
              label="Previous"
              severity="secondary"
              :disabled="isFirstQuestion"
              @click="goToPrevious"
            />

            <div class="flex items-center gap-2">
              <Button
                v-if="!isLastQuestion"
                icon="pi pi-chevron-right"
                label="Next"
                icon-pos="right"
                severity="secondary"
                @click="goToNext"
              />
              <Button
                v-else
                icon="pi pi-check"
                label="Submit Evaluation"
                severity="primary"
                @click="openSubmitDialog"
              />
            </div>
          </div>
        </div>

        <!-- Question Navigation Sidebar -->
        <div class="w-full lg:w-64 flex-shrink-0">
          <div class="card p-4 sticky top-20">
            <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-600 mb-3">
              Questions
            </h3>

            <div class="grid grid-cols-5 lg:grid-cols-4 gap-2">
              <button
                v-for="(question, index) in questions"
                :key="question.id"
                class="w-9 h-9 rounded-lg text-xs font-medium border transition-all flex items-center justify-center"
                :class="{
                  'bg-primary-500 border-primary-500 text-white': index === currentQuestionIndex,
                  'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400': index !== currentQuestionIndex && isQuestionAnswered(question.id),
                  'bg-surface-50 dark:bg-surface-200 border-surface-200 dark:border-surface-300 text-surface-600 dark:text-surface-500 hover:border-primary-300': index !== currentQuestionIndex && !isQuestionAnswered(question.id),
                }"
                @click="goToQuestion(index)"
              >
                {{ questionNumber(index) }}
              </button>
            </div>

            <!-- Legend -->
            <div class="mt-4 pt-3 border-t border-surface-100 dark:border-surface-200 space-y-1.5">
              <div class="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-500">
                <span class="w-3 h-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700" />
                Answered
              </div>
              <div class="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-500">
                <span class="w-3 h-3 rounded bg-surface-50 dark:bg-surface-200 border border-surface-200 dark:border-surface-300" />
                Unanswered
              </div>
              <div class="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-500">
                <span class="w-3 h-3 rounded bg-primary-500 border border-primary-500" />
                Current
              </div>
            </div>

            <!-- Stats -->
            <div class="mt-3 pt-3 border-t border-surface-100 dark:border-surface-200">
              <div class="flex justify-between text-xs text-surface-500 dark:text-surface-500">
                <span>Answered:</span>
                <span class="font-medium text-green-600 dark:text-green-400">{{ answeredCount }}</span>
              </div>
              <div class="flex justify-between text-xs text-surface-500 dark:text-surface-500 mt-1">
                <span>Unanswered:</span>
                <span class="font-medium text-red-500 dark:text-red-400">{{ unansweredCount }}</span>
              </div>
            </div>

            <!-- Submit Button in Sidebar -->
            <Button
              icon="pi pi-check"
              label="Submit"
              severity="primary"
              class="w-full mt-4"
              size="small"
              @click="openSubmitDialog"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- SUBMIT CONFIRMATION DIALOG                                          -->
    <!-- =================================================================== -->
    <Dialog
      v-model:visible="showSubmitDialog"
      header="Submit Evaluation"
      :modal="true"
      :closable="!submitting"
      :style="{ width: '480px' }"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-2xl text-yellow-500" />
          <div>
            <p class="text-sm font-medium text-surface-700 dark:text-surface-600 mb-1">
              Are you sure you want to submit?
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-500">
              Once submitted, you cannot change your answers.
            </p>
          </div>
        </div>

        <div class="bg-surface-50 dark:bg-surface-200 rounded-lg p-3 space-y-1">
          <div class="flex justify-between text-sm">
            <span class="text-surface-500 dark:text-surface-500">Total Questions:</span>
            <span class="font-medium text-surface-700 dark:text-surface-600">{{ totalQuestions }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-surface-500 dark:text-surface-500">Answered:</span>
            <span class="font-medium text-green-600 dark:text-green-400">{{ answeredCount }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-surface-500 dark:text-surface-500">Unanswered:</span>
            <span class="font-medium text-red-500 dark:text-red-400">{{ unansweredCount }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-surface-500 dark:text-surface-500">Time Remaining:</span>
            <span class="font-medium text-surface-700 dark:text-surface-600">{{ formattedTimeRemaining }}</span>
          </div>
        </div>

        <p
          v-if="unansweredCount > 0"
          class="text-xs text-yellow-600 dark:text-yellow-400"
        >
          <i class="pi pi-info-circle mr-1" />
          You have {{ unansweredCount }} unanswered question{{ unansweredCount !== 1 ? 's' : '' }}.
        </p>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          :disabled="submitting"
          @click="cancelSubmit"
        />
        <Button
          icon="pi pi-check"
          :label="submitting ? 'Submitting...' : 'Submit Now'"
          severity="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="submitAttempt"
        />
      </template>
    </Dialog>
  </div>
</template>
