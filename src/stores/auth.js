import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('nexora-auth-token') || '',
    refreshToken: localStorage.getItem('nexora-refresh-token') || '',
    isAuthenticated: !!localStorage.getItem('nexora-auth-token'),
    loading: false,
    error: '',
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.token,
    currentUser: (state) => state.user,
  },

  actions: {
    /**
     * Authenticate user with credentials.
     * @param {Object} credentials — { email, password }
     */
    async login(credentials) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/auth/login', credentials)

        this.token = data.access_token || data.token
        this.refreshToken = data.refresh_token || ''
        this.isAuthenticated = true

        localStorage.setItem('nexora-auth-token', this.token)
        if (this.refreshToken) {
          localStorage.setItem('nexora-refresh-token', this.refreshToken)
        }

        // Store minimal user from login response if included
        if (data.user) {
          this.user = data.user
          localStorage.setItem('nexora-user', JSON.stringify(data.user))
        }

        // Fetch full user profile
        await this.fetchUser()

        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Login failed. Please try again.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Logout the current user.
     */
    async logout() {
      this.loading = true
      try {
        await api.post('/auth/logout')
      } catch {
        // Even if the API call fails, clear local state
      } finally {
        this.token = ''
        this.refreshToken = ''
        this.user = null
        this.isAuthenticated = false
        this.error = ''

        localStorage.removeItem('nexora-auth-token')
        localStorage.removeItem('nexora-refresh-token')
        localStorage.removeItem('nexora-user')

        this.loading = false
      }
    },

    /**
     * Register a new user.
     * @param {Object} userData — { name, email, password, password_confirmation, ... }
     */
    async register(userData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/auth/register', userData)

        // Auto-login after registration if token is returned
        if (data.access_token || data.token) {
          this.token = data.access_token || data.token
          this.refreshToken = data.refresh_token || ''
          this.isAuthenticated = true
          this.user = data.user || null

          localStorage.setItem('nexora-auth-token', this.token)
          if (this.refreshToken) {
            localStorage.setItem('nexora-refresh-token', this.refreshToken)
          }
          if (data.user) {
            localStorage.setItem('nexora-user', JSON.stringify(data.user))
          }
        }

        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Registration failed. Please try again.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Send password reset link.
     * @param {string} email
     */
    async forgotPassword(email) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/auth/forgot-password', { email })
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to send password reset link. Please try again.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset password with token.
     * @param {string} token
     * @param {string} password
     * @param {string} passwordConfirmation
     */
    async resetPassword(token, password, passwordConfirmation) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/auth/reset-password', {
          token,
          password,
          password_confirmation: passwordConfirmation,
        })
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to reset password. Please try again.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch the authenticated user's profile.
     */
    async fetchUser() {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/auth/user')
        this.user = data.user || data.data || data
        this.isAuthenticated = true
        localStorage.setItem('nexora-user', JSON.stringify(this.user))
        return this.user
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch user profile.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update the authenticated user's profile.
     * @param {Object} profileData — { name, email, avatar, ... }
     */
    async updateProfile(profileData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put('/auth/profile', profileData)
        this.user = data.data || data
        localStorage.setItem('nexora-user', JSON.stringify(this.user))
        return this.user
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to update profile.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Change the authenticated user's password.
     * @param {string} oldPassword
     * @param {string} newPassword
     * @param {string} newPasswordConfirmation
     */
    async changePassword(oldPassword, newPassword, newPasswordConfirmation) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put('/auth/change-password', {
          current_password: oldPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        })
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to change password.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Restore authentication state from localStorage (call on app init).
     */
    restoreSession() {
      const storedToken = localStorage.getItem('nexora-auth-token')
      const storedUser = localStorage.getItem('nexora-user')
      const storedRefreshToken = localStorage.getItem('nexora-refresh-token')

      if (storedToken) {
        this.token = storedToken
        this.refreshToken = storedRefreshToken || ''
        this.isAuthenticated = true
        if (storedUser) {
          try {
            this.user = JSON.parse(storedUser)
          } catch {
            this.user = null
          }
        }
      }
    },
  },
})
