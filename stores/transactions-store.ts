import { create } from "zustand";
import type {
  Transaction,
  TransactionStatus,
  TransactionPaginatedResponse,
  CreateTransactionDto,
  UpdateTransactionDto,
  ImportTransactionsResult,
  TransactionQueryDto,
} from "@/types/transactions";
import apiClient from "@/lib/axiosConfig";

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  // Métodos principales
  fetchTransactions: (companyId: string, query?: TransactionQueryDto) => Promise<void>;
  createTransaction: (createTransactionDto: CreateTransactionDto) => Promise<Transaction | null>;
  importTransactions: (
    companyId: string,
    bankAccountId: string,
    file: File
  ) => Promise<ImportTransactionsResult | null>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  updateTransaction: (id: string, updateTransactionDto: UpdateTransactionDto) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByBankAccount: (bankAccountId: string) => Promise<Transaction[]>;
  getTransactionsByStatus: (companyId: string, status: TransactionStatus) => Promise<Transaction[]>;
  getTransactionsByDateRange: (companyId: string, startDate: string, endDate: string) => Promise<Transaction[]>;

  // Métodos utilitarios
  clearTransactions: () => void;
  clearError: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,

  fetchTransactions: async (companyId: string, query: TransactionQueryDto = {}) => {
    set({ loading: true, error: null });
    try {
      // Construir query params
      const params = new URLSearchParams();
      
      // Parámetros de paginación
      params.append('page', query.page?.toString() || '1');
      params.append('limit', query.limit?.toString() || '10');
      
      // Filtros
      if (query.status) params.append('status', query.status);
      if (query.type) params.append('type', query.type);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      if (query.search) params.append('search', query.search);
      if (query.bankAccountId) params.append('bankAccountId', query.bankAccountId);
      if (query.minAmount) params.append('minAmount', query.minAmount);
      if (query.maxAmount) params.append('maxAmount', query.maxAmount);
      if (query.reference) params.append('reference', query.reference);
      if (query.operationNumber) params.append('operationNumber', query.operationNumber);
      if (query.channel) params.append('channel', query.channel);

      const response = await apiClient.get<TransactionPaginatedResponse>(
        `/transactions/company/${companyId}?${params.toString()}`
      );

      const { data, total, page, limit, totalPages } = response.data;

      set({
        transactions: data,
        total,
        page,
        limit,
        totalPages,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions",
        loading: false,
      });
    }
  },

  createTransaction: async (createTransactionDto: CreateTransactionDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Transaction>("/transactions", createTransactionDto);
      const newTransaction = response.data;

      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        loading: false,
      }));

      return newTransaction;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating transaction",
        loading: false,
      });
      return null;
    }
  },

  importTransactions: async (companyId: string, bankAccountId: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);
      formData.append("bankAccountId", bankAccountId);

      const response = await apiClient.post<ImportTransactionsResult>("/transactions/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error importing transactions",
        loading: false,
      });
      return null;
    }
  },

  getTransactionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Transaction>(`/transactions/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transaction",
        loading: false,
      });
      return null;
    }
  },

  updateTransaction: async (id: string, updateTransactionDto: UpdateTransactionDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<Transaction>(`/transactions/${id}`, updateTransactionDto);
      const updatedTransaction = response.data;

      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? updatedTransaction : transaction
        ),
        loading: false,
      }));

      return updatedTransaction;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating transaction",
        loading: false,
      });
      return null;
    }
  },

  deleteTransaction: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/transactions/${id}`);

      set((state) => ({
        transactions: state.transactions.filter((transaction) => transaction.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting transaction",
        loading: false,
      });
    }
  },

  getTransactionsByBankAccount: async (bankAccountId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Transaction[]>(`/transactions/bank-account/${bankAccountId}`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions by bank account",
        loading: false,
      });
      return [];
    }
  },

  getTransactionsByStatus: async (companyId: string, status: TransactionStatus) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Transaction[]>(
        `/transactions/company/${companyId}/status/${status}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions by status",
        loading: false,
      });
      return [];
    }
  },

  getTransactionsByDateRange: async (companyId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Transaction[]>(
        `/transactions/company/${companyId}/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions by date range",
        loading: false,
      });
      return [];
    }
  },

  clearTransactions: () => {
    set({ 
      transactions: [], 
      total: 0, 
      page: 1, 
      limit: 10, 
      totalPages: 0 
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));