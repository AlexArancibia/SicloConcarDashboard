"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Download,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useTransactionsStore } from "@/stores/transactions-store"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useToast } from "@/hooks/use-toast"
import type { Transaction, TransactionStatus, TransactionType } from "@/types/transactions"
import { useAuthStore } from "@/stores/authStore"
import TransactionImportModal from "./transaction-import-modal"
import { Checkbox } from "../ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TransactionDetailsDialog } from "@/components/transaction-details-dialog"

export default function TransactionsPage() {
  const [filters, setFilters] = useState<{
    search: string
    bankAccountId: string
    status: string
    type: string
    dateFrom: string
    dateTo: string
    minAmount: string
    maxAmount: string
  }>({
    search: "",
    bankAccountId: "all",
    status: "all",
    type: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  })

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([])
  const [showTransactionDetailsDialog, setShowTransactionDetailsDialog] = useState(false)
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState<Transaction | null>(null)

  const { toast } = useToast()
  const { company, user } = useAuthStore()

  const {
    transactions,
    loading,
    error,
    total,
    page,
    limit,
    totalPages,
    fetchTransactions,
    deleteTransaction,
    clearError,
  } = useTransactionsStore()

  const { bankAccounts, fetchBankAccounts } = useBankAccountsStore()

  // Función para cargar transacciones sin dependencias que causen loops
 const loadTransactions = useCallback(async (currentPage?: number, currentFilters?: typeof filters, currentLimit?: number) => {
  if (!company?.id) return

  const pageToUse = currentPage ?? page
  const filtersToUse = currentFilters ?? filters
  const limitToUse = currentLimit ?? limit

  const query = {
    page: pageToUse,
    limit: limitToUse,
    ...(filtersToUse.search && { search: filtersToUse.search }),
    ...(filtersToUse.bankAccountId !== "all" && { bankAccountId: filtersToUse.bankAccountId }),
    ...(filtersToUse.status !== "all" && { status: filtersToUse.status as TransactionStatus }),
    ...(filtersToUse.type !== "all" && { type: filtersToUse.type as TransactionType }),
    ...(filtersToUse.dateFrom && { dateFrom: filtersToUse.dateFrom }),
    ...(filtersToUse.dateTo && { dateTo: filtersToUse.dateTo }),
    ...(filtersToUse.minAmount && { minAmount: filtersToUse.minAmount }),
    ...(filtersToUse.maxAmount && { maxAmount: filtersToUse.maxAmount }),
  }
  await fetchTransactions(company.id, query)
}, [company?.id, fetchTransactions]) // Removido page, limit y filters de las dependencias

  // Cargar datos iniciales
  useEffect(() => {
    if (company?.id) {
      fetchBankAccounts(company.id, { page: 1, limit: 100 })
      loadTransactions()
    }
  }, [company?.id, fetchBankAccounts, loadTransactions])

  // Efecto para cambios de página - llamada directa sin dependencias problemáticas
  useEffect(() => {
    if (company?.id) {
      loadTransactions(page)
    }
  }, [page, company?.id]) // Removido loadTransactions de las dependencias

  // Efecto para cambios de filtros - resetea página a 1
  useEffect(() => {
    if (company?.id) {
      useTransactionsStore.setState({ page: 1 })
      loadTransactions(1, filters)
    }
  }, [
    filters.search,
    filters.bankAccountId,
    filters.status,
    filters.type,
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
    company?.id
  ]) // Removido loadTransactions de las dependencias

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      clearError()
    }
  }, [error, toast, clearError])

  const handleFilterChange = (key: string, value: any) => {
    if (key === "dateRange" && typeof value === "object" && value !== null) {
      setFilters((prev) => ({
        ...prev,
        dateFrom: value.from ? value.from.toISOString().split("T")[0] : "",
        dateTo: value.to ? value.to.toISOString().split("T")[0] : "",
      }))
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }))
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm("¿Está seguro de que desea eliminar esta transacción?")) {
      try {
        await deleteTransaction(transactionId)
        toast({
          title: "Éxito",
          description: "Transacción eliminada correctamente",
        })
        loadTransactions()
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Error al eliminar la transacción",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransactionForDetails(transaction)
    setShowTransactionDetailsDialog(true)
  }

  const handleBulkDelete = async () => {
    if (selectedTransactionIds.length === 0) {
      toast({ title: "Nada seleccionado", description: "Seleccione transacciones para eliminar." })
      return
    }
    if (confirm(`¿Está seguro de que desea eliminar ${selectedTransactionIds.length} transacciones?`)) {
      try {
        for (const id of selectedTransactionIds) {
          await deleteTransaction(id)
        }
        toast({
          title: "Éxito",
          description: `${selectedTransactionIds.length} transacciones eliminadas.`,
        })
        setSelectedTransactionIds([])
        loadTransactions()
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Error al eliminar transacciones.",
          variant: "destructive",
        })
      }
    }
  }

  const handleImportComplete = () => {
    loadTransactions()
  }

  // Función mejorada para cambio de página sin bucles
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage !== page && newPage >= 1 && newPage <= totalPages) {
      useTransactionsStore.setState({ page: newPage })
    }
  }, [page, totalPages])

  // Función para cambiar el límite de elementos por página
  const handleLimitChange = useCallback((newLimit: string) => {
    const limitValue = Number(newLimit)
    useTransactionsStore.setState({ limit: limitValue, page: 1 })
    loadTransactions(1)
  }, [loadTransactions])

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig: Record<TransactionStatus, { class: string; label: string }> = {
      PENDING: { class: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Pendiente" },
      PROCESSED: { class: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Procesado" },
      RECONCILED: { class: "bg-green-500/10 text-green-600 border-green-500/20", label: "Conciliado" },
      CANCELLED: { class: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelado" },
    }
    const config = statusConfig[status] || { class: "bg-gray-500/10 text-gray-600", label: "Desconocido" }
    return (
      <Badge variant="secondary" className={config.class}>
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: TransactionType) => {
    const isIncome = type.startsWith("INCOME_")
    const genericTypeConfig: { [key: string]: { color: string; label: string; icon: any } } = {
      INCOME_SALARY: { color: "bg-sky-500/10 text-sky-600", label: "Sueldo", icon: TrendingUp },
      INCOME_BONUS: { color: "bg-teal-500/10 text-teal-600", label: "Bono", icon: TrendingUp },
      INCOME_INTEREST: { color: "bg-cyan-500/10 text-cyan-600", label: "Interés", icon: TrendingUp },
      INCOME_INVESTMENT: { color: "bg-blue-500/10 text-blue-600", label: "Inversión", icon: TrendingUp },
      INCOME_DIVIDENDS: { color: "bg-indigo-500/10 text-indigo-600", label: "Dividendo", icon: TrendingUp },
      INCOME_SALES: { color: "bg-violet-500/10 text-violet-600", label: "Venta", icon: TrendingUp },
      INCOME_SERVICES: { color: "bg-purple-500/10 text-purple-600", label: "Servicio", icon: TrendingUp },
      INCOME_TRANSFER: { color: "bg-fuchsia-500/10 text-fuchsia-600", label: "Transferencia Recibida", icon: TrendingUp },
      INCOME_DEPOSIT: { color: "bg-pink-500/10 text-pink-600", label: "Depósito", icon: TrendingUp },
      INCOME_REFUND: { color: "bg-rose-500/10 text-rose-600", label: "Reembolso Recibido", icon: TrendingUp },
      INCOME_ADJUSTMENT: { color: "bg-lime-500/10 text-lime-600", label: "Ajuste (Ingreso)", icon: TrendingUp },
      INCOME_TAX_REFUND: { color: "bg-emerald-500/10 text-emerald-600", label: "Devolución Imp.", icon: TrendingUp },
      INCOME_OTHER: { color: "bg-green-500/10 text-green-600", label: "Otro Ingreso", icon: TrendingUp },
      PAYROLL_SALARY: { color: "bg-sky-500/10 text-sky-700", label: "Sueldo", icon: TrendingDown },
      PAYROLL_CTS: { color: "bg-teal-500/10 text-teal-700", label: "CTS", icon: TrendingDown },
      PAYROLL_BONUS: { color: "bg-cyan-500/10 text-cyan-700", label: "Grati/Bono", icon: TrendingDown },
      PAYROLL_AFP: { color: "bg-blue-500/10 text-blue-700", label: "AFP", icon: TrendingDown },
      TAX_PAYMENT: { color: "bg-slate-500/10 text-slate-700", label: "Pago SUNAT", icon: TrendingDown },
      TAX_ITF: { color: "bg-stone-500/10 text-stone-700", label: "ITF", icon: TrendingDown },
      TAX_DETRACTION: { color: "bg-neutral-500/10 text-neutral-700", label: "Detracción", icon: TrendingDown },
      EXPENSE_UTILITIES: { color: "bg-yellow-500/10 text-yellow-700", label: "Servicios", icon: TrendingDown },
      EXPENSE_INSURANCE: { color: "bg-amber-500/10 text-amber-700", label: "Seguro", icon: TrendingDown },
      EXPENSE_COMMISSIONS: { color: "bg-orange-500/10 text-orange-700", label: "Comisión", icon: TrendingDown },
      EXPENSE_PURCHASE: { color: "bg-red-500/10 text-red-700", label: "Pago Proveedor", icon: TrendingDown },
      EXPENSE_OTHER: { color: "bg-rose-500/10 text-rose-700", label: "Otro Gasto", icon: TrendingDown },
      TRANSFER_INBANK: { color: "bg-pink-500/10 text-pink-700", label: "Transf. Mismo Banco", icon: TrendingDown },
      TRANSFER_EXTERNAL: { color: "bg-fuchsia-500/10 text-fuchsia-700", label: "Transf. Interbancaria", icon: TrendingDown },
      WITHDRAWAL_CASH: { color: "bg-purple-500/10 text-purple-700", label: "Retiro Efectivo", icon: TrendingDown },
      ADJUSTMENT: { color: "bg-violet-500/10 text-violet-700", label: "Ajuste (Egreso)", icon: TrendingDown },
      REFUND: { color: "bg-indigo-500/10 text-indigo-700", label: "Devolución Emitida", icon: TrendingDown },
    }

    const config = genericTypeConfig[type] || {
      color: `border ${isIncome ? "border-green-500/20 bg-green-500/10 text-green-700" : "border-red-500/20 bg-red-500/10 text-red-700"}`,
      label: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: isIncome ? TrendingUp : TrendingDown,
    }
    const IconComponent = config.icon
    return (
      <Badge variant="outline" className={`${config.color} border`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filterConfigs = [
    { 
      key: "search", 
      type: "search" as const, 
      placeholder: "Descripción, Operación, Referencia...",
      priority: "high" as const,
    },
    {
      key: "dateRange", 
      type: "daterange" as const, 
      placeholder: "Período Transacción",
      priority: "high" as const,
    },
    {
      key: "bankAccountId",
      type: "select" as const,
      placeholder: "Seleccionar cuenta bancaria",
      options: [
        { value: "all", label: "Todas las Cuentas" },
        ...bankAccounts.map((acc) => ({ value: acc.id, label: `${acc.bank?.name} - ${acc.accountNumber} (${acc.currency})` })),
      ],
      maxWidth: "min-w-48 max-w-64",
      priority: "medium" as const,
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Seleccionar estado de transacción",
      options: [
        { value: "all", label: "Todos los Estados" },
        { value: "PENDING", label: "Pendiente" },
        { value: "PROCESSED", label: "Procesado" },
        { value: "RECONCILED", label: "Conciliado" },
        { value: "CANCELLED", label: "Cancelado" },
      ],
      maxWidth: "min-w-36 max-w-44",
      priority: "medium" as const,
    },
    {
      key: "type",
      type: "select" as const,
      placeholder: "Seleccionar tipo de transacción",
      options: [
        { value: "all", label: "Todos los Tipos" },
        { value: "INCOME_SALES", label: "Venta (Ingreso)" },
        { value: "EXPENSE_PURCHASE", label: "Pago Proveedor (Egreso)" },
        { value: "INCOME_SALARY", label: "Sueldo (Ingreso)" },
        { value: "INCOME_BONUS", label: "Bono (Ingreso)" },
        { value: "INCOME_INTEREST", label: "Interés (Ingreso)" },
        { value: "INCOME_INVESTMENT", label: "Inversión (Ingreso)" },
        { value: "INCOME_DIVIDENDS", label: "Dividendo (Ingreso)" },
        { value: "INCOME_SERVICES", label: "Servicio (Ingreso)" },
        { value: "INCOME_TRANSFER", label: "Transferencia (Ingreso)" },
        { value: "INCOME_DEPOSIT", label: "Depósito (Ingreso)" },
        { value: "INCOME_REFUND", label: "Reembolso (Ingreso)" },
        { value: "INCOME_ADJUSTMENT", label: "Ajuste (Ingreso)" },
        { value: "INCOME_TAX_REFUND", label: "Devolución Imp. (Ingreso)" },
        { value: "INCOME_OTHER", label: "Otro Ingreso" },
        { value: "PAYROLL_SALARY", label: "Sueldo (Egreso)" },
        { value: "PAYROLL_CTS", label: "CTS (Egreso)" },
        { value: "PAYROLL_BONUS", label: "Gratificación/Bono (Egreso)" },
        { value: "PAYROLL_AFP", label: "AFP (Egreso)" },
        { value: "TAX_PAYMENT", label: "Pago SUNAT (Egreso)" },
        { value: "TAX_ITF", label: "ITF (Egreso)" },
        { value: "TAX_DETRACTION", label: "Detracción (Egreso)" },
        { value: "EXPENSE_UTILITIES", label: "Servicios (Egreso)" },
        { value: "EXPENSE_INSURANCE", label: "Seguro (Egreso)" },
        { value: "EXPENSE_COMMISSIONS", label: "Comisiones (Egreso)" },
        { value: "EXPENSE_OTHER", label: "Otro gasto (Egreso)" },
        { value: "TRANSFER_INBANK", label: "Transf. mismo banco (Egreso)" },
        { value: "TRANSFER_EXTERNAL", label: "Transf. interbancaria (Egreso)" },
        { value: "WITHDRAWAL_CASH", label: "Retiro efectivo (Egreso)" },
        { value: "ADJUSTMENT", label: "Ajuste (Egreso)" },
        { value: "REFUND", label: "Devolución (Egreso)" },
      ],
      maxWidth: "min-w-48 max-w-64",
      priority: "low" as const,
    },
    { 
      key: "minAmount", 
      type: "search" as const, 
      placeholder: "Ingresar monto mínimo", 
      maxWidth: "w-32",
      priority: "low" as const,
    },
    { 
      key: "maxAmount", 
      type: "search" as const, 
      placeholder: "Ingresar monto máximo", 
      maxWidth: "w-32",
      priority: "low" as const,
    },
  ]

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const formatCurrency = (amount: string | number, currencySymbol = "S/") => {
    if (amount === null || amount === undefined) return `${currencySymbol} 0.00`
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return `${currencySymbol} ${numAmount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <>
      {/* Header Section - Título, descripción y botones por fuera */}
      <div className="space-y-4 sm:space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center py-4 sm:py-8 pl-2 sm:pb-2 pb-2">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Transacciones Bancarias</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Administre las transacciones importadas desde los extractos bancarios.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="default" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="default" onClick={() => setImportModalOpen(true)} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Importar Excel/CSV
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => loadTransactions()} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
              <span className="sm:hidden">Refrescar</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar transacciones: {error}
               <Button variant="outline" size="sm" className="ml-2" onClick={() => loadTransactions()}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters Card */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
          </CardContent>
        </Card>

        {/* Transactions Table Card */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <div>
                  <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
                    Transacciones ({loading ? "..." : total})
                  </CardTitle>
                  {selectedTransactionIds.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-normal">
                      {selectedTransactionIds.length} transacción(es) seleccionada(s)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                {selectedTransactionIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="default"
                    onClick={handleBulkDelete}
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Eliminar Seleccionadas ({selectedTransactionIds.length})</span>
                    <span className="sm:hidden">Eliminar ({selectedTransactionIds.length})</span>
                  </Button>
                )}
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    useTransactionsStore.setState({ limit: Number(value), page: 1 })
                    loadTransactions()
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Mostrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && transactions.length === 0 ? (
              <TableSkeleton rows={limit} columns={9} />
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 px-2">
                          <Checkbox
                            checked={
                              transactions.length > 0 && selectedTransactionIds.length === transactions.length
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTransactionIds(transactions.map((t) => t.id))
                              } else {
                                setSelectedTransactionIds([])
                              }
                            }}
                            aria-label="Seleccionar todas las transacciones"
                          />
                        </TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cuenta Bancaria</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Referencia/Operación</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center">
                            No se encontraron transacciones con los filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            data-state={selectedTransactionIds.includes(transaction.id) && "selected"}
                          >
                            <TableCell className="px-2">
                              <Checkbox
                                checked={selectedTransactionIds.includes(transaction.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedTransactionIds((prev) =>
                                    checked ? [...prev, transaction.id] : prev.filter((id) => id !== transaction.id),
                                  )
                                }}
                                aria-label={`Seleccionar transacción ${transaction.description}`}
                              />
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.transactionDate)}
                              {transaction.operationTime && <div className="text-xs text-muted-foreground">{transaction.operationTime}</div>}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.bankAccount?.alias || transaction.bankAccount?.accountNumber}</div>
                              <div className="text-xs text-muted-foreground">{transaction.bankAccount?.bank?.name} ({transaction.bankAccount?.currencyRef?.code})</div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={transaction.description}>
                              {transaction.description}
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-xs">{transaction.operationNumber}</div>
                              {transaction.reference && <div className="text-xs text-muted-foreground truncate" title={transaction.reference}>Ref: {transaction.reference}</div>}
                            </TableCell>
                            <TableCell className="text-center">{getTypeBadge(transaction.transactionType)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(transaction.amount, transaction.bankAccount?.currencyRef?.symbol)}
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(transaction.status)}</TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewTransactionDetails(transaction)}>
                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 py-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {(page - 1) * limit + 1} a{" "}
                      {Math.min(page * limit, total)} de {total} transacciones
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(1)}
                        disabled={page <= 1 || loading}
                        className="h-8 w-8"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1 || loading}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm px-2">
                        Página {page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages || loading}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={page >= totalPages || loading}
                        className="h-8 w-8"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics Cards */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              Resumen de Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                  {loading ? "..." : total}
                </div>
                <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Total Transacciones</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl sm:text-3xl font-medium text-green-600 dark:text-green-400 mb-2">
                  {loading ? "..." : transactions.filter((t) => t.transactionType.startsWith("INCOME")).length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-green-700 dark:text-green-300">Ingresos</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-2xl sm:text-3xl font-medium text-red-600 dark:text-red-400 mb-2">
                  {loading ? "..." : transactions.filter((t) => t.transactionType.startsWith("EXPENSE") || t.transactionType.startsWith("PAYROLL") || t.transactionType.startsWith("TAX")).length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-red-700 dark:text-red-300">Egresos</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-2xl sm:text-3xl font-medium text-amber-600 dark:text-amber-400 mb-2">
                  {loading ? "..." : transactions.filter((t) => t.status === "PENDING").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-amber-700 dark:text-amber-300">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <TransactionDetailsDialog
        open={showTransactionDetailsDialog}
        onOpenChange={setShowTransactionDetailsDialog}
        transaction={selectedTransactionForDetails}
      />
      <TransactionImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </>
  )
}