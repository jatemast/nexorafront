<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import Avatar from 'primevue/avatar'
import Divider from 'primevue/divider'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const coursesStore = useCoursesStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const courseId = computed(() => route.params.id)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const loadError = ref('')
const enrollmentsLoading = ref(false)
const enrolling = ref(false)
const unenrolling = ref(false)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const course = computed(() => coursesStore.course)
const enrollments = computed(() => coursesStore.enrollments)
const currentUser = computed(() => authStore.user)

const hasEnrollments = computed(() => enrollments.value.length > 0)
const enrollmentCount = computed(() => enrollments.value.length)

const isEnrolled = computed(() => {
  if (!currentUser.value || !enrollments.value.length) return false
  return enrollments.value.some(
    (e) =>
      e.user_id === currentUser.value.id ||
      (e.user && e.user.id === currentUser.value.id),
  )
})

const currentUserEnrollment = computed(() => {
  if (!currentUser.value) return null
  return enrollments.value.find(
    (e) =>
      e.user_id === currentUser.value.id ||
      (e.user && e.user.id === currentUser.value.id),
  )
})

const modules = computed(() => course.value?.modules || [])

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchCourseDetail() {
  pageLoading.value = true
  loadError.value = ''

  try {
    await Promise.all([
      coursesStore.fetchOne(courseId.value),
      fetchEnrollments(),
    ])
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to load course details.'
    loadError.value = message
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 6000,
    })
  } finally {
    pageLoading.value = false
  }
}

async function fetchEnrollments() {
  enrollmentsLoading.value = true
  try {
    await coursesStore.fetchEnrollments({ course_id: courseId.value })
  } catch {
    // Silently handle
  } finally {
    enrollmentsLoading.value = false
  }
}

async function handleEnroll() {
  enrolling.value = true
  try {
    await coursesStore.enroll(courseId.value)
    toast.add({
      severity: 'success',
      summary: 'Enrolled',
      detail: 'You have been enrolled in this course successfully.',
      life: 4000,
    })
    await fetchEnrollments()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to enroll in course.'
    toast.add({
      severity: 'error',
      summary: 'Enrollment Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    enrolling.value = false
  }
}

async function handleUnenroll() {
  unenrolling.value = true
  try {
    const enrollmentId = currentUserEnrollment.value?.id
    if (enrollmentId) {
      await coursesStore.unenroll(enrollmentId)
      toast.add({
        severity: 'success',
        summary: 'Unenrolled',
        detail: 'You have been unenrolled from this course.',
        life: 4000,
      })
      await fetchEnrollments()
    }
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to unenroll from course.'
    toast.add({
      severity: 'error',
      summary: 'Unenrollment Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    unenrolling.value = false
  }
}

function navigateBack() {
  router.push({ name: 'Courses' })
}

function navigateToEdit() {
  router.push({ name: 'CourseEdit', params: { id: courseId.value } })
}

function navigateToEmployee(id) {
  if (id) {
    router.push({ name: 'EmployeeEdit', params: { id } })
  }
}

function getStatusSeverity(status) {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'warn'
    case 'archived':
      return 'danger'
    default:
      return 'info'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'published':
      return 'Published'
    case 'draft':
      return 'Draft'
    case 'archived':
      return 'Archived'
    default:
      return status || 'Unknown'
  }
}

function courseImage() {
  const c = course.value
  if (!c) return null
  return c.image_url || c.image || null
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const m = Number(minutes)
  if (isNaN(m)) return '—'
  if (m < 60) return `${m} min`
  const hours = Math.floor(m / 60)
  const mins = m % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

function totalModulesCount() {
  return modules.value.length
}

function totalLessonsCount() {
  let count = 0
  modules.value.forEach((mod) => {
    if (mod.lessons) {
      count += mod.lessons.length
    }
  })
  return count
}

function totalDuration() {
  let total = 0
  modules.value.forEach((mod) => {
    if (mod.lessons) {
      mod.lessons.forEach((lesson) => {
        total += Number(lesson.duration || 0)
      })
    }
  })
  return total
}

function employeeInitials(user) {
  if (!user) return '?'
  const first = (user.name || '').charAt(0)
  const last = (user.lastname || user.last_name || '').charAt(0)
  return (first + last).toUpperCase() || '?'
}

function employeeFullName(user) {
  if (!user) return 'Unknown'
  return [user.name, user.lastname || user.last_name].filter(Boolean).join(' ') || user.email || 'Unknown'
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchCourseDetail()
})
</script>

<template>
  <div class="course-detail-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Course Details
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          View comprehensive course information
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <Button
          icon="pi pi-arrow-left"
          label="Back to Courses"
          severity="secondary"
          size="small"
          @click="navigateBack"
        />
        <Button
          v-if="authStore.isAuthenticated"
          icon="pi pi-pencil"
          label="Edit Course"
          severity="primary"
          size="small"
          @click="navigateToEdit"
        />
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="pageLoading">
      <!-- Banner Skeleton -->
      <div class="card overflow-hidden">
        <Skeleton width="100%" height="12rem" class="!rounded-none" />
      </div>

      <!-- Info Skeleton -->
      <div class="card p-6 sm:p-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <div class="flex-1 space-y-4">
            <Skeleton width="60%" height="2rem" />
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="80%" height="1rem" />
            <div class="flex gap-3">
              <Skeleton width="6rem" height="2rem" />
              <Skeleton width="6rem" height="2rem" />
              <Skeleton width="6rem" height="2rem" />
            </div>
          </div>
          <div class="w-full lg:w-64 space-y-3">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="2rem" />
            <Skeleton width="100%" height="2rem" />
            <Skeleton width="100%" height="2rem" />
          </div>
        </div>
      </div>

      <!-- Accordion Skeleton -->
      <div class="card p-4 space-y-3">
        <Skeleton v-for="n in 3" :key="n" width="100%" height="3.5rem" />
      </div>

      <!-- Enrollments Skeleton -->
      <div class="card p-6">
        <Skeleton width="40%" height="1.5rem" class="mb-4" />
        <div class="space-y-2">
          <div v-for="n in 4" :key="n" class="flex items-center gap-3">
            <Skeleton shape="circle" size="2.5rem" />
            <Skeleton width="10rem" height="1rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- LOAD ERROR                                                          -->
    <!-- =================================================================== -->
    <template v-else-if="loadError">
      <div class="card p-10 text-center">
        <div class="flex justify-center mb-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/20">
            <i class="pi pi-exclamation-triangle text-2xl text-error-500 dark:text-error-400" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          Failed to Load Course
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          {{ loadError }}
        </p>
        <div class="flex items-center justify-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Retry"
            severity="primary"
            @click="fetchCourseDetail"
          />
          <Button
            icon="pi pi-arrow-left"
            label="Go Back"
            severity="secondary"
            @click="navigateBack"
          />
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- COURSE DETAIL CONTENT                                               -->
    <!-- =================================================================== -->
    <template v-else-if="course">
      <!-- Course Banner -->
      <div class="card overflow-hidden">
        <div class="relative h-48 sm:h-64 bg-surface-100 dark:bg-surface-200">
          <img
            v-if="courseImage()"
            :src="courseImage()"
            :alt="course.title"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/30"
          >
            <i class="pi pi-book text-6xl text-primary-300 dark:text-primary-600" />
          </div>

          <!-- Status Badge -->
          <Tag
            :value="getStatusLabel(course.status)"
            :severity="getStatusSeverity(course.status)"
            class="!absolute !top-4 !right-4 !text-sm !font-semibold !px-3 !py-1"
          />
        </div>
      </div>

      <!-- Course Info -->
      <div class="card p-6 sm:p-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Main Content -->
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-950 mb-3">
              {{ course.title }}
            </h2>

            <div class="prose prose-sm max-w-none text-surface-600 dark:text-surface-500 mb-6" v-html="course.description"></div>

            <!-- Meta Tags -->
            <div class="flex flex-wrap items-center gap-2 mb-6">
              <Tag
                v-if="course.category"
                :value="course.category.name || course.category_name"
                severity="info"
                icon="pi pi-tag"
              />
              <Tag
                v-if="course.instructor_name"
                :value="'Instructor: ' + course.instructor_name"
                severity="secondary"
                icon="pi pi-user"
              />
              <Tag
                :value="totalModulesCount() + ' module' + (totalModulesCount() !== 1 ? 's' : '')"
                severity="secondary"
                icon="pi pi-folder"
              />
              <Tag
                :value="totalLessonsCount() + ' lesson' + (totalLessonsCount() !== 1 ? 's' : '')"
                severity="secondary"
                icon="pi pi-video"
              />
              <Tag
                v-if="totalDuration() > 0"
                :value="'Total: ' + formatDuration(totalDuration())"
                severity="secondary"
                icon="pi pi-clock"
              />
            </div>

            <!-- Enrollment Actions -->
            <div class="flex items-center gap-3 mb-6">
              <Button
                v-if="!isEnrolled && authStore.isAuthenticated"
                icon="pi pi-user-plus"
                label="Enroll in Course"
                severity="success"
                :loading="enrolling"
                :disabled="enrolling"
                @click="handleEnroll"
              />
              <Button
                v-if="isEnrolled"
                icon="pi pi-user-minus"
                label="Unenroll"
                severity="danger"
                outlined
                :loading="unenrolling"
                :disabled="unenrolling"
                @click="handleUnenroll"
              />
              <Tag
                v-if="isEnrolled"
                value="Enrolled"
                severity="success"
                icon="pi pi-check-circle"
              />
              <span
                v-if="!authStore.isAuthenticated"
                class="text-sm text-surface-400 dark:text-surface-500"
              >
                <i class="pi pi-info-circle mr-1" />
                Log in to enroll in this course
              </span>
            </div>
          </div>

          <!-- Sidebar Stats -->
          <div class="w-full lg:w-64 space-y-3">
            <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-100 border border-surface-100 dark:border-surface-200">
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-500 mb-1">
                <i class="pi pi-users" />
                <span>Enrollments</span>
              </div>
              <p class="text-2xl font-bold text-surface-900 dark:text-surface-950">
                {{ enrollmentCount }}
              </p>
            </div>

            <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-100 border border-surface-100 dark:border-surface-200">
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-500 mb-1">
                <i class="pi pi-calendar" />
                <span>Created</span>
              </div>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">
                {{ formatDate(course.created_at) }}
              </p>
            </div>

            <div v-if="course.updated_at && course.updated_at !== course.created_at" class="p-4 rounded-lg bg-surface-50 dark:bg-surface-100 border border-surface-100 dark:border-surface-200">
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-500 mb-1">
                <i class="pi pi-pencil" />
                <span>Last Updated</span>
              </div>
              <p class="text-sm font-medium text-surface-800 dark:text-surface-600">
                {{ formatDate(course.updated_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules Accordion -->
      <div v-if="modules.length > 0" class="card overflow-hidden">
        <div class="p-4 sm:p-6 border-b border-surface-100 dark:border-surface-200">
          <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-600">
            Course Content
          </h2>
          <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
            {{ totalModulesCount() }} modules · {{ totalLessonsCount() }} lessons
          </p>
        </div>

        <Accordion :multiple="true" :active-index="[0]">
          <AccordionPanel
            v-for="(mod, modIndex) in modules"
            :key="modIndex"
            :value="modIndex"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-semibold">
                  {{ modIndex + 1 }}
                </span>
                <div>
                  <p class="text-sm font-semibold text-surface-800 dark:text-surface-600">
                    {{ mod.title || `Module ${modIndex + 1}` }}
                  </p>
                  <p class="text-xs text-surface-400 dark:text-surface-500">
                    {{ (mod.lessons || []).length }} lesson{{ (mod.lessons || []).length !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>
            </template>

            <!-- Lessons List -->
            <div class="pl-4 sm:pl-11 pr-4 pb-2 space-y-1">
              <div v-if="!mod.lessons || mod.lessons.length === 0" class="py-4 text-center">
                <p class="text-sm text-surface-400 dark:text-surface-500">
                  No lessons in this module
                </p>
              </div>
              <div
                v-for="(lesson, lesIndex) in (mod.lessons || [])"
                :key="lesIndex"
                class="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors"
              >
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-200 text-surface-500 dark:text-surface-500 flex items-center justify-center text-xs font-medium">
                  {{ lesIndex + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-surface-700 dark:text-surface-600 truncate">
                    {{ lesson.title }}
                  </p>
                  <div class="flex items-center gap-3 mt-0.5">
                    <span
                      v-if="lesson.video_url"
                      class="text-xs text-primary-500 dark:text-primary-400 flex items-center gap-1"
                    >
                      <i class="pi pi-video text-xs" />
                      Video
                    </span>
                    <span
                      v-if="lesson.content"
                      class="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1"
                    >
                      <i class="pi pi-file text-xs" />
                      Content
                    </span>
                    <span
                      v-if="lesson.duration"
                      class="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1"
                    >
                      <i class="pi pi-clock text-xs" />
                      {{ formatDuration(lesson.duration) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionPanel>
        </Accordion>
      </div>

      <!-- Empty Modules State -->
      <div v-else class="card p-10 text-center">
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-folder-open text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No modules yet
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500">
          This course has no content modules yet.
        </p>
      </div>

      <!-- Enrolled Employees -->
      <div class="card p-6 sm:p-8">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-600">
              Enrolled Employees
            </h2>
            <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
              {{ enrollmentCount }} employee{{ enrollmentCount !== 1 ? 's' : '' }} enrolled
            </p>
          </div>
          <Button
            v-if="enrollments.length > 0"
            icon="pi pi-refresh"
            label="Refresh"
            severity="secondary"
            size="small"
            text
            :loading="enrollmentsLoading"
            @click="fetchEnrollments"
          />
        </div>

        <!-- Enrollments Loading -->
        <div v-if="enrollmentsLoading && !hasEnrollments" class="space-y-3">
          <div v-for="n in 3" :key="n" class="flex items-center gap-3">
            <Skeleton shape="circle" size="2.5rem" />
            <Skeleton width="12rem" height="1rem" />
          </div>
        </div>

        <!-- Empty Enrollments -->
        <div v-else-if="!hasEnrollments && !enrollmentsLoading" class="text-center py-8">
          <div class="flex justify-center mb-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
              <i class="pi pi-users text-xl text-surface-400 dark:text-surface-500" />
            </div>
          </div>
          <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
            No enrollments yet
          </h3>
          <p class="text-sm text-surface-400 dark:text-surface-500 mb-4">
            No employees have enrolled in this course yet.
          </p>
        </div>

        <!-- Enrollments List -->
        <div v-else class="space-y-2">
          <div
            v-for="enrollment in enrollments"
            :key="enrollment.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors cursor-pointer"
            @click="navigateToEmployee(enrollment.user?.id || enrollment.user_id)"
          >
            <Avatar
              :label="employeeInitials(enrollment.user)"
              size="normal"
              shape="circle"
              class="!bg-primary-100 dark:!bg-primary-900/30 !text-primary-700 dark:!text-primary-400 !text-xs !font-semibold"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-700 dark:text-surface-600 truncate">
                {{ employeeFullName(enrollment.user) }}
              </p>
              <p class="text-xs text-surface-400 dark:text-surface-500">
                {{ enrollment.user?.email || '' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-surface-400 dark:text-surface-500">
                {{ formatDate(enrollment.enrolled_at || enrollment.created_at) }}
              </p>
              <Tag
                v-if="enrollment.status"
                :value="enrollment.status"
                :severity="enrollment.status === 'completed' ? 'success' : enrollment.status === 'in_progress' ? 'warn' : 'info'"
                class="!text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
