import axios from 'axios'
import { useToast } from 'primevue/usetoast'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Track token refresh state to avoid concurrent refresh attempts
let isRefreshing = false
let failedQueue = []

/**
 * Process the queue of failed requests after token refresh.
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Get a toast instance outside of Vue component context.
 * Returns null if ToastService is not yet available.
 */
const getToast = () => {
  try {
    return useToast()
  } catch {
    return null
  }
}

// ─── Request Interceptor ───────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexora-auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // ── SaaS Multi-tenant: attach company_id to every request ──────────
    // Every backend controller expects company_id for data isolation.
    // Skip only for auth endpoints (login, register, password reset).
    const skipCompanyId = config.url && (
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/forgot-password') ||
      config.url.includes('/auth/reset-password') ||
      config.url.includes('/auth/refresh')
    )

    if (!skipCompanyId) {
      const companyId = localStorage.getItem('nexora-company-id')
      if (companyId) {
        // For GET/DELETE, attach as query param
        if (['get', 'delete'].includes(config.method?.toLowerCase())) {
          config.params = {
            ...(config.params || {}),
            company_id: companyId,
          }
        } else {
          // For POST/PUT/PATCH, attach to body if not a FormData
          if (config.data instanceof FormData) {
            config.data.append('company_id', companyId)
          } else {
            config.data = {
              ...(config.data || {}),
              company_id: companyId,
            }
          }
        }
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ─── Response Interceptor ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const toast = getToast()

    // If no response, network error
    if (!error.response) {
      if (toast) {
        toast.add({
          severity: 'error',
          summary: 'Connection Error',
          detail: 'Unable to reach the server. Please check your internet connection.',
          life: 6000,
        })
      }
      return Promise.reject(error)
    }

    const { status, data } = error.response

    // ── Handle specific HTTP status codes ──────────────────────────
    switch (status) {
      case 400:
        if (toast) {
          const detail =
            data?.message ||
            (data?.errors
              ? Object.values(data.errors).flat().join(', ')
              : 'The request was invalid.')
          toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail,
            life: 5000,
          })
        }
        break

      case 401:
        // Try token refresh if we have a refresh token and haven't already tried
        const refreshToken = localStorage.getItem('nexora-refresh-token')

        if (refreshToken && !originalRequest._retry) {
          if (isRefreshing) {
            // Queue this request until refresh completes
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return api(originalRequest)
              })
              .catch((err) => {
                return Promise.reject(err)
              })
          }

          originalRequest._retry = true
          isRefreshing = true

          try {
            const { data: refreshData } = await axios.post(
              'http://127.0.0.1:8000/api/auth/refresh',
              { refresh_token: refreshToken }
            )

            const newToken = refreshData.access_token || refreshData.token
            const newRefreshToken =
              refreshData.refresh_token || refreshToken

            localStorage.setItem('nexora-auth-token', newToken)
            if (newRefreshToken) {
              localStorage.setItem('nexora-refresh-token', newRefreshToken)
            }

            // Update the Authorization header for the retry
            originalRequest.headers.Authorization = `Bearer ${newToken}`

            processQueue(null, newToken)

            return api(originalRequest)
          } catch (refreshError) {
            processQueue(refreshError, null)

            // Refresh failed — clear tokens and redirect to login
            localStorage.removeItem('nexora-auth-token')
            localStorage.removeItem('nexora-refresh-token')
            localStorage.removeItem('nexora-user')
            localStorage.removeItem('nexora-company-id')

            if (toast) {
              toast.add({
                severity: 'error',
                summary: 'Session Expired',
                detail: 'Your session has expired. Please log in again.',
                life: 6000,
              })
            }

            // Redirect to login (use window.location as fallback)
            const currentPath = window.location.pathname
            if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
              window.location.href = '/login'
            }

            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        }

        // No refresh token available — clear and redirect
        localStorage.removeItem('nexora-auth-token')
        localStorage.removeItem('nexora-refresh-token')
        localStorage.removeItem('nexora-user')
        localStorage.removeItem('nexora-company-id')

        if (toast) {
          toast.add({
            severity: 'error',
            summary: 'Authentication Required',
            detail: data?.message || 'Please log in to continue.',
            life: 5000,
          })
        }

        const currentPath = window.location.pathname
        if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
          window.location.href = '/login'
        }
        break

      case 403:
        if (toast) {
          toast.add({
            severity: 'error',
            summary: 'Access Denied',
            detail:
              data?.message ||
              'You do not have permission to perform this action.',
            life: 5000,
          })
        }
        break

      case 404:
        if (toast) {
          toast.add({
            severity: 'warn',
            summary: 'Not Found',
            detail:
              data?.message ||
              'The requested resource was not found.',
            life: 4000,
          })
        }
        break

      case 422:
        // Laravel validation errors — we handle these at the store level,
        // but show a generic toast if not caught
        if (toast && data?.message) {
          toast.add({
            severity: 'warn',
            summary: 'Unprocessable Entity',
            detail: data.message,
            life: 5000,
          })
        }
        break

      case 429:
        if (toast) {
          toast.add({
            severity: 'warn',
            summary: 'Too Many Requests',
            detail: 'Please wait a moment before trying again.',
            life: 5000,
          })
        }
        break

      case 500:
        if (toast) {
          toast.add({
            severity: 'error',
            summary: 'Server Error',
            detail:
              data?.message ||
              'An unexpected error occurred. Please try again later.',
            life: 7000,
          })
        }
        break

      default:
        if (status >= 500 && toast) {
          toast.add({
            severity: 'error',
            summary: 'Server Error',
            detail: `An unexpected error occurred (HTTP ${status}).`,
            life: 5000,
          })
        }
        break
    }

    return Promise.reject(error)
  }
)

export default api
