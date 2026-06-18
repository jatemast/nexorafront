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
import InputNumber from 'primevue/inputnumber'

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
const selectedProcessId = ref(null)
const branchOptions = ref([])
const areaOptions = ref([])
const processOptions = ref([])

const form = ref({
  id: null,
  process_id: null,
  name: '',
  code: '',
  description: '',
  responsibilities: '',
  requirements: '',
  min_salary: null,
  max_salary: null,
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
    processOptions.value = []
    selectedAreaId.value = null
    selectedProcessId.value = null
    orgStore.positions = []
    return
  }
  try {
    await orgStore.fetchAreas({ branch_id: selectedBranchId.value })
    areaOptions.value = orgStore.areas.map((a) => ({ label: a.name, value: a.id }))
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar áreas.', life: 6000 })
  }
}

async function loadProcesses() {
  if (!selectedAreaId.value) {
    processOptions.value = []
    selectedProcessId.value = null
    orgStore.positions = []
    return
  }
  try {
    await orgStore.fetchProcesses({ area_id: selectedAreaId.value })
    processOptions.value = orgStore.processes.map((p) => ({ label: p.name, value: p.id }))
    if (orgStore.processes.length > 0 && !selectedProcessId.value) {
      selectedProcessId.value = orgStore.processes[0].id
      await loadPositions()
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar procesos.', life: 6000 })
  }
}

async function loadPositions() {
  if (!selectedProcessId.value) return
  try {
    await orgStore.fetchPositions({ process_id: selectedProcessId.value })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar cargos.', life: 6000 })
  }
}

watch(selectedBranchId, () => { loadAreas() })
watch(selectedAreaId, () => { loadProcesses() })
watch(selectedProcessId, () => { loadPositions() })

const positions = computed(() => orgStore.positions)

const filteredPositions = computed(() => {
  if (!searchQuery.value.trim()) return positions.value
  const q = searchQuery.value.trim().toLowerCase()
  return positions.value.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.responsibilities && p.responsibilities.toLowerCase().includes(q)),
  )
})

function openCreate() {
  isEditing.value = false
  form.value = { id: null, process_id: selectedProcessId.value, name: '', code: '', description: '', responsibilities: '', requirements: '', min_salary: null, max_salary: null, is_active: true, sort_order: 0, metadata: '' }
  dialogVisible.value = true
}

function openEdit(pos) {
  isEditing.value = true
  form.value = {
    id: pos.id,
    process_id: pos.process_id,
    name: pos.name || '',
    code: pos.code || '',
    description: pos.description || '',
    responsibilities: pos.responsibilities || '',
    requirements: pos.requirements || '',
    min_salary: pos.min_salary || null,
    max_salary: pos.max_salary || null,
    is_active: pos.is_active !== false,
    sort_order: pos.sort_order || 0,
    metadata: pos.metadata ? JSON.stringify(pos.metadata) : '',
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
      await orgStore.updatePosition(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cargo actualizado exitosamente.', life: 4000 })
    } else {
      await orgStore.createPosition(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cargo creado exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar el cargo.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(pos) {
  confirm.require({
    message: `¿Estás seguro de eliminar el cargo "${pos.name}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await orgStore.deletePosition(pos.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cargo eliminado exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}

function formatSalary(val) {
  if (val == null) return '-'
  return '$' + Number(val).toLocaleString('es-CO')
}
</script>

<template>
  <div class="positions-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Cargos</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Gestión de cargos y posiciones</p>
      </div>
      <Button label="Nuevo Cargo" icon="pi pi-plus" @click="openCreate" :disabled="!selectedProcessId" />
    </div>

    <!-- Cascading Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Sede:</span>
      <Dropdown v-model="selectedBranchId" :options="branchOptions" placeholder="Seleccionar sede" class="w-48" />
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Área:</span>
      <Dropdown v-model="selectedAreaId" :options="areaOptions" placeholder="Seleccionar área" class="w-48" />
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Proceso:</span>
      <Dropdown v-model="selectedProcessId" :options="processOptions" placeholder="Seleccionar proceso" class="w-48" />
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" height="50px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="card">
      <div class="flex items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar cargo..." class="w-full sm:w-72" />
        </IconField>
      </div>

      <DataTable :value="filteredPositions" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-purple-500" />
              <span class="font-medium">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="code" header="Código" sortable />
        <Column field="min_salary" header="Salario Mín." sortable>
          <template #body="{ data }">{{ formatSalary(data.min_salary) }}</template>
        </Column>
        <Column field="max_salary" header="Salario Máx." sortable>
          <template #body="{ data }">{{ formatSalary(data.max_salary) }}</template>
        </Column>
        <Column field="responsibilities" header="Responsabilidades" sortable>
          <template #body="{ data }">
            <span class="line-clamp-2 text-xs">{{ data.responsibilities || '-' }}</span>
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

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Cargo' : 'Nuevo Cargo'" :modal="true" :style="{ width: '600px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Proceso <span class="text-red-500">*</span></label>
          <Dropdown v-model="form.process_id" :options="processOptions" placeholder="Seleccionar proceso" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre del cargo" :disabled="submitting" />
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
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Salario Mínimo</label>
            <InputNumber v-model="form.min_salary" placeholder="0" :disabled="submitting" mode="currency" currency="COP" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Salario Máximo</label>
            <InputNumber v-model="form.max_salary" placeholder="0" :disabled="submitting" mode="currency" currency="COP" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Descripción</label>
          <Textarea v-model="form.description" placeholder="Descripción del cargo" rows="2" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Responsabilidades</label>
          <Textarea v-model="form.responsibilities" placeholder="Responsabilidades del cargo" rows="3" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Requisitos</label>
          <Textarea v-model="form.requirements" placeholder="Requisitos del cargo" rows="2" :disabled="submitting" />
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
