import { defineStore } from 'pinia'
import api from '@/services/api'

export const useGamificationStore = defineStore('gamification', {
  state: () => ({
    badges: [],
    challenges: [],
    leaderboard: [],
    employeeBadges: [],
    points: null,
    transactions: [],
    loading: false,
    error: '',
  }),

  getters: {
    badgeById: (state) => (id) =>
      state.badges.find((b) => b.id === id) || null,
    challengeById: (state) => (id) =>
      state.challenges.find((c) => c.id === id) || null,
    activeChallenges: (state) =>
      state.challenges.filter((c) => c.is_active),
    totalPoints: (state) => state.points?.total_points || 0,
    currentLevel: (state) => state.points?.level || 1,
    experienceToNextLevel: (state) => state.points?.points_to_next_level || 0,
    currentLevelPoints: (state) => state.points?.current_level_points || 0,
  },

  actions: {
    // ─── Badges ────────────────────────────────────────────────────

    /**
     * Fetch all badges.
     * GET /badges
     * @param {Object} params
     */
    async fetchBadges(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/badges', { params })
        this.badges = data.badges || data.data || data
        return this.badges
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar las insignias.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new badge.
     * POST /badges
     * @param {Object} badgeData
     */
    async createBadge(badgeData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/badges', badgeData)
        const created = data.badge || data.data || data
        this.badges.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear la insignia.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing badge.
     * PUT /badges/{badge}
     * @param {number|string} id
     * @param {Object} badgeData
     */
    async updateBadge(id, badgeData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/badges/${id}`, badgeData)
        const updated = data.badge || data.data || data
        const index = this.badges.findIndex((b) => b.id === id)
        if (index !== -1) {
          this.badges[index] = { ...this.badges[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar la insignia #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a badge by ID.
     * DELETE /badges/{badge}
     * @param {number|string} id
     */
    async deleteBadge(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/badges/${id}`)
        this.badges = this.badges.filter((b) => b.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar la insignia #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Employee Badges ───────────────────────────────────────────

    /**
     * Fetch badges earned by an employee.
     * GET /employee-badges
     * @param {number|string} employeeId
     */
    async fetchEmployeeBadges(employeeId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/employee-badges', {
          params: { employee_id: employeeId },
        })
        this.employeeBadges = data.badges || data.data || data
        return this.employeeBadges
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar las insignias del empleado.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Points ────────────────────────────────────────────────────

    /**
     * Fetch points and transactions for an employee.
     * GET /points
     * @param {number|string} employeeId
     */
    async fetchPoints(employeeId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/points', {
          params: { employee_id: employeeId },
        })
        this.points = data.points || null
        this.transactions = data.transactions || []
        return { points: this.points, transactions: this.transactions }
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los puntos.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Leaderboard ───────────────────────────────────────────────

    /**
     * Fetch leaderboard rankings.
     * GET /leaderboard
     * @param {Object} params — { type, period, limit }
     */
    async fetchLeaderboard(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/leaderboard', { params })
        this.leaderboard = data.leaderboard || data.data || data
        return this.leaderboard
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar la tabla de posiciones.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Challenges ────────────────────────────────────────────────

    /**
     * Fetch all challenges.
     * GET /challenges
     * @param {Object} params
     */
    async fetchChallenges(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/challenges', { params })
        this.challenges = data.challenges || data.data || data
        return this.challenges
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los desafíos.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new challenge.
     * POST /challenges
     * @param {Object} challengeData
     */
    async createChallenge(challengeData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/challenges', challengeData)
        const created = data.challenge || data.data || data
        this.challenges.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear el desafío.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing challenge.
     * PUT /challenges/{challenge}
     * @param {number|string} id
     * @param {Object} challengeData
     */
    async updateChallenge(id, challengeData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/challenges/${id}`, challengeData)
        const updated = data.challenge || data.data || data
        const index = this.challenges.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.challenges[index] = { ...this.challenges[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar el desafío #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Join a challenge.
     * POST /challenges/{challenge}/join
     * @param {number|string} challengeId
     */
    async joinChallenge(challengeId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(`/challenges/${challengeId}/join`)
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al unirse al desafío.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Complete a challenge.
     * POST /challenges/{challenge}/complete
     * @param {number|string} challengeId
     */
    async completeChallenge(challengeId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post(`/challenges/${challengeId}/complete`)
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al completar el desafío.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
