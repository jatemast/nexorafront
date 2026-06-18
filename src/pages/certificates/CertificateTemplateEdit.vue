<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCertificatesStore } from '@/stores/certificates'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import ColorPicker from 'primevue/colorpicker'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const certificatesStore = useCertificatesStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const submitted = ref(false)
const saving = ref(false)
const formError = ref('')
const loadError = ref('')

// Form fields
const name = ref('')
const description = ref('')
const primaryColor = ref('#1e40af')
const secondaryColor = ref('#f59e0b')

// File uploads (stored as base64 data URLs for preview)
const logoFile = ref(null)
const logoPreview = ref(null)
const logoOriginal = ref(null) // Track original URL to know if it's a server file

const backgroundFile = ref(null)
const backgroundPreview = ref(null)
const backgroundOriginal = ref(null)

const signatureFile = ref(null)
const signaturePreview = ref(null)
const signatureOriginal = ref(null)

// Dynamic fields (placeholder labels)
const dynamicFields = ref([
  { key: 'employee_name', label: 'Employee Name', enabled: true },
  { key: 'course_title', label: 'Course Title', enabled: true },
  { key: 'issue_date', label: 'Issue Date', enabled: true },
  { key: 'certificate_code', label: 'Certificate Code', enabled: true },
  { key: 'company_name', label: 'Company Name', enabled: true },
])

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const templateId = computed(() => route.params.id)
const loading = computed(() => certificatesStore.loading)

const formErrors = computed(() => {
  const errs = {}
  if (!submitted.value) return errs

  if (!name.value.trim()) {
    errs.name = 'Template name is required.'
  } else if (name.value.trim().length < 3) {
    errs.name = 'Template name must be at least 3 characters.'
  } else if (name.value.trim().length > 120) {
    errs.name = 'Template name must not exceed 120 characters.'
  }

  if (!description.value.trim()) {
    errs.description = 'Description is required.'
  } else if (description.value.trim().length < 10) {
    errs.description = 'Description must be at least 10 characters.'
  } else if (description.value.trim().length > 500) {
    errs.description = 'Description must not exceed 500 characters.'
  }

  if (!primaryColor.value) {
    errs.primaryColor = 'Primary color is required.'
  }

  if (!secondaryColor.value) {
    errs.secondaryColor = 'Secondary color is required.'
  }

  return errs
})

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

const enabledDynamicFields = computed(() =>
  dynamicFields.value.filter((f) => f.enabled),
)

// ---------------------------------------------------------------------------
// File Upload Handlers
// ---------------------------------------------------------------------------
function handleLogoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid File',
      detail: 'Please select a valid image file for the logo.',
      life: 4000,
    })
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      severity: 'warn',
      summary: 'File Too Large',
      detail: 'Logo image must be less than 5MB.',
      life: 4000,
    })
    return
  }

  logoFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid File',
      detail: 'Please select a valid image file for the background.',
      life: 4000,
    })
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.add({
      severity: 'warn',
      summary: 'File Too Large',
      detail: 'Background image must be less than 10MB.',
      life: 4000,
    })
    return
  }

  backgroundFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    backgroundPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function handleSignatureUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid File',
      detail: 'Please select a valid image file for the signature.',
      life: 4000,
    })
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      severity: 'warn',
      summary: 'File Too Large',
      detail: 'Signature image must be less than 5MB.',
      life: 4000,
    })
    return
  }

  signatureFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    signaturePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  logoFile.value = null
  logoPreview.value = null
  logoOriginal.value = null
}

function removeBackground() {
  backgroundFile.value = null
  backgroundPreview.value = null
  backgroundOriginal.value = null
}

function removeSignature() {
  signatureFile.value = null
  signaturePreview.value = null
  signatureOriginal.value = null
}

function toggleDynamicField(key) {
  const field = dynamicFields.value.find((f) => f.key === key)
  if (field) {
    field.enabled = !field.enabled
  }
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------
async function fetchTemplateData() {
  pageLoading.value = true
  loadError.value = ''

  try {
    const template = await certificatesStore.fetchTemplate(templateId.value)
    populateForm(template)
  } catch (err) {
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      `Failed to load certificate template #${templateId.value}.`
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

function populateForm(template) {
  if (!template) return

  name.value = template.name || ''
  description.value = template.description || ''
  primaryColor.value = template.primary_color || '#1e40af'
  secondaryColor.value = template.secondary_color || '#f59e0b'

  // Handle existing images
  if (template.logo) {
    if (template.logo.startsWith('data:') || template.logo.startsWith('http')) {
      logoPreview.value = template.logo
    } else {
      logoPreview.value = `http://127.0.0.1:8000/${template.logo.replace(/^\//, '')}`
    }
    logoOriginal.value = template.logo
  }

  if (template.background_image) {
    if (template.background_image.startsWith('data:') || template.background_image.startsWith('http')) {
      backgroundPreview.value = template.background_image
    } else {
      backgroundPreview.value = `http://127.0.0.1:8000/${template.background_image.replace(/^\//, '')}`
    }
    backgroundOriginal.value = template.background_image
  }

  if (template.signature) {
    if (template.signature.startsWith('data:') || template.signature.startsWith('http')) {
      signaturePreview.value = template.signature
    } else {
      signaturePreview.value = `http://127.0.0.1:8000/${template.signature.replace(/^\//, '')}`
    }
    signatureOriginal.value = template.signature
  }

  // Handle dynamic fields
  if (template.dynamic_fields && Array.isArray(template.dynamic_fields)) {
    dynamicFields.value.forEach((field) => {
      field.enabled = template.dynamic_fields.includes(field.key)
    })
  }
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function handleSubmit() {
  submitted.value = true
  formError.value = ''

  if (hasErrors.value) {
    const firstError = Object.values(formErrors.value)[0]
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: firstError,
      life: 5000,
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      name: name.value.trim(),
      description: description.value.trim(),
      primary_color: primaryColor.value,
      secondary_color: secondaryColor.value,
      dynamic_fields: enabledDynamicFields.value.map((f) => f.key),
    }

    // Only include file data if a new file was selected
    if (logoPreview.value && logoFile.value) {
      payload.logo = logoPreview.value
    }
    if (backgroundPreview.value && backgroundFile.value) {
      payload.background_image = backgroundPreview.value
    }
    if (signaturePreview.value && signatureFile.value) {
      payload.signature = signaturePreview.value
    }

    await certificatesStore.updateTemplate(templateId.value, payload)

    toast.add({
      severity: 'success',
      summary: 'Template Updated',
      detail: 'The certificate template has been updated successfully.',
      life: 4000,
    })

    router.push({ name: 'CertificateTemplates' })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      'Failed to update certificate template.'

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
  router.push({ name: 'CertificateTemplates' })
}

// ---------------------------------------------------------------------------
// Preview Helper
// ---------------------------------------------------------------------------
const previewBackgroundStyle = computed(() => {
  if (backgroundPreview.value) {
    return { backgroundImage: `url(${backgroundPreview.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return { backgroundColor: '#f5f5f5' }
})

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchTemplateData()
})
</script>

<template>
  <div class="certificate-template-edit-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Edit Certificate Template
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Update the template design and settings
        </p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Back to Templates"
        severity="secondary"
        size="small"
        @click="handleCancel"
      />
    </div>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="pageLoading">
      <div class="card p-6 sm:p-8 space-y-5">
        <Skeleton width="30%" height="1.25rem" class="mb-1" />
        <Skeleton width="50%" height="0.875rem" class="mb-4" />
        <Skeleton width="100%" height="2.75rem" />
        <Skeleton width="100%" height="8rem" />
        <Skeleton width="100%" height="2.75rem" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton height="10rem" />
          <Skeleton height="10rem" />
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
          Failed to Load Template
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          {{ loadError }}
        </p>
        <div class="flex items-center justify-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Retry"
            severity="primary"
            @click="fetchTemplateData"
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

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- ================================================================= -->
        <!-- LEFT COLUMN: FORM (3/5)                                            -->
        <!-- ================================================================= -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Basic Info Card -->
          <div class="card p-6 sm:p-8 space-y-6">
            <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
              Template Information
            </h2>
            <p class="text-xs text-surface-400 dark:text-surface-500 -mt-4">
              Basic details for the certificate template
            </p>

            <!-- Template Name -->
            <div>
              <label
                for="edit-template-name"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Template Name <span class="text-error-500">*</span>
              </label>
              <InputText
                id="edit-template-name"
                v-model="name"
                placeholder="e.g., Course Completion Certificate"
                class="w-full"
                :invalid="!!formErrors.name"
              />
              <small
                v-if="formErrors.name"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ formErrors.name }}
              </small>
            </div>

            <!-- Description -->
            <div>
              <label
                for="edit-template-description"
                class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
              >
                Description <span class="text-error-500">*</span>
              </label>
              <Textarea
                id="edit-template-description"
                v-model="description"
                placeholder="Describe the purpose of this certificate template..."
                :invalid="!!formErrors.description"
                rows="4"
                class="w-full"
                auto-resize
              />
              <small
                v-if="formErrors.description"
                class="text-error-500 dark:text-error-400 text-xs mt-1 block"
              >
                {{ formErrors.description }}
              </small>
              <small class="text-surface-400 dark:text-surface-500 text-xs mt-1 block">
                {{ description.length }}/500 characters
              </small>
            </div>
          </div>

          <!-- Branding Card -->
          <div class="card p-6 sm:p-8 space-y-6">
            <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
              Branding & Styling
            </h2>
            <p class="text-xs text-surface-400 dark:text-surface-500 -mt-4">
              Customize the visual appearance of the certificate
            </p>

            <!-- Logo Upload -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5">
                Logo Upload
              </label>
              <p class="text-xs text-surface-400 dark:text-surface-500 mb-2">
                Recommended size: 200×80px. Max 5MB. Supported formats: PNG, JPG, SVG.
              </p>
              <div class="flex items-start gap-4">
                <div
                  v-if="logoPreview"
                  class="relative flex-shrink-0"
                >
                  <img
                    :src="logoPreview"
                    alt="Logo Preview"
                    class="h-16 w-auto max-w-[160px] object-contain rounded-lg border border-surface-200 dark:border-surface-200"
                  />
                  <button
                    class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white text-xs hover:bg-error-600 transition-colors"
                    @click="removeLogo"
                  >
                    <i class="pi pi-times" style="font-size: 0.625rem" />
                  </button>
                </div>
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    class="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-100 dark:file:bg-surface-100 file:text-surface-700 dark:file:text-surface-600 hover:file:bg-surface-200 dark:hover:file:bg-surface-200 cursor-pointer"
                    @change="handleLogoUpload"
                  />
                </div>
              </div>
            </div>

            <!-- Colors -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Primary Color -->
              <div>
                <label
                  for="edit-primary-color"
                  class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                >
                  Primary Color <span class="text-error-500">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <ColorPicker
                    id="edit-primary-color"
                    v-model="primaryColor"
                    :invalid="!!formErrors.primaryColor"
                  />
                  <InputText
                    :model-value="primaryColor"
                    readonly
                    class="w-28 font-mono text-xs"
                  />
                </div>
                <small
                  v-if="formErrors.primaryColor"
                  class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                >
                  {{ formErrors.primaryColor }}
                </small>
              </div>

              <!-- Secondary Color -->
              <div>
                <label
                  for="edit-secondary-color"
                  class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                >
                  Secondary Color <span class="text-error-500">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <ColorPicker
                    id="edit-secondary-color"
                    v-model="secondaryColor"
                    :invalid="!!formErrors.secondaryColor"
                  />
                  <InputText
                    :model-value="secondaryColor"
                    readonly
                    class="w-28 font-mono text-xs"
                  />
                </div>
                <small
                  v-if="formErrors.secondaryColor"
                  class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                >
                  {{ formErrors.secondaryColor }}
                </small>
              </div>
            </div>

            <!-- Background Image Upload -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5">
                Background Image
              </label>
              <p class="text-xs text-surface-400 dark:text-surface-500 mb-2">
                Recommended size: 1200×850px. Max 10MB. Supported formats: PNG, JPG.
              </p>
              <div class="flex items-start gap-4">
                <div
                  v-if="backgroundPreview"
                  class="relative flex-shrink-0"
                >
                  <img
                    :src="backgroundPreview"
                    alt="Background Preview"
                    class="h-20 w-28 object-cover rounded-lg border border-surface-200 dark:border-surface-200"
                  />
                  <button
                    class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white text-xs hover:bg-error-600 transition-colors"
                    @click="removeBackground"
                  >
                    <i class="pi pi-times" style="font-size: 0.625rem" />
                  </button>
                </div>
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    class="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-100 dark:file:bg-surface-100 file:text-surface-700 dark:file:text-surface-600 hover:file:bg-surface-200 dark:hover:file:bg-surface-200 cursor-pointer"
                    @change="handleBackgroundUpload"
                  />
                </div>
              </div>
            </div>

            <!-- Signature Upload -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5">
                Signature Upload
              </label>
              <p class="text-xs text-surface-400 dark:text-surface-500 mb-2">
                Recommended size: 300×100px. Max 5MB. Supported formats: PNG, JPG.
              </p>
              <div class="flex items-start gap-4">
                <div
                  v-if="signaturePreview"
                  class="relative flex-shrink-0"
                >
                  <img
                    :src="signaturePreview"
                    alt="Signature Preview"
                    class="h-12 w-auto max-w-[180px] object-contain rounded-lg border border-surface-200 dark:border-surface-200"
                  />
                  <button
                    class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white text-xs hover:bg-error-600 transition-colors"
                    @click="removeSignature"
                  >
                    <i class="pi pi-times" style="font-size: 0.625rem" />
                  </button>
                </div>
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    class="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-100 dark:file:bg-surface-100 file:text-surface-700 dark:file:text-surface-600 hover:file:bg-surface-200 dark:hover:file:bg-surface-200 cursor-pointer"
                    @change="handleSignatureUpload"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Fields Card -->
          <div class="card p-6 sm:p-8 space-y-6">
            <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600 mb-1">
              Dynamic Fields
            </h2>
            <p class="text-xs text-surface-400 dark:text-surface-500 -mt-4">
              Select which fields will appear on the certificate
            </p>

            <div class="space-y-2">
              <div
                v-for="field in dynamicFields"
                :key="field.key"
                class="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-200"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-tag text-sm text-surface-400" />
                  <span class="text-sm text-surface-700 dark:text-surface-600">
                    {{ field.label }}
                  </span>
                </div>
                <Button
                  :icon="field.enabled ? 'pi pi-check-circle' : 'pi pi-circle'"
                  :severity="field.enabled ? 'success' : 'secondary'"
                  :outlined="!field.enabled"
                  size="small"
                  :label="field.enabled ? 'Enabled' : 'Disabled'"
                  @click="toggleDynamicField(field.key)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- RIGHT COLUMN: LIVE PREVIEW (2/5)                                   -->
        <!-- ================================================================= -->
        <div class="lg:col-span-2">
          <div class="sticky top-6 space-y-6">
            <div class="card p-6 space-y-4">
              <h2 class="text-base font-semibold text-surface-800 dark:text-surface-600">
                Live Preview
              </h2>
              <p class="text-xs text-surface-400 dark:text-surface-500">
                Real-time preview of the certificate
              </p>

              <!-- Certificate Preview -->
              <div
                class="relative w-full rounded-lg overflow-hidden border-2 border-surface-200 dark:border-surface-200 shadow-lg"
                style="aspect-ratio: 1.414 / 1"
                :style="previewBackgroundStyle"
              >
                <!-- Inner Border -->
                <div
                  class="absolute inset-3 rounded-md flex flex-col items-center justify-center p-6"
                  :style="{ border: `3px solid ${primaryColor}` }"
                >
                  <!-- Logo -->
                  <img
                    v-if="logoPreview"
                    :src="logoPreview"
                    alt="Logo"
                    class="h-10 w-auto object-contain mb-3"
                  />
                  <div
                    v-else
                    class="h-10 w-24 rounded bg-surface-200 dark:bg-surface-200 flex items-center justify-center mb-3"
                  >
                    <span class="text-xs text-surface-400">Logo</span>
                  </div>

                  <!-- Title -->
                  <h3
                    v-if="name.trim()"
                    class="text-sm font-bold text-center mb-2"
                    :style="{ color: primaryColor }"
                  >
                    {{ name }}
                  </h3>
                  <div
                    v-else
                    class="h-4 w-40 rounded bg-surface-200 dark:bg-surface-200 mb-2"
                  />

                  <!-- Dynamic Fields Preview -->
                  <div class="w-full space-y-1.5 text-center">
                    <template v-for="field in dynamicFields" :key="field.key">
                      <p
                        v-if="field.enabled"
                        class="text-xs"
                        :style="{ color: field.key === 'employee_name' || field.key === 'course_title' ? secondaryColor : '#666' }"
                      >
                        <template v-if="field.key === 'employee_name'">
                          <span class="font-semibold" :style="{ color: secondaryColor }">
                            {{ '{employee_name}' }}
                          </span>
                        </template>
                        <template v-else-if="field.key === 'course_title'">
                          <span class="font-semibold" :style="{ color: secondaryColor }">
                            {{ '{course_title}' }}
                          </span>
                        </template>
                        <template v-else-if="field.key === 'issue_date'">
                          {{ '{issue_date}' }}
                        </template>
                        <template v-else-if="field.key === 'certificate_code'">
                          <span class="font-mono text-xs text-surface-400">
                            {{ '{certificate_code}' }}
                          </span>
                        </template>
                        <template v-else-if="field.key === 'company_name'">
                          <span :style="{ color: primaryColor }">
                            {{ '{company_name}' }}
                          </span>
                        </template>
                      </p>
                    </template>
                  </div>

                  <!-- Signature -->
                  <div class="mt-auto w-full">
                    <div
                      v-if="signaturePreview"
                      class="flex justify-center"
                    >
                      <img
                        :src="signaturePreview"
                        alt="Signature"
                        class="h-8 w-auto object-contain"
                      />
                    </div>
                    <div
                      v-else
                      class="flex justify-center"
                    >
                      <div class="h-8 w-32 rounded bg-surface-200 dark:bg-surface-200 flex items-center justify-center">
                        <span class="text-xs text-surface-400">Signature</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Color Legend -->
              <div class="flex items-center gap-4 pt-2">
                <div class="flex items-center gap-1.5">
                  <span
                    class="inline-block h-3 w-3 rounded-full border border-surface-300 dark:border-surface-300"
                    :style="{ backgroundColor: primaryColor }"
                  />
                  <span class="text-xs text-surface-500">Primary</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span
                    class="inline-block h-3 w-3 rounded-full border border-surface-300 dark:border-surface-300"
                    :style="{ backgroundColor: secondaryColor }"
                  />
                  <span class="text-xs text-surface-500">Secondary</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- FORM ACTIONS                                                         -->
      <!-- =================================================================== -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <Button
          label="Cancel"
          severity="secondary"
          :disabled="saving"
          @click="handleCancel"
        />
        <Button
          icon="pi pi-check"
          :label="saving ? 'Updating...' : 'Update Template'"
          severity="primary"
          :loading="saving"
          :disabled="saving"
          @click="handleSubmit"
        />
      </div>
    </template>
  </div>
</template>
