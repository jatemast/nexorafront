<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWhatsAppStore } from '@/stores/whatsapp'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const whatsappStore = useWhatsAppStore()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const filterStatus = ref(null)

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Enviado', value: 'sent' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Leído', value: 'read' },
  { label: 'Fallido', value: 'failed' },
]

onMounted(async () => {
  try {
    await whatsappStore.fetchMessages()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los mensajes.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const messages = computed(() => whatsappStore.messages)

const filteredMessages = computed(() => {
  let list = Array.isArray(messages.value) ? messages.value : []
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (m) =>
        (m.employee && `${m.employee.first_name} ${m.employee.last_name}`.toLowerCase().includes(q)) ||
        (m.schedule?.name && m.schedule.name.toLowerCase().includes(q)) ||
        (m.status && m.status.toLowerCase().includes(q)),
    )
  }
  if (filterStatus.value) {
    list = list.filter((m) => m.status === filterStatus.value)
  }
  return list
})

function getStatusSeverity(status) {
  const map = { pending: 'warn', sent: 'info', delivered: 'success', read: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { pending: 'Pendiente', sent: 'Enviado', delivered: 'Entregado', read: 'Leído', failed: 'Fallido' }
  return map[status] || status
}

function getEmployeeName(msg) {
  if (!msg.employee) return '-'
  const e = msg.employee
  return `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.phone || 'N/A'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-CO')
}
</script>

<template>
  <div class="whatsapp-messages-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Historial de Mensajes</h1>
      <p class="text-surface-500 dark:text-surface-400 mt-1">Seguimiento de mensajes enviados por WhatsApp</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 8" :key="i" height="50px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="card">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar por empleado o programa..." class="w-full sm:w-64" />
        </IconField>
        <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Filtrar estado" class="w-40" />
      </div>

      <DataTable :value="filteredMessages" stripedRows paginator :rows="15" :rowsPerPageOptions="[10, 15, 25]" class="text-sm">
        <Column header="Empleado" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-primary-500" />
              <span class="font-medium">{{ getEmployeeName(data) }}</span>
            </div>
          </template>
        </Column>
        <Column field="employee.phone" header="Teléfono">
          <template #body="{ data }">{{ data.employee?.phone || '-' }}</template>
        </Column>
        <Column header="Programación">
          <template #body="{ data }">{{ data.schedule?.name || '-' }}</template>
        </Column>
        <Column field="status" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)" />
          </template>
        </Column>
        <Column field="sent_at" header="Enviado" sortable>
          <template #body="{ data }">{{ formatDate(data.sent_at || data.created_at) }}</template>
        </Column>
        <Column field="delivered_at" header="Entregado" sortable>
          <template #body="{ data }">{{ formatDate(data.delivered_at) }}</template>
        </Column>
        <Column field="read_at" header="Leído" sortable>
          <template #body="{ data }">{{ formatDate(data.read_at) }}</template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
