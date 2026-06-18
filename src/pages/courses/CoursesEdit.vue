<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Steps from 'primevue/steps'
import FileUpload from 'primevue/fileupload'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const coursesStore = useCoursesStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const courseId = computed(() => route.params.id)

// ---------------------------------------------------------------------------
// Step Configuration
// ---------------------------------------------------------------------------
const steps = [
  { label: 'Basic Info' },
  { label: 'Modules' },
  { label: 'Lessons' },
]
const activeStep = ref(0)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const submitted = ref(false)
const saving = ref(false)
const loadError = ref('')
const formError = ref('')
const categoriesLoading = ref(false)

// Step 1: Basic Info
const title = ref('')
const description = ref('')
const categoryId = ref(null)
const imageFile = ref(null)
const imagePreview = ref('')
const existingImageUrl = ref('')

// Step 2: Modules
const modules = ref([])

// Category options
const categoryOptions = computed(() =>
  coursesStore.categories.map((c) => ({
    label: c.name,
    value: c.id,
  })),
)

// ---------------------------------------------------------------------------
// Validation (same logic as create)
// ---------------------------------------------------------------------------
const step1Errors = computed(() => {
  const errs = {}
  if (!submitted.value) return errs

  if (!title.value.trim()) {
    errs.title = 'Title is required.'
  } else if (title.value.trim().length < 3) {
    errs.title = 'Title must be at least 3 characters.'
  }

  if (!description.value.trim()) {
    errs.description = 'Description is required.'
  } else if (description.value.trim().length < 10) {
    errs.description = 'Description must be at least 10 characters.'
  }

  if (!categoryId.value) {
    errs.categoryId = 'Category is required.'
  }

  return errs
})

const step2Errors = computed(() => {
  const errs = {}
  if (!submitted.value) return errs

  const emptyModules = modules.value.filter((m) => !m.title.trim())
  if (emptyModules.length > 0) {
    errs.modules = 'All modules must have a title.'
  }

  if (modules.value.length === 0) {
    errs.modules = 'At least one module is required.'
  }

  return errs
})

const step3Errors = computed(() => {
  const errs = {}
  if (!submitted.value) return errs

  for (let i = 0; i < modules.value.length; i++) {
    const mod = modules.value[i]
    if (mod.lessons && mod.lessons.length > 0) {
      for (let j = 0; j < mod.lessons.length; j++) {
        const lesson = mod.lessons[j]
        if (!lesson.title.trim()) {
          errs[`lesson_${i}_${j}`] = `Lesson ${j + 1} in module "${mod.title || `Module ${i + 1}`}" must have a title.`
        }
      }
    }
  }

  return errs
})

const hasStep1Errors = computed(() => Object.keys(step1Errors.value).length > 0)
const hasStep2Errors = computed(() => Object.keys(step2Errors.value).length > 0)
const hasStep3Errors = computed(() => Object.keys(step3Errors.value).length > 0)

// ---------------------------------------------------------------------------
// Image Handling
// ---------------------------------------------------------------------------
function onImageSelect(event) {
  const file = event.files?.[0] || event.target?.files?.[0]
  if (!file) return

  imageFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = ''
  existingImageUrl.value = ''
}

// ---------------------------------------------------------------------------
// Module Management
// ---------------------------------------------------------------------------
function addModule() {
  modules.value.push({ id: null, title: '', lessons: [] })
}

function removeModule(index) {
  if (modules.value.length <= 1) return
  modules.value.splice(index, 1)
}

function moveModuleUp(index) {
  if (index === 0) return
  const temp = modules.value[index]
  modules.value[index] = modules.value[index - 1]
  modules.value[index - 1] = temp
}

function moveModuleDown(index) {
  if (index >= modules.value.length - 1) return
  const temp = modules.value[index]
  modules.value[index] = modules.value[index + 1]
  modules.value[index + 1] = temp
}

// ---------------------------------------------------------------------------
// Lesson Management
// ---------------------------------------------------------------------------
function ensureLessons(moduleIndex) {
  if (!modules.value[moduleIndex].lessons) {
    modules.value[moduleIndex].lessons = []
  }
}

function addLesson(moduleIndex) {
  ensureLessons(moduleIndex)
  modules.value[moduleIndex].lessons.push({
    id: null,
    title: '',
    video_url: '',
    content: '',
    duration: 0,
  })
}

function removeLesson(moduleIndex, lessonIndex) {
  ensureLessons(moduleIndex)
  modules.value[moduleIndex].lessons.splice(lessonIndex, 1)
}

function moveLessonUp(moduleIndex, lessonIndex) {
  const lessons = modules.value[moduleIndex].lessons
  if (!lessons || lessonIndex === 0) return
  const temp = lessons[lessonIndex]
  lessons[lessonIndex] = lessons[lessonIndex - 1]
  lessons[lessonIndex - 1] = temp
}

function moveLessonDown(moduleIndex, lessonIndex) {
  const lessons = modules.value[moduleIndex].lessons
  if (!lessons || lessonIndex >= lessons.length - 1) return
  const temp = lessons[lessonIndex]
  lessons[lessonIndex] = lessons[lessonIndex + 1]
  lessons[lessonIndex + 1] = temp
}

// ---------------------------------------------------------------------------
// Step Navigation
// ---------------------------------------------------------------------------
function nextStep() {
  if (activeStep.value === 0) {
    submitted.value = true
    if (hasStep1Errors.value) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fix the errors in Basic Info before proceeding.',
        life: 5000,
      })
      return
    }
  } else if (activeStep.value === 1) {
    submitted.value = true
    if (hasStep2Errors.value) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please add at least one module with a title before proceeding.',
        life: 5000,
      })
      return
    }
  }

  if (activeStep.value < steps.length - 1) {
    activeStep.value++
  }
}

function prevStep() {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

// ---------------------------------------------------------------------------
// Populate Form from Course Data
// ---------------------------------------------------------------------------
function populateForm(course) {
  if (!course) return

  title.value = course.title || ''
  description.value = course.description || ''
  categoryId.value = course.category_id || null

  // Handle existing image
  if (course.image_url || course.image) {
    existingImageUrl.value = course.image_url || course.image
    imagePreview.value = existingImageUrl.value
  }

  // Handle modules
  if (course.modules && course.modules.length > 0) {
    modules.value = course.modules.map((mod) => ({
      id: mod.id || null,
      title: mod.title || '',
      lessons: (mod.lessons || []).map((lesson) => ({
        id: lesson.id || null,
        title: lesson.title || '',
        video_url: lesson.video_url || '',
        content: lesson.content || '',
        duration: lesson.duration || 0,
      })),
    }))
  } else {
    modules.value = [{ id: null, title: '', lessons: [] }]
  }
}

// ---------------------------------------------------------------------------
// Fetch Course Data
// ---------------------------------------------------------------------------
async function fetchCourse() {
  pageLoading.value = true
  loadError.value = ''

  try {
    const course = await coursesStore.fetchOne(courseId.value)
    populateForm(course)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to load course data.'

    loadError.value = message

    toast.add({
      severity: 'error',
      summary: 'Load Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    pageLoading.value = false
  }
}

async function fetchCategories() {
  categoriesLoading.value = true
  try {
    await coursesStore.fetchCategories()
  } catch {
    // Silently handle
  } finally {
    categoriesLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Submit Handler
// ---------------------------------------------------------------------------
async function handleSubmit() {
  submitted.value = true
  formError.value = ''

  if (hasStep1Errors.value || hasStep2Errors.value || hasStep3Errors.value) {
    if (hasStep1Errors.value) {
      activeStep.value = 0
    } else if (hasStep2Errors.value) {
      activeStep.value = 1
    } else {
      activeStep.value = 2
    }
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix all form errors before submitting.',
      life: 5000,
    })
    return
  }

  saving.value = true

  try {
    const formData = new FormData()

    formData.append('title', title.value.trim())
    formData.append('description', description.value.trim())
    formData.append('category_id', categoryId.value)

    if (imageFile.value) {
      formData.append('image', imageFile.value)
    }

    // Append _method for PUT if using FormData with POST fallback
    formData.append('_method', 'PUT')

    const modulesData = modules.value.map((mod, mIndex) => ({
      id: mod.id || undefined,
      title: mod.title.trim(),
      order: mIndex + 1,
      lessons: (mod.lessons || []).map((lesson, lIndex) => ({
        id: lesson.id || undefined,
        title: lesson.title.trim(),
        video_url: lesson.video_url?.trim() || '',
        content: lesson.content?.trim() || '',
        duration: lesson.duration || 0,
        order: lIndex + 1,
      })),
    }))

    formData.append('modules', JSON.stringify(modulesData))

    const updated = await coursesStore.update(courseId.value, formData)

    toast.add({
      severity: 'success',
      summary: 'Course Updated',
      detail: `"${updated.title || title.value}" has been updated successfully.`,
      life: 4000,
    })

    router.push({ name: 'Courses' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      coursesStore.error ||
      'Failed to update course.'

    formError.value = message

    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'Courses' })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(async () => {
  await Promise.all([fetchCourse(), fetchCategories()])
})
</script>

<template>
  <div class="courses-edit-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Edit Course
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Update course details, modules, and lessons
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Courses"
        severity="secondary"
        size="small"
        @click="handleCancel"
      />
    </div>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="pageLoading">
      <div class="card p-4 sm:p-6">
        <Skeleton width="60%" height="2rem" class="mb-4" />
        <div class="flex gap-3 mb-8">
          <Skeleton v-for="n in 3" :key="n" width="8rem" height="2.5rem" />
        </div>
      </div>
      <div class="card p-6 sm:p-8 space-y-5">
        <Skeleton width="30%" height="1.25rem" class="mb-1" />
        <Skeleton width="50%" height="0.875rem" class="mb-4" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="100%" height="8rem" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="10rem" height="8rem" />
      </div>
      <div class="flex justify-between">
        <Skeleton width="6rem" height="2.5rem" />
        <Skeleton width="6rem" height="2.5rem" />
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
            @click="fetchCourse"
          />
          <Button
            icon="pi pi-arrow-left"
            label="Go Back"
            severity="secondary"
            @click="handleCancel"
          />
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- EDIT FORM                                                           -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Form Error -->
      <Message
        v-if="formError"
        severity="error"
        :closable="true"
        class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
      >
        {{ formError }}
      </Message>

      <!-- Steps Indicator -->
      <div class="card p-4 sm:p-6">
        <Steps
          :model="steps"
          :active-step="activeStep"
          :readonly="false"
        />
      </div>

      <!-- STEP 1: Basic Info -->
      <div v-if="activeStep === 0" class="card p-6 sm:p-8">
        <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
          Basic Information
        </h2>
        <p class="text-xs text-surface-400 dark:text-surface-500 mb-6">
          Update the essential details for this course
        </p>

        <div class="space-y-5">
          <!-- Title -->
          <div>
            <label
              for="edit-title"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Course Title <span class="text-error-500">*</span>
            </label>
            <InputText
              id="edit-title"
              v-model="title"
              placeholder="e.g. Introduction to Vue.js"
              :invalid="!!step1Errors.title"
              class="w-full"
            />
            <small
              v-if="step1Errors.title"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ step1Errors.title }}
            </small>
          </div>

          <!-- Description -->
          <div>
            <label
              for="edit-description"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Description <span class="text-error-500">*</span>
            </label>
            <Textarea
              id="edit-description"
              v-model="description"
              placeholder="Write a detailed course description..."
              :invalid="!!step1Errors.description"
              rows="5"
              class="w-full"
              auto-resize
            />
            <small
              v-if="step1Errors.description"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ step1Errors.description }}
            </small>
          </div>

          <!-- Category -->
          <div>
            <label
              for="edit-category"
              class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
            >
              Category <span class="text-error-500">*</span>
            </label>
            <Select
              id="edit-category"
              v-model="categoryId"
              :options="categoryOptions"
              option-label="label"
              option-value="value"
              placeholder="Select a category"
              class="w-full sm:w-72"
              :loading="categoriesLoading"
              :invalid="!!step1Errors.categoryId"
              show-clear
              filter
            />
            <small
              v-if="step1Errors.categoryId"
              class="text-error-500 dark:text-error-400 text-xs mt-1 block"
            >
              {{ step1Errors.categoryId }}
            </small>
          </div>

          <!-- Image Upload -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5">
              Course Image <span class="text-surface-400 font-normal">(optional)</span>
            </label>

            <div v-if="imagePreview" class="mb-3 relative inline-block">
              <img
                :src="imagePreview"
                alt="Course image preview"
                class="max-w-xs max-h-48 rounded-lg object-cover border border-surface-200 dark:border-surface-200"
              />
              <Button
                icon="pi pi-times"
                severity="danger"
                rounded
                size="small"
                class="!absolute !-top-2 !-right-2"
                @click="removeImage"
              />
            </div>

            <div v-if="!imagePreview">
              <FileUpload
                mode="basic"
                name="image"
                accept="image/*"
                :max-file-size="5000000"
                choose-label="Choose Image"
                @select="onImageSelect"
                :pt="{
                  chooseButton: { class: '!text-sm' },
                }"
              />
              <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Modules -->
      <div v-if="activeStep === 1" class="card p-6 sm:p-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
              Course Modules
            </h2>
            <p class="text-xs text-surface-400 dark:text-surface-500">
              Organize your course content into logical modules
            </p>
          </div>
          <Button
            icon="pi pi-plus"
            label="Add Module"
            severity="primary"
            size="small"
            @click="addModule"
          />
        </div>

        <small
          v-if="step2Errors.modules"
          class="text-error-500 dark:text-error-400 text-xs mb-3 block"
        >
          {{ step2Errors.modules }}
        </small>

        <div
          v-if="modules.length === 0"
          class="text-center py-8"
        >
          <div class="flex justify-center mb-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
              <i class="pi pi-folder text-xl text-surface-400 dark:text-surface-500" />
            </div>
          </div>
          <p class="text-sm text-surface-500 dark:text-surface-500 mb-4">
            No modules added yet.
          </p>
          <Button
            icon="pi pi-plus"
            label="Add Module"
            severity="primary"
            size="small"
            @click="addModule"
          />
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(mod, index) in modules"
            :key="index"
            class="border border-surface-200 dark:border-surface-200 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-semibold">
                {{ index + 1 }}
              </span>

              <div class="flex-1 space-y-3">
                <div>
                  <label
                    :for="'edit-mod-title-' + index"
                    class="block text-xs font-medium text-surface-600 dark:text-surface-500 mb-1"
                  >
                    Module Title <span class="text-error-500">*</span>
                  </label>
                  <InputText
                    :id="'edit-mod-title-' + index"
                    v-model="mod.title"
                    :placeholder="'e.g. Module ' + (index + 1) + ': Getting Started'"
                    class="w-full"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1 flex-shrink-0">
                <Button
                  icon="pi pi-arrow-up"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  :disabled="index === 0"
                  v-tooltip.left="'Move Up'"
                  @click="moveModuleUp(index)"
                />
                <Button
                  icon="pi pi-arrow-down"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  :disabled="index === modules.length - 1"
                  v-tooltip.left="'Move Down'"
                  @click="moveModuleDown(index)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  :disabled="modules.length <= 1"
                  v-tooltip.left="'Remove'"
                  @click="removeModule(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3: Lessons -->
      <div v-if="activeStep === 2" class="space-y-6">
        <div
          v-for="(mod, modIndex) in modules"
          :key="modIndex"
          class="card p-6 sm:p-8"
        >
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
                {{ mod.title || `Module ${modIndex + 1}` }} — Lessons
              </h2>
              <p class="text-xs text-surface-400 dark:text-surface-500">
                Add or edit lessons in this module
              </p>
            </div>
            <Button
              icon="pi pi-plus"
              label="Add Lesson"
              severity="primary"
              size="small"
              @click="addLesson(modIndex)"
            />
          </div>

          <div
            v-if="!mod.lessons || mod.lessons.length === 0"
            class="text-center py-6 border-2 border-dashed border-surface-200 dark:border-surface-200 rounded-lg"
          >
            <div class="flex justify-center mb-2">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
                <i class="pi pi-video text-lg text-surface-400 dark:text-surface-500" />
              </div>
            </div>
            <p class="text-sm text-surface-500 dark:text-surface-500 mb-3">
              No lessons in this module yet
            </p>
            <Button
              icon="pi pi-plus"
              label="Add First Lesson"
              severity="secondary"
              size="small"
              @click="addLesson(modIndex)"
            />
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(lesson, lesIndex) in mod.lessons"
              :key="lesIndex"
              class="border border-surface-200 dark:border-surface-200 rounded-lg p-4"
            >
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-200 text-surface-600 dark:text-surface-500 flex items-center justify-center text-xs font-semibold">
                  {{ lesIndex + 1 }}
                </span>

                <div class="flex-1 space-y-3">
                  <div>
                    <label
                      :for="'edit-les-title-' + modIndex + '-' + lesIndex"
                      class="block text-xs font-medium text-surface-600 dark:text-surface-500 mb-1"
                    >
                      Lesson Title <span class="text-error-500">*</span>
                    </label>
                    <InputText
                      :id="'edit-les-title-' + modIndex + '-' + lesIndex"
                      v-model="lesson.title"
                      :placeholder="'e.g. Lesson ' + (lesIndex + 1) + ': Introduction'"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label
                      :for="'edit-les-video-' + modIndex + '-' + lesIndex"
                      class="block text-xs font-medium text-surface-600 dark:text-surface-500 mb-1"
                    >
                      Video URL <span class="text-surface-400 font-normal">(optional)</span>
                    </label>
                    <InputText
                      :id="'edit-les-video-' + modIndex + '-' + lesIndex"
                      v-model="lesson.video_url"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label
                      :for="'edit-les-content-' + modIndex + '-' + lesIndex"
                      class="block text-xs font-medium text-surface-600 dark:text-surface-500 mb-1"
                    >
                      Content <span class="text-surface-400 font-normal">(optional)</span>
                    </label>
                    <Textarea
                      :id="'edit-les-content-' + modIndex + '-' + lesIndex"
                      v-model="lesson.content"
                      placeholder="Write lesson content or notes..."
                      rows="3"
                      class="w-full"
                      auto-resize
                    />
                  </div>
                  <div>
                    <label
                      :for="'edit-les-duration-' + modIndex + '-' + lesIndex"
                      class="block text-xs font-medium text-surface-600 dark:text-surface-500 mb-1"
                    >
                      Duration (minutes) <span class="text-surface-400 font-normal">(optional)</span>
                    </label>
                    <InputNumber
                      :id="'edit-les-duration-' + modIndex + '-' + lesIndex"
                      v-model="lesson.duration"
                      :min="0"
                      :max="1440"
                      placeholder="e.g. 15"
                      class="w-full sm:w-40"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1 flex-shrink-0">
                  <Button
                    icon="pi pi-arrow-up"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    :disabled="lesIndex === 0"
                    v-tooltip.left="'Move Up'"
                    @click="moveLessonUp(modIndex, lesIndex)"
                  />
                  <Button
                    icon="pi pi-arrow-down"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    :disabled="lesIndex >= (mod.lessons?.length || 0) - 1"
                    v-tooltip.left="'Move Down'"
                    @click="moveLessonDown(modIndex, lesIndex)"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    v-tooltip.left="'Remove'"
                    @click="removeLesson(modIndex, lesIndex)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Navigation -->
      <div class="flex items-center justify-between pt-2">
        <Button
          v-if="activeStep > 0"
          icon="pi pi-arrow-left"
          label="Previous"
          severity="secondary"
          :disabled="saving"
          @click="prevStep"
        />

        <div class="flex-1" />

        <div class="flex items-center gap-3">
          <Button
            v-if="activeStep < steps.length - 1"
            icon="pi pi-arrow-right"
            icon-pos="right"
            label="Next"
            severity="primary"
            @click="nextStep"
          />
          <Button
            v-else
            icon="pi pi-check"
            :label="saving ? 'Updating...' : 'Update Course'"
            severity="primary"
            :loading="saving"
            :disabled="saving"
            @click="handleSubmit"
          />
        </div>
      </div>
    </template>
  </div>
</template>
