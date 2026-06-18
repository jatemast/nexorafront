<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGamificationStore } from '@/stores/gamification'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'

const gamificationStore = useGamificationStore()
const employeesStore = useEmployeesStore()
const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const employeeId = ref(null)

onMounted(async () => {
  try {
    // Try to get current employee
    const user = authStore.user
    if (user) {
      await employeesStore.fetchAll()
      const emp = employeesStore.employees.find(
        (e) => e.user_id === user.id || e.email === user.email,
      )
      if (emp) employeeId.value = emp.id
    }

    await gamificationStore.fetchBadges()
    await gamificationStore.fetchChallenges()
    if (employeeId.value) {
      await Promise.all([
        gamificationStore.fetchEmployeeBadges(employeeId.value),
        gamificationStore.fetchPoints(employeeId.value),
      ])
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar datos de gamificación.'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 6000 })
  } finally {
    loading.value = false
  }
})

const employeeBadges = computed(() => gamificationStore.employeeBadges)
const points = computed(() => gamificationStore.points)
const transactions = computed(() => gamificationStore.transactions)
const challenges = computed(() => gamificationStore.challenges)

const levelPercentage = computed(() => {
  if (!points.value) return 0
  const current = points.value.current_level_points || 0
  const toNext = points.value.points_to_next_level || 100
  const totalLevelPoints = current + toNext
  if (totalLevelPoints === 0) return 0
  return Math.min(100, Math.round((current / totalLevelPoints) * 100))
})

function getStatusSeverity(status) {
  const map = { joined: 'info', in_progress: 'warn', completed: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { joined: 'Unido', in_progress: 'En progreso', completed: 'Completado', failed: 'Fallido' }
  return map[status] || status
}
</script>

<template>
  <div class="gamification-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Panel de Gamificación</h1>
      <p class="text-surface-500 dark:text-surface-400 mt-1">Tu progreso, insignias y desafíos</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <Skeleton height="200px" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton v-for="i in 3" :key="i" height="150px" />
      </div>
    </div>

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="space-y-6">
      <!-- Stats Cards Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Level Card -->
        <Card class="!bg-gradient-to-br !from-primary-500 !to-primary-700 !text-white !shadow-lg">
          <template #content>
            <div class="text-center">
              <div class="text-6xl font-extrabold mb-2">{{ gamificationStore.currentLevel }}</div>
              <p class="text-sm opacity-80">Nivel Actual</p>
            </div>
          </template>
        </Card>

        <!-- Points Card -->
        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-star-fill text-3xl text-yellow-500 mb-2" />
              <div class="text-3xl font-bold text-surface-900 dark:text-surface-50">
                {{ gamificationStore.totalPoints.toLocaleString() }}
              </div>
              <p class="text-sm text-surface-500 dark:text-surface-400">Puntos Totales</p>
            </div>
          </template>
        </Card>

        <!-- Badges Card -->
        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-verified text-3xl text-green-500 mb-2" />
              <div class="text-3xl font-bold text-surface-900 dark:text-surface-50">
                {{ employeeBadges.length }}
              </div>
              <p class="text-sm text-surface-500 dark:text-surface-400">Insignias</p>
            </div>
          </template>
        </Card>

        <!-- Experience Card -->
        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-chart-line text-3xl text-blue-500 mb-2" />
              <div class="text-3xl font-bold text-surface-900 dark:text-surface-50">
                {{ points ? (points.total_experience || 0).toLocaleString() : '0' }}
              </div>
              <p class="text-sm text-surface-500 dark:text-surface-400">Experiencia Total</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Experience Bar -->
      <Card v-if="points">
        <template #content>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Progreso de Nivel</span>
            <span class="text-sm text-surface-500 dark:text-surface-400">
              {{ gamificationStore.currentLevelPoints }} / {{ gamificationStore.currentLevelPoints + gamificationStore.experienceToNextLevel }} XP
            </span>
          </div>
          <ProgressBar :value="levelPercentage" :showValue="false" class="h-3" />
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-2">
            Te faltan {{ gamificationStore.experienceToNextLevel }} puntos para el nivel {{ gamificationStore.currentLevel + 1 }}
          </p>
        </template>
      </Card>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Badges -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Mis Insignias</span>
              <Button label="Ver todas" severity="secondary" size="small" text @click="$router.push({ name: 'Badges' })" />
            </div>
          </template>
          <template #content>
            <div v-if="employeeBadges.length === 0" class="text-center py-8 text-surface-400">
              <i class="pi pi-verified text-4xl mb-2" />
              <p>Aún no tienes insignias. ¡Completa desafíos para ganarlas!</p>
            </div>
            <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <div
                v-for="eb in employeeBadges.slice(0, 8)"
                :key="eb.id"
                class="flex flex-col items-center p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
              >
                <i
                  :class="eb.badge?.icon || 'pi pi-star'"
                  class="text-2xl mb-1"
                  :style="{ color: eb.badge?.color || '#6366f1' }"
                />
                <span class="text-xs font-medium text-center text-surface-700 dark:text-surface-300 line-clamp-2">
                  {{ eb.badge?.name || 'Insignia' }}
                </span>
              </div>
            </div>
          </template>
        </Card>

        <!-- Challenges -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Mis Desafíos</span>
              <Button label="Ver todos" severity="secondary" size="small" text @click="$router.push({ name: 'Challenges' })" />
            </div>
          </template>
          <template #content>
            <div v-if="challenges.length === 0" class="text-center py-8 text-surface-400">
              <i class="pi pi-flag text-4xl mb-2" />
              <p>No hay desafíos disponibles.</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="challenge in challenges.slice(0, 5)"
                :key="challenge.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
              >
                <i class="pi pi-flag text-primary-500 text-xl shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-surface-800 dark:text-surface-200 truncate">{{ challenge.name }}</p>
                  <p class="text-xs text-surface-500">
                    {{ challenge.points_reward ? '+' + challenge.points_reward + ' pts' : '' }}
                    {{ challenge.experience_reward ? '+' + challenge.experience_reward + ' exp' : '' }}
                  </p>
                </div>
                <Tag :severity="getStatusSeverity(challenge.status)" :value="getStatusLabel(challenge.status)" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Quick Actions -->
      <div class="flex gap-3">
        <Button label="Tabla de Posiciones" icon="pi pi-list" @click="$router.push({ name: 'Leaderboard' })" />
        <Button label="Ver Insignias" icon="pi pi-verified" severity="secondary" @click="$router.push({ name: 'Badges' })" />
        <Button label="Ver Desafíos" icon="pi pi-flag" severity="secondary" @click="$router.push({ name: 'Challenges' })" />
      </div>
    </div>
  </div>
</template>
