<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'

const docsStore = useDocumentsStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const selectedType = ref(null)
const selectedCategory = ref('')
const editDialogVisible = ref(false)
const editingDoc = ref(null)
const submitting = ref(false)

const typeOptions = [
  { label: 'Todos los tipos', value: null },
  { label: 'Documento', value: 'document' },
  { label: 'Norma', value: 'norm' },
  { label: 'Procedimiento', value: 'procedure' },
  { label: 'Instructivo', value: 'instructive' },
  { label: 'Video', value: 'video' },
  { label: 'Imagen', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'PDF', value: 'pdf' },
]

const editForm = ref({
  title: '',
  description: '',
  type: '',
  category: '',
  status: '',
  is_public: false,
  tags: '',
})

onMounted(async () => {
  try {
    await docsStore.fetchAll()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los documentos.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const documents = computed(() => docsStore.documents)

const filteredDocuments = computed(() => {
  let list = Array.isArray(documents.value) ? documents.value : []
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (d) =>
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.type && d.type.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q)),
    )
  }
  if (selectedType.value) {
    list = list.filter((d) => d.type === selectedType.value)
  }
  if (selectedCategory.value) {
    list = list.filter((d) => d.category === selectedCategory.value)
  }
  return list
})

function getTypeIcon(type) {
  const icons = {
    document: 'pi pi-file',
    norm: 'pi pi-shield',
    procedure: 'pi pi-list',
    instructive: 'pi pi-book',
    video: 'pi pi-video',
    image: 'pi pi-image',
    audio: 'pi pi-volume-up',
    pdf: 'pi pi-file-pdf',
  }
  return icons[type] || 'pi pi-file'
}

function getTypeLabel(type) {
  const labels = {
    document: 'Documento',
    norm: 'Norma',
    procedure: 'Procedimiento',
    instructive: 'Instructivo',
    video: 'Video',
    image: 'Imagen',
    audio: 'Audio',
    pdf: 'PDF',
  }
  return labels[type] || type
}

function getStatusSeverity(status) {
  const map = { draft: 'warn', published: 'success', archived: 'danger' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado' }
  return map[status] || status
}

function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function openEdit(doc) {
  editingDoc.value = doc
  editForm.value = {
    title: doc.title || '',
    description: doc.description || '',
    type: doc.type || '',
    category: doc.category || '',
    status: doc.status || 'draft',
    is_public: doc.is_public || false,
    tags: doc.tags ? (typeof doc.tags === 'string' ? doc.tags : JSON.stringify(doc.tags)) : '',
  }
  editDialogVisible.value = true
}

async function handleUpdate() {
  submitting.value = true
  try {
    const payload = { ...editForm.value }
    if (payload.tags) {
      try { payload.tags = JSON.parse(payload.tags) } catch { /* keep as string */ }
    }
    await docsStore.update(editingDoc.value.id, payload)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Documento actualizado exitosamente.', life: 4000 })
    editDialogVisible.value = false
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al actualizar.', life: 6000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(doc) {
  confirm.require({
    message: `¿Estás seguro de eliminar el documento "${doc.title}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await docsStore.delete(doc.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Documento eliminado exitosamente.', life: 4000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al eliminar.', life: 6000 })
      }
    },
  })
}
</script>

<template>
  <div class="documents-page">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Biblioteca de Documentos</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Gestión documental del sistema</p>
      </div>
      <div class="flex gap-2">
        <Button label="Asignar" icon="pi pi-share-alt" severity="secondary" @click="$router.push({ name: 'DocumentAssign' })" />
        <Button label="Subir Documento" icon="pi pi-upload" @click="$router.push({ name: 'DocumentUpload' })" />
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 6" :key="i" height="60px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="card">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar documentos..." class="w-full sm:w-64" />
        </IconField>
        <Dropdown v-model="selectedType" :options="typeOptions" placeholder="Filtrar tipo" class="w-44" />
        <Dropdown v-model="selectedCategory" :options="[]" placeholder="Filtrar categoría" class="w-44" disabled />
      </div>

      <DataTable :value="filteredDocuments" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]" class="text-sm">
        <Column field="title" header="Título" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i :class="[getTypeIcon(data.type), 'text-primary-500']" />
              <span class="font-medium">{{ data.title }}</span>
            </div>
          </template>
        </Column>
        <Column field="type" header="Tipo" sortable>
          <template #body="{ data }">
            <Tag :value="getTypeLabel(data.type)" severity="info" />
          </template>
        </Column>
        <Column field="category" header="Categoría" sortable>
          <template #body="{ data }">{{ data.category || '-' }}</template>
        </Column>
        <Column field="file_size" header="Tamaño" sortable>
          <template #body="{ data }">{{ formatFileSize(data.file_size) }}</template>
        </Column>
        <Column field="status" header="Estado" sortable>
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)" />
          </template>
        </Column>
        <Column header="Acciones" style="width:180px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit(data)" v-tooltip.top="'Editar'" />
              <Button icon="pi pi-share-alt" severity="help" text rounded size="small" @click="$router.push({ name: 'DocumentAssign', query: { docId: data.id } })" v-tooltip.top="'Asignar'" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(data)" v-tooltip.top="'Eliminar'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:visible="editDialogVisible" header="Editar Documento" :modal="true" :style="{ width: '500px' }" :closable="!submitting">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Título</label>
          <InputText v-model="editForm.title" :disabled="submitting" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Descripción</label>
          <Textarea v-model="editForm.description" rows="2" :disabled="submitting" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Tipo</label>
            <Dropdown v-model="editForm.type" :options="typeOptions.filter(o => o.value)" placeholder="Tipo" :disabled="submitting" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Categoría</label>
            <InputText v-model="editForm.category" :disabled="submitting" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Etiquetas (JSON)</label>
          <InputText v-model="editForm.tags" :disabled="submitting" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="editDialogVisible = false" :disabled="submitting" />
        <Button label="Guardar" icon="pi pi-check" :loading="submitting" @click="handleUpdate" />
      </template>
    </Dialog>
  </div>
</template>
