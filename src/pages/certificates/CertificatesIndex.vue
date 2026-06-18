<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificatesStore } from '@/stores/certificates'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'

// ---------------------------------------------------------------------------
// Stores & Router
// ---------------------------------------------------------------------------
const certificatesStore = useCertificatesStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const initialLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const selectedStatus = ref(null)
const qrDialogVisible = ref(false)
const selectedQR = ref(null)
const selectedCertificate = ref(null)
const downloadingId = ref(null)

const statusOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Issued', value: 'issued' },
  { label: 'Revoked', value: 'revoked' },
  { label: 'Pending', value: 'pending' },
]

let searchTimer = null

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const certificates = computed(() => certificatesStore.certificates)
const loading = computed(() => certificatesStore.loading)
const hasCertificates = computed(() => certificates.value.length > 0)

const filteredCertificates = computed(() => {
  let list = certificates.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (c) =>
        (c.user?.name && c.user.name.toLowerCase().includes(q)) ||
        (c.course?.title && c.course.title.toLowerCase().includes(q)) ||
        (c.certificate_code && c.certificate_code.toLowerCase().includes(q)),
    )
  }

  if (selectedStatus.value) {
    list = list.filter((c) => c.status === selectedStatus.value)
  }

  return list
})

const displayCertificates = computed(() => filteredCertificates.value)
const hasActiveFilters = computed(() => !!selectedStatus.value)

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------
async function fetchInitialData() {
  loadError.value = ''
  try {
    await certificatesStore.fetchAll()
  } catch (err) {
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      'Failed to load certificates.'
    loadError.value = message
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 6000,
    })
  } finally {
    initialLoading.value = false
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    // Client-side filtering
  }, 300)
}

function clearFilters() {
  searchQuery.value = ''
  selectedStatus.value = null
}

function showQRCode(certificate) {
  selectedCertificate.value = certificate
  selectedQR.value = certificate.qr_code_url || certificate.qr_code || null
  qrDialogVisible.value = true
}

function closeQRDialog() {
  qrDialogVisible.value = false
  selectedQR.value = null
  selectedCertificate.value = null
}

async function handleDownloadPDF(certificate) {
  downloadingId.value = certificate.id
  try {
    await certificatesStore.downloadPDF(certificate.id)
    toast.add({
      severity: 'success',
      summary: 'Download Complete',
      detail: `Certificate PDF for "${getEmployeeName(certificate)}" has been downloaded.`,
      life: 4000,
    })
  } catch (err) {
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      'Failed to download certificate PDF.'
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    downloadingId.value = null
  }
}

function confirmRevoke(certificate) {
  confirm.require({
    message: `Are you sure you want to revoke the certificate for "${getEmployeeName(certificate)}"?`,
    header: 'Revoke Certificate',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Revoke',
    acceptClass: 'p-button-danger',
    accept: () => handleRevoke(certificate),
  })
}

async function handleRevoke(certificate) {
  try {
    await certificatesStore.updateTemplate(certificate.id, { status: 'revoked' })
    certificate.status = 'revoked'
    toast.add({
      severity: 'success',
      summary: 'Revoked',
      detail: `Certificate for "${getEmployeeName(certificate)}" has been revoked.`,
      life: 4000,
    })
  } catch (err) {
    // Fallback: use a direct API call pattern if updateTemplate doesn't fit
    const message =
      err.response?.data?.message ||
      certificatesStore.error ||
      'Failed to revoke certificate.'
    toast.add({
      severity: 'error',
      summary: 'Revoke Failed',
      detail: message,
      life: 6000,
    })
  }
}

function getEmployeeName(certificate) {
  if (certificate.user) {
    return [certificate.user.name, certificate.user.lastname]
      .filter(Boolean)
      .join(' ') || 'Unknown Employee'
  }
  return certificate.employee_name || 'Unknown Employee'
}

function getCourseTitle(certificate) {
  return certificate.course?.title || certificate.course_name || '—'
}

function getStatusLabel(status) {
  switch (status) {
    case 'issued':
      return 'Issued'
    case 'revoked':
      return 'Revoked'
    case 'pending':
      return 'Pending'
    default:
      return status || 'Unknown'
  }
}

function getStatusSeverity(status) {
  switch (status) {
    case 'issued':
      return 'success'
    case 'revoked':
      return 'danger'
    case 'pending':
      return 'warn'
    default:
      return 'secondary'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getQRImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('http')) return url
  return `http://127.0.0.1:8000/${url.replace(/^\//, '')}`
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="certificates-index-page space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
          Certificates
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
          Manage all issued certificates and download PDFs
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-cog"
          label="Manage Templates"
          severity="secondary"
          size="small"
          @click="router.push({ name: 'CertificateTemplates' })"
        />
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ERROR STATE                                                         -->
    <!-- =================================================================== -->
    <Message
      v-if="loadError && !initialLoading"
      severity="error"
      :closable="true"
      class="!border-error-200 dark:!border-error-800 !bg-error-50 dark:!bg-error-900/20"
    >
      {{ loadError }}
    </Message>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <template v-if="initialLoading">
      <div class="flex gap-2 flex-wrap">
        <Skeleton v-for="n in 4" :key="`status-skel-${n}`" width="6rem" height="2.25rem" />
      </div>
      <Skeleton width="100%" height="2.75rem" class="sm:!w-72" />

      <div class="card overflow-hidden">
        <div class="space-y-3 p-4">
          <div v-for="n in 8" :key="`row-skel-${n}`" class="flex items-center gap-4">
            <Skeleton width="25%" height="1.25rem" />
            <Skeleton width="20%" height="1.25rem" />
            <Skeleton width="12%" height="1.25rem" />
            <Skeleton width="10%" height="1.25rem" />
            <Skeleton width="15%" height="1.25rem" />
            <Skeleton width="4rem" height="2rem" />
            <Skeleton width="4rem" height="2rem" />
          </div>
        </div>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- MAIN CONTENT                                                        -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- Filters Row -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div class="flex gap-2 flex-wrap">
          <Button
            v-for="opt in statusOptions"
            :key="opt.value || 'all'"
            :label="opt.label"
            :severity="selectedStatus === opt.value ? 'primary' : 'secondary'"
            :outlined="selectedStatus !== opt.value"
            size="small"
            @click="selectedStatus = selectedStatus === opt.value ? null : opt.value"
          />
        </div>

        <Button
          v-if="hasActiveFilters"
          icon="pi pi-times"
          label="Clear"
          severity="secondary"
          text
          size="small"
          @click="clearFilters"
        />
      </div>

      <!-- Search Bar -->
      <div class="flex items-center gap-3 flex-wrap">
        <IconField class="w-full sm:w-80">
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            v-model="searchQuery"
            placeholder="Search certificates..."
            class="w-full"
            @input="onSearchInput"
          />
        </IconField>
        <span class="text-sm text-surface-400 dark:text-surface-500">
          {{ displayCertificates.length }} certificate{{ displayCertificates.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty State: No Certificates at All -->
      <div
        v-if="!hasCertificates && !loading"
        class="card p-12 text-center"
      >
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-verified text-3xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-600 mb-2">
          No certificates yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-500 max-w-sm mx-auto mb-6">
          Certificates will appear here once they are issued to employees upon course completion.
        </p>
        <Button
          icon="pi pi-cog"
          label="Manage Templates"
          severity="primary"
          @click="router.push({ name: 'CertificateTemplates' })"
        />
      </div>

      <!-- Empty State: No Results for Filter -->
      <div
        v-else-if="hasCertificates && displayCertificates.length === 0 && !loading"
        class="card p-10 text-center"
      >
        <div class="flex justify-center mb-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-filter-slash text-xl text-surface-400 dark:text-surface-500" />
          </div>
        </div>
        <h3 class="text-base font-semibold text-surface-600 dark:text-surface-500 mb-1">
          No matching certificates
        </h3>
        <p class="text-sm text-surface-400 dark:text-surface-500 max-w-sm mx-auto mb-4">
          Try adjusting your search or status filter.
        </p>
        <Button
          icon="pi pi-times"
          label="Clear Filters"
          severity="secondary"
          size="small"
          @click="clearFilters"
        />
      </div>

      <!-- Data Table -->
      <div v-if="displayCertificates.length > 0" class="card overflow-hidden">
        <DataTable
          :value="displayCertificates"
          :loading="loading"
          data-key="id"
          striped-rows
          :rows="10"
          :paginator="displayCertificates.length > 10"
          :rows-per-page-options="[5, 10, 25, 50]"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          current-page-report-template="Showing {first} to {last} of {totalRecords}"
        >
          <!-- Employee Name -->
          <Column header="Employee" class="min-w-[200px]">
            <template #body="{ data }">
              <span class="text-sm font-medium text-surface-800 dark:text-surface-600">
                {{ getEmployeeName(data) }}
              </span>
            </template>
          </Column>

          <!-- Course -->
          <Column header="Course" class="min-w-[200px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-700 dark:text-surface-600">
                {{ getCourseTitle(data) }}
              </span>
            </template>
          </Column>

          <!-- Issue Date -->
          <Column header="Issue Date" :sortable="true" field="issued_at" class="min-w-[130px]">
            <template #body="{ data }">
              <span class="text-sm text-surface-500 dark:text-surface-500">
                {{ formatDate(data.issued_at) }}
              </span>
            </template>
          </Column>

          <!-- Status -->
          <Column header="Status" field="status" :sortable="true" class="min-w-[110px]">
            <template #body="{ data }">
              <Tag
                :value="getStatusLabel(data.status)"
                :severity="getStatusSeverity(data.status)"
                class="!text-xs !font-medium"
              />
            </template>
          </Column>

          <!-- QR Code -->
          <Column header="QR Code" class="min-w-[100px]">
            <template #body="{ data }">
              <Button
                icon="pi pi-qrcode"
                severity="info"
                text
                rounded
                size="small"
                v-tooltip.top="'View QR Code'"
                :disabled="!data.qr_code_url && !data.qr_code"
                @click="showQRCode(data)"
              />
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" class="min-w-[160px]">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-download"
                  severity="primary"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Download PDF'"
                  :loading="downloadingId === data.id"
                  @click="handleDownloadPDF(data)"
                />
                <Button
                  v-if="data.status === 'issued'"
                  icon="pi pi-ban"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Revoke Certificate'"
                  @click="confirmRevoke(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <!-- =================================================================== -->
    <!-- QR CODE DIALOG                                                      -->
    <!-- =================================================================== -->
    <Dialog
      v-model:visible="qrDialogVisible"
      header="Certificate QR Code"
      :modal="true"
      :closable="true"
      :draggable="false"
      class="w-full max-w-md"
      :pt="{
        root: { class: '!rounded-2xl !shadow-2xl !border-surface-200 dark:!border-surface-200' },
        header: { class: '!text-lg !font-semibold !text-surface-900 dark:!text-surface-950 !px-6 !pt-6 !pb-4' },
        content: { class: '!px-6 !pb-6' },
      }"
    >
      <div class="text-center space-y-4">
        <p class="text-sm text-surface-600 dark:text-surface-500">
          Scan this QR code to verify the certificate for
          <strong>{{ selectedCertificate ? getEmployeeName(selectedCertificate) : '' }}</strong>.
        </p>

        <div
          v-if="selectedQR"
          class="flex justify-center"
        >
          <img
            :src="getQRImageUrl(selectedQR)"
            alt="QR Code"
            class="w-48 h-48 rounded-lg border border-surface-200 dark:border-surface-200"
          />
        </div>

        <div
          v-else
          class="flex justify-center"
        >
          <div class="flex h-48 w-48 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-100">
            <i class="pi pi-qrcode text-4xl text-surface-300 dark:text-surface-500" />
          </div>
        </div>

        <p
          v-if="selectedCertificate?.certificate_code"
          class="text-xs font-mono text-surface-400 dark:text-surface-500"
        >
          Code: {{ selectedCertificate.certificate_code }}
        </p>
      </div>
    </Dialog>
  </div>
</template>
