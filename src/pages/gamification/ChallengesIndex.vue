<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGamificationStore } from '@/stores/gamification'
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
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'

const gamificationStore = useGamificationStore()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const joinLoading = ref(null)
const completeLoading = ref(null)

const form = ref({
  id: null,
  name: '',
  description: '',
  type: '',
  criteria: '',
  points_reward: 0,
  experience_reward: 0,
  badge_reward_id: null,
  starts_at: null,
  ends_at: null,
  is_active: true,
})

const typeOptions = [
  { label: 'Completar Cursos', value: 'course_completion' },
  { label: 'Puntos', value: 'points' },
  { label: 'Racha', value: 'streak' },
  { label: 'Social', value: 'social' },
  { label: 'Evaluación', value: 'evaluation' },
  { label: 'Microlearning', value: 'microlearning' },
]

onMounted(async () => {
  try {
    await Promise.all([
      gamificationStore.fetchChallenges(),
      gamificationStore.fetchBadges(),
    ])
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los desafíos.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const challenges = computed(() => gamificationStore.challenges)
const badgeOptions = computed(() =>
  gamificationStore.badges.map((b) => ({ label: b.name, value: b.id })),
)

const filteredChallenges = computed(() => {
  if (!searchQuery.value.trim()) return challenges.value
  const q = searchQuery.value.trim().toLowerCase()
  return challenges.value.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)),
  )
})

function openCreate() {
  isEditing.value = false
  form.value = { id: null, name: '', description: '', type: '', criteria: '', points_reward: 0, experience_reward: 0, badge_reward_id: null, starts_at: null, ends_at: null, is_active: true }
  dialogVisible.value = true
}

function openEdit(challenge) {
  isEditing.value = true
  form.value = {
    id: challenge.id,
    name: challenge.name || '',
    description: challenge.description || '',
    type: challenge.type || '',
    criteria: challenge.criteria ? (typeof challenge.criteria === 'string' ? challenge.criteria : JSON.stringify(challenge.criteria)) : '',
    points_reward: challenge.points_reward || 0,
    experience_reward: challenge.experience_reward || 0,
    badge_reward_id: challenge.badge_reward_id || null,
    starts_at: challenge.starts_at ? new Date(challenge.starts_at) : null,
    ends_at: challenge.ends_at ? new Date(challenge.ends_at) : null,
    is_active: challenge.is_active !== false,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      type: form.value.type,
      points_reward: form.value.points_reward,
      experience_reward: form.value.experience_reward,
      badge_reward_id: form.value.badge_reward_id,
      is_active: form.value.is_active,
    }
    if (form.value.criteria) {
      try { payload.criteria = JSON.parse(form.value.criteria) } catch { payload.criteria = form.value.criteria }
    }
    if (form.value.starts_at) payload.starts_at = form.value.starts_at.toISOString()
    if (form.value.ends_at) payload.ends_at = form.value.ends_at.toISOString()

    if (isEditing.value) {
      await gamificationStore.updateChallenge(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Desafío actualizado exitosamente.', life: 4000 })
    } else {
      await gamificationStore.createChallenge(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Desafío creado exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar el desafío.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

async function handleJoin(challengeId) {
  joinLoading.value = challengeId
  try {
    await gamificationStore.joinChallenge(challengeId)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Te has unido al desafío.', life: 4000 })
    await gamificationStore.fetchChallenges()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al unirse.', life: 6000 })
  } finally {
    joinLoading.value = null
  }
}

async function handleComplete(challengeId) {
  completeLoading.value = challengeId
  try {
    const result = await gamificationStore.completeChallenge(challengeId)
    toast.add({ severity: 'success', summary: '¡Desafío Completado!', detail: result.message || 'Recompensas otorgadas.', life: 5000 })
    await gamificationStore.fetchChallenges()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al completar.', life: 6000 })
  } finally {
    completeLoading.value = null
  }
}

function getStatusLabel(challenge) {
  if (!challenge.is_active) return 'Inactivo'
  return 'Activo'
}

function getStatusSeverity(challenge) {
  return challenge.is_active ? 'success' : 'danger'
}
</script>

<template>
  <div class="challenges-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Desafíos</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Participa en desafíos y gana recompensas</p>
      </div>
      <Button label="Nuevo Desafío" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Challenge Cards -->
    <div v-if="!loading && challenges.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <Card v-for="challenge in challenges" :key="challenge.id" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-start gap-3 mb-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 shrink-0">
              <i class="pi pi-flag text-xl" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-surface-900 dark:text-surface-50">{{ challenge.name }}</h3>
              <p class="text-xs text-surface-500 mt-0.5 line-clamp-2">{{ challenge.description || 'Sin descripción' }}</p>
            </div>
            <Tag :severity="getStatusSeverity(challenge)" :value="getStatusLabel(challenge)" />
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <Tag v-if="challenge.points_reward" severity="info" :value="'+'+challenge.points_reward+' pts'" />
            <Tag v-if="challenge.experience_reward" severity="success" :value="'+'+challenge.experience_reward+' exp'" />
            <Tag v-if="challenge.badge" severity="contrast" :value="challenge.badge?.name || 'Insignia'" />
            <Tag :value="challenge.type" severity="warn" />
          </div>

          <div v-if="challenge.participants_count" class="text-xs text-surface-500 mb-3">
            {{ challenge.participants_count }} participante(s)
          </div>

          <div class="flex gap-2">
            <Button
              label="Unirse"
              icon="pi pi-sign-in"
              size="small"
              :loading="joinLoading === challenge.id"
              @click="handleJoin(challenge.id)"
            />
            <Button
              label="Completar"
              icon="pi pi-check"
              size="small"
              severity="success"
              :loading="completeLoading === challenge.id"
              @click="handleComplete(challenge.id)"
            />
            <Button
              icon="pi pi-pencil"
              size="small"
              severity="secondary"
              text
              rounded
              @click="openEdit(challenge)"
              v-tooltip.top="'Editar'"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 4" :key="i" height="200px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Table -->
    <div class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar desafío..." class="w-full sm:w-64" />
        </IconField>
      </div>

      <DataTable :value="filteredChallenges" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.name }}</span>
          </template>
        </Column>
        <Column field="type" header="Tipo" sortable>
          <template #body="{ data }">
            <Tag :value="data.type" />
          </template>
        </Column>
        <Column field="points_reward" header="Puntos" sortable>
          <template #body="{ data }">
            <Tag severity="info" :value="data.points_reward || 0" />
          </template>
        </Column>
        <Column field="participants_count" header="Participantes" sortable>
          <template #body="{ data }">{{ data.participants_count || 0 }}</template>
        </Column>
        <Column field="is_active" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data)" :value="getStatusLabel(data)" />
          </template>
        </Column>
        <Column header="Acciones" style="width:220px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button label="Unirse" size="small" :loading="joinLoading === data.id" @click="handleJoin(data.id)" />
              <Button label="Completar" size="small" severity="success" :loading="completeLoading === data.id" @click="handleComplete(data.id)" />
              <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit(data)" v-tooltip.top="'Editar'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Desafío' : 'Nuevo Desafío'" :modal="true" :style="{ width: '600px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre del desafío" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Descripción</label>
          <Textarea v-model="form.description" placeholder="Descripción del desafío" rows="2" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Tipo <span class="text-red-500">*</span></label>
            <Dropdown v-model="form.type" :options="typeOptions" placeholder="Seleccionar tipo" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Insignia Recompensa</label>
            <Dropdown v-model="form.badge_reward_id" :options="badgeOptions" placeholder="Opcional" :disabled="submitting" showClear />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Puntos</label>
            <InputNumber v-model="form.points_reward" placeholder="0" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Experiencia</label>
            <InputNumber v-model="form.experience_reward" placeholder="0" :disabled="submitting" />
          </div>
          <div class="flex items-center gap-3 pt-6">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Activo</label>
            <ToggleSwitch v-model="form.is_active" :disabled="submitting" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Fecha Inicio</label>
            <Calendar v-model="form.starts_at" placeholder="Opcional" showIcon :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Fecha Fin</label>
            <Calendar v-model="form.ends_at" placeholder="Opcional" showIcon :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Criterios (JSON)</label>
          <Textarea v-model="form.criteria" placeholder='{"target": 10, "metric": "courses"}' rows="2" :disabled="submitting" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" :disabled="submitting" />
        <Button label="Guardar" icon="pi pi-check" :loading="submitting" @click="handleSubmit" />
      </template>
    </Dialog>
  </div>
</template>
