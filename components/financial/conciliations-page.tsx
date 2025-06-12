"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  GitMerge,
  FileText,
  Wallet,
  Calendar,
  Building2,
  Eye,
  Search,
  Code,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTransactionsStore } from "@/stores/transactions-store"
import { useDocumentsStore } from "@/stores/documents-store"
import { useConciliationStore } from "@/stores/conciliation-store"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { MultiSelect } from "@/components/ui/multi-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import type {
  ConciliationItem,
  ConciliationStatus,
  ConciliationItemType,
  ConciliationItemStatus,
  CreateConciliationDto,
  CreateConciliationItemDto,
} from "@/types/conciliation"
import type { Transaction } from "@/types/transactions"
import type { DateRange } from "react-day-picker"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ConciliationsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State for reconciliation process
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [documentAmounts, setDocumentAmounts] = useState<Record<string, number>>({})
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange | undefined>(undefined)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("reconcile")
  const [isProcessing, setIsProcessing] = useState(false)
  const [reconciliationNotes, setReconciliationNotes] = useState("")
  const [conciliationToDelete, setConciliationToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Search states
  const [transactionSearch, setTransactionSearch] = useState("")
  const [documentSearch, setDocumentSearch] = useState("")

  // Pagination states
  const [transactionPage, setTransactionPage] = useState(1)
  const [documentPage, setDocumentPage] = useState(1)
  const [conciliatedPage, setConciliatedPage] = useState(1)
  const itemsPerPage = 10

  // Dialog states
  const [selectedConciliationDetails, setSelectedConciliationDetails] = useState<ConciliationItem | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false)

  // Stores
  const { user } = useAuthStore()
  const { transactions, loading: transactionsLoading, fetchTransactions } = useTransactionsStore()
  const { documents, loading: documentsLoading, fetchDocuments } = useDocumentsStore()
  const {
    conciliations,
    conciliationItems,
    loading: conciliationLoading,
    fetchConciliations,
    fetchConciliationItems,
    createConciliation,
    createConciliationItem,
    completeConciliation,
    validateConciliation,
    deleteConciliation,
  } = useConciliationStore()
  const { activeBankAccounts, fetchActiveBankAccounts, getAccountOptions } = useBankAccountsStore()
  const { suppliers, fetchSuppliers } = useSuppliersStore()

  // Load data on component mount
  useEffect(() => {
    if (user?.companyId) {
      fetchTransactions(user.companyId)
      fetchDocuments(user.companyId)
      fetchConciliations(user.companyId)
      fetchActiveBankAccounts(user.companyId)
      fetchSuppliers(user.companyId)
    }
  }, [user?.companyId, fetchTransactions, fetchDocuments, fetchConciliations, fetchActiveBankAccounts, fetchSuppliers])

  // Filter transactions (only non-conciliated debits)
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.status !== "CONCILIATED" &&
      transaction.transactionType === "DEBIT" &&
      (selectedAccounts.length === 0 || selectedAccounts.includes(transaction.bankAccountId)) &&
      (!selectedPeriod?.from || new Date(transaction.transactionDate) >= selectedPeriod.from) &&
      (!selectedPeriod?.to || new Date(transaction.transactionDate) <= selectedPeriod.to) &&
      (transactionSearch === "" ||
        transaction.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        transaction.operationNumber.toLowerCase().includes(transactionSearch.toLowerCase())),
  )

  // Filter documents (only non-conciliated)
  const filteredDocuments = documents.filter(
    (document) =>
      document.status !== "CONCILIATED" &&
      document.pendingAmount > 0 &&
      (selectedSuppliers.length === 0 || selectedSuppliers.includes(document.supplierId)) &&
      (!selectedPeriod?.from || new Date(document.issueDate) >= selectedPeriod.from) &&
      (!selectedPeriod?.to || new Date(document.issueDate) <= selectedPeriod.to) &&
      (documentSearch === "" ||
        document.fullNumber.toLowerCase().includes(documentSearch.toLowerCase()) ||
        document.supplier?.businessName?.toLowerCase().includes(documentSearch.toLowerCase())),
  )

  // Get conciliated items with details
  const conciliatedItems = useMemo(() => {
    if (!conciliations || conciliations.length === 0) {
      return []
    }

    const allItems = conciliations.flatMap((conciliation) => {
      const items = conciliation.items || []
      return items.map((item) => ({
        ...item,
        conciliationInfo: {
          id: conciliation.id,
          bankAccount: conciliation.bankAccount,
          transaction: conciliation.transaction,
          createdAt: conciliation.createdAt,
        },
      }))
    })

    return allItems.filter((item) => item.status === "MATCHED" || item.status === "PARTIAL_MATCH")
  }, [conciliations])

  // Pagination logic
  const paginatedTransactions = filteredTransactions.slice(
    (transactionPage - 1) * itemsPerPage,
    transactionPage * itemsPerPage,
  )

  const paginatedDocuments = filteredDocuments.slice((documentPage - 1) * itemsPerPage, documentPage * itemsPerPage)

  const paginatedConciliatedItems = conciliatedItems.slice(
    (conciliatedPage - 1) * itemsPerPage,
    conciliatedPage * itemsPerPage,
  )

  const transactionTotalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const documentTotalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const conciliatedTotalPages = Math.ceil(conciliatedItems.length / itemsPerPage)

  // Transaction selection handler
  const handleTransactionSelect = (transaction: Transaction, checked: boolean) => {
    if (checked) {
      setSelectedTransaction(transaction)
    } else {
      setSelectedTransaction(null)
      setSelectedDocuments([])
      setDocumentAmounts({})
    }
  }

  const handleDocumentSelect = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments([...selectedDocuments, documentId])
      const document = filteredDocuments.find((d) => d.id === documentId)
      if (document) {
        setDocumentAmounts((prev) => ({
          ...prev,
          [documentId]: document.pendingAmount,
        }))
      }
    } else {
      setSelectedDocuments(selectedDocuments.filter((id) => id !== documentId))
      setDocumentAmounts((prev) => {
        const newAmounts = { ...prev }
        delete newAmounts[documentId]
        return newAmounts
      })
    }
  }

  const handleAmountChange = (documentId: string, amount: number) => {
    setDocumentAmounts((prev) => ({
      ...prev,
      [documentId]: amount,
    }))
  }

  // Generate payload for debugging
  const generatePayload = (): CreateConciliationDto | null => {
    if (!selectedTransaction || selectedDocuments.length === 0 || !user?.companyId) return null

    const today = new Date()
    const periodStart = selectedPeriod?.from ? format(selectedPeriod.from, "yyyy-MM-dd") : format(today, "yyyy-MM-01")
    const periodEnd = selectedPeriod?.to ? format(selectedPeriod.to, "yyyy-MM-dd") : format(today, "yyyy-MM-dd")

    return {
      companyId: user.companyId,
      bankAccountId: selectedTransaction.bankAccountId,
      transactionId: selectedTransaction.id,
      periodStart,
      periodEnd,
      bankBalance: Math.abs(selectedTransaction.amount),
      bookBalance: totalDocuments,
      difference: totalDifference,
      toleranceAmount: TOLERANCE,
      status: "PENDING" as ConciliationStatus,
      createdById: user.id,
    }
  }

  const TOLERANCE = 30.0

  // Simplified reconciliation handler
  const handleReconciliation = async () => {
    console.log("🚀 handleReconciliation called")

    // Basic validation
    if (!selectedTransaction) {
      console.log("❌ No transaction selected")
      toast({
        title: "Error",
        description: "Debe seleccionar una transacción",
        variant: "destructive",
      })
      return
    }

    if (selectedDocuments.length === 0) {
      console.log("❌ No documents selected")
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un documento",
        variant: "destructive",
      })
      return
    }

    if (!user?.companyId) {
      console.log("❌ No company ID")
      toast({
        title: "Error",
        description: "No se encontró información de la empresa",
        variant: "destructive",
      })
      return
    }

    console.log("✅ Basic validation passed")
    console.log("📊 Selected transaction:", selectedTransaction.id)
    console.log("📋 Selected documents:", selectedDocuments)
    console.log("👤 User company:", user.companyId)

    setIsProcessing(true)

    try {
      // Skip validation for now and go directly to creation
      console.log("⏭️ Skipping validation, proceeding to creation")

      // Create conciliation data
      const today = new Date()
      const periodStart = selectedPeriod?.from ? format(selectedPeriod.from, "yyyy-MM-dd") : format(today, "yyyy-MM-01")
      const periodEnd = selectedPeriod?.to ? format(selectedPeriod.to, "yyyy-MM-dd") : format(today, "yyyy-MM-dd")

      const conciliationData: CreateConciliationDto = {
        companyId: user.companyId,
        bankAccountId: selectedTransaction.bankAccountId,
        transactionId: selectedTransaction.id,
        periodStart,
        periodEnd,
        bankBalance: Math.abs(selectedTransaction.amount),
        bookBalance: totalDocuments,
        difference: totalDifference,
        toleranceAmount: TOLERANCE,
        status: "IN_PROGRESS" as ConciliationStatus,
        createdById: user.id,
      }

      console.log("📝 Creating conciliation with data:", conciliationData)

      const createdConciliation = await createConciliation(conciliationData)
      console.log("✅ Conciliation created:", createdConciliation)

      if (!createdConciliation) {
        throw new Error("Failed to create conciliation - no data returned")
      }

      // Create conciliation items
      console.log("📋 Creating conciliation items...")
      const itemPromises = selectedDocuments.map(async (documentId) => {
        const document = filteredDocuments.find((d) => d.id === documentId)
        if (!document) {
          console.warn(`⚠️ Document not found for ID: ${documentId}`)
          return null
        }

        const amount = documentAmounts[documentId] || document.pendingAmount

        const itemData: CreateConciliationItemDto = {
          conciliationId: createdConciliation.id,
          itemType: "DOCUMENT_TRANSACTION" as ConciliationItemType,
          documentId: document.id,
          documentAmount: amount,
          conciliatedAmount: amount,
          difference: 0,
          detractionAmount: document.detractionAmount || null,
          retentionAmount: document.retentionAmount || null,
          status: "MATCHED" as ConciliationItemStatus,
          notes: reconciliationNotes || `Document ${document.fullNumber}`,
          conciliatedBy: user.id,
        }

        console.log(`📄 Creating item for document ${document.fullNumber}:`, itemData)
        return createConciliationItem(itemData)
      })

      const createdItems = await Promise.all(itemPromises)
      const validItems = createdItems.filter((item) => item !== null)
      console.log("✅ Conciliation items created:", validItems.length)

      // Complete the conciliation
      console.log("🏁 Completing conciliation...")
      const completedConciliation = await completeConciliation(createdConciliation.id)
      console.log("✅ Conciliation completed:", completedConciliation)

      // Reset form
      setSelectedTransaction(null)
      setSelectedDocuments([])
      setDocumentAmounts({})
      setReconciliationNotes("")

      // Reload data
      if (user?.companyId) {
        await fetchConciliations(user.companyId)
      }

      toast({
        title: "Conciliación completada",
        description: `La conciliación se ha completado exitosamente. ID: ${createdConciliation.id}`,
      })

      // Redirect to detail view
      router.push(`/conciliations/${createdConciliation.id}`)
    } catch (error: any) {
      console.error("❌ Error during conciliation:", error)
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      })

      toast({
        title: "Error",
        description: `Error al realizar la conciliación: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      console.log("🏁 Reconciliation process finished")
    }
  }

  const handleDeleteConciliation = async (id: string) => {
    try {
      setIsProcessing(true)
      await deleteConciliation(id)

      toast({
        title: "Conciliación eliminada",
        description: "La conciliación ha sido eliminada exitosamente",
      })

      if (user?.companyId) {
        fetchConciliations(user.companyId)
      }
    } catch (error: any) {
      console.error("Error deleting conciliation:", error)
      toast({
        title: "Error",
        description: `Error al eliminar la conciliación: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setConciliationToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const confirmDelete = (id: string) => {
    setConciliationToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "IMPORTED":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "CONCILIATED":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Conciliado
          </Badge>
        )
      case "PARTIALLY_CONCILIATED":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Parcial
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            {status}
          </Badge>
        )
    }
  }

  const handleViewDetails = (item: ConciliationItem) => {
    setSelectedConciliationDetails(item)
    setIsDetailsDialogOpen(true)
  }

  // Calculate totals
  const totalTransaction = selectedTransaction ? Math.abs(selectedTransaction.amount) : 0

  const totalDocuments = selectedDocuments.reduce((total, docId) => {
    const amount = documentAmounts[docId] || 0
    return total + Number(amount)
  }, 0)

  const totalDifference = totalTransaction - totalDocuments

  const loading = transactionsLoading || documentsLoading || conciliationLoading || isProcessing

  // Pagination component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    itemName,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    itemName: string
  }) => (
    <div className="flex items-center justify-between px-2 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} ({itemName})
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Conciliación Bancaria</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Concilie una transacción bancaria con múltiples documentos fiscales
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <DateRangePicker
              dateRange={selectedPeriod}
              onDateRangeChange={setSelectedPeriod}
              placeholder="Período"
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <MultiSelect
              options={getAccountOptions()}
              selected={selectedAccounts}
              onChange={setSelectedAccounts}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="reconcile" className="flex items-center gap-2">
            <GitMerge className="w-4 h-4" />
            Conciliar
          </TabsTrigger>
          <TabsTrigger value="reconciled" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Conciliados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reconcile" className="space-y-6">
          {/* Bank Transactions */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                    Transacciones Bancarias ({filteredTransactions.length})
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Seleccione una transacción bancaria para conciliar con documentos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar transacciones..."
                    value={transactionSearch}
                    onChange={(e) => {
                      setTransactionSearch(e.target.value)
                      setTransactionPage(1)
                    }}
                    className="w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">
                    {isProcessing ? "Procesando conciliación..." : "Cargando transacciones..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Sel.</th>
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Descripción</th>
                            <th className="text-right p-2">Monto</th>
                            <th className="text-left p-2">Operación</th>
                            <th className="text-left p-2">Canal</th>
                            <th className="text-center p-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTransactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className={`border-b hover:bg-muted/50 transition-colors ${
                                selectedTransaction?.id === transaction.id ? "bg-blue-500/10 border-blue-500/20" : ""
                              }`}
                            >
                              <td className="p-2">
                                <Checkbox
                                  checked={selectedTransaction?.id === transaction.id}
                                  onCheckedChange={(checked) =>
                                    handleTransactionSelect(transaction, checked as boolean)
                                  }
                                  disabled={isProcessing}
                                />
                              </td>
                              <td className="p-2">{format(new Date(transaction.transactionDate), "dd/MM/yyyy")}</td>
                              <td className="p-2 max-w-xs truncate">{transaction.description}</td>
                              <td className="p-2 text-right font-mono">
                                <span className="text-red-600 dark:text-red-400">
                                  S/{" "}
                                  {Math.abs(transaction.amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="p-2 font-mono">{transaction.operationNumber}</td>
                              <td className="p-2">{transaction.channel || "-"}</td>
                              <td className="p-2 text-center">{getStatusBadge(transaction.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <PaginationControls
                    currentPage={transactionPage}
                    totalPages={transactionTotalPages}
                    onPageChange={setTransactionPage}
                    itemName="transacciones"
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Reconciliation Summary */}
          {selectedTransaction && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <GitMerge className="w-4 h-4 sm:w-5 sm:h-5" />
                  Resumen de Conciliación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Monto Transacción</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                      S/ {totalTransaction.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Documentos ({selectedDocuments.length})</p>
                    <p className="text-lg sm:text-xl font-bold text-card-foreground">
                      S/ {totalDocuments.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Diferencia</p>
                    <p
                      className={`text-lg sm:text-xl font-bold ${
                        Math.abs(totalDifference) <= TOLERANCE
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      S/ {Math.abs(totalDifference).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Notas de conciliación */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Notas de conciliación (opcional)</label>
                  <Input
                    placeholder="Agregar notas sobre esta conciliación..."
                    value={reconciliationNotes}
                    onChange={(e) => setReconciliationNotes(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                <div className="mt-4 flex justify-center gap-2">
                  <Dialog open={isPayloadDialogOpen} onOpenChange={setIsPayloadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!selectedTransaction || selectedDocuments.length === 0 || isProcessing}
                        className="text-sm"
                      >
                        <Code className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Ver Payload
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Payload de Conciliación</DialogTitle>
                        <DialogDescription>
                          Datos que se enviarán al backend para realizar la conciliación
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(generatePayload(), null, 2)}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={handleReconciliation}
                    disabled={!selectedTransaction || selectedDocuments.length === 0 || isProcessing}
                    className="text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <GitMerge className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Conciliar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents to Reconcile */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    Documentos a Conciliar ({filteredDocuments.length})
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Seleccione los documentos que corresponden a la transacción bancaria
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar documentos..."
                      value={documentSearch}
                      onChange={(e) => {
                        setDocumentSearch(e.target.value)
                        setDocumentPage(1)
                      }}
                      className="w-full sm:w-64"
                    />
                  </div>
                  <MultiSelect
                    options={suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: `${supplier.businessName} (${supplier.documentNumber})`,
                    }))}
                    selected={selectedSuppliers}
                    onChange={setSelectedSuppliers}
                    className="w-full sm:w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">
                    {isProcessing ? "Procesando conciliación..." : "Cargando documentos..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <div className="min-w-[1100px]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Sel.</th>
                            <th className="text-left p-2">Documento</th>
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Proveedor</th>
                            <th className="text-right p-2">Total</th>
                            <th className="text-right p-2">Detracción</th>
                            <th className="text-right p-2">Conciliado</th>
                            <th className="text-right p-2">Pendiente</th>
                            <th className="text-right p-2">Monto a Conciliar</th>
                            <th className="text-center p-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDocuments.map((document) => (
                            <tr key={document.id} className="border-b hover:bg-muted/30">
                              <td className="p-2">
                                <Checkbox
                                  checked={selectedDocuments.includes(document.id)}
                                  onCheckedChange={(checked) => handleDocumentSelect(document.id, checked as boolean)}
                                  disabled={isProcessing || !selectedTransaction}
                                />
                              </td>
                              <td className="p-2 font-mono">{document.fullNumber}</td>
                              <td className="p-2">{format(new Date(document.issueDate), "dd/MM/yyyy")}</td>
                              <td className="p-2 max-w-xs truncate">{document.supplier?.businessName}</td>
                              <td className="p-2 text-right font-mono">
                                S/ {document.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-mono">
                                S/{" "}
                                {(document.detractionAmount || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-mono">
                                S/ {document.conciliatedAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-mono">
                                S/ {document.pendingAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2">
                                {selectedDocuments.includes(document.id) ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={document.pendingAmount}
                                    value={documentAmounts[document.id] || document.pendingAmount}
                                    onChange={(e) =>
                                      handleAmountChange(document.id, Number.parseFloat(e.target.value) || 0)
                                    }
                                    className="w-24 text-right text-xs"
                                    disabled={isProcessing}
                                  />
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </td>
                              <td className="p-2 text-center">{getStatusBadge(document.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <PaginationControls
                    currentPage={documentPage}
                    totalPages={documentTotalPages}
                    onPageChange={setDocumentPage}
                    itemName="documentos"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciled" className="space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    Conciliaciones ({conciliations.length})
                  </CardTitle>
                  <CardDescription className="text-sm">Lista de conciliaciones realizadas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-left p-2">Transacción</th>
                        <th className="text-left p-2">Cuenta</th>
                        <th className="text-right p-2">Monto</th>
                        <th className="text-center p-2">Documentos</th>
                        <th className="text-center p-2">Estado</th>
                        <th className="text-center p-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conciliations.map((conciliation) => (
                        <tr key={conciliation.id} className="border-b hover:bg-muted/30">
                          <td className="p-2">{format(new Date(conciliation.createdAt), "dd/MM/yyyy HH:mm")}</td>
                          <td className="p-2 max-w-xs truncate">{conciliation.transaction?.description || "-"}</td>
                          <td className="p-2">
                            {conciliation.bankAccount?.alias || conciliation.bankAccount?.accountNumber || "-"}
                          </td>
                          <td className="p-2 text-right font-mono">
                            S/ {Number(conciliation.bankBalance).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-center">
                            {conciliation.totalDocuments} ({conciliation.conciliatedItems}/{conciliation.totalDocuments}
                            )
                          </td>
                          <td className="p-2 text-center">{getStatusBadge(conciliation.status)}</td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/conciliations/${conciliation.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => confirmDelete(conciliation.id)}
                                disabled={isProcessing}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Items Conciliados ({conciliatedItems.length})
              </CardTitle>
              <CardDescription className="text-sm">
                Lista de documentos que han sido conciliados con transacciones bancarias
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Fecha Conciliación</th>
                        <th className="text-left p-2">Documento</th>
                        <th className="text-left p-2">Proveedor</th>
                        <th className="text-right p-2">Monto Conciliado</th>
                        <th className="text-right p-2">Diferencia</th>
                        <th className="text-center p-2">Estado</th>
                        <th className="text-center p-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedConciliatedItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/30">
                          <td className="p-2">
                            {item.conciliatedAt
                              ? format(new Date(item.conciliatedAt), "dd/MM/yyyy HH:mm")
                              : item.conciliationInfo?.createdAt
                                ? format(new Date(item.conciliationInfo.createdAt), "dd/MM/yyyy HH:mm")
                                : "-"}
                          </td>
                          <td className="p-2 font-mono">{item.document?.fullNumber || "-"}</td>
                          <td className="p-2">{item.document?.supplier?.businessName || "-"}</td>
                          <td className="p-2 text-right font-mono">
                            S/ {item.conciliatedAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right font-mono">
                            <span
                              className={
                                Math.abs(item.difference) < 0.01
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              S/ {Math.abs(item.difference).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-2 text-center">{getStatusBadge(item.status)}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewDetails(item)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Detalles de Conciliación</DialogTitle>
                                    <DialogDescription>Información detallada del item conciliado</DialogDescription>
                                  </DialogHeader>
                                  {selectedConciliationDetails && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-3">
                                          <h4 className="font-semibold text-sm">Información del Documento</h4>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Documento:</span>
                                              <span className="font-mono">
                                                {selectedConciliationDetails.document?.fullNumber}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Proveedor:</span>
                                              <span>
                                                {selectedConciliationDetails.document?.supplier?.businessName}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Total Documento:</span>
                                              <span className="font-mono">
                                                S/{" "}
                                                {selectedConciliationDetails.documentAmount?.toLocaleString("es-PE", {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <h4 className="font-semibold text-sm">Resumen de Conciliación</h4>
                                        <div className="p-3 bg-muted/30 rounded-lg text-sm">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Monto Conciliado:</span>
                                              <span className="font-mono text-emerald-600">
                                                S/{" "}
                                                {selectedConciliationDetails.conciliatedAmount.toLocaleString("es-PE", {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Diferencia:</span>
                                              <span
                                                className={`font-mono ${
                                                  Math.abs(selectedConciliationDetails.difference) < 0.01
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                                }`}
                                              >
                                                S/{" "}
                                                {Math.abs(selectedConciliationDetails.difference).toLocaleString(
                                                  "es-PE",
                                                  { minimumFractionDigits: 2 },
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                          {selectedConciliationDetails.notes && (
                                            <div className="mt-3 pt-3 border-t">
                                              <p>
                                                <strong>Notas:</strong> {selectedConciliationDetails.notes}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              {item.conciliationInfo?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/conciliations/${item.conciliationInfo.id}`)}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <PaginationControls
                currentPage={conciliatedPage}
                totalPages={conciliatedTotalPages}
                onPageChange={setConciliatedPage}
                itemName="items conciliados"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar conciliación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta conciliación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la conciliación y todos sus items asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => conciliationToDelete && handleDeleteConciliation(conciliationToDelete)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
