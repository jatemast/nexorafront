<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import ToggleSwitch from 'primevue/toggleswitch'
import Card from 'primevue/card'

const docsStore = useDocumentsStore()
const router = useRouter()
const toast = useToast()

const submitting = ref(false)
const form = ref({
  title: '',
  description: '',
  type: '',
  category: '',
  tags: '',
  is_public: true,
  status: 'published',
  version: '1.0',
})

const file = ref(null)
const fileMeta = ref(null)

const typeOptions = [
  { label: 'Documento', value: 'document' },
  { label: 'Norma', value: 'norm' },
  { label: 'Procedimiento', value: 'procedure' },
  { label: 'Instructivo', value: 'instructive' },
  { label: 'Video', value: 'video' },
  { label: 'Imagen', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'PDF', value: 'pdf' },
]

const categoryOptions = [
  { label: 'General', value: 'general' },
  { label: 'Capacitación', value: 'training' },
  { label: 'Normativa', value: 'regulatory' },
  { label: 'Técnico', value: 'technical' },
  { label: 'Administrativo', value: 'administrative' },
  { label: 'Seguridad', value: 'safety' },
]

function onFileSelect(event) {
  const files = event.files || event
  if (files.length > 0) {
    const f = files[0]
    file.value = f
    fileMeta.value = {
      name: f.name,
      size: f.size,
      type: f.type,
    }
  }
}

async function handleSubmit() {
  if (!form.value.title || !form.value.type) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Título y tipo son obligatorios.', life: 4000 })
    return
  }

  submitting.value = true
  try {
    let payload = { ...form.value }
    if (payload.tags) {
      try { payload.tags = JSON.parse(payload.tags) } catch { payload.tags = payload.tags.split(',').map(t => t.trim()) }
    }
    if (file.value) {
      const fd = new FormData()
      fd.append('file', file.value)
      Object.entries(payload).forEach(([key, val]) => {
        if (val != null && val !== '') {
          fd.append(key, typeof val === 'object' ? JSON.stringify(val) : val)
        }
      })
      payload = fd
    }

    await docsStore.create(payload)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Documento creado exitosamente.', life: 4000 })
    router.push({ name: 'Documents' })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al subir el documento.', life: 6000 })
  } finally {
    submitting.value = false
  }
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
</script>

<template>
  <div class="document-upload-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Subir Documento</h1>
      <p class="text-surface-500 dark:text-surface-400 mt-1">Carga un nuevo documento a la biblioteca</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Upload Area -->
      <Card class="lg:col-span-2">
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Título <span class="text-red-500">*</span></label>
              <InputText v-model="form.title" placeholder="Título del documento" :disabled="submitting" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Descripción</label>
              <Textarea v-model="form.description" placeholder="Descripción del documento" rows="3" :disabled="submitting" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Tipo <span class="text-red-500">*</span></label>
                <Dropdown v-model="form.type" :options="typeOptions" placeholder="Seleccionar tipo" :disabled="submitting" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Categoría</label>
                <Dropdown v-model="form.category" :options="categoryOptions" placeholder="Seleccionar categoría" :disabled="submitting" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Estado</label>
                <Dropdown v-model="form.status" :options="[{ label: 'Publicado', value: 'published' }, { label: 'Borrador', value: 'draft' }]" :disabled="submitting" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Versión</label>
                <InputText v-model="form.version" placeholder="1.0" :disabled="submitting" />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Etiquetas (separadas por coma)</label>
              <InputText v-model="form.tags" placeholder="ej: manual, inducción, 2024" :disabled="submitting" />
            </div>
            <div class="flex items-center gap-3">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Público</label>
              <ToggleSwitch v-model="form.is_public" :disabled="submitting" />
            </div>
          </div>
        </template>
      </Card>

      <!-- File Upload Sidebar -->
      <div class="space-y-4">
        <Card>
          <template #content>
            <h3 class="font-semibold text-surface-900 dark:text-surface-50 mb-3">Archivo</h3>
            <FileUpload
              mode="basic"
              name="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              :maxFileSize="100000000"
              @select="onFileSelect"
              :disabled="submitting"
              chooseLabel="Seleccionar Archivo"
              class="w-full"
            />
            <p v-if="fileMeta" class="mt-3 text-sm text-surface-700 dark:text-surface-300">
              <span class="font-medium">{{ fileMeta.name }}</span>
              <span class="text-surface-500 ml-2">({{ formatSize(fileMeta.size) }})</span>
            </p>
            <p v-else class="mt-3 text-xs text-surface-400">Formatos: imágenes, videos, audio, PDF, Office, TXT, CSV (máx 100MB)</p>
          </template>
        </Card>

        <Button
          label="Subir Documento"
          icon="pi pi-upload"
          :loading="submitting"
          @click="handleSubmit"
          class="w-full"
          size="large"
        />

        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          @click="$router.push({ name: 'Documents' })"
          class="w-full"
          :disabled="submitting"
        />
      </div>
    </div>
  </div>
</template>
