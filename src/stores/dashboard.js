import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    kpis: {
      total_employees: 0,
      active_employees: 0,
      total_courses: 0,
      total_evaluations: 0,
      total_certificates: 0,
      total_microlearning: 0,
      total_enrollments: 0,
      completed_enrollments: 0,
      in_progress_enrollments: 0,
      completion_rate: 0,
      total_attempts: 0,
      passed_attempts: 0,
      pass_rate: 0,
      average_score: 0,
    },
    chartData: {
      monthly_enrollments: null,
      completions_by_category: null,
      score_distribution: null,
    },
    recentActivity: [],
    loading: false,
    error: '',
  }),

  getters: {
    hasChartData: (state) =>
      state.chartData.monthly_enrollments !== null ||
      state.chartData.completions_by_category !== null,
    hasRecentActivity: (state) => state.recentActivity.length > 0,
  },

  actions: {
    /**
     * Fetch all dashboard data (KPIs, charts, and recent activity)
     * from the single /api/dashboard endpoint.
     * @param {Object} params — optional filters (company_id, etc.)
     */
    async fetchDashboard(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/dashboard', { params })
        const responseData = data.data || data

        // The backend returns { kpis, charts, recent_activities }
        this.kpis = { ...this.kpis, ...(responseData.kpis || {}) }
        this.chartData = { ...this.chartData, ...(responseData.charts || {}) }
        this.recentActivity = responseData.recent_activities || []

        return { kpis: this.kpis, chartData: this.chartData, recentActivity: this.recentActivity }
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch dashboard data.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
