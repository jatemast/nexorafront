<script setup>
import { ref, computed, onMounted } from 'vue'
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
import ToggleSwitch from 'primevue/toggleswitch'
import Calendar from 'primevue/calendar'

const whatsappStore = useWhatsAppStore()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)

const form = ref({
  id: null,
  name: '',
  type: '',
  microlearning_content_id: null,
  message_template: '',
  frequency: 'daily',
  custom_cron: '',
  scheduled_time: '08:00',
  target_filters: '',
  is_active: true,
})

const frequencyOptions = [
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Personalizada (Cron)', value: 'custom' },
]

const typeOptions = [
  { label: 'Microlearning', value: 'microlearning' },
  { label: 'Recordatorio', value: 'reminder' },
  { label: 'Anuncio', value: 'announcement' },
  { label: 'Encuesta', value: 'survey' },
  { label: 'Personalizado', value: 'custom' },
]

onMounted(async () => {
  try {
    await whatsappStore.fetchSchedules()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar las programaciones.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const schedules = computed(() => whatsappStore.schedules)

const filteredSchedules = computed(() => {
  if (!searchQuery.value.trim()) return schedules.value
  const q = searchQuery.value.trim().toLowerCase()
  return schedules.value.filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.type && s.type.toLowerCase().includes(q)) ||
      (s.frequency && s.frequency.toLowerCase().includes(q)),
  )
})

function getFrequencyLabel(freq) {
  const map = { daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual', custom: 'Personalizada' }
  return map[freq] || freq
}

function getTypeLabel(type) {
  const map = { microlearning: 'Microlearning', reminder: 'Recordatorio', announcement: 'Anuncio', survey: 'Encuesta', custom: 'Personalizado' }
  return map[type] || type
}

function openCreate() {
  isEditing.value = false
  form.value = { id: null, name: '', type: 'microlearning', microlearning_content_id: null, message_template: '', frequency: 'daily', custom_cron: '', scheduled_time: '08:00', target_filters: '', is_active: true }
  dialogVisible.value = true
}

function openEdit(schedule) {
  isEditing.value = true
  form.value = {
    id: schedule.id,
    name: schedule.name || '',
    type: schedule.type || 'microlearning',
    microlearning_content_id: schedule.microlearning_content_id || null,
    message_template: schedule.message_template || '',
    frequency: schedule.frequency || 'daily',
    custom_cron: schedule.custom_cron || '',
    scheduled_time: schedule.scheduled_time || '08:00',
    target_filters: schedule.target_filters ? (typeof schedule.target_filters === 'string' ? schedule.target_filters : JSON.stringify(schedule.target_filters)) : '',
    is_active: schedule.is_active !== false,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (payload.target_filters) {
      try { payload.target_filters = JSON.parse(payload.target_filters) } catch { /* keep */ }
    }
    delete payload.id

    if (isEditing.value) {
      await whatsappStore.updateSchedule(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Programación actualizada exitosamente.', life: 4000 })
    } else {
      await whatsappStore.createSchedule(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Programación creada exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar la programación.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(schedule) {
  confirm.require({
    message: `¿Estás seguro de eliminar la programación "${schedule.name}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await whatsappStore.deleteSchedule(schedule.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Programación eliminada exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}
</script>

<template>
  <div class="whatsapp-schedules-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Programaciones WhatsApp</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Configura envíos automáticos de mensajes</p>
      </div>
      <Button label="Nueva Programación" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar programación..." class="w-full sm:w-64" />
        </IconField>
      </div>

      <DataTable :value="filteredSchedules" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-whatsapp text-green-500" />
              <span class="font-medium">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="type" header="Tipo" sortable>
          <template #body="{ data }">
            <Tag :value="getTypeLabel(data.type)" severity="info" />
          </template>
        </Column>
        <Column field="frequency" header="Frecuencia" sortable>
          <template #body="{ data }">
            <Tag :value="getFrequencyLabel(data.frequency)" severity="warn" />
          </template>
        </Column>
        <Column field="scheduled_time" header="Hora" sortable>
          <template #body="{ data }">{{ data.scheduled_time || '-' }}</template>
        </Column>
        <Column field="is_active" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="data.is_active !== false ? 'success' : 'danger'" :value="data.is_active !== false ? 'Activa' : 'Inactiva'" />
          </template>
        </Column>
        <Column header="Acciones" style="width:150px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit(data)" v-tooltip.top="'Editar'" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(data)" v-tooltip.top="'Eliminar'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Programación' : 'Nueva Programación'" :modal="true" :style="{ width: '600px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre de la programación" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Tipo <span class="text-red-500">*</span></label>
            <Dropdown v-model="form.type" :options="typeOptions" placeholder="Tipo" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Frecuencia <span class="text-red-500">*</span></label>
            <Dropdown v-model="form.frequency" :options="frequencyOptions" placeholder="Frecuencia" :disabled="submitting" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Hora Programada</label>
            <InputText v-model="form.scheduled_time" placeholder="HH:MM" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2" v-if="form.frequency === 'custom'">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Expresión Cron</label>
            <InputText v-model="form.custom_cron" placeholder="*/30 * * * *" :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Plantilla de Mensaje</label>
          <Textarea v-model="form.message_template" placeholder="Hola {nombre}, tienes un nuevo contenido disponible..." rows="3" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Filtros de Destinatarios (JSON)</label>
          <Textarea v-model="form.target_filters" placeholder='{"area_ids": [1, 2], "position_ids": [3]}' rows="2" :disabled="submitting" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Activa</label>
          <ToggleSwitch v-model="form.is_active" :disabled="submitting" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" :disabled="submitting" />
        <Button label="Guardar" icon="pi pi-check" :loading="submitting" @click="handleSubmit" />
      </template>
    </Dialog>
  </div>
</template>
