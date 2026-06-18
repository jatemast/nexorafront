<script setup>
import { ref, computed, watch } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useToast } from 'primevue/usetoast'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'

// ---------------------------------------------------------------------------
// Props & Emits
// ---------------------------------------------------------------------------
const emit = defineEmits(['success', 'error'])

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------
const employeesStore = useEmployeesStore()
const toast = useToast()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const selectedFile = ref(null)
const fileName = ref('')
const previewData = ref([])
const previewColumns = ref([])
const importing = ref(false)
const importProgress = ref(0)
const importResult = ref(null)
const step = ref(1) // 1 = Upload, 2 = Preview, 3 = Result
const parseError = ref('')

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const hasFile = computed(() => selectedFile.value !== null)
const hasPreview = computed(() => previewData.value.length > 0)
const canImport = computed(() => hasPreview.value && !importing.value)

const importStatus = computed(() => {
  if (!importResult.value) return null
  return importResult.value.success ? 'success' : 'error'
})

const totalRows = computed(() => previewData.value.length)
const successCount = computed(() => {
  if (!importResult.value) return 0
  return importResult.value.imported || importResult.value.success_count || 0
})
const errorCount = computed(() => {
  if (!importResult.value) return 0
  return importResult.value.errors?.length || importResult.value.error_count || 0
})
const skippedCount = computed(() => {
  if (!importResult.value) return 0
  return importResult.value.skipped || 0
})

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

function onFileSelect(event) {
  parseError.value = ''
  importResult.value = null
  previewData.value = []
  previewColumns.value = []

  const file = event.files?.[0]
  if (!file) {
    selectedFile.value = null
    fileName.value = ''
    return
  }

  // Validate file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ]
  const allowedExtensions = ['.xlsx', '.xls', '.csv']
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    parseError.value = 'Please upload a valid Excel file (.xlsx, .xls, .csv).'
    toast.add({
      severity: 'warn',
      summary: 'Invalid File',
      detail: parseError.value,
      life: 5000,
    })
    selectedFile.value = null
    fileName.value = ''
    return
  }

  selectedFile.value = file
  fileName.value = file.name

  // Parse the Excel file for preview
  parseExcelPreview(file)
}

async function parseExcelPreview(file) {
  parseError.value = ''

  try {
    const XLSX = await import('xlsx')
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (!jsonData || jsonData.length === 0) {
          parseError.value = 'The Excel file appears to be empty.'
          return
        }

        // First row as headers
        const headers = jsonData[0].map((h) => String(h || '').trim())
        previewColumns.value = headers.filter((h) => h.length > 0)

        if (previewColumns.value.length === 0) {
          parseError.value = 'No column headers found in the Excel file.'
          return
        }

        // Remaining rows as data
        const rows = jsonData.slice(1).filter((row) =>
          row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''),
        )

        previewData.value = rows.map((row) => {
          const obj = {}
          previewColumns.value.forEach((col, idx) => {
            obj[col] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : ''
          })
          return obj
        })

        if (previewData.value.length === 0) {
          parseError.value = 'No data rows found in the Excel file.'
        } else {
          step.value = 2
        }
      } catch (err) {
        parseError.value = 'Failed to parse the Excel file. Please ensure it is a valid spreadsheet.'
        console.error('Excel parse error:', err)
      }
    }

    reader.onerror = () => {
      parseError.value = 'Failed to read the file. Please try again.'
    }

    reader.readAsArrayBuffer(file)
  } catch {
    parseError.value =
      'Excel parsing library not available. Please ensure xlsx is installed (npm install xlsx).'
    toast.add({
      severity: 'warn',
      summary: 'Preview Unavailable',
      detail: 'File preview requires the xlsx library. You can still import the file.',
      life: 6000,
    })
    // Still allow import even without preview
    step.value = 2
  }
}

async function handleImport() {
  if (!selectedFile.value) {
    toast.add({
      severity: 'warn',
      summary: 'No File',
      detail: 'Please select a file to import.',
      life: 4000,
    })
    return
  }

  importing.value = true
  importProgress.value = 0
  importResult.value = null

  // Simulate progress
  const progressInterval = setInterval(() => {
    if (importProgress.value < 90) {
      importProgress.value += Math.random() * 15
      if (importProgress.value > 90) importProgress.value = 90
    }
  }, 400)

  try {
    const result = await employeesStore.importExcel(selectedFile.value)
    importProgress.value = 100
    clearInterval(progressInterval)

    importResult.value = {
      success: true,
      imported: result.imported || result.success_count || totalRows.value,
      errors: result.errors || [],
      skipped: result.skipped || 0,
      message: result.message || 'Import completed successfully.',
    }

    step.value = 3

    toast.add({
      severity: 'success',
      summary: 'Import Complete',
      detail: importResult.value.message,
      life: 5000,
    })

    emit('success', importResult.value)
  } catch (err) {
    clearInterval(progressInterval)
    importProgress.value = 0

    importResult.value = {
      success: false,
      imported: 0,
      errors: err.response?.data?.errors || [],
      skipped: 0,
      message:
        err.response?.data?.message ||
        employeesStore.error ||
        'Import failed. Please check the file and try again.',
    }

    step.value = 3

    toast.add({
      severity: 'error',
      summary: 'Import Failed',
      detail: importResult.value.message,
      life: 6000,
    })

    emit('error', importResult.value)
  } finally {
    importing.value = false
  }
}

function resetImport() {
  selectedFile.value = null
  fileName.value = ''
  previewData.value = []
  previewColumns.value = []
  importResult.value = null
  importProgress.value = 0
  parseError.value = ''
  step.value = 1
}

function removeFile() {
  selectedFile.value = null
  fileName.value = ''
  previewData.value = []
  previewColumns.value = []
  parseError.value = ''
  step.value = 1
}

// Normalize preview data for display (limit columns shown)
const displayColumns = computed(() => {
  if (previewColumns.value.length <= 8) return previewColumns.value
  return previewColumns.value.slice(0, 8)
})

const displayRows = computed(() => {
  return previewData.value.slice(0, 50) // Show max 50 preview rows
})

const remainingColumns = computed(() => {
  if (previewColumns.value.length <= 8) return 0
  return previewColumns.value.length - 8
})

function getColumnHeader(col) {
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getCellValue(row, col) {
  const val = row[col]
  if (val === undefined || val === null || val === '') return '—'
  return val
}
</script>

<template>
  <div class="import-excel space-y-5">
    <!-- =================================================================== -->
    <!-- STEP INDICATOR                                                      -->
    <!-- =================================================================== -->
    <div class="flex items-center gap-2">
      <div
        :class="[
          'flex items-center gap-1.5 text-sm font-medium',
          step === 1 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500',
        ]"
      >
        <span
          :class="[
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
            step === 1
              ? 'bg-primary-600 text-white'
              : step > 1
                ? 'bg-success-500 text-white'
                : 'bg-surface-200 dark:bg-surface-100 text-surface-500 dark:text-surface-500',
          ]"
        >
          <i v-if="step > 1" class="pi pi-check text-xs" />
          <span v-else>1</span>
        </span>
        Upload
      </div>
      <div class="h-px w-8 bg-surface-200 dark:bg-surface-100" />
      <div
        :class="[
          'flex items-center gap-1.5 text-sm font-medium',
          step === 2 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500',
        ]"
      >
        <span
          :class="[
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
            step === 2
              ? 'bg-primary-600 text-white'
              : step > 2
                ? 'bg-success-500 text-white'
                : 'bg-surface-200 dark:bg-surface-100 text-surface-500 dark:text-surface-500',
          ]"
        >
          <i v-if="step > 2" class="pi pi-check text-xs" />
          <span v-else>2</span>
        </span>
        Preview
      </div>
      <div class="h-px w-8 bg-surface-200 dark:bg-surface-100" />
      <div
        :class="[
          'flex items-center gap-1.5 text-sm font-medium',
          step === 3 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500',
        ]"
      >
        <span
          :class="[
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
            step === 3
              ? step === 3 && importResult?.success
                ? 'bg-success-500 text-white'
                : 'bg-error-500 text-white'
              : 'bg-surface-200 dark:bg-surface-100 text-surface-500 dark:text-surface-500',
          ]"
        >
          3
        </span>
        Result
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- STEP 1: FILE UPLOAD                                                 -->
    <!-- =================================================================== -->
    <template v-if="step === 1">
      <FileUpload
        mode="basic"
        name="file"
        :accept="'.xlsx,.xls,.csv'"
        :max-file-size="10_000_000"
        :choose-label="fileName || 'Choose Excel File'"
        :custom-upload="true"
        :auto="false"
        @select="onFileSelect"
        @clear="removeFile"
        :pt="{
          chooseButton: {
            class: '!rounded-xl !py-3 !px-6 !text-sm !font-medium',
          },
        }"
        class="w-full"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-10 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20 mb-4">
              <i class="pi pi-file-excel text-2xl text-primary-500 dark:text-primary-400" />
            </div>
            <h3 class="text-base font-semibold text-surface-700 dark:text-surface-600 mb-1">
              Upload Excel File
            </h3>
            <p class="text-sm text-surface-400 dark:text-surface-500 max-w-xs">
              Drag and drop your Excel file here, or click to browse. Supported formats: .xlsx, .xls, .csv (max 10MB).
            </p>
          </div>
        </template>
      </FileUpload>

      <!-- Parse Error -->
      <Message
        v-if="parseError"
        severity="error"
        :closable="true"
        class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
      >
        {{ parseError }}
      </Message>

      <!-- Selected File Info -->
      <div
        v-if="hasFile && !parseError"
        class="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 dark:bg-success-900/20">
          <i class="pi pi-file text-success-500 dark:text-success-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-surface-700 dark:text-surface-600 truncate">
            {{ fileName }}
          </p>
          <p class="text-xs text-surface-400 dark:text-surface-500">
            {{ (selectedFile.size / 1024).toFixed(1) }} KB
          </p>
        </div>
        <Button
          icon="pi pi-times"
          severity="secondary"
          text
          rounded
          size="small"
          @click="removeFile"
          v-tooltip.top="'Remove file'"
        />
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- STEP 2: PREVIEW                                                     -->
    <!-- =================================================================== -->
    <template v-if="step === 2">
      <!-- Import Progress -->
      <div v-if="importing" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-surface-700 dark:text-surface-600">
            Importing employees...
          </span>
          <span class="text-sm text-surface-500 dark:text-surface-500">
            {{ Math.round(importProgress) }}%
          </span>
        </div>
        <ProgressBar :value="importProgress" class="!h-2 !rounded-full" />
      </div>

      <!-- Preview Header -->
      <div v-if="!importing" class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-600">
            Data Preview
          </h3>
          <p class="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
            {{ totalRows }} row{{ totalRows !== 1 ? 's' : '' }} found
            <span v-if="remainingColumns > 0">
              &middot; Showing {{ displayColumns.length }} of {{ previewColumns.length }} columns
            </span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-arrow-left"
            label="Back"
            severity="secondary"
            size="small"
            text
            :disabled="importing"
            @click="step = 1"
          />
          <Button
            icon="pi pi-upload"
            label="Import Data"
            severity="primary"
            size="small"
            :loading="importing"
            :disabled="!canImport"
            @click="handleImport"
          />
        </div>
      </div>

      <!-- Preview Table -->
      <div v-if="hasPreview && !importing" class="card overflow-hidden">
        <DataTable
          :value="displayRows"
          size="small"
          striped-rows
          scrollable
          scroll-height="320px"
          class="!text-xs"
        >
          <Column
            v-for="col in displayColumns"
            :key="col"
            :field="col"
            :header="getColumnHeader(col)"
            :sortable="true"
            class="min-w-[120px]"
          >
            <template #body="{ data }">
              <span class="text-xs text-surface-600 dark:text-surface-500">
                {{ getCellValue(data, col) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- STEP 3: IMPORT RESULT                                               -->
    <!-- =================================================================== -->
    <template v-if="step === 3 && importResult">
      <!-- Success Result -->
      <div
        v-if="importResult.success"
        class="rounded-2xl border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 p-6 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-800/30">
            <i class="pi pi-check-circle text-2xl text-success-500 dark:text-success-400" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-success-700 dark:text-success-400 mb-1">
          Import Successful
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 mb-4">
          {{ importResult.message }}
        </p>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div class="rounded-xl bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-200 p-3">
            <p class="text-2xl font-bold text-success-600 dark:text-success-400">
              {{ successCount }}
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-500">Imported</p>
          </div>
          <div class="rounded-xl bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-200 p-3">
            <p class="text-2xl font-bold text-warning-600 dark:text-warning-400">
              {{ skippedCount }}
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-500">Skipped</p>
          </div>
          <div class="rounded-xl bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-200 p-3">
            <p class="text-2xl font-bold text-error-600 dark:text-error-400">
              {{ errorCount }}
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-500">Errors</p>
          </div>
        </div>

        <!-- Error Details -->
        <div v-if="errorCount > 0 && importResult.errors?.length" class="mt-4 text-left max-h-40 overflow-y-auto">
          <p class="text-xs font-semibold text-surface-600 dark:text-surface-500 mb-2">
            Error Details:
          </p>
          <div
            v-for="(err, idx) in importResult.errors"
            :key="idx"
            class="flex items-start gap-2 py-1.5 border-b border-surface-100 dark:border-surface-100 last:border-0"
          >
            <i class="pi pi-exclamation-circle text-error-500 text-xs mt-0.5 shrink-0" />
            <span class="text-xs text-surface-500 dark:text-surface-500">
              {{ typeof err === 'string' ? err : err.message || err.row || `Error at row ${idx + 1}` }}
            </span>
          </div>
        </div>

        <div class="mt-5">
          <Button
            icon="pi pi-refresh"
            label="Import Another File"
            severity="secondary"
            size="small"
            @click="resetImport"
          />
        </div>
      </div>

      <!-- Error Result -->
      <div
        v-else
        class="rounded-2xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 p-6 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-error-100 dark:bg-error-800/30">
            <i class="pi pi-times-circle text-2xl text-error-500 dark:text-error-400" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-error-700 dark:text-error-400 mb-1">
          Import Failed
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-md mx-auto mb-4">
          {{ importResult.message }}
        </p>

        <!-- Error Details -->
        <div v-if="importResult.errors?.length" class="text-left max-h-40 overflow-y-auto mb-4">
          <p class="text-xs font-semibold text-surface-600 dark:text-surface-500 mb-2">
            Error Details:
          </p>
          <div
            v-for="(err, idx) in importResult.errors"
            :key="idx"
            class="flex items-start gap-2 py-1.5 border-b border-surface-100 dark:border-surface-100 last:border-0"
          >
            <i class="pi pi-exclamation-circle text-error-500 text-xs mt-0.5 shrink-0" />
            <span class="text-xs text-surface-500 dark:text-surface-500">
              {{ typeof err === 'string' ? err : err.message || err.row || `Error at row ${idx + 1}` }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Try Again"
            severity="secondary"
            size="small"
            @click="resetImport"
          />
        </div>
      </div>
    </template>
  </div>
</template>
