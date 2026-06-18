<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGamificationStore } from '@/stores/gamification'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Avatar from 'primevue/avatar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const gamificationStore = useGamificationStore()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const selectedType = ref('points')
const selectedPeriod = ref('all')

const typeOptions = [
  { label: 'Puntos', value: 'points' },
  { label: 'Experiencia', value: 'experience' },
]

const periodOptions = [
  { label: 'Todo el tiempo', value: 'all' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Semanal', value: 'weekly' },
]

onMounted(async () => {
  await fetchLeaderboard()
})

async function fetchLeaderboard() {
  loading.value = true
  error.value = ''
  try {
    await gamificationStore.fetchLeaderboard({
      type: selectedType.value,
      period: selectedPeriod.value,
      limit: 50,
    })
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar la tabla de posiciones.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
}

watch([selectedType, selectedPeriod], () => {
  fetchLeaderboard()
})

const leaderboard = computed(() => gamificationStore.leaderboard)

function getRankIcon(rank) {
  if (rank === 1) return 'pi pi-crown text-yellow-500'
  if (rank === 2) return 'pi pi-star-fill text-gray-400'
  if (rank === 3) return 'pi pi-star text-orange-400'
  return null
}

function getEmployeeName(item) {
  if (!item.employee) return 'N/A'
  const e = item.employee
  return `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || 'Empleado #' + item.employee_id
}
</script>

<template>
  <div class="leaderboard-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Tabla de Posiciones</h1>
      <p class="text-surface-500 dark:text-surface-400 mt-1">Ranking de empleados por puntos y experiencia</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Ordenar por:</span>
      <Dropdown v-model="selectedType" :options="typeOptions" class="w-40" />
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Período:</span>
      <Dropdown v-model="selectedPeriod" :options="periodOptions" class="w-44" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 10" :key="i" height="50px" />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Top 3 Podium -->
    <div v-if="leaderboard.length >= 3" class="grid grid-cols-3 gap-4 mb-8">
      <!-- 2nd Place -->
      <Card v-if="leaderboard[1]" class="text-center !bg-gray-50 dark:!bg-gray-800">
        <template #content>
          <i class="pi pi-star-fill text-4xl text-gray-400 mb-2" />
          <div class="text-3xl font-bold text-gray-600 dark:text-gray-300">2</div>
          <p class="font-semibold mt-1 truncate">{{ getEmployeeName(leaderboard[1]) }}</p>
          <p class="text-sm text-surface-500">
            {{ selectedType === 'experience' ? (leaderboard[1].total_experience || 0).toLocaleString() + ' EXP' : (leaderboard[1].total_points || 0).toLocaleString() + ' pts' }}
          </p>
        </template>
      </Card>

      <!-- 1st Place -->
      <Card class="text-center !bg-yellow-50 dark:!bg-yellow-900/20 !border-yellow-300">
        <template #content>
          <i class="pi pi-crown text-5xl text-yellow-500 mb-2" />
          <div class="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">1</div>
          <p class="font-semibold mt-1 truncate">{{ getEmployeeName(leaderboard[0]) }}</p>
          <p class="text-sm text-surface-500">
            {{ selectedType === 'experience' ? (leaderboard[0].total_experience || 0).toLocaleString() + ' EXP' : (leaderboard[0].total_points || 0).toLocaleString() + ' pts' }}
          </p>
        </template>
      </Card>

      <!-- 3rd Place -->
      <Card v-if="leaderboard[2]" class="text-center !bg-orange-50 dark:!bg-orange-900/20">
        <template #content>
          <i class="pi pi-star text-4xl text-orange-400 mb-2" />
          <div class="text-3xl font-bold text-orange-500">3</div>
          <p class="font-semibold mt-1 truncate">{{ getEmployeeName(leaderboard[2]) }}</p>
          <p class="text-sm text-surface-500">
            {{ selectedType === 'experience' ? (leaderboard[2].total_experience || 0).toLocaleString() + ' EXP' : (leaderboard[2].total_points || 0).toLocaleString() + ' pts' }}
          </p>
        </template>
      </Card>
    </div>

    <!-- Full Table -->
    <div class="card" v-if="leaderboard.length > 0">
      <DataTable :value="leaderboard" stripedRows class="text-sm">
        <Column header="#" style="width:70px">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <i v-if="getRankIcon(data.rank)" :class="getRankIcon(data.rank)" />
              <span v-else class="font-bold text-surface-500">{{ data.rank }}</span>
            </div>
          </template>
        </Column>
        <Column header="Empleado">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Avatar
                :label="getEmployeeName(data).substring(0, 2).toUpperCase()"
                size="small"
                shape="circle"
                class="!bg-primary-500 !text-white !text-xs"
              />
              <span class="font-medium">{{ getEmployeeName(data) }}</span>
            </div>
          </template>
        </Column>
        <Column field="total_points" header="Puntos" sortable>
          <template #body="{ data }">
            <Tag severity="info" :value="(data.total_points || 0).toLocaleString()" />
          </template>
        </Column>
        <Column field="total_experience" header="Experiencia" sortable>
          <template #body="{ data }">
            <Tag severity="success" :value="(data.total_experience || 0).toLocaleString()" />
          </template>
        </Column>
        <Column field="level" header="Nivel" sortable>
          <template #body="{ data }">
            <span class="font-bold text-primary-600">{{ data.level || 1 }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else-if="!loading && !error" class="text-center py-16">
      <i class="pi pi-list text-6xl text-surface-300 mb-4" />
      <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">Sin datos</h2>
      <p class="text-surface-500">No hay datos de ranking disponibles aún.</p>
    </div>
  </div>
</template>
