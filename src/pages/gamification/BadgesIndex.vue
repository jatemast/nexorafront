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

const gamificationStore = useGamificationStore()
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
  description: '',
  icon: 'pi pi-star',
  color: '#6366f1',
  category: '',
  criteria: '',
  points_awarded: 0,
  is_active: true,
})

const iconOptions = [
  { label: 'Estrella', value: 'pi pi-star' },
  { label: 'Estrella Rellena', value: 'pi pi-star-fill' },
  { label: 'Corona', value: 'pi pi-crown' },
  { label: 'Verificado', value: 'pi pi-verified' },
  { label: 'Trofeo', value: 'pi pi-trophy' },
  { label: 'Corazón', value: 'pi pi-heart' },
  { label: 'Corazón Relleno', value: 'pi pi-heart-fill' },
  { label: 'Rayo', value: 'pi pi-bolt' },
  { label: 'Fuego', value: 'pi pi-sun' },
  { label: 'Diamante', value: 'pi pi-tag' },
]

const colorOptions = [
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Oro', value: '#f59e0b' },
  { label: 'Verde', value: '#10b981' },
  { label: 'Rojo', value: '#ef4444' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Púrpura', value: '#8b5cf6' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Cyan', value: '#06b6d4' },
]

onMounted(async () => {
  try {
    await gamificationStore.fetchBadges()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar las insignias.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const badges = computed(() => gamificationStore.badges)

const filteredBadges = computed(() => {
  if (!searchQuery.value.trim()) return badges.value
  const q = searchQuery.value.trim().toLowerCase()
  return badges.value.filter(
    (b) =>
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)),
  )
})

function openCreate() {
  isEditing.value = false
  form.value = { id: null, name: '', description: '', icon: 'pi pi-star', color: '#6366f1', category: '', criteria: '', points_awarded: 0, is_active: true }
  dialogVisible.value = true
}

function openEdit(badge) {
  isEditing.value = true
  form.value = {
    id: badge.id,
    name: badge.name || '',
    description: badge.description || '',
    icon: badge.icon || 'pi pi-star',
    color: badge.color || '#6366f1',
    category: badge.category || '',
    criteria: badge.criteria ? (typeof badge.criteria === 'string' ? badge.criteria : JSON.stringify(badge.criteria)) : '',
    points_awarded: badge.points_awarded || 0,
    is_active: badge.is_active !== false,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (payload.criteria) {
      try { payload.criteria = JSON.parse(payload.criteria) } catch { /* keep as string */ }
    }
    delete payload.id

    if (isEditing.value) {
      await gamificationStore.updateBadge(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Insignia actualizada exitosamente.', life: 4000 })
    } else {
      await gamificationStore.createBadge(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Insignia creada exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar la insignia.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(badge) {
  confirm.require({
    message: `¿Estás seguro de eliminar la insignia "${badge.name}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await gamificationStore.deleteBadge(badge.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Insignia eliminada exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}
</script>

<template>
  <div class="badges-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Insignias</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Gestión de insignias de gamificación</p>
      </div>
      <Button label="Nueva Insignia" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Badge Grid -->
    <div v-if="!loading && badges.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div
        v-for="badge in badges"
        :key="badge.id"
        class="flex flex-col items-center p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow cursor-pointer"
        @click="openEdit(badge)"
      >
        <i :class="badge.icon || 'pi pi-star'" class="text-3xl mb-2" :style="{ color: badge.color || '#6366f1' }" />
        <span class="text-sm font-medium text-center text-surface-700 dark:text-surface-300 line-clamp-2">{{ badge.name }}</span>
        <span class="text-xs text-surface-500 mt-1">{{ badge.points_awarded ? '+' + badge.points_awarded + ' pts' : 'Sin puntos' }}</span>
        <Tag
          :severity="badge.is_active !== false ? 'success' : 'danger'"
          :value="badge.is_active !== false ? 'Activa' : 'Inactiva'"
          class="!text-xs mt-2"
        />
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 6" :key="i" height="120px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Table -->
    <div class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar insignia..." class="w-full sm:w-64" />
        </IconField>
      </div>

      <DataTable :value="filteredBadges" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column header="Icono" style="width:80px">
          <template #body="{ data }">
            <i :class="data.icon || 'pi pi-star'" class="text-2xl" :style="{ color: data.color || '#6366f1' }" />
          </template>
        </Column>
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.name }}</span>
          </template>
        </Column>
        <Column field="description" header="Descripción" sortable>
          <template #body="{ data }">{{ data.description || '-' }}</template>
        </Column>
        <Column field="category" header="Categoría" sortable />
        <Column field="points_awarded" header="Puntos" sortable>
          <template #body="{ data }">
            <Tag severity="info" :value="data.points_awarded || 0" />
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
    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Insignia' : 'Nueva Insignia'" :modal="true" :style="{ width: '550px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre de la insignia" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Descripción</label>
          <Textarea v-model="form.description" placeholder="Descripción de la insignia" rows="2" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Ícono</label>
            <Dropdown v-model="form.icon" :options="iconOptions" placeholder="Seleccionar ícono" :disabled="submitting">
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <i :class="slotProps.value" />
                  <span>{{ iconOptions.find(o => o.value === slotProps.value)?.label }}</span>
                </div>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <i :class="slotProps.option.value" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Dropdown>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Color</label>
            <Dropdown v-model="form.color" :options="colorOptions" placeholder="Seleccionar color" :disabled="submitting">
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <span class="h-4 w-4 rounded-full inline-block" :style="{ background: slotProps.value }" />
                  <span>{{ colorOptions.find(o => o.value === slotProps.value)?.label }}</span>
                </div>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <span class="h-4 w-4 rounded-full inline-block" :style="{ background: slotProps.option.value }" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Dropdown>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Categoría</label>
            <InputText v-model="form.category" placeholder="Categoría" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Puntos Otorgados</label>
            <InputNumber v-model="form.points_awarded" placeholder="0" :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Criterios (JSON)</label>
          <Textarea v-model="form.criteria" placeholder='{"type": "course_completion", "count": 5}' rows="2" :disabled="submitting" />
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
