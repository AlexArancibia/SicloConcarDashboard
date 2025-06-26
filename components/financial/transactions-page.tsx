"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  Download,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useTransactionsStore } from "@/stores/transactions-store"
import { useBanksStore } from "@/stores/bank-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TransactionStatus, TransactionType } from "@/types/transactions"
import TransactionImportModal from "./transaction-import-modal"
import { useAuthStore } from "@/stores/authStore"

export default function TransactionsPage() {
  const [filters, setFilters] = useState<{
    search: string
    bankAccounts: string[]
    status: TransactionStatus[]
    types: TransactionType[]
    dateRange: { from: Date | undefined; to: Date | undefined }
  }>({
    search: "",
    bankAccounts: [],
    status: [],
    types: [],
    dateRange: { from: undefined, to: undefined },
  })

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Stores
  const { 
    transactions, 
    loading, 
    error, 
    fetchTransactions, 
    clearError,
    total,
    page,
    limit,
    totalPages
  } = useTransactionsStore()
  const { banks, getActiveBanks, clearError: clearBanksError } = useBanksStore()
  const { user } = useAuthStore()

  // Cargar datos iniciales y cuando cambien los filtros
  useEffect(() => {
    if (user?.companyId) {
      loadTransactions()
      getActiveBanks()
    }
  }, [user?.companyId, currentPage, itemsPerPage])

  // Efecto para recargar cuando cambian los filtros
  useEffect(() => {
    if (user?.companyId) {
      setCurrentPage(1) // Resetear a la primera página al cambiar filtros
      loadTransactions()
    }
  }, [
    filters.search,
    filters.bankAccounts,
    filters.status,
    filters.types,
    filters.dateRange
  ])

  const loadTransactions = async () => {
    if (!user?.companyId) return

    setRefreshing(true)
    clearError()
    clearBanksError()

    try {
      const query = {
        page: currentPage,
        limit: itemsPerPage,
        ...(filters.search && { search: filters.search }),
        ...(filters.bankAccounts.length > 0 && { bankAccountId: filters.bankAccounts.join(',') }),
        ...(filters.status.length > 0 && { status: filters.status.join(',') as TransactionStatus }),
        ...(filters.types.length > 0 && { type: filters.types.join(',') }),
        ...(filters.dateRange.from && { dateFrom: filters.dateRange.from.toISOString().split('T')[0] }),
        ...(filters.dateRange.to && { dateTo: filters.dateRange.to.toISOString().split('T')[0] }),
      }

      await fetchTransactions(user.companyId, query)
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleImportComplete = async (hasSuccessfulImports: boolean) => {
    if (hasSuccessfulImports && user?.companyId) {
      await loadTransactions()
    }
  }

  const handleRefresh = async () => {
    if (user?.companyId) {
      await loadTransactions()
    }
  }

  const getTypeBadge = (type: TransactionType) => {
    const typeConfig: Record<TransactionType, { color: string; label: string; icon: any }> = {
      // INGRESOS
      INCOME_SALARY: {
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        label: "Sueldo",
        icon: TrendingUp,
      },
      INCOME_BONUS: {
        color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
        label: "Bono",
        icon: TrendingUp,
      },
      INCOME_INTEREST: {
        color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        label: "Interés",
        icon: TrendingUp,
      },
      INCOME_INVESTMENT: {
        color: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
        label: "Inversión",
        icon: TrendingUp,
      },
      INCOME_DIVIDENDS: {
        color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
        label: "Dividendo",
        icon: TrendingUp,
      },
      INCOME_SALES: {
        color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        label: "Venta",
        icon: TrendingUp,
      },
      INCOME_SERVICES: {
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        label: "Servicio",
        icon: TrendingUp,
      },
      INCOME_TRANSFER: {
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        label: "Transferencia",
        icon: TrendingUp,
      },
      INCOME_DEPOSIT: {
        color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        label: "Depósito",
        icon: TrendingUp,
      },
      INCOME_REFUND: {
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        label: "Reembolso",
        icon: TrendingUp,
      },
      INCOME_ADJUSTMENT: {
        color: "bg-lime-500/10 text-lime-600 border-lime-500/20",
        label: "Ajuste",
        icon: TrendingUp,
      },
      INCOME_TAX_REFUND: {
        color: "bg-green-500/10 text-green-600 border-green-500/20",
        label: "Devolución Imp.",
        icon: TrendingUp,
      },
      INCOME_OTHER: {
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        label: "Otro Ingreso",
        icon: TrendingUp,
      },

      // EGRESOS
      PAYROLL_SALARY: {
        color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
        label: "Sueldo",
        icon: TrendingDown,
      },
      PAYROLL_CTS: {
        color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        label: "CTS",
        icon: TrendingDown,
      },
      PAYROLL_BONUS: {
        color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
        label: "Grati/Bono",
        icon: TrendingDown,
      },
      PAYROLL_AFP: {
        color: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
        label: "AFP",
        icon: TrendingDown,
      },
      TAX_PAYMENT: {
        color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        label: "Pago SUNAT",
        icon: TrendingDown,
      },
      TAX_ITF: {
        color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
        label: "ITF",
        icon: TrendingDown,
      },
      TAX_DETRACTION: {
        color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        label: "Detracción",
        icon: TrendingDown,
      },
      EXPENSE_UTILITIES: {
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        label: "Servicios",
        icon: TrendingDown,
      },
      EXPENSE_INSURANCE: {
        color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
        label: "Seguro",
        icon: TrendingDown,
      },
      EXPENSE_COMMISSIONS: {
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        label: "Comisión",
        icon: TrendingDown,
      },
      EXPENSE_PURCHASE: {
        color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        label: "Pago proveedor",
        icon: TrendingDown,
      },
      EXPENSE_OTHER: {
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        label: "Otro gasto",
        icon: TrendingDown,
      },
      TRANSFER_INBANK: {
        color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        label: "Transf. mismo banco",
        icon: TrendingDown,
      },
      TRANSFER_EXTERNAL: {
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        label: "Transf. interbancaria",
        icon: TrendingDown,
      },
      WITHDRAWAL_CASH: {
        color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        label: "Retiro efectivo",
        icon: TrendingDown,
      },
      ADJUSTMENT: {
        color: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
        label: "Ajuste",
        icon: TrendingDown,
      },
      REFUND: {
        color: "bg-lime-500/10 text-lime-600 border-lime-500/20",
        label: "Devolución",
        icon: TrendingDown,
      },
    };

    const config = typeConfig[type]
    const IconComponent = config.icon
    return (
      <Badge variant="secondary" className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      (transaction.operationNumber && transaction.operationNumber.includes(filters.search)) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(filters.search.toLowerCase()))

    const matchesBankAccount =
      filters.bankAccounts.length === 0 || filters.bankAccounts.includes(transaction.bankAccountId)

    const matchesStatus =
      filters.status.length === 0 || filters.status.includes(transaction.status)

    const matchesType =
      filters.types.length === 0 || filters.types.includes(transaction.transactionType)

    const matchesDate =
      !filters.dateRange.from ||
      (new Date(transaction.transactionDate) >= filters.dateRange.from &&
        (!filters.dateRange.to || new Date(transaction.transactionDate) <= filters.dateRange.to))

    return matchesSearch && matchesBankAccount && matchesStatus && matchesType && matchesDate
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.transactionDate)
    const dateB = new Date(b.transactionDate)

    if (dateA.getTime() === dateB.getTime() && a.operationTime && b.operationTime) {
      return b.operationTime.localeCompare(a.operationTime)
    }

    return dateB.getTime() - dateA.getTime()
  })

  const paginatedTransactions = sortedTransactions.slice(
    (page - 1) * limit,
    page * limit
  )

  const statusOptions = [
    { value: "PENDING", label: "Pendiente" },
    { value: "PROCESSED", label: "Procesado" },
    { value: "RECONCILED", label: "Conciliado" },
    { value: "CANCELLED", label: "Cancelado" },
  ]

  const typeOptions = [
    // INGRESOS
    { value: "INCOME_SALARY", label: "Sueldo (Ingreso)" },
    { value: "INCOME_BONUS", label: "Bono (Ingreso)" },
    { value: "INCOME_INTEREST", label: "Interés (Ingreso)" },
    { value: "INCOME_INVESTMENT", label: "Inversión (Ingreso)" },
    { value: "INCOME_DIVIDENDS", label: "Dividendo (Ingreso)" },
    { value: "INCOME_SALES", label: "Venta (Ingreso)" },
    { value: "INCOME_SERVICES", label: "Servicio (Ingreso)" },
    { value: "INCOME_TRANSFER", label: "Transferencia (Ingreso)" },
    { value: "INCOME_DEPOSIT", label: "Depósito (Ingreso)" },
    { value: "INCOME_REFUND", label: "Reembolso (Ingreso)" },
    { value: "INCOME_ADJUSTMENT", label: "Ajuste (Ingreso)" },
    { value: "INCOME_TAX_REFUND", label: "Devolución Imp. (Ingreso)" },
    { value: "INCOME_OTHER", label: "Otro Ingreso" },
    
    // EGRESOS
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
    { value: "EXPENSE_PURCHASE", label: "Pago proveedor (Egreso)" },
    { value: "EXPENSE_OTHER", label: "Otro gasto (Egreso)" },
    { value: "TRANSFER_INBANK", label: "Transf. mismo banco (Egreso)" },
    { value: "TRANSFER_EXTERNAL", label: "Transf. interbancaria (Egreso)" },
    { value: "WITHDRAWAL_CASH", label: "Retiro efectivo (Egreso)" },
    { value: "ADJUSTMENT", label: "Ajuste (Egreso)" },
    { value: "REFUND", label: "Devolución (Egreso)" },
  ]

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(paginatedTransactions.map((t) => t.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId) ? prev.filter((id) => id !== transactionId) : [...prev, transactionId],
    )
  }

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return
    console.log("Eliminar transacciones:", selectedTransactions)
    setSelectedTransactions([])
    setSelectAll(false)
  }

  const bankAccountOptions = transactions.reduce(
    (acc, transaction) => {
      const bankAccount = transaction.bankAccount
      if (bankAccount && !acc.find((opt) => opt.value === bankAccount.id)) {
        acc.push({
          value: bankAccount.id,
          label: `${bankAccount.bank.name} - ${bankAccount.accountNumber}`,
        })
      }
      return acc
    },
    [] as Array<{ value: string; label: string }>,
  )

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "Descripción, Operación, Referencia, Razón Social...",
    },
    {
      key: "bankAccounts",
      type: "multiselect" as const,
      placeholder: "Cuentas bancarias",
      options: bankAccountOptions,
      className: "min-w-48",
    },
    {
      key: "status",
      type: "multiselect" as const,
      placeholder: "Estado",
      options: statusOptions,
      className: "min-w-32",
    },
    {
      key: "types",
      type: "multiselect" as const,
      placeholder: "Tipo",
      options: typeOptions,
      className: "min-w-32",
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período",
    },
  ]

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }


  return (
    <div className="space-y-4">
      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="flex items-center justify-between">
            <span>Error al cargar transacciones: {error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transacciones Bancarias</h1>
          <p className="text-muted-foreground">Administre las transacciones importadas desde los extractos bancarios</p>
        </div>
        <div className="flex gap-2">
          {selectedTransactions.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar ({selectedTransactions.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
        </div>
      </div>

      <Card>
        <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Transacciones ({loading || refreshing ? "..." : total})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || refreshing ? (
            <TableSkeleton rows={8} columns={9} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 w-12">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="text-left p-3 text-card-foreground">Fecha/Hora</th>
                        <th className="text-left p-3 text-card-foreground">Cuenta</th>
                        <th className="text-left p-3 text-card-foreground">Operación</th>
                        <th className="text-left p-3 text-card-foreground">Descripción</th>
                        <th className="text-center p-3 text-card-foreground">Tipo</th>
                        <th className="text-right p-3 text-card-foreground">Monto</th>
                        <th className="text-right p-3 text-card-foreground">Saldo</th>
                        <th className="text-center p-3 text-card-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.includes(transaction.id)}
                              onChange={() => handleSelectTransaction(transaction.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-card-foreground text-sm">
                                {new Date(transaction.transactionDate).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </p>
                              {transaction.operationTime && (
                                <p className="text-xs text-muted-foreground">{transaction.operationTime}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-mono text-card-foreground text-xs">
                                {transaction.bankAccount?.accountNumber || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.bankAccount?.bank?.name || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-mono text-card-foreground text-sm">
                              {transaction.operationNumber || "N/A"}
                            </p>
                            {transaction.branch && (
                              <p className="text-xs text-muted-foreground">Suc: {transaction.branch}</p>
                            )}
                          </td>
                          <td className="p-3 max-w-64 truncate text-card-foreground" title={transaction.description}>
                            {transaction.description}
                            {transaction.reference && (
                              <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                            )}
                          </td>
                          <td className="p-3 text-center">{getTypeBadge(transaction.transactionType)}</td>
                          <td className="p-3 text-right font-mono text-card-foreground">
                            {transaction.bankAccount?.currencyRef?.symbol || "PEN"}{" "}
                            {Number.parseFloat(transaction.amount).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3 text-right font-mono text-card-foreground">
                            {transaction.bankAccount?.currencyRef?.symbol || "PEN"}{" "}
                            {Number.parseFloat(transaction.balance).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleSelectTransaction(transaction.id)}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} transacciones
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={page === 1}>
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {filteredTransactions.length === 0 && !error && (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron transacciones con los filtros aplicados</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TransactionImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}