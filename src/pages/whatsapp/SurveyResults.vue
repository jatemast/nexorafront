<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWhatsAppStore } from '@/stores/whatsapp'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'

const whatsappStore = useWhatsAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const surveyId = computed(() => route.params.id)

onMounted(async () => {
  try {
    await whatsappStore.fetchSurveyResults(surveyId.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los resultados.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const results = computed(() => whatsappStore.surveyResults)
const survey = computed(() => results.value?.survey || {})
const totalResponses = computed(() => results.value?.total_responses || 0)
const responses = computed(() => results.value?.responses || [])

function parseQuestions(surveyData) {
  if (!surveyData?.questions) return []
  if (typeof surveyData.questions === 'string') {
    try { return JSON.parse(surveyData.questions) } catch { return [] }
  }
  return surveyData.questions
}

function parseAnswers(response) {
  if (!response?.answers) return []
  if (typeof response.answers === 'string') {
    try { return JSON.parse(response.answers) } catch { return [] }
  }
  return response.answers
}

function getAnswerDisplay(question, answers, index) {
  const answer = answers[index]
  if (answer == null) return 'Sin respuesta'
  if (question.type === 'multiple_choice' || question.type === 'checkbox') {
    if (Array.isArray(answer)) return answer.join(', ')
    return answer
  }
  if (question.type === 'boolean') return answer ? 'Sí' : 'No'
  if (question.type === 'scale') return answer + '/5'
  return answer
}

function getEmployeeName(response) {
  if (!response.employee) return 'Anónimo'
  const e = response.employee
  return `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Empleado'
}

function getResponseStats(questionIndex) {
  const questions = parseQuestions(survey.value)
  const question = questions[questionIndex]
  if (!question) return { total: 0, data: [] }

  const answerCounts = {}
  responses.value.forEach((r) => {
    const answers = parseAnswers(r)
    const ans = answers[questionIndex]
    const key = Array.isArray(ans) ? ans.join(', ') : String(ans ?? 'Sin respuesta')
    answerCounts[key] = (answerCounts[key] || 0) + 1
  })

  return {
    total: totalResponses.value,
    data: Object.entries(answerCounts).map(([key, count]) => ({ answer: key, count })),
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-CO')
}
</script>

<template>
  <div class="survey-results-page">
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="$router.push({ name: 'Surveys' })" />
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Resultados de Encuesta</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">{{ survey.title || 'Cargando...' }}</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <Skeleton height="80px" />
      <Skeleton height="300px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="space-y-6">
      <!-- Summary Card -->
      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50">{{ survey.title }}</h2>
              <p class="text-sm text-surface-500 mt-1">{{ survey.description || 'Sin descripción' }}</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-extrabold text-primary-600">{{ totalResponses }}</div>
              <p class="text-sm text-surface-500">Respuestas Totales</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Question Summary -->
      <div v-for="(question, qIdx) in parseQuestions(survey)" :key="qIdx">
        <Card class="mb-4">
          <template #content>
            <h3 class="font-semibold text-surface-900 dark:text-surface-50 mb-2">
              {{ qIdx + 1 }}. {{ question.text }}
              <Tag v-if="question.required" value="Obligatoria" severity="warn" class="ml-2" />
            </h3>
            <p class="text-xs text-surface-500 mb-4">Tipo: {{ question.type }}</p>

            <!-- Answer Distribution -->
            <div class="space-y-2">
              <div
                v-for="stat in getResponseStats(qIdx).data"
                :key="stat.answer"
                class="flex items-center gap-3"
              >
                <span class="text-sm w-32 truncate">{{ stat.answer }}</span>
                <div class="flex-1 bg-surface-100 dark:bg-surface-700 rounded-full h-6 overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full flex items-center px-2 text-xs text-white font-medium"
                    :style="{ width: totalResponses > 0 ? (stat.count / totalResponses * 100) + '%' : '0%' }"
                  >
                    {{ stat.count }}
                  </div>
                </div>
                <span class="text-xs text-surface-500 w-12 text-right">
                  {{ totalResponses > 0 ? Math.round(stat.count / totalResponses * 100) : 0 }}%
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Individual Responses Table -->
      <Card>
        <template #title>Respuestas Individuales</template>
        <template #content>
          <DataTable :value="responses" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
            <Column header="Empleado">
              <template #body="{ data }">
                <span class="font-medium">{{ getEmployeeName(data) }}</span>
              </template>
            </Column>
            <Column
              v-for="(question, qIdx) in parseQuestions(survey)"
              :key="qIdx"
              :header="'P' + (qIdx + 1)"
              style="min-width:120px"
            >
              <template #body="{ data }">
                <span class="text-xs">{{ getAnswerDisplay(question, parseAnswers(data), qIdx) }}</span>
              </template>
            </Column>
            <Column field="submitted_at" header="Fecha">
              <template #body="{ data }">
                <span class="text-xs">{{ formatDate(data.submitted_at || data.created_at) }}</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>
