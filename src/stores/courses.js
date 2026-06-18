import { defineStore } from 'pinia'
import api from '@/services/api'

export const useCoursesStore = defineStore('courses', {
  state: () => ({
    courses: [],
    course: null,
    categories: [],
    enrollments: [],
    loading: false,
    error: '',
  }),

  getters: {
    totalCourses: (state) => state.courses.length,
    courseById: (state) => (id) =>
      state.courses.find((c) => c.id === id) || null,
    publishedCourses: (state) =>
      state.courses.filter((c) => c.status === 'published'),
    categoryById: (state) => (id) =>
      state.categories.find((cat) => cat.id === id) || null,
  },

  actions: {
    // ─── Courses ────────────────────────────────────────────────────

    /**
     * Fetch all courses.
     * @param {Object} params — optional query parameters (page, per_page, search, category_id, status, etc.)
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/courses', { params })
        this.courses = data.data || data
        return this.courses
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch courses.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single course by ID.
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/courses/${id}`)
        this.course = data.data || data
        return this.course
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to fetch course #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new course.
     * @param {Object} courseData
     */
    async create(courseData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/courses', courseData)
        const created = data.data || data
        this.courses.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create course.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing course.
     * @param {number|string} id
     * @param {Object} courseData
     */
    async update(id, courseData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/courses/${id}`, courseData)
        const updated = data.data || data
        const index = this.courses.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.courses[index] = { ...this.courses[index], ...updated }
        }
        if (this.course && this.course.id === id) {
          this.course = { ...this.course, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to update course #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a course by ID.
     * @param {number|string} id
     */
    async delete(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/courses/${id}`)
        this.courses = this.courses.filter((c) => c.id !== id)
        if (this.course && this.course.id === id) {
          this.course = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to delete course #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Categories ─────────────────────────────────────────────────

    /**
     * Fetch all course categories.
     */
    async fetchCategories() {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/course-categories')
        this.categories = data.data || data
        return this.categories
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch course categories.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new course category.
     * @param {Object} categoryData — { name, description, ... }
     */
    async createCategory(categoryData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/course-categories', categoryData)
        const created = data.data || data
        this.categories.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create course category.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing course category.
     * @param {number|string} id
     * @param {Object} categoryData — { name, description, ... }
     */
    async updateCategory(id, categoryData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/course-categories/${id}`, categoryData)
        const updated = data.data || data
        const index = this.categories.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.categories[index] = { ...this.categories[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to update course category.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a course category by ID.
     * @param {number|string} id
     */
    async deleteCategory(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/course-categories/${id}`)
        this.categories = this.categories.filter((c) => c.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to delete course category.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Enrollments ────────────────────────────────────────────────

    /**
     * Fetch enrollments, optionally filtered by course or user.
     * @param {Object} params — { course_id, user_id, status, page, per_page }
     */
    async fetchEnrollments(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/courses/enrollments', { params })
        this.enrollments = data.data || data
        return this.enrollments
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch enrollments.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Enroll the current user in a course.
     * @param {number|string} courseId
     */
    async enroll(courseId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/courses/enrollments', {
          course_id: courseId,
        })
        const enrollment = data.data || data
        this.enrollments.unshift(enrollment)
        return enrollment
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to enroll in course.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Unenroll the current user from a course.
     * @param {number|string} courseId
     */
    async unenroll(courseId) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/courses/enrollments/${courseId}`)
        this.enrollments = this.enrollments.filter(
          (e) => e.course_id !== courseId && e.id !== courseId,
        )
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to unenroll from course.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
