import { defineStore } from 'pinia'
import api from '@/services/api'

export const useEmployeesStore = defineStore('employees', {
  state: () => ({
    employees: [],
    employee: null,
    loading: false,
    error: '',
  }),

  getters: {
    totalEmployees: (state) => state.employees.length,
    employeeById: (state) => (id) =>
      state.employees.find((e) => e.id === id) || null,
  },

  actions: {
    /**
     * Fetch all employees.
     * @param {Object} params — optional query parameters (page, per_page, search, etc.)
     */
    async fetchAll(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/employees', { params })
        // Backend returns paginated: { data: [...], meta: { total, ... } }
        this.employees = data.data || data
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to fetch employees.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single employee by ID.
     * @param {number|string} id
     */
    async fetchOne(id) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get(`/employees/${id}`)
        this.employee = data.data || data
        return this.employee
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to fetch employee #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new employee.
     * @param {Object} employeeData
     */
    async create(employeeData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/employees', employeeData)
        const created = data.data || data
        this.employees.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to create employee.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing employee.
     * @param {number|string} id
     * @param {Object} employeeData
     */
    async update(id, employeeData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/employees/${id}`, employeeData)
        const updated = data.data || data
        const index = this.employees.findIndex((e) => e.id === id)
        if (index !== -1) {
          this.employees[index] = { ...this.employees[index], ...updated }
        }
        if (this.employee && this.employee.id === id) {
          this.employee = { ...this.employee, ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to update employee #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle the status of an employee (active ⇄ inactive).
     * @param {number|string} id
     * @param {string} currentStatus — 'active' | 'inactive' | 'suspended'
     */
    async toggleStatus(id, currentStatus) {
      this.loading = true
      this.error = ''
      try {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        const { data } = await api.put(`/employees/${id}`, { status: newStatus })
        const updated = data.data || data.employee || data

        // Update in the list
        const index = this.employees.findIndex((e) => e.id === id)
        if (index !== -1) {
          this.employees[index] = { ...this.employees[index], status: newStatus }
        }
        // Update single employee if loaded
        if (this.employee && this.employee.id === id) {
          this.employee = { ...this.employee, status: newStatus }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to toggle employee #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete an employee by ID (soft delete — uses Laravel SoftDeletes).
     * @param {number|string} id
     */
    async delete(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/employees/${id}`)
        this.employees = this.employees.filter((e) => e.id !== id)
        if (this.employee && this.employee.id === id) {
          this.employee = null
        }
      } catch (err) {
        this.error =
          err.response?.data?.message || `Failed to delete employee #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Import employees from an Excel file.
     * @param {File|FormData} file — Excel file or FormData containing the file
     */
    async importExcel(file) {
      this.loading = true
      this.error = ''
      try {
        const formData = file instanceof FormData ? file : (() => {
          const fd = new FormData()
          fd.append('file', file)
          return fd
        })()

        const { data } = await api.post('/employees/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        // Refresh the list after import
        await this.fetchAll()
        return data
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to import employees.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Export employees to Excel and trigger download.
     * @param {Object} params — optional filters
     */
    async exportExcel(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const response = await api.get('/employees/export/download', {
          params,
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
          filenameMatch ? filenameMatch[1] : 'employees-export.xlsx'
        )
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        return response
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Failed to export employees.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
