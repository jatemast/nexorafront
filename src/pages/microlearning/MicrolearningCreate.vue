<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMicrolearningStore } from '@/stores/microlearning'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Calendar from 'primevue/calendar'
import Message from 'primevue/message'
import Card from 'primevue/card'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const microlearningStore = useMicrolearningStore()
const toast = useToast()
const router = useRouter()

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
const formSubmitted = ref(false)
const saving = ref(false)

const formTitle = ref('')
const formType = ref(null)
const formContent = ref('')
const formVideoUrl = ref('')
const formDuration = ref(null)
const formScheduledAt = ref(null)

const typeOptions = [
  { label: 'Video', value: 'video' },
  { label: 'Article', value: 'article' },
  { label: 'Quiz', value: 'quiz' },
]

// ---------------------------------------------------------------------------
// Computed — Conditional field visibility
// ---------------------------------------------------------------------------
const showContentEditor = computed(() =>
  formType.value === 'article' || formType.value === 'quiz'
)
const showVideoUrl = computed(() => formType.value === 'video')

// Reset conditional fields when type changes
watch(formType, () => {
  if (!showContentEditor.value) {
    formContent.value = ''
  }
  if (!showVideoUrl.value) {
    formVideoUrl.value = ''
  }
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const formErrors = computed(() => {
  const errs = {}
  if (!formSubmitted.value) return errs

  if (!formTitle.value.trim()) {
    errs.title = 'Title is required.'
  } else if (formTitle.value.trim().length < 3) {
    errs.title = 'Title must be at least 3 characters.'
  }

  if (!formType.value) {
    errs.type = 'Please select a content type.'
  }

  if (showContentEditor.value && !formContent.value.trim()) {
    errs.content = 'Content is required for this type.'
  }

  if (showVideoUrl.value) {
    if (!formVideoUrl.value.trim()) {
      errs.video_url = 'Video URL is required.'
    } else {
      try {
        const url = new URL(formVideoUrl.value.trim())
        if (!['http:', 'https:'].includes(url.protocol)) {
          errs.video_url = 'Please enter a valid URL starting with http:// or https://.'
        }
      } catch {
        errs.video_url = 'Please enter a valid URL.'
      }
    }
  }

  if (formDuration.value == null || formDuration.value === '') {
    errs.duration = 'Duration is required.'
  } else if (Number(formDuration.value) <= 0) {
    errs.duration = 'Duration must be greater than 0 minutes.'
  }

  if (formScheduledAt.value && !(formScheduledAt.value instanceof Date)) {
    errs.scheduled_at = 'Please select a valid date and time.'
  }

  return errs
})

const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------
async function handleSubmit() {
  formSubmitted.value = true

  if (hasFormErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the form errors before saving.',
      life: 5000,
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      title: formTitle.value.trim(),
      type: formType.value,
      duration: Number(formDuration.value),
    }

    if (showContentEditor.value) {
      payload.content = formContent.value.trim()
    }

    if (showVideoUrl.value) {
      payload.video_url = formVideoUrl.value.trim()
    }

    if (formScheduledAt.value instanceof Date) {
      payload.scheduled_at = formScheduledAt.value.toISOString()
    }

    await microlearningStore.create(payload)

    toast.add({
      severity: 'success',
      summary: 'Content Created',
      detail: `"${payload.title}" has been created successfully.`,
      life: 4000,
    })

    router.push({ name: 'Microlearning' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      microlearningStore.error ||
      'Failed to create microlearning content.'

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 6000,
    })
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------
function handleCancel() {
  router.push({ name: 'Microlearning' })
}
</script>

<template>
  <div class="microlearning-create-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Create Microlearning Content
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Add a new video, article, or quiz to your microlearning library
        </p>
      </div>

      <Button
        icon="pi pi-arrow-left"
        label="Back to List"
        severity="secondary"
        size="small"
        @click="handleCancel"
      />
    </div>

    <!-- =================================================================== -->
    <!-- FORM CARD                                                           -->
    <!-- =================================================================== -->
    <Card
      class="!rounded-xl !shadow-sm !border-surface-200 dark:!border-surface-200"
      :pt="{
        body: { class: '!p-6' },
      }"
    >
      <form @submit.prevent="handleSubmit" novalidate class="space-y-6">
        <!-- Type Selector -->
        <div>
          <label
            for="ml-type"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Content Type <span class="text-error-500">*</span>
          </label>
          <Select
            id="ml-type"
            v-model="formType"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            placeholder="Select content type..."
            :invalid="!!formErrors.type"
            class="w-full max-w-xs"
          />
          <small
            v-if="formErrors.type"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.type }}
          </small>
        </div>

        <!-- Title -->
        <div>
          <label
            for="ml-title"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Title <span class="text-error-500">*</span>
          </label>
          <InputText
            id="ml-title"
            v-model="formTitle"
            placeholder="e.g. Introduction to Cybersecurity"
            :invalid="!!formErrors.title"
            class="w-full"
          />
          <small
            v-if="formErrors.title"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.title }}
          </small>
        </div>

        <!-- Content (conditionally shown for article & quiz) -->
        <div v-if="showContentEditor">
          <label
            for="ml-content"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Content <span class="text-error-500">*</span>
          </label>
          <Textarea
            id="ml-content"
            v-model="formContent"
            placeholder="Write the content for this {{ formType }}..."
            rows="6"
            :invalid="!!formErrors.content"
            class="w-full"
            auto-resize
          />
          <small
            v-if="formErrors.content"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.content }}
          </small>
        </div>

        <!-- Video URL (conditionally shown for video) -->
        <div v-if="showVideoUrl">
          <label
            for="ml-video-url"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Video URL <span class="text-error-500">*</span>
          </label>
          <InputText
            id="ml-video-url"
            v-model="formVideoUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            :invalid="!!formErrors.video_url"
            class="w-full"
          />
          <small
            v-if="formErrors.video_url"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.video_url }}
          </small>
          <small v-else class="text-surface-400 text-xs mt-1 block">
            Enter a valid video URL (YouTube, Vimeo, or any embeddable video platform).
          </small>
        </div>

        <!-- Duration (minutes) -->
        <div>
          <label
            for="ml-duration"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Duration (minutes) <span class="text-error-500">*</span>
          </label>
          <InputNumber
            id="ml-duration"
            v-model="formDuration"
            placeholder="e.g. 15"
            :min="1"
            :max="480"
            suffix=" min"
            :invalid="!!formErrors.duration"
            class="w-full max-w-xs"
            :input-class="'w-full'"
          />
          <small
            v-if="formErrors.duration"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.duration }}
          </small>
          <small v-else class="text-surface-400 text-xs mt-1 block">
            Estimated time to complete this content, in minutes.
          </small>
        </div>

        <!-- Scheduling Date/Time -->
        <div>
          <label
            for="ml-scheduled"
            class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
          >
            Schedule Date & Time <span class="text-surface-400 font-normal">(optional)</span>
          </label>
          <Calendar
            id="ml-scheduled"
            v-model="formScheduledAt"
            show-time
            hour-format="12"
            placeholder="Select date and time to publish..."
            :min-date="new Date()"
            :invalid="!!formErrors.scheduled_at"
            class="w-full max-w-sm"
          />
          <small
            v-if="formErrors.scheduled_at"
            class="text-error-500 dark:text-error-400 text-xs mt-1 block"
          >
            {{ formErrors.scheduled_at }}
          </small>
          <small v-else class="text-surface-400 text-xs mt-1 block">
            When should this content be available? Leave blank to publish immediately.
          </small>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-200">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            :disabled="saving"
            @click="handleCancel"
          />
          <Button
            type="submit"
            :label="saving ? 'Creating...' : 'Create Content'"
            severity="primary"
            :loading="saving"
            :disabled="saving"
            icon="pi pi-check"
          />
        </div>
      </form>
    </Card>
  </div>
</template>
