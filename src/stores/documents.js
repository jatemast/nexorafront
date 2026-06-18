import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDocumentsStore = defineStore('documents', {
  state: () => ({
    documents: [],
    document: null,
    assignments: [],
    tracking: [],
    loading: false,
    error: '',
  }),

  getters: {
    documentById: (state) => (id) =>
      state.documents.find((d) => d.id === id) || null,
    totalDocuments: (state) => state.documents.length,
  },

  actions: {
    // ─── Documents ─────────────────────────────────────────────────

    /**
     * Fetch all documents with optional filters.
     * GET /documents
     * @param {Object} params — { type, category, search, page, per_page }
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/documents', { params })
        this.documents = data.data || data
        return this.documents
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los documentos.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single document by ID.
     * GET /documents/{id}
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/documents/${id}`)
        this.document = data.document || data.data || data
        return this.document
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al cargar el documento #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new document.
     * POST /documents
     * @param {Object} documentData
     */
    async create(documentData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/documents', documentData)
        const created = data.document || data.data || data
        this.documents.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear el documento.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing document.
     * PUT /documents/{id}
     * @param {number|string} id
     * @param {Object} documentData
     */
    async update(id, documentData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/documents/${id}`, documentData)
        const updated = data.document || data.data || data
        const index = this.documents.findIndex((d) => d.id === id)
        if (index !== -1) {
          this.documents[index] = { ...this.documents[index], ...updated }
        }
        if (this.document && this.document.id === id) {
          this.document = { ...this.document, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar el documento #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a document by ID.
     * DELETE /documents/{id}
     * @param {number|string} id
     */
    async delete(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/documents/${id}`)
        this.documents = this.documents.filter((d) => d.id !== id)
        if (this.document && this.document.id === id) {
          this.document = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar el documento #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Assignments ───────────────────────────────────────────────

    /**
     * Assign a document to employees, areas, positions, or branches.
     * POST /documents/{id}/assign
     * @param {number|string} documentId
     * @param {Object} data — { employee_ids, area_ids, position_ids, due_date, notes }
     */
    async assign(documentId, data) {
      this.loading = true
      this.error = ''
      try {
        const { data: response } = await api.post(`/documents/${documentId}/assign`, data)
        return response
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al asignar el documento.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch assignments for a document via the show endpoint.
     * GET /documents/{id}
     * @param {number|string} documentId
     */
    async fetchAssignments(documentId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/documents/${documentId}`)
        this.document = data.document || data.data || data
        this.assignments = this.document?.document_assignments || this.document?.documentAssignments || []
        return this.assignments
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al cargar las asignaciones del documento #${documentId}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Tracking ──────────────────────────────────────────────────

    /**
     * Fetch document tracking records.
     * GET /documents-tracking
     * @param {Object} params — { employee_id, page, per_page }
     */
    async fetchTracking(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/documents-tracking', { params })
        this.tracking = data.data || data
        return this.tracking
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar el seguimiento de documentos.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
