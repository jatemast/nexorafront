import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    companies: [],
    company: null,
    masterDashboard: {
      kpis: {},
      top_companies: [],
      registrations_by_month: null,
    },
    loading: false,
    error: '',
  }),

  getters: {
    totalCompanies: (state) => state.companies.length,
    companyById: (state) => (id) =>
      state.companies.find((c) => c.id === id) || null,
  },

  actions: {
    // ─── Master Dashboard ────────────────────────────────────────────

    async fetchMasterDashboard(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/admin/dashboard', { params })
        this.masterDashboard = {
          kpis: data.kpis || {},
          top_companies: data.top_companies || [],
          registrations_by_month: data.registrations_by_month || null,
        }
        return this.masterDashboard
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch master dashboard.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Companies CRUD ──────────────────────────────────────────────

    async fetchCompanies(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/admin/companies', { params })
        this.companies = data.data || data
        return this.companies
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch companies.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchCompany(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/admin/companies/${id}`)
        this.company = data.company || data.data || data
        return this.company
      } catch (err) {
        this.error = err.response?.data?.message || `Failed to fetch company #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    async createCompany(companyData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/admin/companies', companyData)
        const created = data.company || data.data || data
        this.companies.unshift(created)
        return created
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create company.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateCompany(id, companyData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/admin/companies/${id}`, companyData)
        const updated = data.company || data.data || data
        const index = this.companies.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.companies[index] = { ...this.companies[index], ...updated }
        }
        if (this.company?.id === id) {
          this.company = { ...this.company, ...updated }
        }
        return updated
      } catch (err) {
        this.error = err.response?.data?.message || `Failed to update company #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteCompany(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/admin/companies/${id}`)
        this.companies = this.companies.filter((c) => c.id !== id)
        if (this.company?.id === id) {
          this.company = null
        }
      } catch (err) {
        this.error = err.response?.data?.message || `Failed to delete company #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    async toggleCompanyActive(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(`/admin/companies/${id}/toggle-active`)
        const updated = data.company || data.data || data
        const index = this.companies.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.companies[index] = { ...this.companies[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error = err.response?.data?.message || `Failed to toggle company #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
