<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useOrganizationalStore } from '@/stores/organizational'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Card from 'primevue/card'

const orgStore = useOrganizationalStore()
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
  code: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  manager_name: '',
  is_active: true,
  metadata: '',
})

const statsCards = computed(() => {
  return orgStore.branches.map((b) => ({
    ...b,
    areasCount: b.areas_count || 0,
  }))
})

onMounted(async () => {
  try {
    await orgStore.fetchBranches()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar las sedes.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const branches = computed(() => orgStore.branches)

const filteredBranches = computed(() => {
  if (!searchQuery.value.trim()) return branches.value
  const q = searchQuery.value.trim().toLowerCase()
  return branches.value.filter(
    (b) =>
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.manager_name && b.manager_name.toLowerCase().includes(q)),
  )
})

function openCreate() {
  isEditing.value = false
  form.value = { id: null, name: '', code: '', address: '', city: '', phone: '', email: '', manager_name: '', is_active: true, metadata: '' }
  dialogVisible.value = true
}

function openEdit(branch) {
  isEditing.value = true
  form.value = {
    id: branch.id,
    name: branch.name || '',
    code: branch.code || '',
    address: branch.address || '',
    city: branch.city || '',
    phone: branch.phone || '',
    email: branch.email || '',
    manager_name: branch.manager_name || '',
    is_active: branch.is_active !== false,
    metadata: branch.metadata ? JSON.stringify(branch.metadata) : '',
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (payload.metadata && typeof payload.metadata === 'string') {
      try { payload.metadata = JSON.parse(payload.metadata) } catch { /* keep as string */ }
    }
    delete payload.id

    if (isEditing.value) {
      await orgStore.updateBranch(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Sede actualizada exitosamente.', life: 4000 })
    } else {
      await orgStore.createBranch(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Sede creada exitosamente.', life: 4000 })
    }
    dialogVisible.value = false
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al guardar la sede.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(branch) {
  confirm.require({
    message: `¿Estás seguro de eliminar la sede "${branch.name}"? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await orgStore.deleteBranch(branch.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Sede eliminada exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}
</script>

<template>
  <div class="branches-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Sucursales / Sedes</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Gestión de sedes de la empresa</p>
      </div>
      <Button label="Nueva Sede" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Stats Cards -->
    <div v-if="!loading && branches.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      <Card v-for="branch in branches" :key="branch.id" class="!shadow-sm">
        <template #content>
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 shrink-0">
              <i class="pi pi-map-marker" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-surface-900 dark:text-surface-50 truncate">{{ branch.name }}</h3>
              <p class="text-xs text-surface-500 dark:text-surface-400">{{ branch.city || 'Sin ciudad' }}</p>
              <div class="flex gap-2 mt-2">
                <Tag severity="info" :value="branch.areas_count + ' Áreas'" />
                <Tag :severity="branch.is_active !== false ? 'success' : 'danger'" :value="branch.is_active !== false ? 'Activa' : 'Inactiva'" />
              </div>
            </div>
          </div>
        </template>
      </Card>
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
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar sede..." class="w-full sm:w-72" />
        </IconField>
      </div>

      <DataTable :value="filteredBranches" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-indigo-500" />
              <span class="font-medium">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="code" header="Código" sortable />
        <Column field="city" header="Ciudad" sortable />
        <Column field="manager_name" header="Responsable" sortable>
          <template #body="{ data }">
            {{ data.manager_name || '-' }}
          </template>
        </Column>
        <Column field="areas_count" header="Áreas" sortable>
          <template #body="{ data }">
            <Tag severity="info" :value="data.areas_count || 0" />
          </template>
        </Column>
        <Column field="is_active" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="data.is_active !== false ? 'success' : 'danger'" :value="data.is_active !== false ? 'Activa' : 'Inactiva'" />
          </template>
        </Column>
        <Column header="Acciones" style="width: 150px">
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
      :header="isEditing ? 'Editar Sede' : 'Nueva Sede'"
      :modal="true"
      :style="{ width: '550px' }"
      :closable="!submitting"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Nombre <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="Nombre de la sede" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Código</label>
            <InputText v-model="form.code" placeholder="Código" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Ciudad</label>
            <InputText v-model="form.city" placeholder="Ciudad" :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Dirección</label>
          <Textarea v-model="form.address" placeholder="Dirección" rows="2" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Teléfono</label>
            <InputText v-model="form.phone" placeholder="Teléfono" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Email</label>
            <InputText v-model="form.email" placeholder="Email" type="email" :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Responsable</label>
          <InputText v-model="form.manager_name" placeholder="Nombre del responsable" :disabled="submitting" />
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
