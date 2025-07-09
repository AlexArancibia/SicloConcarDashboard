"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  AlertCircle,
  Download,
  Eye,
  ArrowRight,
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Info,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FiltersBar } from "@/components/ui/filters-bar"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useConciliationsStore } from "@/stores/conciliation-store"
import { useDocumentsStore } from "@/stores/documents-store"
import { useTransactionsStore } from "@/stores/transactions-store"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { useAuthStore } from "@/stores/authStore"
import { ConciliationDialog } from "@/components/conciliation-dialog"
import type { Document, DocumentStatus, DocumentType  } from "@/types/documents"
import type { ConciliationType } from "@/types/conciliations"
import { useToast } from "@/hooks/use-toast"
import { DetractionConciliationDialog } from "@/components/detraction-conciliation-dialog"
import { Transaction, TransactionType } from "@/types/transactions"

const DEBUG_MODE = true

const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[CONCILIATIONS DEBUG] ${message}`, data || "")
  }
}

export default function ConciliationsPage() {
  const { user } = useAuthStore()
  const {
    conciliations,
    loading: conciliationsLoading,
    error: conciliationsError,
    fetchConciliations,
    deleteConciliation,
    clearError: clearConciliationsError,
    validateConciliation,
    updateConciliation,
    getConciliationItems,
    createConciliationItem,
    updateConciliationItem,
  } = useConciliationsStore()

  const {
    documents,
    loading: documentsLoading,
    fetchDocuments: fetchAllDocuments,
    updateDocument,
  } = useDocumentsStore()

  const { transactions, loading: transactionsLoading, fetchTransactions: fetchAllTransactions } = useTransactionsStore()

  const { bankAccounts, fetchBankAccounts } = useBankAccountsStore()

  // State
  const [showConciliationDialog, setShowConciliationDialog] = useState(false)
  const [showDetractionDialog, setShowDetractionDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  const [transactionPage, setTransactionPage] = useState(1)
  const [documentPage, setDocumentPage] = useState(1)
  const [transactionItemsPerPage] = useState(10)
  const [documentItemsPerPage] = useState(10)

  // Selection state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [documentConciliationAmounts, setDocumentConciliationAmounts] = useState<Record<string, number>>({})
  const [selectedConciliationIds, setSelectedConciliationIds] = useState<string[]>([])

  // Filters for transactions
  const [transactionFilters, setTransactionFilters] = useState({
    search: "",
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    bankAccount: "",
    type: "",
    status: "",
    minAmount: "",
    maxAmount: "",
  })

  // Filters for documents
  const [documentFilters, setDocumentFilters] = useState({
    search: "",
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    supplier: "",
    status: "",
    type: "",
    currency: "",
    minAmount: "",
    maxAmount: "",
  })

  const loading = conciliationsLoading || documentsLoading || transactionsLoading
  const error = conciliationsError

  // Load initial data
  useEffect(() => {
    if (user?.companyId) {
      debugLog("Loading initial data for company", user.companyId)
      Promise.all([
        fetchConciliations(user.companyId, { page: 1, limit: 100 }),
        fetchAllDocuments(user.companyId, { page: 1, limit: 1000 }),
        fetchAllTransactions(user.companyId, { page: 1, limit: 1000 }),
        fetchBankAccounts(user.companyId, { page: 1, limit: 100 }),
      ]).catch((error) => {
        debugLog("Error loading initial data", error)
      })
    }
  }, [user?.companyId, fetchConciliations, fetchAllDocuments, fetchAllTransactions, fetchBankAccounts])

  // Check if transaction is already conciliated
  const isTransactionConciliated = useCallback(
    (transactionId: string) => {
      return conciliations.some(
        (conciliation) => conciliation.transactionId === transactionId && conciliation.status !== "CANCELLED",
      )
    },
    [conciliations],
  )

  // Get existing conciliation for transaction
  const getExistingConciliation = useCallback(
    (transactionId: string) => {
      return conciliations.find(
        (conciliation) => conciliation.transactionId === transactionId && conciliation.status !== "CANCELLED",
      )
    },
    [conciliations],
  )

  // Get available transactions for document conciliation (all except detractions)
  const { availableDocTransactions, totalDocTransactionPages } = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      // Basic availability criteria
      const hasValidStatus = transaction.status === "PENDING"
      const hasValidAmount =
        transaction.pendingAmount === null || Number.parseFloat(transaction.pendingAmount || transaction.amount) > 0
      const isNotDetraction = transaction.transactionType !== "TAX_DETRACTION"

      // Business rule: exclude already conciliated transactions
      const isNotConciliated = !isTransactionConciliated(transaction.id)

      return hasValidStatus && hasValidAmount && isNotConciliated && isNotDetraction
    })

    // Apply filters
    if (transactionFilters.search) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description?.toLowerCase().includes(transactionFilters.search.toLowerCase()) ||
          transaction.operationNumber?.toLowerCase().includes(transactionFilters.search.toLowerCase()) ||
          transaction.supplier?.businessName?.toLowerCase().includes(transactionFilters.search.toLowerCase()),
      )
    }

    if (transactionFilters.dateRange.from) {
      filtered = filtered.filter(
        (transaction) => new Date(transaction.transactionDate) >= transactionFilters.dateRange.from!,
      )
    }

    if (transactionFilters.dateRange.to) {
      filtered = filtered.filter(
        (transaction) => new Date(transaction.transactionDate) <= transactionFilters.dateRange.to!,
      )
    }

    if (transactionFilters.bankAccount && transactionFilters.bankAccount !== "all") {
      filtered = filtered.filter((transaction) => transaction.bankAccountId === transactionFilters.bankAccount)
    }

    if (transactionFilters.type && transactionFilters.type !== "all") {
      filtered = filtered.filter((transaction) => transaction.transactionType === transactionFilters.type)
    }

    if (transactionFilters.status && transactionFilters.status !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === transactionFilters.status)
    }

    if (transactionFilters.minAmount) {
      filtered = filtered.filter(
        (transaction) =>
          Math.abs(Number.parseFloat(transaction.amount)) >= Number.parseFloat(transactionFilters.minAmount),
      )
    }

    if (transactionFilters.maxAmount) {
      filtered = filtered.filter(
        (transaction) =>
          Math.abs(Number.parseFloat(transaction.amount)) <= Number.parseFloat(transactionFilters.maxAmount),
      )
    }

    const totalPages = Math.ceil(filtered.length / transactionItemsPerPage)
    const startIndex = (transactionPage - 1) * transactionItemsPerPage
    const endIndex = startIndex + transactionItemsPerPage
    const paginatedTransactions = filtered.slice(startIndex, endIndex)

    debugLog("Available transactions for document conciliation", {
      total: filtered.length,
      page: transactionPage,
      excludedConciliated: transactions.filter((t) => isTransactionConciliated(t.id)).length,
    })

    return { availableDocTransactions: paginatedTransactions, totalDocTransactionPages: totalPages }
  }, [transactions, transactionFilters, transactionPage, transactionItemsPerPage, isTransactionConciliated])

  // Get available transactions for detraction conciliation (only detractions)
  const { availableDetractionTransactions, totalDetractionTransactionPages } = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      // Basic availability criteria
      const hasValidStatus = transaction.status === "PENDING"
      const hasValidAmount =
        transaction.pendingAmount === null || Number.parseFloat(transaction.pendingAmount || transaction.amount) > 0
      const isDetraction = transaction.transactionType === "TAX_DETRACTION"

      // Business rule: exclude already conciliated transactions
      const isNotConciliated = !isTransactionConciliated(transaction.id)

      return hasValidStatus && hasValidAmount && isNotConciliated && isDetraction
    })

    // Apply filters
    if (transactionFilters.search) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description?.toLowerCase().includes(transactionFilters.search.toLowerCase()) ||
          transaction.operationNumber?.toLowerCase().includes(transactionFilters.search.toLowerCase()) ||
          transaction.supplier?.businessName?.toLowerCase().includes(transactionFilters.search.toLowerCase()),
      )
    }

    if (transactionFilters.dateRange.from) {
      filtered = filtered.filter(
        (transaction) => new Date(transaction.transactionDate) >= transactionFilters.dateRange.from!,
      )
    }

    if (transactionFilters.dateRange.to) {
      filtered = filtered.filter(
        (transaction) => new Date(transaction.transactionDate) <= transactionFilters.dateRange.to!,
      )
    }

    if (transactionFilters.bankAccount && transactionFilters.bankAccount !== "all") {
      filtered = filtered.filter((transaction) => transaction.bankAccountId === transactionFilters.bankAccount)
    }

    if (transactionFilters.type && transactionFilters.type !== "all") {
      filtered = filtered.filter((transaction) => transaction.transactionType === transactionFilters.type)
    }

    if (transactionFilters.status && transactionFilters.status !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === transactionFilters.status)
    }

    if (transactionFilters.minAmount) {
      filtered = filtered.filter(
        (transaction) =>
          Math.abs(Number.parseFloat(transaction.amount)) >= Number.parseFloat(transactionFilters.minAmount),
      )
    }

    if (transactionFilters.maxAmount) {
      filtered = filtered.filter(
        (transaction) =>
          Math.abs(Number.parseFloat(transaction.amount)) <= Number.parseFloat(transactionFilters.maxAmount),
      )
    }

    const totalPages = Math.ceil(filtered.length / transactionItemsPerPage)
    const startIndex = (transactionPage - 1) * transactionItemsPerPage
    const endIndex = startIndex + transactionItemsPerPage
    const paginatedTransactions = filtered.slice(startIndex, endIndex)

    debugLog("Available transactions for detraction conciliation", {
      total: filtered.length,
      page: transactionPage,
      excludedConciliated: transactions.filter((t) => isTransactionConciliated(t.id)).length,
    })

    return { availableDetractionTransactions: paginatedTransactions, totalDetractionTransactionPages: totalPages }
  }, [transactions, transactionFilters, transactionPage, transactionItemsPerPage, isTransactionConciliated])

  // Get available documents for conciliation with filters
const { availableDocuments, totalDocumentPages, matchingAccountCount } = useMemo(() => {
  let filtered = documents.filter((doc) => {
    // Basic availability criteria
    const hasValidStatus = doc.status === "APPROVED"
    const hasValidAmount = Number.parseFloat(doc.pendingAmount || "0") > 0
    return hasValidStatus && hasValidAmount
  })

  // Special handling for TRANSFER_INBANK transactions
  let matchingAccountCount = 0
  if (selectedTransaction?.transactionType === "TRANSFER_INBANK") {
    const numbersOnly = selectedTransaction.description?.replace(/\D/g, '') || ''
    
    if (numbersOnly) {
      const docsWithMatchingAccount = []
      const otherDocs = []
      
      for (const doc of filtered) {
        const hasMatchingAccount = doc.supplier?.supplierBankAccounts?.some(acc => {
          const accNumberClean = acc.accountNumber?.replace(/\D/g, '')
          return accNumberClean && accNumberClean.includes(numbersOnly)
        })
        
        if (hasMatchingAccount) {
          docsWithMatchingAccount.push(doc)
          matchingAccountCount++
        } else {
          otherDocs.push(doc)
        }
      }
      
      filtered = [...docsWithMatchingAccount, ...otherDocs]
    }
  }

  // Apply filters
  if (documentFilters.search) {
    filtered = filtered.filter(
      (doc) =>
        doc.fullNumber?.toLowerCase().includes(documentFilters.search.toLowerCase()) ||
        doc.supplier?.businessName?.toLowerCase().includes(documentFilters.search.toLowerCase()) ||
        doc.supplier?.documentNumber?.toLowerCase().includes(documentFilters.search.toLowerCase()),
    )
  }

  if (documentFilters.dateRange.from) {
    filtered = filtered.filter((doc) => new Date(doc.issueDate) >= documentFilters.dateRange.from!)
  }

  if (documentFilters.dateRange.to) {
    filtered = filtered.filter((doc) => new Date(doc.issueDate) <= documentFilters.dateRange.to!)
  }

  if (documentFilters.supplier) {
    filtered = filtered.filter((doc) =>
      doc.supplier?.businessName?.toLowerCase().includes(documentFilters.supplier.toLowerCase()),
    )
  }

  if (documentFilters.status && documentFilters.status !== "all") {
    filtered = filtered.filter((doc) => doc.status === documentFilters.status)
  }

  if (documentFilters.type && documentFilters.type !== "all") {
    filtered = filtered.filter((doc) => doc.documentType === documentFilters.type)
  }

  if (documentFilters.currency && documentFilters.currency !== "all") {
    filtered = filtered.filter((doc) => doc.currency === documentFilters.currency)
  }

  if (documentFilters.minAmount) {
    filtered = filtered.filter((doc) => {
      const amount = Number.parseFloat(doc.pendingAmount || "0")
      return amount >= Number.parseFloat(documentFilters.minAmount)
    })
  }

  if (documentFilters.maxAmount) {
    filtered = filtered.filter((doc) => {
      const amount = Number.parseFloat(doc.pendingAmount || "0")
      return amount <= Number.parseFloat(documentFilters.maxAmount)
    })
  }

  const totalPages = Math.ceil(filtered.length / documentItemsPerPage)
  const startIndex = (documentPage - 1) * documentItemsPerPage
  const endIndex = startIndex + documentItemsPerPage
  const paginatedDocuments = filtered.slice(startIndex, endIndex)

  debugLog("Available documents for conciliation", { 
    total: filtered.length,
    page: documentPage,
    matchingAccountCount,
    withoutAccounting: documents.filter(
      (d) => d.status === "APPROVED" && (!d.accountLinks || d.accountLinks.length === 0),
    ).length,
  })

  return { 
    availableDocuments: paginatedDocuments, 
    totalDocumentPages: totalPages,
    matchingAccountCount
  }
}, [documents, documentFilters, documentPage, documentItemsPerPage, selectedTransaction])
  // Get available detractions with filters
  const { availableDetractions, totalDetractionPages } = useMemo(() => {
    let filtered = documents.filter((doc) => {
      const hasValidStatus = doc.status === "APPROVED"
      const hasDetraction = doc.detraction?.hasDetraction
      const detractionAmount = Number.parseFloat(doc.detraction?.amount || "0")
      const isConciliated = doc.detraction?.isConciliated || false
      const hasValidAmount = hasDetraction && !isConciliated && detractionAmount > 0

      return hasValidStatus && hasValidAmount
    })

    // Apply same filters as documents
    if (documentFilters.search) {
      filtered = filtered.filter(
        (doc) =>
          doc.fullNumber?.toLowerCase().includes(documentFilters.search.toLowerCase()) ||
          doc.supplier?.businessName?.toLowerCase().includes(documentFilters.search.toLowerCase()) ||
          doc.supplier?.documentNumber?.toLowerCase().includes(documentFilters.search.toLowerCase()),
      )
    }

    if (documentFilters.dateRange.from) {
      filtered = filtered.filter((doc) => new Date(doc.issueDate) >= documentFilters.dateRange.from!)
    }

    if (documentFilters.dateRange.to) {
      filtered = filtered.filter((doc) => new Date(doc.issueDate) <= documentFilters.dateRange.to!)
    }

    if (documentFilters.supplier) {
      filtered = filtered.filter((doc) =>
        doc.supplier?.businessName?.toLowerCase().includes(documentFilters.supplier.toLowerCase()),
      )
    }

    if (documentFilters.minAmount) {
      filtered = filtered.filter((doc) => {
        const amount = Number.parseFloat(doc.detraction?.amount || "0")
        return amount >= Number.parseFloat(documentFilters.minAmount)
      })
    }

    if (documentFilters.maxAmount) {
      filtered = filtered.filter((doc) => {
        const amount = Number.parseFloat(doc.detraction?.amount || "0")
        return amount <= Number.parseFloat(documentFilters.maxAmount)
      })
    }

    const totalPages = Math.ceil(filtered.length / documentItemsPerPage)
    const startIndex = (documentPage - 1) * documentItemsPerPage
    const endIndex = startIndex + documentItemsPerPage
    const paginatedDetractions = filtered.slice(startIndex, endIndex)

    debugLog("Available detractions for conciliation", { total: filtered.length, page: documentPage })
    return { availableDetractions: paginatedDetractions, totalDetractionPages: totalPages }
  }, [documents, documentFilters, documentPage, documentItemsPerPage])

  // Paginated conciliations
  const paginatedConciliations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return conciliations.slice(startIndex, endIndex)
  }, [conciliations, currentPage, itemsPerPage])

  const totalPages = Math.ceil(conciliations.length / itemsPerPage)

  const handleTransactionSelect = (transaction: Transaction) => {
    const existingConciliation = getExistingConciliation(transaction.id)

    // if (existingConciliation) {
    //   alert(`Esta transacción ya está conciliada en la conciliación ${existingConciliation.reference || existingConciliation.id}. 
    //          Para modificarla, debe editar la conciliación existente.`)
    //   return
    // }

    setSelectedTransaction(transaction)
    setSelectedDocuments([])
    setDocumentConciliationAmounts({})
    debugLog("Transaction selected", { transactionId: transaction.id, amount: transaction.amount })

    if (transaction.transactionType === "TRANSFER_INBANK") {
  // Extraemos todos los números de la descripción y los unimos
  const numbersOnly = transaction.description?.replace(/\D/g, '') || ''
  
  if (numbersOnly) {
    debugLog("Transferencia interna detectada", { accountNumber: numbersOnly })
    
    // También podemos mostrar un toast informativo
    toast({
      title: "Transferencia interna detectada",
      description: `Buscando documentos con cuenta bancaria: ${numbersOnly}`,
    })
  }
}

  }

  

  const handleDocumentSelect = async (document: Document) => {
    const isSelected = selectedDocuments.some((doc) => doc.id === document.id)

    if (isSelected) {
      setSelectedDocuments((prev) => prev.filter((doc) => doc.id !== document.id))
      setDocumentConciliationAmounts((prev) => {
        const newAmounts = { ...prev }
        delete newAmounts[document.id]
        return newAmounts
      })
    } else {
      if (selectedDocuments.length > 0) {
        const firstSupplier = selectedDocuments[0].supplierId
        if (document.supplierId !== firstSupplier) {
          alert("Los documentos deben ser del mismo proveedor para conciliación de documentos")
          return
        }
      }

      setSelectedDocuments((prev) => [...prev, document])

      const defaultAmount = Number.parseFloat(document.pendingAmount || "0")
      setDocumentConciliationAmounts((prev) => ({
        ...prev,
        [document.id]: defaultAmount,
      }))
    }

    debugLog("Document selection changed", { documentId: document.id, isSelected: !isSelected })
  }

  const handleDetractionSelect = async (document: Document) => {
    const isSelected = selectedDocuments.some((doc) => doc.id === document.id)

    if (isSelected) {
      setSelectedDocuments((prev) => prev.filter((doc) => doc.id !== document.id))
      setDocumentConciliationAmounts((prev) => {
        const newAmounts = { ...prev }
        delete newAmounts[document.id]
        return newAmounts
      })
    } else {
      setSelectedDocuments((prev) => [...prev, document])

      const defaultAmount = Number.parseFloat(document.detraction?.amount || "0")
      setDocumentConciliationAmounts((prev) => ({
        ...prev,
        [document.id]: defaultAmount,
      }))
    }

    debugLog("Detraction selection changed", { documentId: document.id, isSelected: !isSelected })
  }

  const handleCreateDocumentConciliation = async () => {
    if (!selectedTransaction) {
      alert("Debe seleccionar una transacción")
      return
    }

    if (selectedDocuments.length === 0) {
      alert("Debe seleccionar al menos un documento")
      return
    }

    const existingConciliation = getExistingConciliation(selectedTransaction.id)

    if (existingConciliation) {
      try {
        const updateData = {
          totalDocuments: selectedDocuments.length,
          totalAmount: getSelectedTotal(),
          difference: getDifference(),
        }

        await updateConciliation(existingConciliation.id, updateData)

        // Update conciliation items
        for (const doc of selectedDocuments) {
          const itemData = {
            documentId: doc.id,
            documentAmount: Number.parseFloat(doc.pendingAmount || "0"),
            conciliatedAmount: documentConciliationAmounts[doc.id] || 0,
            difference: Number.parseFloat(doc.pendingAmount || "0") - (documentConciliationAmounts[doc.id] || 0),
            status: "CONCILIATED" as const,
          }

          debugLog("Updating conciliation item", itemData)
        }

        // Refresh data
        if (user?.companyId) {
          await fetchConciliations(user.companyId, { page: currentPage, limit: itemsPerPage })
        }

        // Clear selection
        setSelectedTransaction(null)
        setSelectedDocuments([])
        setDocumentConciliationAmounts({})

      } catch (error) {
        console.error("Error updating conciliation:", error)
        alert("Ocurrió un error al actualizar la conciliación existente")
      }
    } else {
      debugLog("Opening document conciliation dialog", {
        transaction: selectedTransaction.id,
        documents: selectedDocuments.map((d) => d.id),
        amounts: documentConciliationAmounts,
      })

      setShowConciliationDialog(true)
    }
  }

  const handleCreateDetractionConciliation = async () => {
    if (!selectedTransaction) {
      alert("Debe seleccionar una transacción")
      return
    }

    if (selectedDocuments.length === 0) {
      alert("Debe seleccionar al menos un documento con detracción")
      return
    }

    const existingConciliation = getExistingConciliation(selectedTransaction.id)

    if (existingConciliation) {
      try {
        const updateData = {
          totalDocuments: selectedDocuments.length,
          totalAmount: getSelectedTotal(),
          difference: getDifference(),
          detractionIds: selectedDocuments.map(doc => doc.id),
        }

        await updateConciliation(existingConciliation.id, updateData)

        // Update conciliation items
        for (const doc of selectedDocuments) {
          const itemData = {
            documentId: doc.id,
            documentAmount: Number.parseFloat(doc.detraction?.amount || "0"),
            conciliatedAmount: documentConciliationAmounts[doc.id] || 0,
            difference: Number.parseFloat(doc.detraction?.amount || "0") - (documentConciliationAmounts[doc.id] || 0),
            status: "CONCILIATED" as const,
          }

          debugLog("Updating detraction conciliation item", itemData)
        }

        // Refresh data
        if (user?.companyId) {
          await fetchConciliations(user.companyId, { page: currentPage, limit: itemsPerPage })
        }

        // Clear selection
        setSelectedTransaction(null)
        setSelectedDocuments([])
        setDocumentConciliationAmounts({})

      } catch (error) {
        console.error("Error updating detraction conciliation:", error)
        alert("Ocurrió un error al actualizar la conciliación de detracción existente")
      }
    } else {
      debugLog("Opening detraction conciliation dialog", {
        transaction: selectedTransaction.id,
        documents: selectedDocuments.map((d) => d.id),
        amounts: documentConciliationAmounts,
      })

      setShowDetractionDialog(true)
    }
  }

  const handleTransactionFilterChange = (key: string, value: any) => {
    setTransactionFilters((prev) => ({ ...prev, [key]: value }))
    setTransactionPage(1)
  }

  const handleDocumentFilterChange = (key: string, value: any) => {
    setDocumentFilters((prev) => ({ ...prev, [key]: value }))
    setDocumentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleTransactionPageChange = (newPage: number) => {
    setTransactionPage(newPage)
  }

  const handleDocumentPageChange = (newPage: number) => {
    setDocumentPage(newPage)
  }

  const formatCurrency = (amount: string | number | null, currencySymbol = "S/") => {
    if (!amount) return `${currencySymbol} 0.00`
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return `${currencySymbol} ${numAmount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const getSelectedTotal = () => {
    return selectedDocuments.reduce((sum, doc) => {
      return sum + (documentConciliationAmounts[doc.id] || 0)
    }, 0)
  }

  const getTransactionAmount = () => {
    return selectedTransaction ? Math.abs(Number.parseFloat(selectedTransaction.amount)) : 0
  }

  const getDifference = () => {
    return Math.abs(getSelectedTotal() - getTransactionAmount())
  }

  const getStatusBadge = (status: DocumentStatus) => {
    const statusConfig = {
      DRAFT: { class: "bg-gray-500/10 text-gray-600 border-gray-500/20", label: "Borrador" },
      PENDING: { class: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Pendiente" },
      APPROVED: { class: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Aprobado" },
      REJECTED: { class: "bg-red-500/10 text-red-600 border-red-500/20", label: "Rechazado" },
      PAID: { class: "bg-green-500/10 text-green-600 border-green-500/20", label: "Pagado" },
      CANCELLED: { class: "bg-slate-500/10 text-slate-600 border-slate-500/20", label: "Cancelado" },
    }

    const config = statusConfig[status] || {
      class: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      label: "Desconocido",
    }

    return (
      <Badge variant="secondary" className={config.class}>
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: DocumentType) => {
    const typeConfig = {
      INVOICE: { class: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Factura" },
      CREDIT_NOTE: { class: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "N. Crédito" },
      DEBIT_NOTE: { class: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "N. Débito" },
      RECEIPT: { class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Recibo" },
      PURCHASE_ORDER: { class: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20", label: "O. Compra" },
      CONTRACT: { class: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", label: "Contrato" },
    }

    const config = typeConfig[type] || {
      class: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      label: "Otro",
    }

    return (
      <Badge variant="outline" className={config.class}>
        {config.label}
      </Badge>
    )
  }

  const getTransactionTypeBadge = (type: TransactionType) => {
    const typeConfig: Record<string, { class: string, label: string }> = {
      // INCOME
      INCOME_SALARY: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Haber" },
      INCOME_BONUS: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Bono" },
      INCOME_INTEREST: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Interés" },
      INCOME_SALES: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Venta" },
      INCOME_SERVICES: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Servicio" },
      INCOME_TRANSFER: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Transferencia" },
      INCOME_REFUND: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Reembolso" },
      
      // EXPENSE
      PAYROLL_SALARY: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Sueldo" },
      PAYROLL_CTS: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "CTS" },
      PAYROLL_BONUS: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Gratificación" },
      PAYROLL_AFP: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "AFP" },
      TAX_PAYMENT: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Impuesto" },
      TAX_DETRACTION: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Detracción" },
      EXPENSE_UTILITIES: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Servicio" },
      EXPENSE_PURCHASE: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Compra" },
      TRANSFER_INBANK: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", label: "Transferencia" },
      TRANSFER_EXTERNAL: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", label: "Transfer. Ext" },
      WITHDRAWAL_CASH: { class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30", label: "Retiro" },
    }

    const config = typeConfig[type] || {
      class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30",
      label: type.replace(/_/g, " "),
    }

    return (
      <Badge className={config.class}>
        {config.label}
      </Badge>
    )
  }

  const transactionFilterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "Descripción, número, proveedor...",
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período de transacción",
    },
    {
      key: "bankAccount",
      type: "select" as const,
      placeholder: "Cuenta bancaria",
      options: [
        { value: "all", label: "Todas las cuentas" },
        ...bankAccounts.map((account) => ({
          value: account.id,
          label: `${account.bank?.name || "Banco"} - ${account.alias || account.accountNumber}`,
        })),
      ],
      className: "min-w-48",
    },
    {
      key: "type",
      type: "select" as const,
      placeholder: "Tipo de transacción",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "PAYROLL_SALARY", label: "Sueldo" },
        { value: "PAYROLL_CTS", label: "CTS" },
        { value: "PAYROLL_BONUS", label: "Gratificación / Bono" },
        { value: "PAYROLL_AFP", label: "Aporte AFP" },
        { value: "TAX_PAYMENT", label: "Pago de impuestos (SUNAT)" },
        { value: "TAX_ITF", label: "ITF" },
        { value: "TAX_DETRACTION", label: "Detracción" },
        { value: "EXPENSE_UTILITIES", label: "Servicios (Luz, Agua, Internet...)" },
        { value: "EXPENSE_INSURANCE", label: "Seguro" },
        { value: "EXPENSE_COMMISSIONS", label: "Comisiones y mantenimiento" },
        { value: "EXPENSE_PURCHASE", label: "Pago a proveedor" },
        { value: "EXPENSE_OTHER", label: "Otro gasto" },
        { value: "TRANSFER_INBANK", label: "Transferencia misma cuenta" },
        { value: "TRANSFER_EXTERNAL", label: "Transferencia interbancaria" },
        { value: "WITHDRAWAL_CASH", label: "Retiro en efectivo" },
        { value: "ADJUSTMENT", label: "Ajuste / Regularización" },
        { value: "REFUND", label: "Devolución" },
      ],
      className: "min-w-40",
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Estado Transacción",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "PENDING", label: "Pendiente" },
        { value: "COMPLETED", label: "Completado" },
        { value: "RECONCILED", label: "Conciliado" },
        { value: "CANCELLED", label: "Cancelado" },
      ],
      className: "min-w-40",
    },
    {
      key: "minAmount",
      type: "search" as const,
      placeholder: "Monto mínimo",
      className: "w-32",
    },
    {
      key: "maxAmount",
      type: "search" as const,
      placeholder: "Monto máximo",
      className: "w-32",
    },
  ]

  const documentFilterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "Número, RUC, proveedor...",
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período de emisión",
    },
    {
      key: "type",
      type: "select" as const,
      placeholder: "Tipo de documento",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "INVOICE", label: "Facturas" },
        { value: "CREDIT_NOTE", label: "N. Crédito" },
        { value: "DEBIT_NOTE", label: "N. Débito" },
        { value: "RECEIPT", label: "Recibos" },
        { value: "PURCHASE_ORDER", label: "O. Compra" },
        { value: "CONTRACT", label: "Contratos" },
      ],
      className: "min-w-40",
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Estado",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "APPROVED", label: "Aprobado" },
        { value: "PENDING", label: "Pendiente" },
        { value: "PAID", label: "Pagado" },
        { value: "CANCELLED", label: "Cancelado" },
        { value: "DRAFT", label: "Borrador" },
        { value: "REJECTED", label: "Rechazado" },
      ],
      className: "min-w-32",
    },
    {
      key: "currency",
      type: "select" as const,
      placeholder: "Moneda",
      options: [
        { value: "all", label: "Todas las monedas" },
        { value: "PEN", label: "Soles (PEN)" },
        { value: "USD", label: "Dólares (USD)" },
      ],
      className: "min-w-32",
    },
    {
      key: "minAmount",
      type: "search" as const,
      placeholder: "Monto mínimo",
      className: "w-32",
    },
    {
      key: "maxAmount",
      type: "search" as const,
      placeholder: "Monto máximo",
      className: "w-32",
    },
  ]

  const handleConciliationAmountChange = (documentId: string, amount: number) => {
    setDocumentConciliationAmounts((prev) => ({
      ...prev,
      [documentId]: amount,
    }))
  }

  const { toast } = useToast()

  const handleDeleteSelectedConciliations = async () => {
    if (selectedConciliationIds.length === 0) {
      toast({ title: "Nada seleccionado", description: "Por favor, seleccione al menos una conciliación para eliminar."});
      return;
    }

    if (confirm(`¿Está seguro de que desea eliminar ${selectedConciliationIds.length} conciliacion(es) seleccionada(s)? Esta acción no se puede deshacer.`)) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const id of selectedConciliationIds) {
        try {
          await deleteConciliation(id);
          successCount++;
        } catch (e) {
          console.error(`Error eliminando conciliación ${id}:`, e);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({ title: "Éxito", description: `${successCount} conciliacion(es) eliminada(s) correctamente.` });
      }
      if (errorCount > 0) {
        toast({ title: "Error Parcial", description: `No se pudieron eliminar ${errorCount} conciliacion(es). Revise la consola para más detalles.`, variant: "destructive" });
      }
      
      setSelectedConciliationIds([]);
      if (user?.companyId) {
        fetchConciliations(user.companyId, { page: currentPage, limit: itemsPerPage });
      }
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error cargando conciliaciones: {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={clearConciliationsError}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conciliaciones Bancarias</h1>
          <p className="text-gray-600 dark:text-gray-400">Selecciona transacciones y documentos para conciliar</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Business Rules Alerts */}
      {/* {selectedTransaction && isTransactionConciliated(selectedTransaction.id) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta transacción ya está conciliada en la conciliación{" "}
            {getExistingConciliation(selectedTransaction.id)?.reference}. Para modificarla, debe editar la
            conciliación existente.
          </AlertDescription>
        </Alert>
      )} */}

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Crear Conciliación Documentos</TabsTrigger>
          <TabsTrigger value="detractions">Crear Conciliación Detracciones</TabsTrigger>
          <TabsTrigger value="existing">Conciliaciones Existentes</TabsTrigger>
        </TabsList>

        {/* Document Conciliation Tab */}
        <TabsContent value="documents" className="space-y-6">
          {/* Transaction Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transacciones Disponibles  
              </CardTitle>
              <CardDescription className="text-xs">
                Selecciona una transacción bancaria (excluye{" "}
                {transactions.filter((t) => isTransactionConciliated(t.id)).length} ya conciliadas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Filters */}
              <Card>
                <FiltersBar
                  filters={transactionFilterConfigs}
                  values={transactionFilters}
                  onChange={handleTransactionFilterChange}
                />
              </Card>

              {loading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableDocTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No se encontraron transacciones disponibles.
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableDocTransactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            data-state={selectedTransaction?.id === transaction.id && "selected"}
                            onClick={() => handleTransactionSelect(transaction)}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <TableCell>
                              <Input
                                type="radio"
                                name="selectedTransaction"
                                checked={selectedTransaction?.id === transaction.id}
                                readOnly
                                className="h-4 w-4 text-primary accent-primary"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.operationNumber} • {transaction.bankAccount?.bank?.name || "Banco"}
                              </div>
                              {transaction.supplier && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {transaction.supplier.businessName} ({transaction.supplier.documentNumber})
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.transactionDate)}
                              {transaction.operationTime && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.operationTime}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`font-semibold ${
                                transaction.amount.startsWith('-') 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Saldo: {formatCurrency(transaction.balance)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getTransactionTypeBadge(transaction.transactionType)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {totalDocTransactionPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4 px-3 border-t">
                      <div className="flex-1 text-sm text-muted-foreground">
                        Página {transactionPage} de {totalDocTransactionPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransactionPageChange(transactionPage - 1)}
                        disabled={transactionPage <= 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransactionPageChange(transactionPage + 1)}
                        disabled={transactionPage >= totalDocTransactionPages}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Selection */}
          {selectedTransaction && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos Disponibles ({availableDocuments.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedDocuments.length} seleccionado{selectedDocuments.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Filters */}
                <Card>
                  <FiltersBar
                    filters={documentFilterConfigs}
                    values={documentFilters}
                    onChange={handleDocumentFilterChange}
                  />
                </Card>

                {loading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Fechas</TableHead>
                          <TableHead className="text-right">Montos</TableHead>
                          <TableHead className="text-right w-32">Conciliar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableDocuments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No se encontraron documentos disponibles.
                            </TableCell>
                          </TableRow>
                        ) : (
                          availableDocuments.map((document) => {
                            const isSelected = selectedDocuments.some((doc) => doc.id === document.id)
                            const pendingAmount = Number.parseFloat(document.pendingAmount || "0")
                            const conciliationAmount = documentConciliationAmounts[document.id] || pendingAmount
                            const hasMatchingAccount = selectedTransaction?.transactionType === "TRANSFER_INBANK" && 
                              document.supplier?.supplierBankAccounts?.some(acc => {
                                const accountMatch = selectedTransaction.description?.match(/\d{3}\s\d{8}\s\d/)
                                return accountMatch && acc.accountNumber === accountMatch[0]
                              })

                            return (
                              <TableRow
                                key={document.id}
                                data-state={isSelected && "selected"}
                                onClick={() => handleDocumentSelect(document)}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <TableCell>
                                  <Checkbox checked={isSelected} aria-label="Seleccionar documento" />
                                </TableCell>
                                <TableCell >
                                  <div className="flex items-start gap-2">
                                    {getTypeBadge(document.documentType)}
                                    <div>
                                      <div className="font-medium">{document.fullNumber}</div>
                                      {hasMatchingAccount && (
                                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                          Cuenta coincidente
                                        </Badge>
                                      )}
 
                                      {document.detraction?.hasDetraction && (
                                        <Badge variant="secondary" className="text-xs mt-1">
                                          Detracción
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                <div className="truncate max-w-xs" title={document.supplier?.businessName}>
                                  {document.supplier?.businessName}
                                  {document.supplier?.documentNumber && (
                                    <span className="text-xs text-muted-foreground block">
                                      {document.supplier.documentNumber}
                                    </span>
                                  )}
                                  {formatBankAccounts(document.supplier?.supplierBankAccounts)}
                                </div>
                                {/* {getStatusBadge(document.status)} */}
                              </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    Emisión: {formatDate(document.issueDate)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Vence: {formatDate(document.dueDate || document.issueDate)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="font-bold">
                                    {formatCurrency(pendingAmount, document.currencyRef?.symbol || "S/")}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Total: {formatCurrency(document.total, document.currencyRef?.symbol || "S/")}
                                  </div>
                                  {document.hasRetention && (
                                    <div className="text-xs text-muted-foreground">
                                      Ret: {formatCurrency(document.retentionAmount, document.currencyRef?.symbol || "S/")}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isSelected ? (
                                    <div className="space-y-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={pendingAmount}
                                        value={conciliationAmount}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          handleConciliationAmountChange(
                                            document.id,
                                            Number.parseFloat(e.target.value) || 0,
                                          )
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 text-xs text-right w-24"
                                      />
                                      <div className="text-xs text-muted-foreground">
                                        {pendingAmount > 0 ? ((conciliationAmount / pendingAmount) * 100).toFixed(1) + "%" : "0.0%"}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">-</div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                    {totalDocumentPages > 1 && (
                      <div className="flex items-center justify-end space-x-2 py-4 px-3 border-t">
                        <div className="flex-1 text-sm text-muted-foreground">
                          Página {documentPage} de {totalDocumentPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentPageChange(documentPage - 1)}
                          disabled={documentPage <= 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentPageChange(documentPage + 1)}
                          disabled={documentPage >= totalDocumentPages}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary and Action */}
          {selectedTransaction && selectedDocuments.length > 0 && (
            <Card>
              <CardContent className="p-6">
                {selectedTransaction?.transactionType === "TRANSFER_INBANK" && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Se detectó una transferencia interna. Se están mostrando primero los documentos del proveedor con la cuenta {selectedTransaction.description?.match(/\d{3}\s\d{8}\s\d/)?.[0]}.
                </AlertDescription>
              </Alert>
            )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Transacción</div>
                    <div className="font-bold text-xl">
                      {formatCurrency(getTransactionAmount(), selectedTransaction.bankAccount?.currencyRef?.symbol || "S/")}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{selectedTransaction.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedTransaction.bankAccount?.bank?.name || "Banco"} -{" "}
                      {selectedTransaction.bankAccount?.alias || selectedTransaction.bankAccount?.accountNumber}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Documentos</div>
                    <div className="font-bold text-xl">
                      {formatCurrency(getSelectedTotal(), selectedTransaction.bankAccount?.currencyRef?.symbol || "S/")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDocuments.length} seleccionado{selectedDocuments.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Conciliación{" "}
                      {getSelectedTotal() <
                      selectedDocuments.reduce((sum, doc) => {
                        const totalAmount = Number.parseFloat(doc.pendingAmount || "0")
                        return sum + totalAmount
                      }, 0)
                        ? "parcial"
                        : "completa"}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Diferencia</div>
                    <div className={`font-bold text-xl ${getDifference() === 0 ? "text-green-600" : "text-orange-600"}`}>
                      {formatCurrency(getDifference(), selectedTransaction.bankAccount?.currencyRef?.symbol || "S/")}
                    </div>
                    <Button onClick={handleCreateDocumentConciliation} className="mt-3 w-full" size="lg">
                      {getExistingConciliation(selectedTransaction.id) ? "Actualizar" : "Crear"} Conciliación
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Detraction Conciliation Tab */}
        <TabsContent value="detractions" className="space-y-6">
          {/* Transaction Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transacciones de Detracción Disponibles  
              </CardTitle>
              <CardDescription className="text-xs">
                Selecciona una transacción de detracción (excluye{" "}
                {transactions.filter((t) => isTransactionConciliated(t.id)).length} ya conciliadas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Filters */}
              <Card>
                <FiltersBar
                  filters={transactionFilterConfigs}
                  values={transactionFilters}
                  onChange={handleTransactionFilterChange}
                />
              </Card>

              {loading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableDetractionTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No se encontraron transacciones de detracción disponibles.
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableDetractionTransactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            data-state={selectedTransaction?.id === transaction.id && "selected"}
                            onClick={() => handleTransactionSelect(transaction)}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <TableCell>
                              <Input
                                type="radio"
                                name="selectedTransaction"
                                checked={selectedTransaction?.id === transaction.id}
                                readOnly
                                className="h-4 w-4 text-primary accent-primary"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.operationNumber} • {transaction.bankAccount?.bank?.name || "Banco"}
                              </div>
                              {transaction.supplier && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {transaction.supplier.businessName} ({transaction.supplier.documentNumber})
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.transactionDate)}
                              {transaction.operationTime && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.operationTime}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`font-semibold ${
                                transaction.amount.startsWith('-') 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Saldo: {formatCurrency(transaction.balance)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getTransactionTypeBadge(transaction.transactionType)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {totalDetractionTransactionPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4 px-3 border-t">
                      <div className="flex-1 text-sm text-muted-foreground">
                        Página {transactionPage} de {totalDetractionTransactionPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransactionPageChange(transactionPage - 1)}
                        disabled={transactionPage <= 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransactionPageChange(transactionPage + 1)}
                        disabled={transactionPage >= totalDetractionTransactionPages}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detraction Selection */}
          {selectedTransaction && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detracciones Disponibles ({availableDetractions.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedDocuments.length} seleccionado{selectedDocuments.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Filters */}
                <Card>
                  <FiltersBar
                    filters={documentFilterConfigs}
                    values={documentFilters}
                    onChange={handleDocumentFilterChange}
                  />
                </Card>

                {loading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Fechas</TableHead>
                          <TableHead className="text-right">Montos</TableHead>
                          <TableHead className="text-right w-32">Conciliar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableDetractions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No se encontraron detracciones disponibles.
                            </TableCell>
                          </TableRow>
                        ) : (
                          availableDetractions.map((document) => {
                            const isSelected = selectedDocuments.some((doc) => doc.id === document.id)
                            const detractionAmount = Number.parseFloat(document.detraction?.amount || "0")
                            const conciliationAmount = documentConciliationAmounts[document.id] || detractionAmount
                            const hasAccounting = document.accountLinks && document.accountLinks.length > 0
                            const hasCostCenters = document.costCenterLinks && document.costCenterLinks.length > 0

                            return (
                              <TableRow
                                key={document.id}
                                data-state={isSelected && "selected"}
                                onClick={() => handleDetractionSelect(document)}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <TableCell>
                                  <Checkbox checked={isSelected} aria-label="Seleccionar detracción" />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-start gap-2">
                                    {getTypeBadge(document.documentType)}
                                    <div>
                                      <div className="font-medium">{document.fullNumber}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {document.supplier?.documentNumber}
                                      </div>
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        Detracción
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="truncate max-w-xs" title={document.supplier?.businessName}>
                                    {document.supplier?.businessName}
                                  </div>
                                  {getStatusBadge(document.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    Emisión: {formatDate(document.issueDate)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Vence: {formatDate(document.dueDate || document.issueDate)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="font-bold">
                                    Detracción: {formatCurrency(detractionAmount, document.currencyRef?.symbol || "S/")}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Total: {formatCurrency(document.total, document.currencyRef?.symbol || "S/")}
                                  </div>
                                  {document.hasRetention && (
                                    <div className="text-xs text-muted-foreground">
                                      Ret: {formatCurrency(document.retentionAmount, document.currencyRef?.symbol || "S/")}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isSelected ? (
                                    <div className="space-y-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={detractionAmount}
                                        value={conciliationAmount}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          handleConciliationAmountChange(
                                            document.id,
                                            Number.parseFloat(e.target.value) || 0,
                                          )
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 text-xs text-right w-24"
                                      />
                                      <div className="text-xs text-muted-foreground">
                                        {detractionAmount > 0 ? ((conciliationAmount / detractionAmount) * 100).toFixed(1) + "%" : "0.0%"}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">-</div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                    {totalDetractionPages > 1 && (
                      <div className="flex items-center justify-end space-x-2 py-4 px-3 border-t">
                        <div className="flex-1 text-sm text-muted-foreground">
                          Página {documentPage} de {totalDetractionPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentPageChange(documentPage - 1)}
                          disabled={documentPage <= 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentPageChange(documentPage + 1)}
                          disabled={documentPage >= totalDetractionPages}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary and Action */}
          {selectedTransaction && selectedDocuments.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Transacción</div>
                    <div className="font-bold text-xl">
                      {formatCurrency(getTransactionAmount(), selectedTransaction.bankAccount?.currencyRef?.symbol || "S/")}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{selectedTransaction.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedTransaction.bankAccount?.bank?.name || "Banco"} -{" "}
                      {selectedTransaction.bankAccount?.alias || selectedTransaction.bankAccount?.accountNumber}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Detracciones</div>
                    <div className="font-bold text-xl">
                      {formatCurrency(getSelectedTotal(), selectedTransaction.bankAccount?.currencyRef?.symbol || "S/")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDocuments.length} seleccionado{selectedDocuments.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Conciliación{" "}
                      {getSelectedTotal() <
                      selectedDocuments.reduce((sum, doc) => {
                        const totalAmount = Number.parseFloat(doc.detraction?.amount || "0")
                        return sum + totalAmount
                      }, 0)
                        ? "parcial"
                        : "completa"}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Diferencia</div>
                    <div className={`font-bold text-xl ${getDifference() === 0 ? "text-green-600" : "text-orange-600"}`}>
                      {formatCurrency(getDifference(), selectedTransaction.bankAccount?.currencyRef?.symbol || "S/")}
                    </div>
                    <Button onClick={handleCreateDetractionConciliation} className="mt-3 w-full" size="lg">
                      {getExistingConciliation(selectedTransaction.id) ? "Actualizar" : "Crear"} Conciliación
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Existing Conciliations Tab */}
        <TabsContent value="existing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Conciliaciones Existentes</CardTitle>
                  <CardDescription>
                    {conciliations.length} conciliaciones registradas.{" "}
                    {selectedConciliationIds.length > 0 && (
                      <span className="text-primary font-medium">{selectedConciliationIds.length} seleccionada(s)</span>
                    )}
                  </CardDescription>
                </div>
                <div>
                  {selectedConciliationIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelectedConciliations}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Seleccionadas ({selectedConciliationIds.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : conciliations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay conciliaciones registradas</p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                paginatedConciliations.length > 0 &&
                                selectedConciliationIds.length === paginatedConciliations.length
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedConciliationIds(paginatedConciliations.map((c) => c.id))
                                } else {
                                  setSelectedConciliationIds([])
                                }
                              }}
                              aria-label="Seleccionar todas las conciliaciones en esta página"
                            />
                          </TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Banco</TableHead>
                          <TableHead className="text-center">Tipo</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedConciliations.map((conciliation) => (
                          <TableRow 
                            key={conciliation.id}
                            data-state={selectedConciliationIds.includes(conciliation.id) && "selected"}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedConciliationIds.includes(conciliation.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedConciliationIds((prev) =>
                                    checked ? [...prev, conciliation.id] : prev.filter((id) => id !== conciliation.id),
                                  )
                                }}
                                aria-label={`Seleccionar conciliación ${conciliation.reference || conciliation.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{conciliation.reference || "Sin referencia"}</div>
                              <div className="text-xs text-muted-foreground">
                                {conciliation.totalDocuments} documento{conciliation.totalDocuments !== 1 ? "s" : ""}
                              </div>
                              {conciliation.transactionId && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">Transacción vinculada</div>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(conciliation.createdAt)}</TableCell>
                            <TableCell>
                              <div>{conciliation.bankAccount?.bank?.name || "Banco"}</div>
                              <div className="text-xs text-muted-foreground">
                                {conciliation.bankAccount?.alias || conciliation.bankAccount?.accountNumber}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{conciliation.type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  conciliation.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                                    : conciliation.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100"
                                }
                              >
                                {conciliation.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {formatCurrency(conciliation.totalAmount, conciliation.bankAccount?.currencyRef?.symbol || "S/")}
                              </div>
                              {Number.parseFloat(conciliation.difference) !== 0 && (
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                  Dif: {formatCurrency(conciliation.difference, conciliation.bankAccount?.currencyRef?.symbol || "S/")}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => (window.location.href = `/conciliations/${conciliation.id}`)}
                                title="Ver Detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                        {Math.min(currentPage * itemsPerPage, conciliations.length)} de {conciliations.length}{" "}
                        conciliaciones
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConciliationDialog
        open={showConciliationDialog}
        onOpenChange={setShowConciliationDialog}
        selectedTransaction={selectedTransaction}
        selectedDocuments={selectedDocuments}
        documentConciliationAmounts={documentConciliationAmounts}
        bankAccounts={bankAccounts}
        conciliationType="DOCUMENTS"
      />

      <DetractionConciliationDialog
        open={showDetractionDialog}
        onOpenChange={setShowDetractionDialog}
        selectedTransaction={selectedTransaction}
        selectedDocuments={selectedDocuments}
        documentConciliationAmounts={documentConciliationAmounts}
        bankAccounts={bankAccounts}
      />
    </div>
  )
}

const formatBankAccounts = (bankAccounts?: Array<{
  id: string;
  bankId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  bank?: {
    name: string;
    code: string;
  };
}>) => {
  if (!bankAccounts || bankAccounts.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 space-y-1">
      {bankAccounts.map((account) => (
        <div key={account.id} className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="font-bold">{account.bank?.name || 'Banco'}:</span>
          <span>{account.accountNumber}</span>
          <span>{account.currency}</span>
        </div>
      ))}
    </div>
  );
};