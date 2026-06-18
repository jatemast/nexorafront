import { defineStore } from 'pinia'
import api from '@/services/api'

export const useQuestionsStore = defineStore('questions', {
  state: () => ({
    questions: [],
    question: null,
    categories: [],
    loading: false,
    error: '',
  }),

  getters: {
    totalQuestions: (state) => state.questions.length,
    questionById: (state) => (id) =>
      state.questions.find((q) => q.id === id) || null,
    questionsByCategory: (state) => (categoryId) =>
      state.questions.filter((q) => q.category_id === categoryId),
  },

  actions: {
    /**
     * Fetch all questions.
     * @param {Object} params — optional query parameters (page, per_page, search, category_id, etc.)
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/questions', { params })
        this.questions = data.data || data
        return this.questions
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch questions.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single question by ID.
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/questions/${id}`)
        this.question = data.data || data
        return this.question
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to fetch question #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new question.
     * @param {Object} questionData
     */
    async create(questionData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/questions', questionData)
        const created = data.data || data
        this.questions.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create question.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing question.
     * @param {number|string} id
     * @param {Object} questionData
     */
    async update(id, questionData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/questions/${id}`, questionData)
        const updated = data.data || data
        const index = this.questions.findIndex((q) => q.id === id)
        if (index !== -1) {
          this.questions[index] = { ...this.questions[index], ...updated }
        }
        if (this.question && this.question.id === id) {
          this.question = { ...this.question, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to update question #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a question by ID.
     * @param {number|string} id
     */
    async delete(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/questions/${id}`)
        this.questions = this.questions.filter((q) => q.id !== id)
        if (this.question && this.question.id === id) {
          this.question = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to delete question #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Categories ─────────────────────────────────────────────────

    /**
     * Fetch all question categories.
     */
    async fetchCategories() {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/questions/categories')
        this.categories = data.data || data
        return this.categories
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch question categories.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new question category.
     * @param {Object} categoryData — { name, description, ... }
     */
    async createCategory(categoryData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/questions/categories', categoryData)
        const created = data.data || data
        this.categories.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create question category.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing question category.
     * @param {number|string} id
     * @param {Object} categoryData — { name, description, ... }
     */
    async updateCategory(id, categoryData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/questions/categories/${id}`, categoryData)
        const updated = data.data || data
        const index = this.categories.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.categories[index] = { ...this.categories[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to update question category.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a question category by ID.
     * @param {number|string} id
     */
    async deleteCategory(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/questions/categories/${id}`)
        this.categories = this.categories.filter((c) => c.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to delete question category.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
