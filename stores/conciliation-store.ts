import { create } from "zustand";
import apiClient from "@/lib/axiosConfig";
import type {
  Conciliation,
  ConciliationPaginatedResponse,
  CreateConciliationDto,
  UpdateConciliationDto,
  ConciliationQueryDto,
  ConciliationItem,
  CreateConciliationItemDto,
  UpdateConciliationItemDto,
  ConciliationExpense,
  CreateConciliationExpenseDto,
  UpdateConciliationExpenseDto,
  ValidateConciliationDto,
  ConciliationValidationResult,
  ConciliationStats,
  BulkOperationResult,
  ExportConciliationResult,
  PendingDocument,
  UnmatchedTransaction,
} from "@/types/conciliations";

interface ConciliationsState {
  conciliations: Conciliation[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Métodos principales
  fetchConciliations: (companyId: string, query?: ConciliationQueryDto) => Promise<void>;
  createConciliation: (createDto: CreateConciliationDto) => Promise<Conciliation | null>;
  getConciliationById: (id: string) => Promise<Conciliation | null>;
  updateConciliation: (id: string, updateDto: UpdateConciliationDto) => Promise<Conciliation | null>;
  deleteConciliation: (id: string) => Promise<void>;

  // Métodos de estado/completado
  completeConciliation: (id: string) => Promise<Conciliation | null>;
  performAutomaticConciliation: (id: string) => Promise<any>;
  validateConciliation: (validateDto: ValidateConciliationDto) => Promise<ConciliationValidationResult | null>;

  // Métodos de items
  createConciliationItem: (createDto: CreateConciliationItemDto) => Promise<ConciliationItem | null>;
  getConciliationItemById: (id: string) => Promise<ConciliationItem | null>;
  updateConciliationItem: (id: string, updateDto: UpdateConciliationItemDto) => Promise<ConciliationItem | null>;
  deleteConciliationItem: (id: string) => Promise<void>;
  getConciliationItems: (conciliationId: string) => Promise<ConciliationItem[]>;

  // Métodos de expenses
  createConciliationExpense: (createDto: CreateConciliationExpenseDto) => Promise<ConciliationExpense | null>;
  getConciliationExpenseById: (id: string) => Promise<ConciliationExpense | null>;
  updateConciliationExpense: (id: string, updateDto: UpdateConciliationExpenseDto) => Promise<ConciliationExpense | null>;
  deleteConciliationExpense: (id: string) => Promise<void>;
  getConciliationExpenses: (conciliationId: string) => Promise<ConciliationExpense[]>;

  // Métodos avanzados
  fetchConciliationsAdvanced: (companyId: string, filters: any) => Promise<void>;
  getConciliationStatistics: (companyId: string, startDate?: string, endDate?: string) => Promise<ConciliationStats | null>;
  bulkCompleteConciliations: (conciliationIds: string[]) => Promise<BulkOperationResult[]>;
  bulkAutoConciliate: (conciliationIds: string[]) => Promise<BulkOperationResult[]>;
  exportConciliations: (companyId: string, format: "csv" | "excel", filters: any) => Promise<ExportConciliationResult | null>;
  getPendingDocuments: (companyId: string, startDate?: string, endDate?: string, bankAccountId?: string) => Promise<PendingDocument[]>;
  getUnmatchedTransactions: (companyId: string, startDate?: string, endDate?: string, bankAccountId?: string) => Promise<UnmatchedTransaction[]>;

  // Métodos utilitarios
  clearConciliations: () => void;
  clearError: () => void;
}

export const useConciliationsStore = create<ConciliationsState>((set, get) => ({
  conciliations: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  // Métodos principales
  fetchConciliations: async (companyId, query = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      
      // Parámetros de paginación
      params.append('page', query.page?.toString() || '1');
      params.append('limit', query.limit?.toString() || '10');
      
      // Filtros
      if (query.status) params.append('status', query.status);
      if (query.type) params.append('type', query.type);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      if (query.periodFrom) params.append('periodFrom', query.periodFrom);
      if (query.periodTo) params.append('periodTo', query.periodTo);
      if (query.search) params.append('search', query.search);
      if (query.bankAccountId) params.append('bankAccountId', query.bankAccountId);
      if (query.minDifference) params.append('minDifference', query.minDifference);
      if (query.maxDifference) params.append('maxDifference', query.maxDifference);
      if (query.minBankBalance) params.append('minBankBalance', query.minBankBalance);
      if (query.maxBankBalance) params.append('maxBankBalance', query.maxBankBalance);
      if (query.createdById) params.append('createdById', query.createdById);
      if (query.approvedById) params.append('approvedById', query.approvedById);
      if (query.hasTransaction !== undefined) params.append('hasTransaction', query.hasTransaction.toString());

      const response = await apiClient.get<ConciliationPaginatedResponse>(
        `/conciliations/company/${companyId}?${params.toString()}`
      );

      const { data, total, page, limit, totalPages } = response.data;

      set({
        conciliations: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliations",
        loading: false,
      });
    }
  },

  createConciliation: async (createDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Conciliation>("/conciliations", createDto);
      const newConciliation = response.data;

      set((state) => ({
        conciliations: [newConciliation, ...state.conciliations],
        loading: false,
      }));

      return newConciliation;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating conciliation",
        loading: false,
      });
      return null;
    }
  },

  getConciliationById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Conciliation>(`/conciliations/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation",
        loading: false,
      });
      return null;
    }
  },

  updateConciliation: async (id, updateDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<Conciliation>(`/conciliations/${id}`, updateDto);
      const updatedConciliation = response.data;

      set((state) => ({
        conciliations: state.conciliations.map((c) =>
          c.id === id ? updatedConciliation : c
        ),
        loading: false,
      }));

      return updatedConciliation;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation",
        loading: false,
      });
      return null;
    }
  },

  deleteConciliation: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/conciliations/${id}`);

      set((state) => ({
        conciliations: state.conciliations.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation",
        loading: false,
      });
    }
  },

  // Métodos de estado/completado
  completeConciliation: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Conciliation>(`/conciliations/${id}/complete`);
      const completedConciliation = response.data;

      set((state) => ({
        conciliations: state.conciliations.map((c) =>
          c.id === id ? completedConciliation : c
        ),
        loading: false,
      }));

      return completedConciliation;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error completing conciliation",
        loading: false,
      });
      return null;
    }
  },

  performAutomaticConciliation: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/conciliations/${id}/auto-conciliate`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error performing automatic conciliation",
        loading: false,
      });
      return null;
    }
  },

  validateConciliation: async (validateDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ConciliationValidationResult>(
        "/conciliations/validate",
        validateDto
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error validating conciliation",
        loading: false,
      });
      return null;
    }
  },

  // Métodos de items
  createConciliationItem: async (createDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ConciliationItem>("/conciliations/items", createDto);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating conciliation item",
        loading: false,
      });
      return null;
    }
  },

  getConciliationItemById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ConciliationItem>(`/conciliations/items/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation item",
        loading: false,
      });
      return null;
    }
  },

  updateConciliationItem: async (id, updateDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<ConciliationItem>(
        `/conciliations/items/${id}`,
        updateDto
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation item",
        loading: false,
      });
      return null;
    }
  },

  deleteConciliationItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/conciliations/items/${id}`);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation item",
        loading: false,
      });
    }
  },

  getConciliationItems: async (conciliationId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ConciliationItem[]>(
        `/conciliations/${conciliationId}/items`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation items",
        loading: false,
      });
      return [];
    }
  },

  // Métodos de expenses
  createConciliationExpense: async (createDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ConciliationExpense>(
        "/conciliations/expenses",
        createDto
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating conciliation expense",
        loading: false,
      });
      return null;
    }
  },

  getConciliationExpenseById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ConciliationExpense>(`/conciliations/expenses/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation expense",
        loading: false,
      });
      return null;
    }
  },

  updateConciliationExpense: async (id, updateDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<ConciliationExpense>(
        `/conciliations/expenses/${id}`,
        updateDto
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation expense",
        loading: false,
      });
      return null;
    }
  },

  deleteConciliationExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/conciliations/expenses/${id}`);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation expense",
        loading: false,
      });
    }
  },

  getConciliationExpenses: async (conciliationId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ConciliationExpense[]>(
        `/conciliations/${conciliationId}/expenses`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation expenses",
        loading: false,
      });
      return [];
    }
  },

  // Métodos avanzados
  fetchConciliationsAdvanced: async (companyId, filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      
      // Parámetros básicos
      params.append('page', filters.page?.toString() || '1');
      params.append('limit', filters.limit?.toString() || '10');
      
      // Filtros
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.bankAccountId) params.append('bankAccountId', filters.bankAccountId);
      if (filters.createdById) params.append('createdById', filters.createdById);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get<ConciliationPaginatedResponse>(
        `/conciliations/company/${companyId}/advanced?${params.toString()}`
      );

      const { data, total, page, limit, totalPages } = response.data;

      set({
        conciliations: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching advanced conciliations",
        loading: false,
      });
    }
  },

  getConciliationStatistics: async (companyId, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<ConciliationStats>(
        `/conciliations/company/${companyId}/statistics?${params.toString()}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation statistics",
        loading: false,
      });
      return null;
    }
  },

  bulkCompleteConciliations: async (conciliationIds) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<BulkOperationResult[]>(
        "/conciliations/bulk/complete",
        { conciliationIds }
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error completing conciliations in bulk",
        loading: false,
      });
      return [];
    }
  },

  bulkAutoConciliate: async (conciliationIds) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<BulkOperationResult[]>(
        "/conciliations/bulk/auto-conciliate",
        { conciliationIds }
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error auto-conciliating in bulk",
        loading: false,
      });
      return [];
    }
  },

  exportConciliations: async (companyId, format, filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      // Agregar filtros
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.bankAccountId) params.append('bankAccountId', filters.bankAccountId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get<ExportConciliationResult>(
        `/conciliations/company/${companyId}/export?${params.toString()}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error exporting conciliations",
        loading: false,
      });
      return null;
    }
  },

  getPendingDocuments: async (companyId, startDate, endDate, bankAccountId) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (bankAccountId) params.append('bankAccountId', bankAccountId);

      const response = await apiClient.get<PendingDocument[]>(
        `/conciliations/company/${companyId}/pending-documents?${params.toString()}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching pending documents",
        loading: false,
      });
      return [];
    }
  },

  getUnmatchedTransactions: async (companyId, startDate, endDate, bankAccountId) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (bankAccountId) params.append('bankAccountId', bankAccountId);

      const response = await apiClient.get<UnmatchedTransaction[]>(
        `/conciliations/company/${companyId}/unmatched-transactions?${params.toString()}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching unmatched transactions",
        loading: false,
      });
      return [];
    }
  },

  // Métodos utilitarios
  clearConciliations: () => {
    set({ conciliations: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
  },

  clearError: () => {
    set({ error: null });
  },
}));