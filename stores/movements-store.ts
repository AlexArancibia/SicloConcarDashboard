import { create } from "zustand"
import type { Movement } from "@/types"

interface MovementsState {
  movements: Movement[]
  loading: boolean
  error: string | null
  fetchMovements: () => Promise<void>
  addMovements: (movements: Movement[]) => Promise<void>
  deleteMovement: (id: string) => Promise<void>
}

export const useMovementsStore = create<MovementsState>((set) => ({
  movements: [],
  loading: false,
  error: null,
  fetchMovements: async () => {
    set({ loading: true, error: null })
    try {
      // Simulación de una llamada a API
      // En un entorno real, esto sería una llamada fetch a un endpoint
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Datos de ejemplo
      const movements: Movement[] = [
        {
          id: "1",
          date: "09/05/2025",
          valueDate: "",
          description: "IMPUESTO ITF",
          amount: -2.9,
          balance: 174653.71,
          branch: "000-000",
          operationNumber: "00000000",
          operationTime: "00:00:00",
          user: "BATCH",
          utc: "0909",
          reference: "",
          accountNumber: "193-2519100-0-54",
          accountHolder: "GRUPO REVOLUCIONES S.A.C.",
          currency: "PEN",
          accountType: "Corriente",
          uploadDate: "2024-01-15",
          fileName: "estado_bancario_enero.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          date: "09/05/2025",
          valueDate: "",
          description: "DETR.MASIVA 7624786714",
          amount: -14164.0,
          balance: 174656.61,
          branch: "111-034",
          operationNumber: "01026656",
          operationTime: "21:55:13",
          user: "SNTPEA",
          utc: "4709",
          reference: "",
          accountNumber: "193-2519100-0-54",
          accountHolder: "GRUPO REVOLUCIONES S.A.C.",
          currency: "PEN",
          accountType: "Corriente",
          uploadDate: "2024-01-15",
          fileName: "estado_bancario_enero.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "3",
          date: "09/05/2025",
          valueDate: "",
          description: "DETR.MASIVA 7624797240",
          amount: -6103.0,
          balance: 188820.61,
          branch: "111-034",
          operationNumber: "01026852",
          operationTime: "22:18:02",
          user: "SNTPEA",
          utc: "4709",
          reference: "",
          accountNumber: "193-2519100-0-54",
          accountHolder: "GRUPO REVOLUCIONES S.A.C.",
          currency: "PEN",
          accountType: "Corriente",
          uploadDate: "2024-01-15",
          fileName: "estado_bancario_enero.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "4",
          date: "09/05/2025",
          valueDate: "",
          description: "A 193 94566597 0",
          amount: -3115.2,
          balance: 194923.61,
          branch: "111-065",
          operationNumber: "01049061",
          operationTime: "10:27:54",
          user: "OBEB94",
          utc: "4401",
          reference: "Bicicletas almacen",
          accountNumber: "193-2519100-0-54",
          accountHolder: "GRUPO REVOLUCIONES S.A.C.",
          currency: "PEN",
          accountType: "Corriente",
          uploadDate: "2024-01-15",
          fileName: "estado_bancario_enero.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "5",
          date: "09/05/2025",
          valueDate: "",
          description: "PAGO DETRAC 7624810089",
          amount: -2771.0,
          balance: 198038.81,
          branch: "111-034",
          operationNumber: "01027034",
          operationTime: "22:47:25",
          user: "SNTPEA",
          utc: "4709",
          reference: "",
          accountNumber: "193-2519100-0-54",
          accountHolder: "GRUPO REVOLUCIONES S.A.C.",
          currency: "PEN",
          accountType: "Corriente",
          uploadDate: "2024-01-15",
          fileName: "estado_bancario_enero.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "6",
          date: "09/05/2025",
          valueDate: "",
          description: "A 193 94566597 0",
          amount: -2200.0,
          balance: 200809.81,
          branch: "111-065",
          operationNumber: "01048093",
          operationTime: "10:27:54",
          user: "OBE741",
          utc: "4401",
          reference: "Zapatillas",
          accountNumber: "193-2519100-0-54",
          accountHolder: "GRUPO REVOLUCIONES S.A.C.",
          currency: "PEN",
          accountType: "Corriente",
          uploadDate: "2024-01-15",
          fileName: "estado_bancario_enero.xlsx",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
      ]

      set({ movements, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  addMovements: async (newMovements) => {
    set({ loading: true, error: null })
    try {
      // Simulación de una llamada a API
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => {
        // Evitar duplicados
        const existingIds = new Set(state.movements.map((mov) => mov.id))
        const uniqueNewMovements = newMovements.filter((mov) => !existingIds.has(mov.id))

        return {
          movements: [...state.movements, ...uniqueNewMovements],
          loading: false,
        }
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  deleteMovement: async (id) => {
    set({ loading: true, error: null })
    try {
      // Simulación de una llamada a API
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => ({
        movements: state.movements.filter((movement) => movement.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
}))
