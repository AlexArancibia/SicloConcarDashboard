import { create } from "zustand"
import type {
  Document,
  DocumentStatus,
  DocumentQueryDto,
  CreateDocumentDto,
  UpdateDocumentDto,
  ConciliateDocumentDto,
  DocumentResponseDto,
  DocumentSummaryResponseDto,
  BulkUpdateStatusDto,
  BulkDeleteDocumentsDto,
  DocumentXmlData,
  DocumentDigitalSignature,
  DocumentDetraction,
  DocumentAccountLink,
  DocumentCostCenterLink,
  DocumentLine,
  DocumentPaymentTerm,
} from "@/types/documents"
import apiClient from "@/lib/axiosConfig"
import { PaginatedResponse } from "@/types/documents"

interface DocumentsState {
  documents: Document[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos que coinciden exactamente con el service/controller
  fetchDocuments: (companyId: string, query?: DocumentQueryDto) => Promise<void>
  createDocument: (createDocumentDto: CreateDocumentDto) => Promise<DocumentResponseDto | null>
  getDocumentById: (id: string) => Promise<DocumentResponseDto | null>
  updateDocument: (id: string, updateDocumentDto: UpdateDocumentDto) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  getDocumentsByStatus: (companyId: string, status: DocumentStatus) => Promise<Document[]>
  getDocumentsBySupplier: (companyId: string, supplierId: string, query?: DocumentQueryDto) => Promise<void>
  getDocumentsByDateRange: (companyId: string, startDate: string, endDate: string) => Promise<Document[]>
  updateDocumentStatus: (id: string, status: DocumentStatus, updatedById: string) => Promise<DocumentResponseDto | null>
  conciliateDocument: (id: string, conciliateDto: ConciliateDocumentDto) => Promise<DocumentResponseDto | null>
  getDocumentSummary: (companyId: string) => Promise<DocumentSummaryResponseDto | null>
  getDocumentsWithPendingDetractions: (companyId: string) => Promise<Document[]>
  getDocumentsWithXmlData: (companyId: string) => Promise<Document[]>

  // Métodos específicos para partes del documento
  getDocumentXmlData: (id: string) => Promise<DocumentXmlData | null>
  getDocumentDigitalSignature: (id: string) => Promise<DocumentDigitalSignature | null>
  getDocumentDetraction: (id: string) => Promise<DocumentDetraction | null>
  getDocumentAccountLinks: (id: string) => Promise<DocumentAccountLink[]>
  getDocumentCostCenterLinks: (id: string) => Promise<DocumentCostCenterLink[]>
  getDocumentLines: (id: string) => Promise<DocumentLine[]>
  getDocumentPaymentTerms: (id: string) => Promise<DocumentPaymentTerm[]>

  // Operaciones bulk
  bulkUpdateStatus: (bulkUpdateDto: BulkUpdateStatusDto) => Promise<DocumentResponseDto[]>
  bulkDeleteDocuments: (bulkDeleteDto: BulkDeleteDocumentsDto) => Promise<void>

  // Métodos utilitarios
  clearDocuments: () => void
  clearError: () => void
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchDocuments: async (companyId: string, query: DocumentQueryDto = {}) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get<PaginatedResponse<Document>>(
        `/documents/company/${companyId}?${params.toString()}`,
      )

      const { data, pagination } = response.data

      set({
        documents: data,
        pagination,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents",
        loading: false,
      })
    }
  },

  createDocument: async (createDocumentDto: CreateDocumentDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<DocumentResponseDto>("/documents", createDocumentDto)
      const newDocument = response.data

      set((state) => ({
        documents: [newDocument, ...state.documents],
        loading: false,
      }))

      return newDocument
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating document",
        loading: false,
      })
      return null
    }
  },

  getDocumentById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentResponseDto>(`/documents/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document",
        loading: false,
      })
      return null
    }
  },

  updateDocument: async (id: string, updateDocumentDto: UpdateDocumentDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<DocumentResponseDto>(`/documents/${id}`, updateDocumentDto)
      const updatedDocument = response.data

      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === id ? updatedDocument : doc)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating document",
        loading: false,
      })
    }
  },

  deleteDocument: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/documents/${id}`)

      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting document",
        loading: false,
      })
    }
  },

  getDocumentsByStatus: async (companyId: string, status: DocumentStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document[]>(`/documents/company/${companyId}/status/${status}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents by status",
        loading: false,
      })
      return []
    }
  },

  getDocumentsBySupplier: async (companyId: string, supplierId: string, query: DocumentQueryDto = {}) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get<PaginatedResponse<Document>>(
        `/documents/company/${companyId}/supplier/${supplierId}?${params.toString()}`,
      )

      const { data, pagination } = response.data

      set({
        documents: data,
        pagination,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents by supplier",
        loading: false,
      })
    }
  },

  getDocumentsByDateRange: async (companyId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document[]>(
        `/documents/company/${companyId}/date-range?startDate=${startDate}&endDate=${endDate}`,
      )
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents by date range",
        loading: false,
      })
      return []
    }
  },

  updateDocumentStatus: async (id: string, status: DocumentStatus, updatedById: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<DocumentResponseDto>(`/documents/${id}/status?status=${status}`, {
        updatedById,
      })
      const updatedDocument = response.data

      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === id ? updatedDocument : doc)),
        loading: false,
      }))

      return updatedDocument
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating document status",
        loading: false,
      })
      return null
    }
  },

  conciliateDocument: async (id: string, conciliateDto: ConciliateDocumentDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<DocumentResponseDto>(`/documents/${id}/conciliate`, conciliateDto)
      const updatedDocument = response.data

      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === id ? updatedDocument : doc)),
        loading: false,
      }))

      return updatedDocument
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error conciliating document",
        loading: false,
      })
      return null
    }
  },

  getDocumentSummary: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentSummaryResponseDto>(`/documents/company/${companyId}/summary`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document summary",
        loading: false,
      })
      return null
    }
  },

  getDocumentsWithPendingDetractions: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document[]>(`/documents/company/${companyId}/pending-detractions`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents with pending detractions",
        loading: false,
      })
      return []
    }
  },

  getDocumentsWithXmlData: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document[]>(`/documents/company/${companyId}/with-xml`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents with XML data",
        loading: false,
      })
      return []
    }
  },

  getDocumentXmlData: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentXmlData>(`/documents/${id}/xml`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document XML data",
        loading: false,
      })
      return null
    }
  },

  getDocumentDigitalSignature: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentDigitalSignature>(`/documents/${id}/signature`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document digital signature",
        loading: false,
      })
      return null
    }
  },

  getDocumentDetraction: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentDetraction>(`/documents/${id}/detraction`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document detraction",
        loading: false,
      })
      return null
    }
  },

  getDocumentAccountLinks: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentAccountLink[]>(`/documents/${id}/account-links`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document account links",
        loading: false,
      })
      return []
    }
  },

  getDocumentCostCenterLinks: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentCostCenterLink[]>(`/documents/${id}/cost-center-links`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document cost center links",
        loading: false,
      })
      return []
    }
  },

  getDocumentLines: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentLine[]>(`/documents/${id}/lines`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document lines",
        loading: false,
      })
      return []
    }
  },

  getDocumentPaymentTerms: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<DocumentPaymentTerm[]>(`/documents/${id}/payment-terms`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document payment terms",
        loading: false,
      })
      return []
    }
  },

  bulkUpdateStatus: async (bulkUpdateDto: BulkUpdateStatusDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<DocumentResponseDto[]>("/documents/bulk/status", bulkUpdateDto)
      const updatedDocuments = response.data

      set((state) => ({
        documents: state.documents.map((doc) => {
          const updated = updatedDocuments.find((updated) => updated.id === doc.id)
          return updated || doc
        }),
        loading: false,
      }))

      return updatedDocuments
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error bulk updating document status",
        loading: false,
      })
      return []
    }
  },

  bulkDeleteDocuments: async (bulkDeleteDto: BulkDeleteDocumentsDto) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete("/documents/bulk", { data: bulkDeleteDto })

      set((state) => ({
        documents: state.documents.filter((doc) => !bulkDeleteDto.documentIds.includes(doc.id)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error bulk deleting documents",
        loading: false,
      })
    }
  },

  clearDocuments: () => {
    set({ documents: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))
