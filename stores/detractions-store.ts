import { create } from "zustand"
import type { Detraction } from "@/types"

interface DetractionsState {
  detractions: Detraction[]
  loading: boolean
  error: string | null
  fetchDetractions: () => Promise<void>
  updateDetraction: (id: string, detraction: Partial<Detraction>) => Promise<void>
  markAsPaid: (id: string, paymentDate: string, operationNumber: string) => Promise<void>
}

export const useDetractionsStore = create<DetractionsState>((set) => ({
  detractions: [],
  loading: false,
  error: null,
  fetchDetractions: async () => {
    set({ loading: true, error: null })
    try {
      // Simulación de una llamada a API
      // En un entorno real, esto sería una llamada fetch a un endpoint
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Datos de ejemplo
      const detractions: Detraction[] = [
        {
          id: "1",
          documentId: "F001-00001234",
          documentType: "Factura",
          supplier: "PROVEEDOR EJEMPLO S.A.C.",
          supplierRuc: "20123456789",
          documentDate: "2024-01-15",
          documentAmount: 1250.0,
          detractionRate: 10,
          detractionAmount: 125.0,
          paymentDate: "2024-01-16",
          operationNumber: "7624786714",
          status: "paid",
          accountNumber: "00-000-714151",
          currency: "PEN",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-16T10:00:00Z",
        },
        {
          id: "2",
          documentId: "F001-00001235",
          documentType: "Factura",
          supplier: "SERVICIOS GENERALES S.R.L.",
          supplierRuc: "20987654321",
          documentDate: "2024-01-14",
          documentAmount: 850.5,
          detractionRate: 10,
          detractionAmount: 85.05,
          paymentDate: null,
          operationNumber: null,
          status: "pending",
          accountNumber: "00-000-714151",
          currency: "PEN",
          createdAt: "2024-01-14T10:00:00Z",
          updatedAt: "2024-01-14T10:00:00Z",
        },
        {
          id: "3",
          documentId: "RH-00000456",
          documentType: "Recibo por Honorarios",
          supplier: "CONSULTOR INDEPENDIENTE",
          supplierRuc: "10123456789",
          documentDate: "2024-01-13",
          documentAmount: 2100.0,
          detractionRate: 10,
          detractionAmount: 210.0,
          paymentDate: "2024-01-14",
          operationNumber: "7624815055",
          status: "paid",
          accountNumber: "00-000-714151",
          currency: "PEN",
          createdAt: "2024-01-13T10:00:00Z",
          updatedAt: "2024-01-14T10:00:00Z",
        },
        {
          id: "4",
          documentId: "F001-00001236",
          documentType: "Factura",
          supplier: "CONSTRUCCIONES ABC S.A.C.",
          supplierRuc: "20555666777",
          documentDate: "2024-01-12",
          documentAmount: 5600.0,
          detractionRate: 12,
          detractionAmount: 672.0,
          paymentDate: null,
          operationNumber: null,
          status: "overdue",
          accountNumber: "00-000-714151",
          currency: "PEN",
          createdAt: "2024-01-12T10:00:00Z",
          updatedAt: "2024-01-12T10:00:00Z",
        },
      ]

      set({ detractions, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  updateDetraction: async (id, updatedDetraction) => {
    set({ loading: true, error: null })
    try {
      // Simulación de una llamada a API
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => ({
        detractions: state.detractions.map((detraction) =>
          detraction.id === id
            ? {
                ...detraction,
                ...updatedDetraction,
                updatedAt: new Date().toISOString(),
              }
            : detraction,
        ),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  markAsPaid: async (id, paymentDate, operationNumber) => {
    set({ loading: true, error: null })
    try {
      // Simulación de una llamada a API
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => ({
        detractions: state.detractions.map((detraction) =>
          detraction.id === id
            ? {
                ...detraction,
                paymentDate,
                operationNumber,
                status: "paid",
                updatedAt: new Date().toISOString(),
              }
            : detraction,
        ),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
}))
