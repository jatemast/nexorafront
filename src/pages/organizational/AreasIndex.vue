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
const branchOptions = ref([])

const form = ref({
  id: null,
  branch_id: null,
  name: '',
  code: '',
  description: '',
  parent_id: null,
  is_active: true,
  sort_order: 0,
  metadata: '',
})

onMounted(async () => {
  try {
    const branches = await orgStore.fetchBranches()
    branchOptions.value = branches.map((b) => ({ label: b.name, value: b.id }))
    if (branches.length > 0) {
      selectedBranchId.value = branches[0].id
      await loadAreas()
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los datos.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

async function loadAreas() {
  if (!selectedBranchId.value) return
  try {
    await orgStore.fetchAreas({ branch_id: selectedBranchId.value })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las áreas.', life: 6000 })
  }
}

watch(selectedBranchId, () => {
  loadAreas()
})

const areas = computed(() => orgStore.areas)

const filteredAreas = computed(() => {
  if (!searchQuery.value.trim()) return areas.value
  const q = searchQuery.value.trim().toLowerCase()
  return areas.value.filter(
    (a) =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.code && a.code.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q)),
  )
})

function openCreate() {
  isEditing.value = false
  form.value = { id: null, branch_id: selectedBranchId.value, name: '', code: '', description: '', parent_id: null, is_active: true, sort_order: 0, metadata: '' }
  dialogVisible.value = true
}

function openEdit(area) {
  isEditing.value = true
  form.value = {
    id: area.id,
    branch_id: area.branch_id,
    name: area.name || '',
    code: area.code || '',
    description: area.description || '',
    parent_id: area.parent_id || null,
    is_active: area.is_active !== false,
    sort_order: area.sort_order || 0,
    metadata: area.metadata ? JSON.stringify(area.metadata) : '',
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
      await orgStore.updateArea(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Área actualizada exitosamente.', life: 4000 })
    } else {
      await orgStore.createArea(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Área creada exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar el área.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(area) {
  confirm.require({
    message: `¿Estás seguro de eliminar el área "${area.name}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await orgStore.deleteArea(area.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Área eliminada exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}

function getStatusSeverity(active) {
  return active !== false ? 'success' : 'danger'
}

function getStatusLabel(active) {
  return active !== false ? 'Activa' : 'Inactiva'
}
</script>

<template>
  <div class="areas-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Áreas</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Gestión de áreas organizacionales</p>
      </div>
      <Button label="Nueva Área" icon="pi pi-plus" @click="openCreate" :disabled="!selectedBranchId" />
    </div>

    <!-- Branch Selector -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Filtrar por Sede:</span>
      <Dropdown
        v-model="selectedBranchId"
        :options="branchOptions"
        placeholder="Seleccionar sede"
        class="w-64"
        :loading="loading"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" height="50px" />
    </div>

    <!-- Error -->
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Table -->
    <div v-else class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar área..." class="w-full sm:w-72" />
        </IconField>
      </div>

      <DataTable :value="filteredAreas" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-th-large text-teal-500" />
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
        <Column field="processes_count" header="Procesos" sortable>
          <template #body="{ data }">
            <Tag severity="warning" :value="data.processes_count || 0" />
          </template>
        </Column>
        <Column field="sort_order" header="Orden" sortable style="width:80px" />
        <Column field="is_active" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.is_active)" :value="getStatusLabel(data.is_active)" />
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
    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Editar Área' : 'Nueva Área'"
      :modal="true"
      :style="{ width: '550px' }"
      :closable="!submitting"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Sede <span class="text-red-500">*</span></label>
          <Dropdown v-model="form.branch_id" :options="branchOptions" placeholder="Seleccionar sede" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre del área" :disabled="submitting" />
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
          <Textarea v-model="form.description" placeholder="Descripción del área" rows="2" :disabled="submitting" />
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
