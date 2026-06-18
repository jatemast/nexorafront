import { defineStore } from 'pinia'
import api from '@/services/api'

export const useWhatsAppStore = defineStore('whatsapp', {
  state: () => ({
    schedules: [],
    messages: [],
    surveys: [],
    surveyResults: null,
    loading: false,
    error: '',
  }),

  getters: {
    scheduleById: (state) => (id) =>
      state.schedules.find((s) => s.id === id) || null,
    surveyById: (state) => (id) =>
      state.surveys.find((s) => s.id === id) || null,
    activeSchedules: (state) =>
      state.schedules.filter((s) => s.is_active),
    publishedSurveys: (state) =>
      state.surveys.filter((s) => s.status === 'published'),
  },

  actions: {
    // ─── WhatsApp Schedules ────────────────────────────────────────

    /**
     * Fetch all WhatsApp schedules.
     * GET /whatsapp-schedules
     * @param {Object} params
     */
    async fetchSchedules(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/whatsapp-schedules', { params })
        this.schedules = data.schedules || data.data || data
        return this.schedules
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar las programaciones.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new WhatsApp schedule.
     * POST /whatsapp-schedules
     * @param {Object} scheduleData
     */
    async createSchedule(scheduleData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/whatsapp-schedules', scheduleData)
        const created = data.schedule || data.data || data
        this.schedules.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear la programación.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing WhatsApp schedule.
     * PUT /whatsapp-schedules/{schedule}
     * @param {number|string} id
     * @param {Object} scheduleData
     */
    async updateSchedule(id, scheduleData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/whatsapp-schedules/${id}`, scheduleData)
        const updated = data.schedule || data.data || data
        const index = this.schedules.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.schedules[index] = { ...this.schedules[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar la programación #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a WhatsApp schedule by ID.
     * DELETE /whatsapp-schedules/{schedule}
     * @param {number|string} id
     */
    async deleteSchedule(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/whatsapp-schedules/${id}`)
        this.schedules = this.schedules.filter((s) => s.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar la programación #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── WhatsApp Messages ─────────────────────────────────────────

    /**
     * Fetch WhatsApp message tracking/history.
     * GET /whatsapp-messages
     * @param {Object} params — { employee_id, schedule_id, status, page, per_page }
     */
    async fetchMessages(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/whatsapp-messages', { params })
        this.messages = data.data || data
        return this.messages
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los mensajes.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Surveys ───────────────────────────────────────────────────

    /**
     * Fetch all surveys.
     * GET /surveys
     * @param {Object} params
     */
    async fetchSurveys(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/surveys', { params })
        this.surveys = data.surveys || data.data || data
        return this.surveys
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar las encuestas.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new survey.
     * POST /surveys
     * @param {Object} surveyData — { title, description, questions (JSON), status, starts_at, ends_at }
     */
    async createSurvey(surveyData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/surveys', surveyData)
        const created = data.survey || data.data || data
        this.surveys.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear la encuesta.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing survey.
     * PUT /surveys/{survey}
     * @param {number|string} id
     * @param {Object} surveyData
     */
    async updateSurvey(id, surveyData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/surveys/${id}`, surveyData)
        const updated = data.survey || data.data || data
        const index = this.surveys.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.surveys[index] = { ...this.surveys[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar la encuesta #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Submit survey answers.
     * POST /surveys/{survey}/submit
     * @param {number|string} surveyId
     * @param {Object} answers — { answers: [...] }
     */
    async submitSurvey(surveyId, answers) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(`/surveys/${surveyId}/submit`, { answers })
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al enviar la encuesta.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch survey results.
     * GET /surveys/{survey}/results
     * @param {number|string} surveyId
     */
    async fetchSurveyResults(surveyId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/surveys/${surveyId}/results`)
        this.surveyResults = data
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los resultados de la encuesta.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
