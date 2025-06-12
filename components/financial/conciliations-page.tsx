"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Filter,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRightIcon,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
  const [expandedConciliations, setExpandedConciliations] = useState<Record<string, boolean>>({})

  // Search states
  const [transactionSearch, setTransactionSearch] = useState("")
  const [documentSearch, setDocumentSearch] = useState("")
  const [conciliatedSearch, setConciliatedSearch] = useState("")

  // Pagination states
  const [transactionPage, setTransactionPage] = useState(1)
  const [documentPage, setDocumentPage] = useState(1)
  const [conciliatedPage, setConciliatedPage] = useState(1)
  const itemsPerPage = 10

  // Dialog states
  const [selectedConciliationDetails, setSelectedConciliationDetails] = useState<ConciliationItem | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

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
  const filteredTransactions = useMemo(() => {
    return transactions.filter(
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
  }, [transactions, selectedAccounts, selectedPeriod, transactionSearch])

  // Filter documents (only non-conciliated)
  const filteredDocuments = useMemo(() => {
    return documents.filter(
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
  }, [documents, selectedSuppliers, selectedPeriod, documentSearch])

  // Filter conciliations with their items
  const filteredConciliations = useMemo(() => {
    if (!conciliations || conciliations.length === 0) {
      return []
    }

    return conciliations
      .filter((conciliation) => {
        // Filter by search term
        if (conciliatedSearch === "") return true

        // Check if conciliation matches search
        if (
          conciliation.transaction?.description?.toLowerCase().includes(conciliatedSearch.toLowerCase()) ||
          conciliation.bankAccount?.accountNumber?.toLowerCase().includes(conciliatedSearch.toLowerCase()) ||
          conciliation.bankAccount?.alias?.toLowerCase().includes(conciliatedSearch.toLowerCase())
        ) {
          return true
        }

        // Check if any of the items match search
        const items = conciliation.items || []
        return items.some(
          (item) =>
            item.document?.fullNumber?.toLowerCase().includes(conciliatedSearch.toLowerCase()) ||
            item.document?.supplier?.businessName?.toLowerCase().includes(conciliatedSearch.toLowerCase()),
        )
      })
      .map((conciliation) => {
        // Enrich conciliation with filtered items
        const items = conciliation.items || []
        const filteredItems = conciliatedSearch
          ? items.filter(
              (item) =>
                item.document?.fullNumber?.toLowerCase().includes(conciliatedSearch.toLowerCase()) ||
                item.document?.supplier?.businessName?.toLowerCase().includes(conciliatedSearch.toLowerCase()),
            )
          : items

        return {
          ...conciliation,
          filteredItems,
        }
      })
  }, [conciliations, conciliatedSearch])

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice((transactionPage - 1) * itemsPerPage, transactionPage * itemsPerPage)
  }, [filteredTransactions, transactionPage, itemsPerPage])

  const paginatedDocuments = useMemo(() => {
    return filteredDocuments.slice((documentPage - 1) * itemsPerPage, documentPage * itemsPerPage)
  }, [filteredDocuments, documentPage, itemsPerPage])

  const paginatedConciliations = useMemo(() => {
    return filteredConciliations.slice((conciliatedPage - 1) * itemsPerPage, conciliatedPage * itemsPerPage)
  }, [filteredConciliations, conciliatedPage, itemsPerPage])

  const transactionTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage))
  const documentTotalPages = Math.max(1, Math.ceil(filteredDocuments.length / itemsPerPage))
  const conciliatedTotalPages = Math.max(1, Math.ceil(filteredConciliations.length / itemsPerPage))

  // Toggle expanded state for a conciliation
  const toggleConciliationExpanded = (conciliationId: string) => {
    setExpandedConciliations((prev) => ({
      ...prev,
      [conciliationId]: !prev[conciliationId],
    }))
  }

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
    // Basic validation
    if (!selectedTransaction) {
      toast({
        title: "Error",
        description: "Debe seleccionar una transacción",
        variant: "destructive",
      })
      return
    }

    if (selectedDocuments.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un documento",
        variant: "destructive",
      })
      return
    }

    if (!user?.companyId) {
      toast({
        title: "Error",
        description: "No se encontró información de la empresa",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
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

      const createdConciliation = await createConciliation(conciliationData)

      if (!createdConciliation) {
        throw new Error("No se pudo crear la conciliación")
      }

      // Create conciliation items
      const itemPromises = selectedDocuments.map(async (documentId) => {
        const document = filteredDocuments.find((d) => d.id === documentId)
        if (!document) {
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

        return createConciliationItem(itemData)
      })

      await Promise.all(itemPromises)

      // Complete the conciliation
      await completeConciliation(createdConciliation.id)

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
        description: `La conciliación se ha completado exitosamente`,
      })

      // Redirect to detail view
      router.push(`/conciliations/${createdConciliation.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al realizar la conciliación: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "CONCILIATED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Conciliado
          </Badge>
        )
      case "PARTIALLY_CONCILIATED":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Parcial
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  // Loading skeleton components
  const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Aplique filtros a sus conciliaciones</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <DateRangePicker
                    dateRange={selectedPeriod}
                    onDateRangeChange={setSelectedPeriod}
                    placeholder="Seleccionar período"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cuentas</label>
                  <MultiSelect
                    options={getAccountOptions()}
                    selected={selectedAccounts}
                    onChange={setSelectedAccounts}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proveedores</label>
                  <MultiSelect
                    options={suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: `${supplier.businessName} (${supplier.documentNumber})`,
                    }))}
                    selected={selectedSuppliers}
                    onChange={setSelectedSuppliers}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsFilterSheetOpen(false)}>Aplicar filtros</Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden sm:flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <DateRangePicker
                      dateRange={selectedPeriod}
                      onDateRangeChange={setSelectedPeriod}
                      placeholder="Período"
                      className="w-40"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filtrar por período</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <MultiSelect
                      options={getAccountOptions()}
                      selected={selectedAccounts}
                      onChange={setSelectedAccounts}
                      placeholder="Cuentas"
                      className="w-40"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filtrar por cuentas bancarias</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          {/* Two-column layout for transactions and documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Transactions Column */}
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                      Transacciones Bancarias ({filteredTransactions.length})
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Seleccione una transacción bancaria para conciliar
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
                      aria-label="Buscar transacciones"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {loading ? (
                  <TableSkeleton rows={5} />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Sel.</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Operación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map((transaction) => (
                              <TableRow
                                key={transaction.id}
                                className={
                                  selectedTransaction?.id === transaction.id ? "bg-blue-500/10 border-blue-500/20" : ""
                                }
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedTransaction?.id === transaction.id}
                                    onCheckedChange={(checked) =>
                                      handleTransactionSelect(transaction, checked as boolean)
                                    }
                                    disabled={isProcessing}
                                    aria-label={`Seleccionar transacción ${transaction.operationNumber}`}
                                  />
                                </TableCell>
                                <TableCell>{format(new Date(transaction.transactionDate), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="max-w-[150px] truncate">{transaction.description}</TableCell>
                                <TableCell className="text-right font-mono">
                                  <span className="text-red-600 dark:text-red-400">
                                    S/{" "}
                                    {Math.abs(transaction.amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono">{transaction.operationNumber}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                No se encontraron transacciones que coincidan con los filtros
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
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

            {/* Documents Column */}
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      Documentos a Conciliar ({filteredDocuments.length})
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Seleccione los documentos que corresponden a la transacción
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
                        aria-label="Buscar documentos"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {loading ? (
                  <TableSkeleton rows={5} />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Sel.</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead className="text-right">Pendiente</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedDocuments.length > 0 ? (
                            paginatedDocuments.map((document) => (
                              <TableRow key={document.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedDocuments.includes(document.id)}
                                    onCheckedChange={(checked) => handleDocumentSelect(document.id, checked as boolean)}
                                    disabled={isProcessing || !selectedTransaction}
                                    aria-label={`Seleccionar documento ${document.fullNumber}`}
                                  />
                                </TableCell>
                                <TableCell className="font-mono">{document.fullNumber}</TableCell>
                                <TableCell className="max-w-[150px] truncate">
                                  {document.supplier?.businessName}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  S/ {document.pendingAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
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
                                      aria-label={`Monto a conciliar para ${document.fullNumber}`}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                No se encontraron documentos que coincidan con los filtros
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
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
          </div>

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
                    <div className="flex items-center justify-center gap-1">
                      <p
                        className={`text-lg sm:text-xl font-bold ${
                          Math.abs(totalDifference) <= TOLERANCE
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        S/ {Math.abs(totalDifference).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </p>
                      {Math.abs(totalDifference) <= TOLERANCE ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Diferencia dentro del límite de tolerancia</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Diferencia excede el límite de tolerancia de S/ {TOLERANCE.toFixed(2)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notas de conciliación */}
                <div className="mt-4">
                  <label htmlFor="reconciliation-notes" className="block text-sm font-medium mb-2">
                    Notas de conciliación (opcional)
                  </label>
                  <Textarea
                    id="reconciliation-notes"
                    placeholder="Agregar notas sobre esta conciliación..."
                    value={reconciliationNotes}
                    onChange={(e) => setReconciliationNotes(e.target.value)}
                    disabled={isProcessing}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
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
        </TabsContent>

        <TabsContent value="reconciled" className="space-y-6">
          {/* Combined Conciliations and Items Table */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <GitMerge className="w-4 h-4 sm:w-5 sm:h-5" />
                    Conciliaciones ({filteredConciliations.length})
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Lista de conciliaciones realizadas con sus documentos asociados
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conciliaciones..."
                    value={conciliatedSearch}
                    onChange={(e) => {
                      setConciliatedSearch(e.target.value)
                      setConciliatedPage(1)
                    }}
                    className="w-full sm:w-64"
                    aria-label="Buscar conciliaciones"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <TableSkeleton rows={5} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30px]"></TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Transacción</TableHead>
                          <TableHead>Cuenta</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-center">Documentos</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedConciliations.length > 0 ? (
                          paginatedConciliations.map((conciliation) => (
                            <>
                              {/* Conciliation Row */}
                              <TableRow key={conciliation.id} className="bg-muted/20">
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleConciliationExpanded(conciliation.id)}
                                    aria-label={
                                      expandedConciliations[conciliation.id]
                                        ? "Colapsar documentos"
                                        : "Expandir documentos"
                                    }
                                  >
                                    {expandedConciliations[conciliation.id] ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="font-mono font-medium">
                                  #{conciliation.id.substring(0, 8)}
                                </TableCell>
                                <TableCell>{format(new Date(conciliation.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                                <TableCell className="max-w-[150px] truncate">
                                  {conciliation.transaction?.description || "-"}
                                </TableCell>
                                <TableCell>
                                  {conciliation.bankAccount?.alias || conciliation.bankAccount?.accountNumber || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  S/{" "}
                                  {Number(conciliation.bankBalance).toLocaleString("es-PE", {
                                    minimumFractionDigits: 2,
                                  })}
                                </TableCell>
                                <TableCell className="text-center">
                                  {conciliation.totalDocuments} ({conciliation.conciliatedItems}/
                                  {conciliation.totalDocuments})
                                </TableCell>
                                <TableCell className="text-center">{getStatusBadge(conciliation.status)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => router.push(`/conciliations/${conciliation.id}`)}
                                            aria-label="Ver detalles"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver detalles</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-600"
                                            onClick={() => confirmDelete(conciliation.id)}
                                            disabled={isProcessing}
                                            aria-label="Eliminar conciliación"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Eliminar conciliación</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Conciliation Items (expandable) */}
                              {expandedConciliations[conciliation.id] &&
                                conciliation.filteredItems &&
                                conciliation.filteredItems.map((item) => (
                                  <TableRow key={`${conciliation.id}-${item.id}`} className="bg-muted/5 text-sm">
                                    <TableCell></TableCell>
                                    <TableCell colSpan={2} className="pl-8">
                                      <div className="flex items-center">
                                        <FileText className="w-3 h-3 mr-2 text-muted-foreground" />
                                        <span className="font-mono">{item.document?.fullNumber || "-"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell colSpan={2} className="max-w-[200px] truncate">
                                      {item.document?.supplier?.businessName || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      S/ {item.conciliatedAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      <span
                                        className={
                                          Math.abs(item.difference) < 0.01
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-red-600 dark:text-red-400"
                                        }
                                      >
                                        {Math.abs(item.difference) > 0
                                          ? `S/ ${Math.abs(item.difference).toLocaleString("es-PE", {
                                              minimumFractionDigits: 2,
                                            })}`
                                          : "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-center">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleViewDetails(item)}
                                                aria-label="Ver detalles del item"
                                              >
                                                <Eye className="w-3 h-3" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Ver detalles del item</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                              No se encontraron conciliaciones que coincidan con los filtros
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    currentPage={conciliatedPage}
                    totalPages={conciliatedTotalPages}
                    onPageChange={setConciliatedPage}
                    itemName="conciliaciones"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de detalles de conciliación */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
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
                      <span className="font-mono">{selectedConciliationDetails.document?.fullNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proveedor:</span>
                      <span>{selectedConciliationDetails.document?.supplier?.businessName}</span>
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
                          Math.abs(selectedConciliationDetails.difference) < 0.01 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        S/{" "}
                        {Math.abs(selectedConciliationDetails.difference).toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                        })}
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
