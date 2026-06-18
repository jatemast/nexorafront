import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export const useOrganizationalStore = defineStore('organizational', {
  state: () => ({
    branches: [],
    areas: [],
    processes: [],
    positions: [],
    organigram: null,
    company: null,
    loading: false,
    error: '',
  }),

  getters: {
    branchById: (state) => (id) =>
      state.branches.find((b) => b.id === id) || null,
    areaById: (state) => (id) =>
      state.areas.find((a) => a.id === id) || null,
    processById: (state) => (id) =>
      state.processes.find((p) => p.id === id) || null,
    positionById: (state) => (id) =>
      state.positions.find((p) => p.id === id) || null,
  },

  actions: {
    // ─── Organigram ────────────────────────────────────────────────

    /**
     * Fetch the full organigram tree for a company.
     * GET /organigram/{company}
     * @param {number|string} companyId
     */
    async fetchOrganigram(companyId) {
      this.loading = true
      this.error = ''
      try {
        const authStore = useAuthStore()
        const id = companyId || authStore.companyId
        const { data } = await api.get(`/organigram/${id}`)
        this.company = data.company || null
        this.organigram = data.organigram || data
        return this.organigram
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar el organigrama.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Branches ─────────────────────────────────────────────────

    /**
     * Fetch all branches.
     * GET /branches
     * @param {Object} params — optional query parameters
     */
    async fetchBranches(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/branches', { params })
        this.branches = data.branches || data.data || data
        return this.branches
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar las sedes.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new branch.
     * POST /branches
     * @param {Object} branchData
     */
    async createBranch(branchData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/branches', branchData)
        const created = data.branch || data.data || data
        this.branches.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear la sede.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing branch.
     * PUT /branches/{branch}
     * @param {number|string} id
     * @param {Object} branchData
     */
    async updateBranch(id, branchData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/branches/${id}`, branchData)
        const updated = data.branch || data.data || data
        const index = this.branches.findIndex((b) => b.id === id)
        if (index !== -1) {
          this.branches[index] = { ...this.branches[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar la sede #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a branch by ID.
     * DELETE /branches/{branch}
     * @param {number|string} id
     */
    async deleteBranch(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/branches/${id}`)
        this.branches = this.branches.filter((b) => b.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar la sede #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Areas ────────────────────────────────────────────────────

    /**
     * Fetch areas filtered by branch.
     * GET /areas
     * @param {Object} params — must include branch_id
     */
    async fetchAreas(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/areas', { params })
        this.areas = data.areas || data.data || data
        return this.areas
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar las áreas.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new area.
     * POST /areas
     * @param {Object} areaData
     */
    async createArea(areaData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/areas', areaData)
        const created = data.area || data.data || data
        this.areas.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear el área.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing area.
     * PUT /areas/{area}
     * @param {number|string} id
     * @param {Object} areaData
     */
    async updateArea(id, areaData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/areas/${id}`, areaData)
        const updated = data.area || data.data || data
        const index = this.areas.findIndex((a) => a.id === id)
        if (index !== -1) {
          this.areas[index] = { ...this.areas[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar el área #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete an area by ID.
     * DELETE /areas/{area}
     * @param {number|string} id
     */
    async deleteArea(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/areas/${id}`)
        this.areas = this.areas.filter((a) => a.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar el área #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Processes ─────────────────────────────────────────────────

    /**
     * Fetch processes filtered by area.
     * GET /processes
     * @param {Object} params — must include area_id
     */
    async fetchProcesses(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/processes', { params })
        this.processes = data.processes || data.data || data
        return this.processes
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los procesos.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new process.
     * POST /processes
     * @param {Object} processData
     */
    async createProcess(processData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/processes', processData)
        const created = data.process || data.data || data
        this.processes.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear el proceso.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing process.
     * PUT /processes/{process}
     * @param {number|string} id
     * @param {Object} processData
     */
    async updateProcess(id, processData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/processes/${id}`, processData)
        const updated = data.process || data.data || data
        const index = this.processes.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.processes[index] = { ...this.processes[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar el proceso #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a process by ID.
     * DELETE /processes/{process}
     * @param {number|string} id
     */
    async deleteProcess(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/processes/${id}`)
        this.processes = this.processes.filter((p) => p.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar el proceso #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Positions ─────────────────────────────────────────────────

    /**
     * Fetch positions filtered by process.
     * GET /positions
     * @param {Object} params — must include process_id
     */
    async fetchPositions(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.get('/positions', { params })
        this.positions = data.positions || data.data || data
        return this.positions
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al cargar los cargos.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new position.
     * POST /positions
     * @param {Object} positionData
     */
    async createPosition(positionData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/positions', positionData)
        const created = data.position || data.data || data
        this.positions.unshift(created)
        return created
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Error al crear el cargo.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing position.
     * PUT /positions/{position}
     * @param {number|string} id
     * @param {Object} positionData
     */
    async updatePosition(id, positionData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.put(`/positions/${id}`, positionData)
        const updated = data.position || data.data || data
        const index = this.positions.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.positions[index] = { ...this.positions[index], ...updated }
        }
        return updated
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al actualizar el cargo #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a position by ID.
     * DELETE /positions/{position}
     * @param {number|string} id
     */
    async deletePosition(id) {
      this.loading = true
      this.error = ''
      try {
        await api.delete(`/positions/${id}`)
        this.positions = this.positions.filter((p) => p.id !== id)
      } catch (err) {
        this.error =
          err.response?.data?.message || `Error al eliminar el cargo #${id}.`
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
