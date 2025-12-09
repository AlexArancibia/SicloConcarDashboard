import { create } from "zustand"
import type { TaxScheme, CreateTaxSchemeDto, UpdateTaxSchemeDto, TaxSchemeFilters } from "@/types/tax-schemes"
import apiClient from "@/lib/axiosConfig"

interface TaxSchemesState {
  // State
  taxSchemes: TaxScheme[]
  currentTaxScheme: TaxScheme | null
  loading: boolean
  error: string | null

  // Actions
  loadTaxSchemes: (filters?: TaxSchemeFilters) => Promise<void>
  getTaxSchemeById: (id: string) => Promise<TaxScheme | null>
  getTaxSchemeByName: (name: string) => TaxScheme | null
  getTaxSchemeBySchemeId: (schemeId: string) => TaxScheme | null
  createTaxScheme: (data: CreateTaxSchemeDto) => Promise<TaxScheme | null>
  updateTaxScheme: (id: string, data: UpdateTaxSchemeDto) => Promise<TaxScheme | null>
  deleteTaxScheme: (id: string) => Promise<boolean>
  getActiveTaxSchemes: () => TaxScheme[]
  clearError: () => void
  setCurrentTaxScheme: (taxScheme: TaxScheme | null) => void
  clearTaxSchemes: () => void
}

export const useTaxSchemesStore = create<TaxSchemesState>((set, get) => ({
  // Initial state
  taxSchemes: [],
  currentTaxScheme: null,
  loading: false,
  error: null,

  // Actions
  loadTaxSchemes: async (filters = {}) => {
    console.log("🔄 [TaxSchemesStore] Cargando tax schemes...")
    console.log("📋 [TaxSchemesStore] Filtros:", filters)

    set({ loading: true, error: null })

    try {
      const startTime = performance.now()
      const response = await apiClient.get<TaxScheme[]>("/tax-schemes")
      const endTime = performance.now()
      let taxSchemes = response.data

      console.log("✅ [TaxSchemesStore] Tax schemes recibidos del API:", {
        count: taxSchemes.length,
        tiempo: `${(endTime - startTime).toFixed(2)}ms`,
      })

      // Aplicar filtros en el cliente ya que el API no los soporta
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const beforeCount = taxSchemes.length
        taxSchemes = taxSchemes.filter(
          (ts) =>
            ts.taxSchemeName.toLowerCase().includes(searchTerm) ||
            ts.taxSchemeId.toLowerCase().includes(searchTerm) ||
            (ts.description && ts.description.toLowerCase().includes(searchTerm)),
        )
        console.log(`🔍 [TaxSchemesStore] Filtrados por búsqueda "${filters.search}": ${taxSchemes.length} de ${beforeCount}`)
      }

      if (filters.isActive !== undefined) {
        const beforeCount = taxSchemes.length
        taxSchemes = taxSchemes.filter((ts) => ts.isActive === filters.isActive)
        console.log(`✅ [TaxSchemesStore] Filtrados por isActive ${filters.isActive}: ${taxSchemes.length} de ${beforeCount}`)
      }

      if (filters.taxTypeCode) {
        const beforeCount = taxSchemes.length
        taxSchemes = taxSchemes.filter((ts) => ts.taxTypeCode === filters.taxTypeCode)
        console.log(`🏷️ [TaxSchemesStore] Filtrados por taxTypeCode "${filters.taxTypeCode}": ${taxSchemes.length} de ${beforeCount}`)
      }

      // Log detallado solo en desarrollo
      if (process.env.NODE_ENV === "development" && taxSchemes.length <= 20) {
        taxSchemes.forEach((ts, index) => {
          console.log(`🏷️ [TaxSchemesStore] Tax Scheme ${index + 1}:`, {
            id: ts.id,
            taxSchemeId: ts.taxSchemeId,
            taxSchemeName: ts.taxSchemeName,
            taxPercentage: ts.taxPercentage,
            isActive: ts.isActive,
          })
        })
      } else if (taxSchemes.length > 20) {
        console.log(`📋 [TaxSchemesStore] ${taxSchemes.length} tax schemes cargados (logs detallados omitidos por cantidad)`)
      }

      set({
        taxSchemes,
        loading: false,
      })

      console.log("✅ [TaxSchemesStore] Tax schemes guardados en store:", taxSchemes.length)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error cargando tax schemes"
      console.error("❌ [TaxSchemesStore] Error cargando tax schemes:", {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      })

      set({
        error: errorMessage,
        loading: false,
        taxSchemes: [],
      })
    }
  },

  getTaxSchemeById: async (id: string) => {
    console.log("🔍 Obteniendo tax scheme por ID:", id)
    set({ loading: true, error: null })

    try {
      const response = await apiClient.get<TaxScheme>(`/tax-schemes/${id}`)
      const taxScheme = response.data

      console.log("✅ Tax scheme obtenido:", taxScheme)

      set({ currentTaxScheme: taxScheme, loading: false })
      return taxScheme
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error obteniendo tax scheme"
      console.error("❌ Error obteniendo tax scheme:", error)

      if (error.response?.status === 404) {
        console.warn("⚠️ Tax scheme no encontrado:", id)
        set({ loading: false })
        return null
      }

      set({ error: errorMessage, loading: false })
      return null
    }
  },

  getTaxSchemeByName: (name: string) => {
    const { taxSchemes } = get()
    console.log(`🔍 Buscando tax scheme por nombre "${name}" en ${taxSchemes.length} esquemas`)

    const taxScheme = taxSchemes.find((ts) => ts.taxSchemeName.toLowerCase() === name.toLowerCase())

    if (taxScheme) {
      console.log(`✅ Tax scheme encontrado por nombre "${name}":`, {
        id: taxScheme.id,
        taxSchemeId: taxScheme.taxSchemeId,
        taxSchemeName: taxScheme.taxSchemeName,
      })
    } else {
      console.warn(`❌ Tax scheme NO encontrado por nombre "${name}"`)
      console.log(
        "📋 Esquemas disponibles:",
        taxSchemes.map((ts) => ts.taxSchemeName),
      )
    }

    return taxScheme || null
  },

  getTaxSchemeBySchemeId: (schemeId: string) => {
    const { taxSchemes } = get()
    console.log(`🔍 Buscando tax scheme por schemeId "${schemeId}" en ${taxSchemes.length} esquemas`)

    const taxScheme = taxSchemes.find((ts) => ts.taxSchemeId === schemeId)

    if (taxScheme) {
      console.log(`✅ Tax scheme encontrado por schemeId "${schemeId}":`, {
        id: taxScheme.id,
        taxSchemeId: taxScheme.taxSchemeId,
        taxSchemeName: taxScheme.taxSchemeName,
      })
    } else {
      console.warn(`❌ Tax scheme NO encontrado por schemeId "${schemeId}"`)
      console.log(
        "📋 SchemeIds disponibles:",
        taxSchemes.map((ts) => ts.taxSchemeId),
      )
    }

    return taxScheme || null
  },

  createTaxScheme: async (data: CreateTaxSchemeDto) => {
    console.log("➕ Creando tax scheme:", data)
    set({ loading: true, error: null })

    try {
      const response = await apiClient.post<TaxScheme>("/tax-schemes", data)
      const newTaxScheme = response.data

      console.log("✅ Tax scheme creado:", newTaxScheme)

      set((state) => ({
        taxSchemes: [newTaxScheme, ...state.taxSchemes],
        currentTaxScheme: newTaxScheme,
        loading: false,
      }))

      return newTaxScheme
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error creando tax scheme"
      console.error("❌ Error creando tax scheme:", error)
      set({ error: errorMessage, loading: false })
      return null
    }
  },

  updateTaxScheme: async (id: string, data: UpdateTaxSchemeDto) => {
    console.log("📝 Actualizando tax scheme:", id, data)
    set({ loading: true, error: null })

    try {
      const response = await apiClient.patch<TaxScheme>(`/tax-schemes/${id}`, data)
      const updatedTaxScheme = response.data

      console.log("✅ Tax scheme actualizado:", updatedTaxScheme)

      set((state) => ({
        taxSchemes: state.taxSchemes.map((ts) => (ts.id === id ? updatedTaxScheme : ts)),
        currentTaxScheme: state.currentTaxScheme?.id === id ? updatedTaxScheme : state.currentTaxScheme,
        loading: false,
      }))

      return updatedTaxScheme
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error actualizando tax scheme"
      console.error("❌ Error actualizando tax scheme:", error)
      set({ error: errorMessage, loading: false })
      return null
    }
  },

  deleteTaxScheme: async (id: string) => {
    console.log("🗑️ Eliminando tax scheme:", id)
    set({ loading: true, error: null })

    try {
      // El endpoint devuelve 204 No Content, no hay response body
      await apiClient.delete(`/tax-schemes/${id}`)

      console.log("✅ Tax scheme eliminado:", id)

      set((state) => ({
        taxSchemes: state.taxSchemes.filter((ts) => ts.id !== id),
        currentTaxScheme: state.currentTaxScheme?.id === id ? null : state.currentTaxScheme,
        loading: false,
      }))

      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error eliminando tax scheme"
      console.error("❌ Error eliminando tax scheme:", error)
      set({ error: errorMessage, loading: false })
      return false
    }
  },

  getActiveTaxSchemes: () => {
    const { taxSchemes } = get()
    const activeSchemes = taxSchemes.filter((ts) => ts.isActive)
    console.log(`🔍 Obteniendo tax schemes activos: ${activeSchemes.length} de ${taxSchemes.length}`)
    return activeSchemes
  },

  clearError: () => {
    if (process.env.NODE_ENV === "development") {
      console.log("🧹 [TaxSchemesStore] Limpiando error del store")
    }
    set({ error: null })
  },

  setCurrentTaxScheme: (taxScheme: TaxScheme | null) => {
    console.log("📝 Estableciendo tax scheme actual:", taxScheme?.taxSchemeName || "null")
    set({ currentTaxScheme: taxScheme })
  },

  clearTaxSchemes: () => {
    console.log("🧹 Limpiando tax schemes del store")
    set({ taxSchemes: [] })
  },
}))
