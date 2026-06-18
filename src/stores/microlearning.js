import { defineStore } from 'pinia'
import api from '@/services/api'

export const useMicrolearningStore = defineStore('microlearning', {
  state: () => ({
    microlearningItems: [],
    microlearningItem: null,
    assignments: [],
    loading: false,
    error: '',
  }),

  getters: {
    totalItems: (state) => state.microlearningItems.length,
    itemById: (state) => (id) =>
      state.microlearningItems.find((m) => m.id === id) || null,
    activeAssignments: (state) =>
      state.assignments.filter((a) => a.status === 'active'),
  },

  actions: {
    /**
     * Fetch all microlearning items.
     * @param {Object} params — optional query parameters (page, per_page, search, type, etc.)
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/microlearning', { params })
        this.microlearningItems = data.data || data
        return this.microlearningItems
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to fetch microlearning items.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single microlearning item by ID.
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/microlearning/${id}`)
        this.microlearningItem = data.data || data
        return this.microlearningItem
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to fetch microlearning item #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new microlearning item.
     * @param {Object} itemData
     */
    async create(itemData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/microlearning', itemData)
        const created = data.data || data
        this.microlearningItems.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to create microlearning item.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing microlearning item.
     * @param {number|string} id
     * @param {Object} itemData
     */
    async update(id, itemData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/microlearning/${id}`, itemData)
        const updated = data.data || data
        const index = this.microlearningItems.findIndex((m) => m.id === id)
        if (index !== -1) {
          this.microlearningItems[index] = {
            ...this.microlearningItems[index],
            ...updated,
          }
        }
        if (this.microlearningItem && this.microlearningItem.id === id) {
          this.microlearningItem = { ...this.microlearningItem, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to update microlearning item #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a microlearning item by ID.
     * @param {number|string} id
     */
    async delete(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/microlearning/${id}`)
        this.microlearningItems = this.microlearningItems.filter(
          (m) => m.id !== id
        )
        if (this.microlearningItem && this.microlearningItem.id === id) {
          this.microlearningItem = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          `Failed to delete microlearning item #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Assign a microlearning item to users or groups.
     * @param {Object} assignmentData — { microlearning_id, user_ids, group_ids, due_date, ... }
     */
    async assign(assignmentData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(
          '/microlearning/assignments',
          assignmentData
        )
        const created = data.data || data
        this.assignments.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to assign microlearning item.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch microlearning assignments.
     * @param {Object} params — optional query parameters (user_id, microlearning_id, status, etc.)
     */
    async fetchAssignments(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/microlearning/assignments', {
          params,
        })
        this.assignments = data.data || data
        return this.assignments
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to fetch microlearning assignments.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
