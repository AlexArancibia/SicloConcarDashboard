"use client"

import { useState, useEffect } from "react"
import Layout from "./layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingDown, Eye, FileText, Calendar, AlertTriangle } from "lucide-react"
import { useDetractionsStore } from "@/stores/detractions-store"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"

export default function DetractionsPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    accounts: [],
    dateRange: { from: undefined, to: undefined },
  })

  // Usar el store de detracciones
  const { detractions, loading, error, fetchDetractions, updateDetraction, markAsPaid } = useDetractionsStore()

  // Usar el store de cuentas bancarias para los filtros
  const { fetchBankAccounts, getAccountOptions } = useBankAccountsStore()

  // Cargar las detracciones y cuentas al montar el componente
  useEffect(() => {
    fetchDetractions()
    fetchBankAccounts()
  }, [fetchDetractions, fetchBankAccounts])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Pagado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Vencido
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            Desconocido
          </Badge>
        )
    }
  }

  const filteredDetractions = (detractions || []).filter((detraction) => {
    const matchesSearch =
      detraction.supplier.toLowerCase().includes(filters.search.toLowerCase()) ||
      detraction.documentId.toLowerCase().includes(filters.search.toLowerCase()) ||
      detraction.supplierRuc.includes(filters.search)
    const matchesStatus = !filters.status || filters.status === "all" || detraction.status === filters.status
    const matchesAccount = filters.accounts.length === 0 || filters.accounts.includes(detraction.accountNumber)
    const matchesDate =
      !filters.dateRange.from ||
      (new Date(detraction.documentDate) >= filters.dateRange.from &&
        (!filters.dateRange.to || new Date(detraction.documentDate) <= filters.dateRange.to))

    return matchesSearch && matchesStatus && matchesAccount && matchesDate
  })

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "RUC, Documento, Proveedor...",
    },
    {
      key: "accounts",
      type: "multiselect" as const,
      placeholder: "Cuentas de detracciones",
      options: getAccountOptions(),
      className: "min-w-48",
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período de documentos",
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Estado de pago",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "paid", label: "Pagado" },
        { value: "pending", label: "Pendiente" },
        { value: "overdue", label: "Vencido" },
      ],
      className: "min-w-40",
    },
  ]

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Detracciones</h1>
            <p className="text-muted-foreground">
              Administre las detracciones del Sistema de Pago de Obligaciones Tributarias
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <FileText className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
        </Card>

        {/* Detractions Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              Detracciones ({loading ? "..." : filteredDetractions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={8} columns={11} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-card-foreground">Documento</th>
                          <th className="text-left p-3 text-card-foreground">Fecha Doc.</th>
                          <th className="text-left p-3 text-card-foreground">Proveedor</th>
                          <th className="text-left p-3 text-card-foreground">RUC</th>
                          <th className="text-right p-3 text-card-foreground">Monto Doc.</th>
                          <th className="text-center p-3 text-card-foreground">Tasa %</th>
                          <th className="text-right p-3 text-card-foreground">Detracción</th>
                          <th className="text-left p-3 text-card-foreground">Fecha Pago</th>
                          <th className="text-left p-3 text-card-foreground">Operación</th>
                          <th className="text-center p-3 text-card-foreground">Estado</th>
                          <th className="text-center p-3 text-card-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetractions.map((detraction) => (
                          <tr key={detraction.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3">
                              <div>
                                <p className="font-mono text-card-foreground">{detraction.documentId}</p>
                                <p className="text-xs text-muted-foreground">{detraction.documentType}</p>
                              </div>
                            </td>
                            <td className="p-3 text-card-foreground">{detraction.documentDate}</td>
                            <td className="p-3 max-w-48 truncate text-card-foreground" title={detraction.supplier}>
                              {detraction.supplier}
                            </td>
                            <td className="p-3 font-mono text-card-foreground">{detraction.supplierRuc}</td>
                            <td className="p-3 text-right font-mono text-card-foreground">
                              {detraction.currency}{" "}
                              {detraction.documentAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center text-card-foreground">{detraction.detractionRate}%</td>
                            <td className="p-3 text-right font-mono font-semibold text-amber-600">
                              {detraction.currency}{" "}
                              {detraction.detractionAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-card-foreground">{detraction.paymentDate || "-"}</td>
                            <td className="p-3 font-mono text-card-foreground">{detraction.operationNumber || "-"}</td>
                            <td className="p-3 text-center">{getStatusBadge(detraction.status)}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" title="Ver detalles">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {detraction.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Marcar como pagado"
                                    className="text-emerald-600"
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </Button>
                                )}
                                {detraction.status === "overdue" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Alerta de vencimiento"
                                    className="text-red-600"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
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

                {filteredDetractions.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron detracciones con los filtros aplicados</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
