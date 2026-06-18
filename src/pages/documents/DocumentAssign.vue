<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useEmployeesStore } from '@/stores/employees'
import { useOrganizationalStore } from '@/stores/organizational'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Card from 'primevue/card'
import PickList from 'primevue/picklist'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'

const docsStore = useDocumentsStore()
const employeesStore = useEmployeesStore()
const orgStore = useOrganizationalStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')

const documents = ref([])
const selectedDocumentId = ref(null)
const selectedEmployees = ref([])
const availableEmployees = ref([])
const targetEmployees = ref([])
const dueDate = ref(null)
const notes = ref('')

const assignMode = ref('employees') // 'employees' | 'areas' | 'positions'
const selectedAreas = ref([])
const selectedPositions = ref([])

const areaOptions = ref([])
const positionOptions = ref([])

onMounted(async () => {
  try {
    await Promise.all([
      docsStore.fetchAll(),
      employeesStore.fetchAll(),
    ])
    documents.value = Array.isArray(docsStore.documents) ? docsStore.documents : []
    availableEmployees.value = employeesStore.employees.map((e) => ({
      ...e,
      label: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || e.email,
    }))

    // Pre-select document if passed via query
    if (route.query.docId) {
      selectedDocumentId.value = Number(route.query.docId)
    }

    // Load areas and positions
    const branches = await orgStore.fetchBranches()
    if (branches.length > 0) {
      await orgStore.fetchAreas({ branch_id: branches[0].id })
      areaOptions.value = orgStore.areas.map((a) => ({ label: a.name, value: a.id }))
      if (orgStore.areas.length > 0) {
        await orgStore.fetchProcesses({ area_id: orgStore.areas[0].id })
        positionOptions.value = []
        // Positions come from processes
        for (const proc of orgStore.processes) {
          await orgStore.fetchPositions({ process_id: proc.id })
          orgStore.positions.forEach((p) => {
            positionOptions.value.push({ label: `${p.name}`, value: p.id })
          })
        }
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar los datos.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const selectedDocument = computed(() =>
  documents.value.find((d) => d.id === selectedDocumentId.value),
)

async function handleAssign() {
  if (!selectedDocumentId.value) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona un documento.', life: 4000 })
    return
  }

  submitting.value = true
  try {
    const payload = {
      due_date: dueDate.value ? dueDate.value.toISOString().split('T')[0] : null,
      notes: notes.value || null,
    }

    if (assignMode.value === 'employees') {
      payload.employee_ids = targetEmployees.value.map((e) => e.id)
    } else if (assignMode.value === 'areas') {
      payload.area_ids = selectedAreas.value
    } else if (assignMode.value === 'positions') {
      payload.position_ids = selectedPositions.value
    }

    const result = await docsStore.assign(selectedDocumentId.value, payload)
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Documento asignado exitosamente. ${result.assignments_count || 0} asignaciones creadas.`,
      life: 4000,
    })
    router.push({ name: 'Documents' })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al asignar el documento.',
      life: 6000,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="document-assign-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Asignar Documento</h1>
      <p class="text-surface-500 dark:text-surface-400 mt-1">Distribuye documentos a empleados, áreas o cargos</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <Skeleton height="60px" />
      <Skeleton height="300px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="space-y-6">
      <!-- Document Selection -->
      <Card>
        <template #content>
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div class="flex flex-col gap-2 flex-1">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Documento <span class="text-red-500">*</span></label>
              <Dropdown
                v-model="selectedDocumentId"
                :options="documents.map(d => ({ label: d.title, value: d.id }))"
                placeholder="Seleccionar documento"
                class="w-full"
                filter
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Fecha Límite</label>
              <Calendar v-model="dueDate" placeholder="Opcional" showIcon />
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Notas</label>
              <InputText v-model="notes" placeholder="Notas de asignación (opcional)" />
            </div>
          </div>

          <!-- Document Preview -->
          <div v-if="selectedDocument" class="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
              {{ selectedDocument.title }}
            </span>
            <span class="text-xs text-surface-500 ml-2">
              ({{ selectedDocument.type }})
            </span>
          </div>
        </template>
      </Card>

      <!-- Assign Mode -->
      <Card>
        <template #content>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Asignar a:</span>
            <Button
              :label="'Empleados'"
              :severity="assignMode === 'employees' ? 'primary' : 'secondary'"
              size="small"
              @click="assignMode = 'employees'"
            />
            <Button
              :label="'Áreas'"
              :severity="assignMode === 'areas' ? 'primary' : 'secondary'"
              size="small"
              @click="assignMode = 'areas'"
            />
            <Button
              :label="'Cargos'"
              :severity="assignMode === 'positions' ? 'primary' : 'secondary'"
              size="small"
              @click="assignMode = 'positions'"
            />
          </div>

          <!-- Employee PickList -->
          <div v-if="assignMode === 'employees'">
            <PickList
              v-model="targetEmployees"
              :dataKey="'id'"
              listStyle="height:350px"
            >
              <template #sourceheader>Empleados Disponibles</template>
              <template #targetheader>Empleados Seleccionados</template>
              <template #item="slotProps">
                <div class="flex items-center gap-2 py-1">
                  <i class="pi pi-user text-primary-500" />
                  <span>{{ slotProps.item.label || slotProps.item.email }}</span>
                </div>
              </template>
            </PickList>
          </div>

          <!-- Area Selection -->
          <div v-else-if="assignMode === 'areas'">
            <Dropdown
              v-model="selectedAreas"
              :options="areaOptions"
              placeholder="Seleccionar áreas"
              class="w-full"
              multiple
              filter
            />
            <p class="text-xs text-surface-500 mt-2">
              El documento se asignará a todos los empleados de las áreas seleccionadas.
            </p>
          </div>

          <!-- Position Selection -->
          <div v-else-if="assignMode === 'positions'">
            <Dropdown
              v-model="selectedPositions"
              :options="positionOptions"
              placeholder="Seleccionar cargos"
              class="w-full"
              multiple
              filter
            />
            <p class="text-xs text-surface-500 mt-2">
              El documento se asignará a todos los empleados con los cargos seleccionados.
            </p>
          </div>
        </template>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button label="Cancelar" severity="secondary" icon="pi pi-times" @click="$router.push({ name: 'Documents' })" :disabled="submitting" />
        <Button label="Asignar Documento" icon="pi pi-share-alt" :loading="submitting" @click="handleAssign" />
      </div>
    </div>
  </div>
</template>
