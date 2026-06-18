import { defineStore } from 'pinia'
import api from '@/services/api'

export const useEvaluationsStore = defineStore('evaluations', {
  state: () => ({
    evaluations: [],
    evaluation: null,
    attempt: null,
    results: null,
    loading: false,
    error: '',
  }),

  getters: {
    totalEvaluations: (state) => state.evaluations.length,
    evaluationById: (state) => (id) =>
      state.evaluations.find((e) => e.id === id) || null,
    isAttemptInProgress: (state) =>
      !!state.attempt && state.attempt.status === 'in_progress',
  },

  actions: {
    /**
     * Fetch all evaluations.
     * @param {Object} params — optional query parameters (page, per_page, search, course_id, etc.)
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/evaluations', { params })
        this.evaluations = data.data || data
        return this.evaluations
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch evaluations.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single evaluation by ID.
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/evaluations/${id}`)
        this.evaluation = data.data || data
        return this.evaluation
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to fetch evaluation #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new evaluation.
     * @param {Object} evaluationData
     */
    async create(evaluationData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/evaluations', evaluationData)
        const created = data.data || data
        this.evaluations.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create evaluation.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing evaluation.
     * @param {number|string} id
     * @param {Object} evaluationData
     */
    async update(id, evaluationData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/evaluations/${id}`, evaluationData)
        const updated = data.data || data
        const index = this.evaluations.findIndex((e) => e.id === id)
        if (index !== -1) {
          this.evaluations[index] = { ...this.evaluations[index], ...updated }
        }
        if (this.evaluation && this.evaluation.id === id) {
          this.evaluation = { ...this.evaluation, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to update evaluation #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete an evaluation by ID.
     * @param {number|string} id
     */
    async delete(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/evaluations/${id}`)
        this.evaluations = this.evaluations.filter((e) => e.id !== id)
        if (this.evaluation && this.evaluation.id === id) {
          this.evaluation = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to delete evaluation #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Start an evaluation attempt.
     * @param {number|string} evaluationId
     */
    async startAttempt(evaluationId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(`/evaluations/${evaluationId}/attempts`)
        this.attempt = data.data || data
        return this.attempt
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to start evaluation attempt.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Submit answers for an evaluation attempt.
     * @param {number|string} attemptId
     * @param {Object} answers — { answers: [{ question_id, answer, ... }] }
     */
    async submitAttempt(attemptId, answers) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(
          `/evaluations/attempts/${attemptId}/submit`,
          answers
        )
        this.results = data.data || data
        this.attempt = null
        return this.results
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to submit evaluation attempt.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch results for a completed evaluation attempt.
     * @param {number|string} attemptId
     */
    async fetchResults(attemptId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/evaluations/attempts/${attemptId}/results`)
        this.results = data.data || data
        return this.results
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch evaluation results.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
