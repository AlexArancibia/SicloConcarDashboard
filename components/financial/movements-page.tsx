"use client"

import { useState, useEffect } from "react"
import Layout from "./layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Banknote, Building2, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import MovementUploadModal from "./movement-upload-modal"
import { useMovementsStore } from "@/stores/movements-store"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"

export default function MovementsPage() {
  const [filters, setFilters] = useState({
    search: "",
    accounts: [],
    dateRange: { from: undefined, to: undefined },
  })
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // Usar el store de movimientos
  const { movements, loading, error, fetchMovements, addMovements, deleteMovement } = useMovementsStore()

  // Usar el store de cuentas bancarias para los filtros
  const { bankAccounts, fetchBankAccounts, getAccountOptions } = useBankAccountsStore()

  // Cargar los movimientos y cuentas al montar el componente
  useEffect(() => {
    fetchMovements()
    fetchBankAccounts()
  }, [fetchMovements, fetchBankAccounts])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleMovementUpload = (uploadedMovements: any[]) => {
    addMovements(uploadedMovements)
    setUploadModalOpen(false)
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </Layout>
    )
  }

  const getMovementTypeBadge = (amount: number) => {
    if (amount > 0) {
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Crédito
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
          <TrendingDown className="w-3 h-3 mr-1" />
          Débito
        </Badge>
      )
    }
  }

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      movement.operationNumber.includes(filters.search) ||
      movement.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
      movement.accountNumber.includes(filters.search)
    const matchesAccount = filters.accounts.length === 0 || filters.accounts.includes(movement.accountNumber)
    const matchesDate =
      !filters.dateRange.from ||
      (new Date(movement.date) >= filters.dateRange.from &&
        (!filters.dateRange.to || new Date(movement.date) <= filters.dateRange.to))

    return matchesSearch && matchesAccount && matchesDate
  })

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "Descripción, Operación, Referencia...",
    },
    {
      key: "accounts",
      type: "multiselect" as const,
      placeholder: "Cuentas bancarias",
      options: getAccountOptions(),
      className: "min-w-48",
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período de movimientos",
    },
  ]

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Movimientos Bancarios</h1>
            <p className="text-muted-foreground">
              Administre los movimientos bancarios importados desde los estados de cuenta
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Subir Movimientos
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
        </Card>

        {/* Movements Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Movimientos Bancarios ({loading ? "..." : filteredMovements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={8} columns={12} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[1400px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-card-foreground">Fecha</th>
                          <th className="text-left p-3 text-card-foreground">Cuenta</th>
                          <th className="text-left p-3 text-card-foreground">Descripción</th>
                          <th className="text-center p-3 text-card-foreground">Tipo</th>
                          <th className="text-right p-3 text-card-foreground">Salida</th>
                          <th className="text-right p-3 text-card-foreground">Saldo</th>
                          <th className="text-left p-3 text-card-foreground">Sucursal</th>
                          <th className="text-left p-3 text-card-foreground">Operación</th>
                          <th className="text-left p-3 text-card-foreground">Hora</th>
                          <th className="text-left p-3 text-card-foreground">Usuario</th>
                          <th className="text-left p-3 text-card-foreground">Referencia</th>
                          <th className="text-left p-3 text-card-foreground">Archivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMovements.map((movement) => (
                          <tr key={movement.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3 text-card-foreground">{movement.date}</td>
                            <td className="p-3">
                              <div>
                                <p className="font-mono text-card-foreground text-xs">{movement.accountNumber}</p>
                                <p className="text-xs text-muted-foreground">{movement.accountType}</p>
                              </div>
                            </td>
                            <td className="p-3 max-w-64 truncate text-card-foreground" title={movement.description}>
                              {movement.description}
                            </td>
                            <td className="p-3 text-center">{getMovementTypeBadge(movement.amount)}</td>
                            <td className="p-3 text-right font-mono">
                              <span
                                className={
                                  movement.amount < 0
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }
                              >
                                {movement.currency}{" "}
                                {Math.abs(movement.amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-card-foreground">
                              {movement.currency}{" "}
                              {movement.balance.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-card-foreground">{movement.branch}</td>
                            <td className="p-3 font-mono text-card-foreground">{movement.operationNumber}</td>
                            <td className="p-3 text-card-foreground">{movement.operationTime}</td>
                            <td className="p-3 text-card-foreground">{movement.user}</td>
                            <td className="p-3 text-card-foreground">{movement.reference || "-"}</td>
                            <td className="p-3">
                              <div>
                                <p className="text-xs text-card-foreground truncate max-w-32" title={movement.fileName}>
                                  {movement.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">{movement.uploadDate}</p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredMovements.length === 0 && (
                  <div className="text-center py-8">
                    <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron movimientos con los filtros aplicados</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4 text-blue-600" />
                Resumen por Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="h-3 w-12 bg-muted rounded animate-pulse mx-auto mb-1" />
                          <div className="h-4 w-16 bg-muted rounded animate-pulse mx-auto" />
                        </div>
                        <div className="text-center">
                          <div className="h-3 w-12 bg-muted rounded animate-pulse mx-auto mb-1" />
                          <div className="h-4 w-16 bg-muted rounded animate-pulse mx-auto" />
                        </div>
                        <div className="text-center">
                          <div className="h-3 w-12 bg-muted rounded animate-pulse mx-auto mb-1" />
                          <div className="h-4 w-16 bg-muted rounded animate-pulse mx-auto" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from(new Set(filteredMovements.map((m) => m.accountNumber))).map((accountNumber) => {
                    const accountMovements = filteredMovements.filter((m) => m.accountNumber === accountNumber)
                    const accountCredits = accountMovements
                      .filter((m) => m.amount > 0)
                      .reduce((sum, m) => sum + m.amount, 0)
                    const accountDebits = accountMovements
                      .filter((m) => m.amount < 0)
                      .reduce((sum, m) => sum + Math.abs(m.amount), 0)
                    const lastBalance = accountMovements.length > 0 ? accountMovements[0].balance : 0
                    const currency = accountMovements.length > 0 ? accountMovements[0].currency : "PEN"

                    return (
                      <div key={accountNumber} className="p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-mono text-sm text-card-foreground">{accountNumber}</p>
                          <Badge variant="outline" className="text-xs">
                            {accountMovements.length} mov.
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <p className="text-muted-foreground">Créditos</p>
                            <p className="font-semibold text-emerald-600">
                              {currency} {accountCredits.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Débitos</p>
                            <p className="font-semibold text-red-600">
                              {currency} {accountDebits.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Saldo</p>
                            <p className="font-semibold text-card-foreground">
                              {currency} {lastBalance.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-purple-600" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-48 bg-muted rounded animate-pulse mb-1" />
                        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="text-right ml-2">
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMovements.slice(0, 5).map((movement, index) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground truncate">{movement.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.date} • {movement.operationTime}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p
                          className={`text-sm font-semibold ${movement.amount < 0 ? "text-red-600" : "text-emerald-600"}`}
                        >
                          {movement.currency} {movement.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MovementUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadComplete={handleMovementUpload}
      />
    </Layout>
  )
}
