<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEvaluationsStore } from '@/stores/evaluations'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Divider from 'primevue/divider'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const evaluationsStore = useEvaluationsStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const attemptId = computed(() => route.params.id)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const results = computed(() => evaluationsStore.results)

const score = computed(() => results.value?.score ?? 0)
const totalPoints = computed(() => results.value?.total_points ?? results.value?.total ?? 0)
const percentage = computed(() => {
  if (totalPoints.value === 0) return 0
  return Math.round((score.value / totalPoints.value) * 100)
})

const passed = computed(() => results.value?.passed ?? results.value?.is_passed ?? false)
const passingScoreThreshold = computed(() => results.value?.passing_score ?? results.value?.evaluation?.passing_score ?? 0)
const timeTaken = computed(() => results.value?.time_taken ?? results.value?.time_spent ?? 0)

const evaluationTitle = computed(() => results.value?.evaluation?.title || results.value?.evaluation_title || 'Evaluation')
const questions = computed(() => results.value?.questions || results.value?.answers || [])
const hasQuestions = computed(() => questions.value.length > 0)

const formattedTimeTaken = computed(() => {
  const seconds = timeTaken.value
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }
  return `${mins} min ${secs} sec`
})

const formattedDate = computed(() => {
  const dateStr = results.value?.completed_at || results.value?.created_at
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// ---------------------------------------------------------------------------
// Score circle
// ---------------------------------------------------------------------------
const circleRadius = 80
const circleCircumference = 2 * Math.PI * circleRadius
const circleDashOffset = computed(() => {
  return circleCircumference - (percentage.value / 100) * circleCircumference
})

const scoreColor = computed(() => {
  if (passed.value) return '#22c55e'
  return '#ef4444'
})

const scoreGradient = computed(() => {
  if (passed.value) {
    return ['#22c55e', '#16a34a']
  }
  return ['#ef4444', '#dc2626']
})

// ---------------------------------------------------------------------------
// Question Results Helpers
// ---------------------------------------------------------------------------
function isQuestionCorrect(question) {
  return question.is_correct === true || question.correct === true
}

function userAnswerDisplay(question) {
  const answer = question.user_answer ?? question.selected_answer ?? question.answer
  if (answer === null || answer === undefined) return 'No answer'
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join(', ') : 'No answer'
  }
  if (typeof answer === 'boolean') {
    return answer ? 'True' : 'False'
  }
  return String(answer) || 'No answer'
}

function correctAnswerDisplay(question) {
  const answer = question.correct_answer
  if (answer === null || answer === undefined) return 'N/A'
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join(', ') : 'N/A'
  }
  if (typeof answer === 'boolean') {
    return answer ? 'True' : 'False'
  }
  return String(answer) || 'N/A'
}

function hasExplanation(question) {
  return !!(question.explanation && question.explanation.trim())
}

function questionTypeLabel(question) {
  switch (question.type) {
    case 'multiple_choice':
      return 'Multiple Choice'
    case 'multiple_select':
      return 'Multiple Select'
    case 'true_false':
      return 'True / False'
    default:
      return question.type || 'Unknown'
  }
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchResultsData() {
  initialLoading.value = true
  loadError.value = ''

  try {
    await evaluationsStore.fetchResults(attemptId.value)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      evaluationsStore.error ||
      'Failed to load evaluation results.'

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

function navigateBack() {
  router.push({ name: 'Evaluations' })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchResultsData()
})
</script>

<template>
  <div class="evaluation-results-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Evaluation Results
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          {{ evaluationTitle }}
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Evaluations"
        severity="secondary"
        size="small"
        @click="navigateBack"
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
      <!-- Score Card Skeleton -->
      <div class="card p-8 text-center">
        <div class="flex justify-center mb-4">
          <Skeleton width="10rem" height="10rem" shape="circle" />
        </div>
        <Skeleton width="12rem" height="1.5rem" class="mx-auto mb-2" />
        <Skeleton width="8rem" height="2rem" class="mx-auto mb-4" />
        <div class="flex justify-center gap-4">
          <Skeleton width="8rem" height="1.25rem" />
          <Skeleton width="8rem" height="1.25rem" />
        </div>
      </div>

      <!-- Questions Skeleton -->
      <div class="card p-6 space-y-4">
        <div v-for="n in 5" :key="`q-skel-${n}`" class="flex items-start gap-3">
          <Skeleton width="2rem" height="2rem" shape="circle" class="flex-shrink-0" />
          <div class="flex-1 space-y-2">
            <Skeleton width="70%" height="1rem" />
            <Skeleton width="100%" height="0.875rem" />
            <Skeleton width="50%" height="0.875rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else-if="results && !loadError">
      <!-- Score Card -->
      <div class="card p-6 sm:p-8">
        <div class="flex flex-col lg:flex-row items-center gap-8">
          <!-- Progress Circle -->
          <div class="flex-shrink-0 relative">
            <svg width="200" height="200" class="transform -rotate-90">
              <!-- Background circle -->
              <circle
                cx="100"
                cy="100"
                :r="circleRadius"
                fill="none"
                stroke="currentColor"
                stroke-width="12"
                class="text-surface-100 dark:text-surface-200"
              />
              <!-- Progress circle -->
              <circle
                cx="100"
                cy="100"
                :r="circleRadius"
                fill="none"
                :stroke="scoreColor"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="circleCircumference"
                :stroke-dashoffset="circleDashOffset"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <!-- Center text -->
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-extrabold" :style="{ color: scoreColor }">
                {{ percentage }}%
              </span>
              <span class="text-xs text-surface-400 dark:text-surface-500 mt-1">
                {{ score }}/{{ totalPoints }}
              </span>
            </div>
          </div>

          <!-- Score Details -->
          <div class="flex-1 text-center lg:text-left">
            <div class="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <Tag
                :value="passed ? 'Passed' : 'Failed'"
                :severity="passed ? 'success' : 'danger'"
                class="!text-sm !px-3 !py-1"
              />
            </div>

            <h2 class="text-xl font-bold text-surface-800 dark:text-surface-600 mb-4">
              {{ passed ? 'Congratulations!' : 'Keep Trying!' }}
            </h2>

            <p class="text-sm text-surface-500 dark:text-surface-500 mb-6">
              {{ passed
                ? `You have successfully passed the evaluation with a score of ${percentage}%.`
                : `You scored ${percentage}%, which is below the passing threshold of ${passingScoreThreshold}%.` }}
            </p>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              <div class="bg-surface-50 dark:bg-surface-200 rounded-lg p-3 text-center">
                <p class="text-xs text-surface-400 dark:text-surface-500 mb-1">Time Taken</p>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                  {{ formattedTimeTaken }}
                </p>
              </div>
              <div class="bg-surface-50 dark:bg-surface-200 rounded-lg p-3 text-center">
                <p class="text-xs text-surface-400 dark:text-surface-500 mb-1">Completed</p>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                  {{ formattedDate }}
                </p>
              </div>
              <div class="bg-surface-50 dark:bg-surface-200 rounded-lg p-3 text-center">
                <p class="text-xs text-surface-400 dark:text-surface-500 mb-1">Passing Score</p>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                  {{ passingScoreThreshold }}%
                </p>
              </div>
              <div class="bg-surface-50 dark:bg-surface-200 rounded-lg p-3 text-center">
                <p class="text-xs text-surface-400 dark:text-surface-500 mb-1">Correct</p>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-600">
                  {{ questions.filter(isQuestionCorrect).length }}/{{ questions.length }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- QUESTIONS BREAKDOWN                                                -->
      <!-- ================================================================= -->
      <div class="card p-6 sm:p-8">
        <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
          Question Breakdown
        </h2>
        <p class="text-xs text-surface-400 dark:text-surface-500 mb-6">
          Review your answers for each question
        </p>

        <!-- Empty State -->
        <div
          v-if="!hasQuestions"
          class="text-center py-8"
        >
          <div class="flex justify-center mb-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
              <i class="pi pi-question text-xl text-surface-400 dark:text-surface-500" />
            </div>
          </div>
          <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-500 mb-1">
            No question details available
          </h3>
          <p class="text-xs text-surface-400 dark:text-surface-500">
            The results do not include individual question breakdowns.
          </p>
        </div>

        <!-- Questions List -->
        <div v-else class="space-y-4">
          <div
            v-for="(question, index) in questions"
            :key="question.id || index"
            class="border rounded-lg p-4"
            :class="{
              'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10': isQuestionCorrect(question),
              'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10': !isQuestionCorrect(question),
              'border-surface-200 dark:border-surface-200': isQuestionCorrect(question) === undefined,
            }"
          >
            <!-- Question Header -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-start gap-2 flex-1 min-w-0">
                <span
                  class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  :class="{
                    'bg-green-500 text-white': isQuestionCorrect(question),
                    'bg-red-500 text-white': !isQuestionCorrect(question),
                    'bg-surface-200 text-surface-600': isQuestionCorrect(question) === undefined,
                  }"
                >
                  <i
                    :class="isQuestionCorrect(question) ? 'pi pi-check' : 'pi pi-times'"
                    class="text-xs"
                  />
                </span>
                <div>
                  <p class="text-sm font-medium text-surface-800 dark:text-surface-600">
                    {{ question.question_text || question.text || `Question ${index + 1}` }}
                  </p>
                  <span class="text-xs text-surface-400 dark:text-surface-500">
                    {{ questionTypeLabel(question) }}
                  </span>
                </div>
              </div>
              <Tag
                :value="isQuestionCorrect(question) ? 'Correct' : 'Incorrect'"
                :severity="isQuestionCorrect(question) ? 'success' : 'danger'"
                class="!text-xs flex-shrink-0"
              />
            </div>

            <!-- Answer Details -->
            <div class="space-y-2 pl-8">
              <!-- User's Answer -->
              <div class="flex items-start gap-2">
                <span class="text-xs font-medium text-surface-500 dark:text-surface-500 w-28 flex-shrink-0">
                  Your Answer:
                </span>
                <span
                  class="text-sm"
                  :class="{
                    'text-red-600 dark:text-red-400': !isQuestionCorrect(question),
                    'text-green-600 dark:text-green-400': isQuestionCorrect(question),
                    'text-surface-500 dark:text-surface-500': isQuestionCorrect(question) === undefined,
                  }"
                >
                  {{ userAnswerDisplay(question) }}
                </span>
              </div>

              <!-- Correct Answer (only show if wrong) -->
              <div
                v-if="!isQuestionCorrect(question)"
                class="flex items-start gap-2"
              >
                <span class="text-xs font-medium text-surface-500 dark:text-surface-500 w-28 flex-shrink-0">
                  Correct Answer:
                </span>
                <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                  {{ correctAnswerDisplay(question) }}
                </span>
              </div>

              <!-- Points -->
              <div
                v-if="question.points !== undefined || question.score !== undefined"
                class="flex items-start gap-2"
              >
                <span class="text-xs font-medium text-surface-500 dark:text-surface-500 w-28 flex-shrink-0">
                  Points:
                </span>
                <span class="text-sm text-surface-700 dark:text-surface-600">
                  {{ question.points ?? question.score ?? 0 }}
                </span>
              </div>

              <!-- Explanation -->
              <div
                v-if="hasExplanation(question)"
                class="mt-2 p-3 bg-surface-50 dark:bg-surface-200 rounded-lg"
              >
                <p class="text-xs font-medium text-surface-500 dark:text-surface-500 mb-1">
                  <i class="pi pi-info-circle mr-1" />
                  Explanation
                </p>
                <p class="text-sm text-surface-700 dark:text-surface-600 leading-relaxed">
                  {{ question.explanation }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- ACTIONS                                                            -->
      <!-- ================================================================= -->
      <div class="flex items-center justify-center gap-3 pt-2">
        <Button
          icon="pi pi-arrow-left"
          label="Back to Evaluations"
          severity="secondary"
          @click="navigateBack"
        />
        <Button
          icon="pi pi-refresh"
          label="Retake Evaluation"
          severity="primary"
          @click="router.push({ name: 'EvaluationTake', params: { id: results?.evaluation?.id || results?.evaluation_id } })"
        />
      </div>
    </template>
  </div>
</template>
