<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrganizationalStore } from '@/stores/organizational'
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

const orgStore = useOrganizationalStore()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const selectedBranchId = ref(null)
const selectedAreaId = ref(null)
const branchOptions = ref([])
const areaOptions = ref([])

const form = ref({
  id: null,
  area_id: null,
  name: '',
  code: '',
  description: '',
  is_active: true,
  sort_order: 0,
  metadata: '',
})

onMounted(async () => {
  try {
    const branches = await orgStore.fetchBranches()
    branchOptions.value = branches.map((b) => ({ label: b.name, value: b.id }))
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los datos.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

async function loadAreas() {
  if (!selectedBranchId.value) {
    areaOptions.value = []
    selectedAreaId.value = null
    orgStore.processes = []
    return
  }
  try {
    await orgStore.fetchAreas({ branch_id: selectedBranchId.value })
    areaOptions.value = orgStore.areas.map((a) => ({ label: a.name, value: a.id }))
    if (orgStore.areas.length > 0 && !selectedAreaId.value) {
      selectedAreaId.value = orgStore.areas[0].id
      await loadProcesses()
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las áreas.', life: 6000 })
  }
}

async function loadProcesses() {
  if (!selectedAreaId.value) return
  try {
    await orgStore.fetchProcesses({ area_id: selectedAreaId.value })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los procesos.', life: 6000 })
  }
}

watch(selectedBranchId, () => { loadAreas() })
watch(selectedAreaId, () => { loadProcesses() })

const processes = computed(() => orgStore.processes)

const filteredProcesses = computed(() => {
  if (!searchQuery.value.trim()) return processes.value
  const q = searchQuery.value.trim().toLowerCase()
  return processes.value.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)),
  )
})

function openCreate() {
  isEditing.value = false
  form.value = { id: null, area_id: selectedAreaId.value, name: '', code: '', description: '', is_active: true, sort_order: 0, metadata: '' }
  dialogVisible.value = true
}

function openEdit(proc) {
  isEditing.value = true
  form.value = {
    id: proc.id,
    area_id: proc.area_id,
    name: proc.name || '',
    code: proc.code || '',
    description: proc.description || '',
    is_active: proc.is_active !== false,
    sort_order: proc.sort_order || 0,
    metadata: proc.metadata ? JSON.stringify(proc.metadata) : '',
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (payload.metadata && typeof payload.metadata === 'string') {
      try { payload.metadata = JSON.parse(payload.metadata) } catch { /* keep */ }
    }
    delete payload.id

    if (isEditing.value) {
      await orgStore.updateProcess(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proceso actualizado exitosamente.', life: 4000 })
    } else {
      await orgStore.createProcess(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proceso creado exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar el proceso.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(proc) {
  confirm.require({
    message: `¿Estás seguro de eliminar el proceso "${proc.name}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await orgStore.deleteProcess(proc.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proceso eliminado exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}
</script>

<template>
  <div class="processes-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Procesos</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Gestión de procesos organizacionales</p>
      </div>
      <Button label="Nuevo Proceso" icon="pi pi-plus" @click="openCreate" :disabled="!selectedAreaId" />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Sede:</span>
      <Dropdown v-model="selectedBranchId" :options="branchOptions" placeholder="Seleccionar sede" class="w-52" />
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Área:</span>
      <Dropdown v-model="selectedAreaId" :options="areaOptions" placeholder="Seleccionar área" class="w-52" :loading="loading" />
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" height="50px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar proceso..." class="w-full sm:w-72" />
        </IconField>
      </div>

      <DataTable :value="filteredProcesses" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-orange-500" />
              <span class="font-medium">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="code" header="Código" sortable />
        <Column field="description" header="Descripción" sortable>
          <template #body="{ data }">
            <span class="line-clamp-2">{{ data.description || '-' }}</span>
          </template>
        </Column>
        <Column field="sort_order" header="Orden" sortable style="width:80px" />
        <Column field="is_active" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="data.is_active !== false ? 'success' : 'danger'" :value="data.is_active !== false ? 'Activo' : 'Inactivo'" />
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

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Proceso' : 'Nuevo Proceso'" :modal="true" :style="{ width: '550px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Área <span class="text-red-500">*</span></label>
          <Dropdown v-model="form.area_id" :options="areaOptions" placeholder="Seleccionar área" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre del proceso" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Código</label>
            <InputText v-model="form.code" placeholder="Código" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Orden</label>
            <InputText v-model.number="form.sort_order" type="number" placeholder="0" :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Descripción</label>
          <Textarea v-model="form.description" placeholder="Descripción del proceso" rows="2" :disabled="submitting" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Activo</label>
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
