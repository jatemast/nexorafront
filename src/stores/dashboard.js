import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    kpis: {
      total_users: 0,
      total_courses: 0,
      total_enrollments: 0,
      completion_rate: 0,
      active_users: 0,
      total_certificates: 0,
    },
    chartData: {
      enrollments_over_time: null,
      completions_by_course: null,
      user_activity: null,
      evaluation_scores: null,
    },
    recentActivity: [],
    loading: false,
    error: '',
  }),

  getters: {
    hasChartData: (state) =>
      state.chartData.enrollments_over_time !== null ||
      state.chartData.completions_by_course !== null,
    hasRecentActivity: (state) => state.recentActivity.length > 0,
  },

  actions: {
    /**
     * Fetch Key Performance Indicators for the dashboard.
     * @param {Object} params — optional filters (date_from, date_to, etc.)
     */
    async fetchKPIs(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/dashboard/kpis', { params })
        const responseData = data.data || data
        this.kpis = { ...this.kpis, ...responseData }
        return this.kpis
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch dashboard KPIs.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch chart data for the dashboard.
     * @param {Object} params — optional filters (date_from, date_to, granularity, etc.)
     */
    async fetchChartData(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/dashboard/charts', { params })
        const responseData = data.data || data
        this.chartData = { ...this.chartData, ...responseData }
        return this.chartData
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch dashboard chart data.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch recent activity feed for the dashboard.
     * @param {Object} params — optional filters (limit, type, etc.)
     */
    async fetchRecentActivity(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/dashboard/recent-activity', {
          params,
        })
        this.recentActivity = data.data || data
        return this.recentActivity
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Failed to fetch recent activity.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
