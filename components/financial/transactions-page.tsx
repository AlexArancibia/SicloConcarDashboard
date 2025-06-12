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
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Stores
  const { transactions, loading, error, fetchTransactions, clearError } = useTransactionsStore()
  const { bankAccounts, fetchActiveBankAccounts, getAccountOptions } = useBankAccountsStore()
  const { user } = useAuthStore()

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.companyId) {
      console.log("Cargando datos para companyId:", user.companyId)
      fetchTransactions(user.companyId)
      fetchActiveBankAccounts(user.companyId)
    }
  }, [user?.companyId, fetchTransactions, fetchActiveBankAccounts])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset a la primera página cuando se cambian filtros
  }

  const handleImportComplete = async (hasSuccessfulImports: boolean) => {
    console.log("Import completed, hasSuccessfulImports:", hasSuccessfulImports)

    // Solo actualizar si hubo importaciones exitosas
    if (hasSuccessfulImports && user?.companyId) {
      setRefreshing(true)
      try {
        await fetchTransactions(user.companyId)
        console.log("Transacciones actualizadas después de importación exitosa")
      } catch (error) {
        console.error("Error al actualizar transacciones:", error)
      } finally {
        setRefreshing(false)
      }
    }
  }

  const handleRefresh = async () => {
    if (user?.companyId) {
      setRefreshing(true)
      clearError() // Limpiar errores previos
      try {
        await fetchTransactions(user.companyId)
        await fetchActiveBankAccounts(user.companyId)
      } catch (error) {
        console.error("Error al refrescar datos:", error)
      } finally {
        setRefreshing(false)
      }
    }
  }

  const getTypeBadge = (type: TransactionType) => {
    const typeConfig = {
      DEBIT: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Débito", icon: TrendingDown },
      CREDIT: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Crédito", icon: TrendingUp },
    }

    const config = typeConfig[type]
    const IconComponent = config.icon
    return (
      <Badge variant="secondary" className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getTransactionFlags = (transaction: any) => {
    const flags = []
    if (transaction.isITF) flags.push({ label: "ITF", color: "bg-purple-500/10 text-purple-600" })
    if (transaction.isDetraction) flags.push({ label: "Detracción", color: "bg-orange-500/10 text-orange-600" })
    if (transaction.isBankFee) flags.push({ label: "Comisión", color: "bg-red-500/10 text-red-600" })
    if (transaction.isTransfer) flags.push({ label: "Transferencia", color: "bg-blue-500/10 text-blue-600" })
    return flags
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.operationNumber.includes(filters.search) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(filters.search.toLowerCase())) ||
      (transaction.supplier?.businessName &&
        transaction.supplier.businessName.toLowerCase().includes(filters.search.toLowerCase()))

    const matchesBankAccount =
      filters.bankAccounts.length === 0 || (filters.bankAccounts as string[]).includes(transaction.bankAccountId)

    const matchesStatus =
      filters.status.length === 0 || (filters.status as TransactionStatus[]).includes(transaction.status)

    const matchesType =
      filters.types.length === 0 || (filters.types as TransactionType[]).includes(transaction.transactionType)

    const matchesDate =
      !filters.dateRange.from ||
      (new Date(transaction.transactionDate) >= filters.dateRange.from &&
        (!filters.dateRange.to || new Date(transaction.transactionDate) <= filters.dateRange.to))

    return matchesSearch && matchesBankAccount && matchesStatus && matchesType && matchesDate
  })

  // Cálculos de paginación
  const totalItems = filteredTransactions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  const statusOptions = [
    { value: "IMPORTED", label: "Importado" },
    { value: "PENDING", label: "Pendiente" },
    { value: "CONCILIATED", label: "Conciliado" },
    { value: "PARTIALLY_CONCILIATED", label: "Parcialmente Conciliado" },
    { value: "EXCLUDED", label: "Excluido" },
  ]

  const typeOptions = [
    { value: "DEBIT", label: "Débito" },
    { value: "CREDIT", label: "Crédito" },
  ]

  // Usar las opciones del store de bank accounts
  const bankAccountOptions = getAccountOptions()

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

  return (
    <div className="space-y-4">
      {/* Error Alert */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transacciones Bancarias</h1>
          <p className="text-muted-foreground">Administre las transacciones importadas desde los extractos bancarios</p>
        </div>
        <div className="flex gap-2">
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
            Importar Extracto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Transacciones ({loading || refreshing ? "..." : totalItems})
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
                        <th className="text-left p-3 text-card-foreground">Fecha</th>
                        <th className="text-left p-3 text-card-foreground">Cuenta</th>
                        <th className="text-left p-3 text-card-foreground">Operación</th>
                        <th className="text-left p-3 text-card-foreground">Descripción</th>
                        <th className="text-center p-3 text-card-foreground">Tipo</th>
                        <th className="text-right p-3 text-card-foreground">Monto</th>
                        <th className="text-right p-3 text-card-foreground">Saldo</th>
                        <th className="text-left p-3 text-card-foreground">Proveedor</th>
                        <th className="text-left p-3 text-card-foreground">Clasificación</th>
                        <th className="text-center p-3 text-card-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <p className="text-card-foreground text-sm">
                                {new Date(transaction.transactionDate).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </p>
                              {transaction.valueDate && (
                                <p className="text-xs text-muted-foreground">
                                  Valor:{" "}
                                  {new Date(transaction.valueDate).toLocaleDateString("es-PE", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-mono text-card-foreground text-xs">
                                {transaction.bankAccount?.accountNumber || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.bankAccount?.bankName || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-mono text-card-foreground text-sm">{transaction.operationNumber}</p>
                            {transaction.operationTime && (
                              <p className="text-xs text-muted-foreground">{transaction.operationTime}</p>
                            )}
                          </td>
                          <td className="p-3 max-w-64 truncate text-card-foreground" title={transaction.description}>
                            {transaction.description}
                            {transaction.reference && (
                              <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                            )}
                          </td>
                          <td className="p-3 text-center">{getTypeBadge(transaction.transactionType)}</td>
                          <td className="p-3 text-right font-mono">
                            <span
                              className={
                                transaction.transactionType === "DEBIT"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }
                            >
                              PEN {transaction.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-card-foreground">
                            PEN {transaction.balance.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-card-foreground">
                            <div>
                              <p className="text-sm">{transaction.supplier?.businessName || "-"}</p>
                              {transaction.supplier?.tradeName && (
                                <p className="text-xs text-muted-foreground">{transaction.supplier.tradeName}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {getTransactionFlags(transaction).map((flag, index) => (
                                <Badge key={index} variant="secondary" className={`${flag.color} text-xs`}>
                                  {flag.label}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
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

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} transacciones
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
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

      {/* Import Modal */}
      <TransactionImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
