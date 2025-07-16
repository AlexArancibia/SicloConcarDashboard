export interface ConcarDataItem {
  // Bank Account fields
  accountNumber: string
  accountType: string
  currency: string
  alias?: string
  description?: string

  // Transaction fields
  transactionDate: Date
  transaction_description: string
  transactionType: string
  amount: number
  balance: number
  branch?: string
  operationNumber?: string
  operationTime?: string
  operatorUser?: string
  utc?: string
  transaction_reference?: string

  // Supplier fields
  tradeName?: string
  supplier_documentType?: string
  supplier_documentNumber?: string

  // Conciliation fields
  conciliation_id: string
  conciliation_type: string
  bankBalance: number
  bookBalance: number
  toleranceAmount: number
  conciliation_status: string
  additionalExpensesTotal: number
  totalAmount?: number
  paymentAmount?: number
  conciliation_created_at: Date

  // Conciliation Item fields
  conciliation_item_id?: string
  itemType?: string
  documentId?: string
  documentAmount?: number
  item_conciliated_amount?: number
  item_difference?: number
  distributionPercentage?: number
  item_status?: string
  item_notes?: string
  systemNotes?: string
  conciliatedBy?: string

  // Conciliation Expense fields
  expense_id?: string
  expense_description?: string
  expense_amount?: number
  expenseType?: string
  accountId?: string
  expense_notes?: string
  isTaxDeductible?: boolean
  supportingDocument?: string
  expenseDate?: Date

  // Document fields
  document_id?: string
  document_companyId?: string
  documentType?: string
  series?: string
  number?: string
  fullNumber?: string
  supplierId?: string
  issueDate?: Date
  issueTime?: string
  dueDate?: Date
  receptionDate?: Date
  document_currency?: string
  exchangeRate?: number
  subtotal?: number
  igv?: number
  otherTaxes?: number
  document_total?: number
  hasRetention?: boolean
  retentionAmount?: number
  retentionPercentage?: number
  netPayableAmount?: number
  document_conciliated_amount?: number
  document_pending_amount?: number
  paymentMethod?: string
  document_description?: string
  observations?: string
  tags?: string
  document_status?: string
  orderReference?: string
  contractNumber?: string
  additionalNotes?: string
}

export interface ConcarDataResponse {
  data: ConcarDataItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ConcarSummaryResponse {
  total_conciliations: number
  total_items: number
  total_expenses: number
  total_documents: number
  total_conciliation_amount: number
  total_bank_balance: number
  total_book_balance: number
  total_additional_expenses: number
  completed_conciliations: number
  pending_conciliations: number
  in_progress_conciliations: number
}

export interface ConcarFilters {
  startDate: string
  endDate: string
  bankAccountId?: string
  conciliationType?: "DOCUMENTS" | "DETRACTIONS"
  conciliationStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  transactionType?: string
  documentType?: "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE" | "RECEIPT" | "PURCHASE_ORDER" | "CONTRACT"
  supplierId?: string
  page?: number
  limit?: number
}
