import { defineStore } from 'pinia'
import api from '@/services/api'

export const useCertificatesStore = defineStore('certificates', {
  state: () => ({
    certificates: [],
    certificate: null,
    templates: [],
    template: null,
    loading: false,
    error: '',
  }),

  getters: {
    totalCertificates: (state) => state.certificates.length,
    certificateById: (state) => (id) =>
      state.certificates.find((c) => c.id === id) || null,
    templateById: (state) => (id) =>
      state.templates.find((t) => t.id === id) || null,
  },

  actions: {
    /**
     * Fetch all certificates.
     * @param {Object} params — optional query parameters (page, per_page, search, user_id, course_id, etc.)
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/certificates', { params })
        this.certificates = data.data || data
        return this.certificates
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch certificates.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single certificate by ID.
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/certificates/${id}`)
        this.certificate = data.data || data
        return this.certificate
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to fetch certificate #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Templates ──────────────────────────────────────────────────

    /**
     * Fetch all certificate templates.
     * @param {Object} params — optional query parameters (page, per_page, search, etc.)
     */
    async fetchTemplates(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/certificates/templates', { params })
        this.templates = data.data || data
        return this.templates
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch certificate templates.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single certificate template by ID.
     * @param {number|string} id
     */
    async fetchTemplate(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/certificates/templates/${id}`)
        this.template = data.data || data
        return this.template
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to fetch certificate template #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new certificate template.
     * @param {Object} templateData
     */
    async createTemplate(templateData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/certificates/templates', templateData)
        const created = data.data || data
        this.templates.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create certificate template.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing certificate template.
     * @param {number|string} id
     * @param {Object} templateData
     */
    async updateTemplate(id, templateData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(
          `/certificates/templates/${id}`,
          templateData
        )
        const updated = data.data || data
        const index = this.templates.findIndex((t) => t.id === id)
        if (index !== -1) {
          this.templates[index] = { ...this.templates[index], ...updated }
        }
        if (this.template && this.template.id === id) {
          this.template = { ...this.template, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to update certificate template #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a certificate template by ID.
     * @param {number|string} id
     */
    async deleteTemplate(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/certificates/templates/${id}`)
        this.templates = this.templates.filter((t) => t.id !== id)
        if (this.template && this.template.id === id) {
          this.template = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to delete certificate template #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Download a certificate as PDF.
     * @param {number|string} certificateId
     */
    async downloadPDF(certificateId) {
      this.loading = true
      this.error = ''
      try {
        const response = await api.get(`/certificates/${certificateId}/pdf`, {
          responseType: 'blob',
        })

        // Trigger file download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        const disposition = response.headers['content-disposition']
        const filenameMatch =
          disposition && disposition.match(/filename="?(.+?)"?$/)
        link.setAttribute(
          'download',
          filenameMatch
            ? filenameMatch[1]
            : `certificate-${certificateId}.pdf`
        )
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        return response
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to download certificate #${certificateId}.`
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
