<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import FileUpload from 'primevue/fileupload'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------
const authStore = useAuthStore()
const toast = useToast()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const pageLoading = ref(true)
const activeTab = ref('0')

// --- Profile Form ---
const profileName = ref('')
const profileLastname = ref('')
const profileEmail = ref('')
const profilePhone = ref('')
const profileCompany = ref('')
const profileSubmitted = ref(false)
const profileSaving = ref(false)

// --- Password Form ---
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirmation = ref('')
const passwordSubmitted = ref(false)
const passwordSaving = ref(false)

// --- Avatar ---
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarUploading = ref(false)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const user = computed(() => authStore.user)
const userName = computed(() => user.value?.name || 'User')
const userEmail = computed(() => user.value?.email || '')
const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (name[0] || 'U').toUpperCase()
})

// ---------------------------------------------------------------------------
// Load user data on mount
// ---------------------------------------------------------------------------
onMounted(async () => {
  try {
    // Attempt to fetch fresh user data
    const userData = user.value || authStore.user
    if (!userData || !userData.name) {
      await authStore.fetchUser()
    }

    // Populate form fields
    const currentUser = authStore.user
    if (currentUser) {
      profileName.value = currentUser.name || ''
      profileLastname.value = currentUser.lastname || currentUser.last_name || ''
      profileEmail.value = currentUser.email || ''
      profilePhone.value = currentUser.phone || ''
      profileCompany.value = currentUser.company || ''
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load profile data.',
      life: 5000,
    })
  } finally {
    pageLoading.value = false
  }
})

// ---------------------------------------------------------------------------
// Profile Validation
// ---------------------------------------------------------------------------
const profileErrors = computed(() => {
  const errs = {}
  if (profileSubmitted.value) {
    if (!profileName.value.trim()) {
      errs.name = 'Name is required.'
    } else if (profileName.value.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.'
    }

    if (!profileLastname.value.trim()) {
      errs.lastname = 'Last name is required.'
    } else if (profileLastname.value.trim().length < 2) {
      errs.lastname = 'Last name must be at least 2 characters.'
    }

    if (!profileEmail.value.trim()) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.value)) {
      errs.email = 'Please enter a valid email address.'
    }

    if (profilePhone.value && !/^\+?[\d\s\-()]{7,15}$/.test(profilePhone.value)) {
      errs.phone = 'Please enter a valid phone number.'
    }
  }
  return errs
})

const profileHasErrors = computed(() => Object.keys(profileErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Password Validation
// ---------------------------------------------------------------------------
const passwordErrors = computed(() => {
  const errs = {}
  if (passwordSubmitted.value) {
    if (!currentPassword.value) {
      errs.currentPassword = 'Current password is required.'
    }

    if (!newPassword.value) {
      errs.newPassword = 'New password is required.'
    } else if (newPassword.value.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword.value)) {
      errs.newPassword =
        'Password must contain uppercase, lowercase, and a number.'
    }

    if (!newPasswordConfirmation.value) {
      errs.newPasswordConfirmation = 'Please confirm your new password.'
    } else if (newPassword.value !== newPasswordConfirmation.value) {
      errs.newPasswordConfirmation = 'Passwords do not match.'
    }
  }
  return errs
})

const passwordHasErrors = computed(() => Object.keys(passwordErrors.value).length > 0)

// ---------------------------------------------------------------------------
// Password Strength
// ---------------------------------------------------------------------------
const passwordStrength = computed(() => {
  const pwd = newPassword.value
  if (!pwd) return { level: 0, label: '', color: '' }

  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++

  if (score <= 2)
    return { level: 1, label: 'Weak', color: 'bg-error-500' }
  if (score <= 3)
    return { level: 2, label: 'Fair', color: 'bg-warning-500' }
  if (score <= 4)
    return { level: 3, label: 'Good', color: 'bg-accent-500' }
  return { level: 4, label: 'Strong', color: 'bg-success-500' }
})

// ===========================================================================
// HANDLERS
// ===========================================================================

// --- Update Profile ---
async function handleUpdateProfile() {
  profileSubmitted.value = true

  if (profileHasErrors.value) return

  profileSaving.value = true

  try {
    await authStore.updateProfile({
      name: profileName.value.trim(),
      lastname: profileLastname.value.trim(),
      email: profileEmail.value.trim(),
      phone: profilePhone.value.trim(),
      company: profileCompany.value.trim(),
    })

    toast.add({
      severity: 'success',
      summary: 'Profile Updated',
      detail: 'Your profile information has been saved successfully.',
      life: 4000,
    })

    profileSubmitted.value = false
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Failed to update profile.'

    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    profileSaving.value = false
  }
}

// --- Change Password ---
async function handleChangePassword() {
  passwordSubmitted.value = true

  if (passwordHasErrors.value) return

  passwordSaving.value = true

  try {
    const data = await authStore.changePassword(
      currentPassword.value,
      newPassword.value,
      newPasswordConfirmation.value,
    )

    toast.add({
      severity: 'success',
      summary: 'Password Changed',
      detail: data?.message || 'Your password has been changed successfully.',
      life: 4000,
    })

    // Reset form
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirmation.value = ''
    passwordSubmitted.value = false
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Failed to change password.'

    toast.add({
      severity: 'error',
      summary: 'Change Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    passwordSaving.value = false
  }
}

// --- Avatar Upload ---
function onAvatarSelect(event) {
  const file = event.files?.[0] || event.target?.files?.[0]
  if (!file) return

  avatarFile.value = file

  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function handleAvatarUpload() {
  if (!avatarFile.value) {
    toast.add({
      severity: 'warn',
      summary: 'No File Selected',
      detail: 'Please select an image file to upload.',
      life: 4000,
    })
    return
  }

  avatarUploading.value = true

  try {
    const formData = new FormData()
    formData.append('avatar', avatarFile.value)

    await authStore.updateProfile(formData)

    toast.add({
      severity: 'success',
      summary: 'Avatar Updated',
      detail: 'Your profile picture has been updated successfully.',
      life: 4000,
    })

    avatarFile.value = null
    avatarPreview.value = null
  } catch (err) {
    const message =
      err.response?.data?.message ||
      authStore.error ||
      'Failed to upload avatar.'

    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: message,
      life: 6000,
    })
  } finally {
    avatarUploading.value = false
  }
}

function removeAvatarPreview() {
  avatarFile.value = null
  avatarPreview.value = null
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- =================================================================== -->
    <!-- PAGE HEADER                                                         -->
    <!-- =================================================================== -->
    <div>
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-950 tracking-tight">
        My Profile
      </h1>
      <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">
        Manage your account information and security settings
      </p>
    </div>

    <!-- =================================================================== -->
    <!-- LOADING SKELETON                                                    -->
    <!-- =================================================================== -->
    <div v-if="pageLoading" class="card p-6 space-y-6">
      <div class="flex items-center gap-4">
        <Skeleton shape="circle" size="5rem" />
        <div class="space-y-2 flex-1">
          <Skeleton width="40%" height="1.5rem" />
          <Skeleton width="60%" height="1rem" />
        </div>
      </div>
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="100%" height="3rem" />
      <Skeleton width="30%" height="2.5rem" />
    </div>

    <!-- =================================================================== -->
    <!-- PROFILE CONTENT                                                     -->
    <!-- =================================================================== -->
    <template v-else>
      <!-- ──────────────────────────────────────────────── -->
      <!-- Avatar & User Info Banner                        -->
      <!-- ──────────────────────────────────────────────── -->
      <div class="card p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-center gap-5">
          <!-- Avatar Section -->
          <div class="relative group">
            <Avatar
              v-if="avatarPreview"
              :image="avatarPreview"
              size="xlarge"
              shape="circle"
              class="!w-20 !h-20"
            />
            <Avatar
              v-else
              :label="userInitials"
              size="xlarge"
              shape="circle"
              class="!w-20 !h-20 !bg-primary-600 !text-white !text-xl !font-semibold"
            />
            <!-- Upload overlay on hover -->
            <label
              for="avatar-upload"
              class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <i class="pi pi-camera text-white text-xl" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarSelect($event)"
            />
          </div>

          <!-- User Info -->
          <div class="flex-1 text-center sm:text-left">
            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-950">
              {{ userName }}
            </h2>
            <p class="text-sm text-surface-500 dark:text-surface-500">
              {{ userEmail }}
            </p>
            <p
              v-if="user?.role"
              class="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
            >
              {{ user.role }}
            </p>
          </div>

          <!-- Avatar Upload Actions -->
          <div
            v-if="avatarFile"
            class="flex flex-col sm:flex-row items-center gap-2"
          >
            <Button
              label="Upload"
              size="small"
              severity="primary"
              :loading="avatarUploading"
              @click="handleAvatarUpload"
            />
            <Button
              label="Cancel"
              size="small"
              severity="secondary"
              :disabled="avatarUploading"
              @click="removeAvatarPreview"
            />
          </div>
        </div>
      </div>

      <!-- ──────────────────────────────────────────────── -->
      <!-- Tabs: Profile | Password                         -->
      <!-- ──────────────────────────────────────────────── -->
      <Tabs v-model:value="activeTab" class="card overflow-hidden">
        <TabList class="px-4 pt-4 border-b border-surface-200 dark:border-surface-200">
          <Tab value="0">
            <i class="pi pi-user mr-2" />
            <span>Edit Profile</span>
          </Tab>
          <Tab value="1">
            <i class="pi pi-lock mr-2" />
            <span>Change Password</span>
          </Tab>
        </TabList>

        <TabPanels>
          <!-- ======================================================== -->
          <!-- TAB 0: Edit Profile                                      -->
          <!-- ======================================================== -->
          <TabPanel value="0" class="!p-0">
            <div class="p-6 sm:p-8">
              <form @submit.prevent="handleUpdateProfile" novalidate class="space-y-5">
                <!-- Name + Lastname -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      for="profile-name"
                      class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                    >
                      First name
                    </label>
                    <InputText
                      id="profile-name"
                      v-model="profileName"
                      placeholder="Your first name"
                      :invalid="!!profileErrors.name"
                      class="w-full"
                    />
                    <small
                      v-if="profileErrors.name"
                      class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                    >
                      {{ profileErrors.name }}
                    </small>
                  </div>
                  <div>
                    <label
                      for="profile-lastname"
                      class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                    >
                      Last name
                    </label>
                    <InputText
                      id="profile-lastname"
                      v-model="profileLastname"
                      placeholder="Your last name"
                      :invalid="!!profileErrors.lastname"
                      class="w-full"
                    />
                    <small
                      v-if="profileErrors.lastname"
                      class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                    >
                      {{ profileErrors.lastname }}
                    </small>
                  </div>
                </div>

                <!-- Email -->
                <div>
                  <label
                    for="profile-email"
                    class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                  >
                    Email address
                  </label>
                  <InputText
                    id="profile-email"
                    v-model="profileEmail"
                    type="email"
                    placeholder="you@example.com"
                    :invalid="!!profileErrors.email"
                    class="w-full"
                  />
                  <small
                    v-if="profileErrors.email"
                    class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                  >
                    {{ profileErrors.email }}
                  </small>
                </div>

                <!-- Phone -->
                <div>
                  <label
                    for="profile-phone"
                    class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                  >
                    Phone number <span class="text-surface-400 font-normal">(optional)</span>
                  </label>
                  <InputText
                    id="profile-phone"
                    v-model="profilePhone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    :invalid="!!profileErrors.phone"
                    class="w-full"
                  />
                  <small
                    v-if="profileErrors.phone"
                    class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                  >
                    {{ profileErrors.phone }}
                  </small>
                </div>

                <!-- Company (read-only unless admin) -->
                <div v-if="profileCompany || user?.role === 'admin'">
                  <label
                    for="profile-company"
                    class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                  >
                    Company
                  </label>
                  <InputText
                    id="profile-company"
                    v-model="profileCompany"
                    placeholder="Your company"
                    :disabled="user?.role !== 'admin'"
                    class="w-full"
                  />
                </div>

                <!-- Submit -->
                <div class="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    :label="profileSaving ? 'Saving...' : 'Save changes'"
                    :loading="profileSaving"
                    :disabled="profileSaving"
                    severity="primary"
                  />
                  <Button
                    type="button"
                    label="Reset"
                    severity="secondary"
                    :disabled="profileSaving"
                    @click="
                      profileName = user?.name || '';
                      profileLastname = user?.lastname || user?.last_name || '';
                      profileEmail = user?.email || '';
                      profilePhone = user?.phone || '';
                      profileCompany = user?.company || '';
                      profileSubmitted = false;
                    "
                  />
                </div>
              </form>
            </div>
          </TabPanel>

          <!-- ======================================================== -->
          <!-- TAB 1: Change Password                                   -->
          <!-- ======================================================== -->
          <TabPanel value="1" class="!p-0">
            <div class="p-6 sm:p-8">
              <form @submit.prevent="handleChangePassword" novalidate class="space-y-5">
                <!-- Current Password -->
                <div>
                  <label
                    for="profile-current-password"
                    class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                  >
                    Current password
                  </label>
                  <Password
                    id="profile-current-password"
                    v-model="currentPassword"
                    placeholder="Enter current password"
                    :feedback="false"
                    :invalid="!!passwordErrors.currentPassword"
                    toggle-mask
                    class="w-full"
                    autocomplete="current-password"
                  />
                  <small
                    v-if="passwordErrors.currentPassword"
                    class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                  >
                    {{ passwordErrors.currentPassword }}
                  </small>
                </div>

                <!-- New Password -->
                <div>
                  <label
                    for="profile-new-password"
                    class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                  >
                    New password
                  </label>
                  <Password
                    id="profile-new-password"
                    v-model="newPassword"
                    placeholder="Enter new password"
                    :invalid="!!passwordErrors.newPassword"
                    toggle-mask
                    class="w-full"
                    autocomplete="new-password"
                  />
                  <!-- Strength Bar -->
                  <div
                    v-if="newPassword"
                    class="mt-2"
                  >
                    <div class="flex gap-1">
                      <div
                        v-for="i in 4"
                        :key="i"
                        :class="[
                          'h-1 flex-1 rounded-full transition-colors duration-200',
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : 'bg-surface-200 dark:bg-surface-200',
                        ]"
                      />
                    </div>
                    <p
                      v-if="passwordStrength.label"
                      :class="[
                        'text-xs mt-1',
                        {
                          'text-error-500 dark:text-error-400': passwordStrength.level === 1,
                          'text-warning-500 dark:text-warning-400': passwordStrength.level === 2,
                          'text-accent-500 dark:text-accent-400': passwordStrength.level === 3,
                          'text-success-500 dark:text-success-400': passwordStrength.level === 4,
                        },
                      ]"
                    >
                      {{ passwordStrength.label }}
                    </p>
                  </div>
                  <small
                    v-if="passwordErrors.newPassword"
                    class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                  >
                    {{ passwordErrors.newPassword }}
                  </small>
                </div>

                <!-- Confirm New Password -->
                <div>
                  <label
                    for="profile-new-password-confirmation"
                    class="block text-sm font-medium text-surface-700 dark:text-surface-600 mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <Password
                    id="profile-new-password-confirmation"
                    v-model="newPasswordConfirmation"
                    placeholder="Confirm new password"
                    :feedback="false"
                    :invalid="!!passwordErrors.newPasswordConfirmation"
                    toggle-mask
                    class="w-full"
                    autocomplete="new-password"
                  />
                  <small
                    v-if="passwordErrors.newPasswordConfirmation"
                    class="text-error-500 dark:text-error-400 text-xs mt-1 block"
                  >
                    {{ passwordErrors.newPasswordConfirmation }}
                  </small>
                </div>

                <!-- Submit -->
                <div class="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    :label="passwordSaving ? 'Changing password...' : 'Change password'"
                    :loading="passwordSaving"
                    :disabled="passwordSaving"
                    severity="primary"
                  />
                  <Button
                    type="button"
                    label="Cancel"
                    severity="secondary"
                    :disabled="passwordSaving"
                    @click="
                      currentPassword = '';
                      newPassword = '';
                      newPasswordConfirmation = '';
                      passwordSubmitted = false;
                    "
                  />
                </div>
              </form>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </div>
</template>
