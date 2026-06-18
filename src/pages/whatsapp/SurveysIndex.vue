<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWhatsAppStore } from '@/stores/whatsapp'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'

const whatsappStore = useWhatsAppStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const questionBuilderVisible = ref(false)
const editingQuestionIndex = ref(-1)

const form = ref({
  id: null,
  title: '',
  description: '',
  questions: [],
  status: 'draft',
  starts_at: null,
  ends_at: null,
})

const currentQuestion = ref({
  type: 'text',
  text: '',
  options: [],
  required: true,
})

const newOption = ref('')

const statusOptions = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Publicado', value: 'published' },
  { label: 'Cerrado', value: 'closed' },
]

const questionTypes = [
  { label: 'Texto', value: 'text' },
  { label: 'Opción Múltiple', value: 'multiple_choice' },
  { label: 'Casilla de Verificación', value: 'checkbox' },
  { label: 'Escala (1-5)', value: 'scale' },
  { label: 'Sí/No', value: 'boolean' },
]

onMounted(async () => {
  try {
    await whatsappStore.fetchSurveys()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar las encuestas.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const surveys = computed(() => whatsappStore.surveys)

const filteredSurveys = computed(() => {
  if (!searchQuery.value.trim()) return surveys.value
  const q = searchQuery.value.trim().toLowerCase()
  return surveys.value.filter(
    (s) =>
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)),
  )
})

function getStatusSeverity(status) {
  const map = { draft: 'warn', published: 'success', closed: 'danger' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { draft: 'Borrador', published: 'Publicada', closed: 'Cerrada' }
  return map[status] || status
}

function parseQuestions(survey) {
  if (!survey.questions) return []
  if (typeof survey.questions === 'string') {
    try { return JSON.parse(survey.questions) } catch { return [] }
  }
  return survey.questions
}

function openCreate() {
  isEditing.value = false
  form.value = { id: null, title: '', description: '', questions: [], status: 'draft', starts_at: null, ends_at: null }
  dialogVisible.value = true
}

function openEdit(survey) {
  isEditing.value = true
  form.value = {
    id: survey.id,
    title: survey.title || '',
    description: survey.description || '',
    questions: parseQuestions(survey),
    status: survey.status || 'draft',
    starts_at: survey.starts_at ? new Date(survey.starts_at) : null,
    ends_at: survey.ends_at ? new Date(survey.ends_at) : null,
  }
  dialogVisible.value = true
}

// Question Builder
function openAddQuestion() {
  editingQuestionIndex.value = -1
  currentQuestion.value = { type: 'text', text: '', options: [], required: true }
  questionBuilderVisible.value = true
}

function openEditQuestion(index) {
  editingQuestionIndex.value = index
  currentQuestion.value = { ...form.value.questions[index] }
  if (!currentQuestion.value.options) currentQuestion.value.options = []
  questionBuilderVisible.value = true
}

function saveQuestion() {
  const q = { ...currentQuestion.value }
  if (['text', 'scale', 'boolean'].includes(q.type)) {
    q.options = []
  }
  if (editingQuestionIndex.value >= 0) {
    form.value.questions[editingQuestionIndex.value] = q
  } else {
    form.value.questions.push(q)
  }
  questionBuilderVisible.value = false
}

function removeQuestion(index) {
  form.value.questions.splice(index, 1)
}

function addOption() {
  const opt = newOption.value.trim()
  if (opt && !currentQuestion.value.options.includes(opt)) {
    currentQuestion.value.options.push(opt)
  }
  newOption.value = ''
}

function removeOption(index) {
  currentQuestion.value.options.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El título es obligatorio.', life: 4000 })
    return
  }

  submitting.value = true
  try {
    const payload = {
      title: form.value.title,
      description: form.value.description,
      questions: JSON.stringify(form.value.questions),
      status: form.value.status,
    }
    if (form.value.starts_at) payload.starts_at = form.value.starts_at.toISOString()
    if (form.value.ends_at) payload.ends_at = form.value.ends_at.toISOString()

    if (isEditing.value) {
      await whatsappStore.updateSurvey(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Encuesta actualizada exitosamente.', life: 4000 })
    } else {
      await whatsappStore.createSurvey(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Encuesta creada exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar la encuesta.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(survey) {
  confirm.require({
    message: `¿Estás seguro de eliminar la encuesta "${survey.title}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        // Surveys don't have a dedicated delete endpoint in routes, using update to close
        toast.add({ severity: 'info', summary: 'Info', detail: 'Usa el estado "Cerrada" para desactivar la encuesta.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar.', life: 6000 })
      }
    },
  })
}

function getQuestionTypeLabel(type) {
  const map = { text: 'Texto', multiple_choice: 'Op. Múltiple', checkbox: 'Checkbox', scale: 'Escala 1-5', boolean: 'Sí/No' }
  return map[type] || type
}
</script>

<template>
  <div class="surveys-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Encuestas</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Crea y gestiona encuestas para empleados</p>
      </div>
      <Button label="Nueva Encuesta" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Survey Cards -->
    <div v-if="!loading && surveys.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <Card v-for="survey in surveys" :key="survey.id" class="hover:shadow-lg transition-shadow cursor-pointer" @click="openEdit(survey)">
        <template #content>
          <div class="flex items-start gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 shrink-0">
              <i class="pi pi-question-circle text-lg" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-surface-900 dark:text-surface-50 truncate">{{ survey.title }}</h3>
              <p class="text-xs text-surface-500 mt-0.5 line-clamp-2">{{ survey.description || 'Sin descripción' }}</p>
            </div>
            <Tag :severity="getStatusSeverity(survey.status)" :value="getStatusLabel(survey.status)" />
          </div>
          <div class="flex items-center gap-3 text-xs text-surface-500">
            <span><i class="pi pi-list mr-1" />{{ parseQuestions(survey).length }} pregunta(s)</span>
            <span><i class="pi pi-users mr-1" />{{ survey.responses_count || 0 }} respuesta(s)</span>
          </div>
          <div class="flex gap-2 mt-3">
            <Button
              label="Ver Resultados"
              icon="pi pi-chart-bar"
              size="small"
              severity="secondary"
              @click.stop="$router.push({ name: 'SurveyResults', params: { id: survey.id } })"
            />
            <Button
              icon="pi pi-pencil"
              size="small"
              severity="info"
              text
              rounded
              @click.stop="openEdit(survey)"
              v-tooltip.top="'Editar'"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 4" :key="i" height="150px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Table -->
    <div class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar encuesta..." class="w-full sm:w-64" />
        </IconField>
      </div>

      <DataTable :value="filteredSurveys" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="title" header="Título" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.title }}</span>
          </template>
        </Column>
        <Column field="description" header="Descripción" sortable>
          <template #body="{ data }">
            <span class="line-clamp-1 text-xs">{{ data.description || '-' }}</span>
          </template>
        </Column>
        <Column header="Preguntas" sortable>
          <template #body="{ data }">{{ parseQuestions(data).length }}</template>
        </Column>
        <Column field="responses_count" header="Respuestas" sortable>
          <template #body="{ data }">
            <Tag severity="info" :value="data.responses_count || 0" />
          </template>
        </Column>
        <Column field="status" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)" />
          </template>
        </Column>
        <Column header="Acciones" style="width:200px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-chart-bar" severity="help" text rounded size="small" @click="$router.push({ name: 'SurveyResults', params: { id: data.id } })" v-tooltip.top="'Resultados'" />
              <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit(data)" v-tooltip.top="'Editar'" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(data)" v-tooltip.top="'Eliminar'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Encuesta' : 'Nueva Encuesta'" :modal="true" :style="{ width: '700px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Título <span class="text-red-500">*</span></label>
          <InputText v-model="form.title" placeholder="Título de la encuesta" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Descripción</label>
          <Textarea v-model="form.description" placeholder="Descripción de la encuesta" rows="2" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Estado</label>
            <Dropdown v-model="form.status" :options="statusOptions" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Fecha Inicio</label>
            <Calendar v-model="form.starts_at" placeholder="Opcional" showIcon :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Fecha Fin</label>
            <Calendar v-model="form.ends_at" placeholder="Opcional" showIcon :disabled="submitting" />
          </div>
        </div>

        <!-- Questions List -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Preguntas ({{ form.questions.length }})</label>
            <Button label="Agregar Pregunta" icon="pi pi-plus" size="small" severity="secondary" @click="openAddQuestion" :disabled="submitting" />
          </div>
          <div v-if="form.questions.length === 0" class="text-center py-4 text-surface-400 text-sm border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg">
            Sin preguntas. Haz clic en "Agregar Pregunta".
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(q, idx) in form.questions"
              :key="idx"
              class="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Tag :value="getQuestionTypeLabel(q.type)" severity="info" class="shrink-0" />
                <span class="text-sm text-surface-700 dark:text-surface-300 truncate">{{ q.text }}</span>
                <Tag v-if="q.required" value="Obligatoria" severity="warn" class="shrink-0" />
              </div>
              <div class="flex gap-1 shrink-0">
                <Button icon="pi pi-pencil" size="small" text rounded @click="openEditQuestion(idx)" :disabled="submitting" />
                <Button icon="pi pi-times" size="small" text rounded severity="danger" @click="removeQuestion(idx)" :disabled="submitting" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" :disabled="submitting" />
        <Button label="Guardar" icon="pi pi-check" :loading="submitting" @click="handleSubmit" />
      </template>
    </Dialog>

    <!-- Question Builder Dialog -->
    <Dialog v-model:visible="questionBuilderVisible" header="Pregunta" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Tipo de Pregunta</label>
          <Dropdown v-model="currentQuestion.type" :options="questionTypes" placeholder="Seleccionar tipo" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Pregunta</label>
          <InputText v-model="currentQuestion.text" placeholder="Escribe la pregunta" />
        </div>
        <div class="flex items-center gap-3">
          <input type="checkbox" v-model="currentQuestion.required" id="required-q" />
          <label for="required-q" class="text-sm">Obligatoria</label>
        </div>

        <!-- Options for multiple_choice / checkbox -->
        <div v-if="['multiple_choice', 'checkbox'].includes(currentQuestion.type)" class="flex flex-col gap-2">
          <label class="text-sm font-medium">Opciones</label>
          <div class="space-y-1">
            <div v-for="(opt, idx) in currentQuestion.options" :key="idx" class="flex items-center gap-2">
              <span class="text-sm flex-1">{{ opt }}</span>
              <Button icon="pi pi-times" size="small" text rounded severity="danger" @click="removeOption(idx)" />
            </div>
          </div>
          <div class="flex gap-2">
            <InputText v-model="newOption" placeholder="Nueva opción" class="flex-1" @keyup.enter="addOption" />
            <Button icon="pi pi-plus" size="small" severity="secondary" @click="addOption" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="questionBuilderVisible = false" />
        <Button label="Guardar Pregunta" icon="pi pi-check" @click="saveQuestion" />
      </template>
    </Dialog>
  </div>
</template>
