<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrganizationalStore } from '@/stores/organizational'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import Badge from 'primevue/badge'

const orgStore = useOrganizationalStore()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const expandedNodes = ref({})

onMounted(async () => {
  try {
    await orgStore.fetchOrganigram(authStore.companyId)
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar el organigrama.'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 6000,
    })
  } finally {
    loading.value = false
  }
})

const company = computed(() => orgStore.company)
const organigram = computed(() => orgStore.organigram)

function toggleNode(key) {
  expandedNodes.value[key] = !expandedNodes.value[key]
}

function isExpanded(key) {
  return !!expandedNodes.value[key]
}

function countPositions(branch) {
  let count = 0
  if (branch.areas) {
    for (const area of branch.areas) {
      if (area.processes) {
        for (const proc of area.processes) {
          count += proc.positions?.length || 0
        }
      }
    }
  }
  return count
}
</script>

<template>
  <div class="organigram-page">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Organigrama</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">
          Estructura organizacional de la empresa
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <Skeleton v-for="i in 3" :key="i" height="120px" />
    </div>

    <!-- Error -->
    <Message v-else-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <!-- No Data -->
    <div v-else-if="!organigram || organigram.length === 0" class="text-center py-16">
      <i class="pi pi-sitemap text-6xl text-surface-300 dark:text-surface-600 mb-4" />
      <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
        Sin estructura organizacional
      </h2>
      <p class="text-surface-500 dark:text-surface-400">
        Aún no se ha definido la estructura organizacional. Comienza agregando sedes.
      </p>
      <Button
        label="Ir a Sedes"
        icon="pi pi-arrow-right"
        class="mt-4"
        @click="$router.push({ name: 'Branches' })"
      />
    </div>

    <!-- Organigram Tree -->
    <div v-else class="space-y-6">
      <!-- Company Header -->
      <Card v-if="company" class="!bg-primary-50 dark:!bg-primary-900/20 !border-primary-200 dark:!border-primary-800">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600 text-white shrink-0">
              <i class="pi pi-building text-2xl" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50">
                {{ company.name || company.razon_social || company.business_name || 'Empresa' }}
              </h2>
              <p class="text-surface-500 dark:text-surface-400 text-sm">
                {{ company.nit ? 'NIT: ' + company.nit : '' }}
                {{ company.email ? ' · ' + company.email : '' }}
              </p>
            </div>
            <Tag severity="info" class="ml-auto" :value="organigram.length + ' Sede(s)'" />
          </div>
        </template>
      </Card>

      <!-- Branches Tree -->
      <div v-for="branch in organigram" :key="branch.id" class="mb-4">
        <Card class="!border-l-4 !border-l-primary-500">
          <template #content>
            <!-- Branch Header -->
            <div
              class="flex items-center gap-3 cursor-pointer select-none"
              @click="toggleNode('branch-' + branch.id)"
            >
              <Button
                :icon="isExpanded('branch-' + branch.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                severity="secondary"
                text
                rounded
                size="small"
              />
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 shrink-0">
                <i class="pi pi-map-marker text-lg" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-surface-900 dark:text-surface-50">{{ branch.name }}</h3>
                <p class="text-xs text-surface-500 dark:text-surface-400">
                  {{ branch.city || '' }}{{ branch.city && branch.address ? ' · ' : '' }}{{ branch.address || '' }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Tag severity="info" :value="(branch.areas?.length || 0) + ' Área(s)'" />
                <Tag severity="success" :value="countPositions(branch) + ' Cargo(s)'" />
                <Tag
                  :severity="branch.is_active !== false ? 'success' : 'danger'"
                  :value="branch.is_active !== false ? 'Activa' : 'Inactiva'"
                />
              </div>
            </div>

            <!-- Areas (expanded) -->
            <div v-if="isExpanded('branch-' + branch.id)" class="mt-4 ml-8 space-y-3">
              <div v-if="!branch.areas || branch.areas.length === 0" class="text-surface-400 text-sm italic py-2">
                Sin áreas definidas
              </div>
              <Panel
                v-for="area in branch.areas"
                :key="area.id"
                :toggleable="true"
                :collapsed="true"
                class="!border-teal-200 dark:!border-teal-800"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-th-large text-teal-600" />
                    <span class="font-medium">{{ area.name }}</span>
                    <Tag severity="warning" :value="(area.processes?.length || 0) + ' Procesos'" />
                  </div>
                </template>
                <!-- Processes -->
                <div class="space-y-2 ml-4">
                  <div v-if="!area.processes || area.processes.length === 0" class="text-surface-400 text-sm italic">
                    Sin procesos definidos
                  </div>
                  <Panel
                    v-for="proc in area.processes"
                    :key="proc.id"
                    :toggleable="true"
                    :collapsed="true"
                    class="!border-orange-200 dark:!border-orange-800"
                  >
                    <template #header>
                      <div class="flex items-center gap-2">
                        <i class="pi pi-cog text-orange-600" />
                        <span class="font-medium">{{ proc.name }}</span>
                        <Tag severity="contrast" :value="(proc.positions?.length || 0) + ' Cargos'" />
                      </div>
                    </template>
                    <!-- Positions -->
                    <div class="space-y-2 ml-4">
                      <div v-if="!proc.positions || proc.positions.length === 0" class="text-surface-400 text-sm italic">
                        Sin cargos definidos
                      </div>
                      <div
                        v-for="position in proc.positions"
                        :key="position.id"
                        class="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
                      >
                        <i class="pi pi-user text-purple-600" />
                        <div>
                          <span class="font-medium text-surface-700 dark:text-surface-300">{{ position.name }}</span>
                          <span
                            v-if="position.min_salary || position.max_salary"
                            class="text-xs text-surface-500 dark:text-surface-400 ml-2"
                          >
                            {{ position.min_salary ? '$' + Number(position.min_salary).toLocaleString() : '' }}
                            {{ position.min_salary && position.max_salary ? ' - ' : '' }}
                            {{ position.max_salary ? '$' + Number(position.max_salary).toLocaleString() : '' }}
                          </span>
                        </div>
                        <Tag
                          :severity="position.is_active !== false ? 'success' : 'danger'"
                          :value="position.is_active !== false ? 'Activo' : 'Inactivo'"
                          class="ml-auto"
                        />
                      </div>
                    </div>
                  </Panel>
                </div>
              </Panel>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
