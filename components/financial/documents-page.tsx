"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import XMLImportModal from "./xml-import-modal"
import { useDocumentsStore } from "@/stores/documents-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useToast } from "@/hooks/use-toast"
import type { DocumentStatus, DocumentType } from "@/types"
import { useAuthStore } from "@/stores/authStore"

export default function DocumentsPage() {
  const [filters, setFilters] = useState<{
    search: string
    type: string
    status: string
    dateRange: { from: Date | undefined; to: Date | undefined }
  }>({
    search: "",
    type: "",
    status: "",
    dateRange: { from: undefined, to: undefined },
  })
  const [xmlImportOpen, setXmlImportOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const { toast } = useToast()
  const { user } = useAuthStore()

  // Zustand store
  const {
    documents,
    loading,
    error,
    pagination,
    fetchDocuments,
    deleteDocument,
    uploadXmlDocument,
    validateWithSunat,
    clearError,
  } = useDocumentsStore()

  useEffect(() => {
    if (user?.companyId) {
      fetchDocuments(user.companyId, currentPage, pageSize)
    }
  }, [fetchDocuments, user?.companyId, currentPage])

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
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleXMLImport = () => {
    // Refresh the documents list after import
    if (user?.companyId) {
      fetchDocuments(user.companyId, currentPage, pageSize)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("¿Está seguro de que desea eliminar este documento?")) {
      await deleteDocument(documentId)
      toast({
        title: "Éxito",
        description: "Documento eliminado correctamente",
      })
    }
  }

  const handleValidateSunat = async (documentId: string) => {
    const success = await validateWithSunat(documentId)
    if (success) {
      toast({
        title: "Éxito",
        description: "Validación con SUNAT iniciada",
      })
      // Refresh the documents list
      if (user?.companyId) {
        fetchDocuments(user.companyId, currentPage, pageSize)
      }
    }
  }

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "PENDING":
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
      case "VALIDATED":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            Validado
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Rechazado
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
            Anulado
          </Badge>
        )
      case "PAID":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          >
            Pagado
          </Badge>
        )
      case "OVERDUE":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          >
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

  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case "FACTURA":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Factura
          </Badge>
        )
      case "NOTA_CREDITO":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          >
            N. Crédito
          </Badge>
        )
      case "NOTA_DEBITO":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          >
            N. Débito
          </Badge>
        )
      case "RECIBO_HONORARIOS":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            RH
          </Badge>
        )
      case "BOLETA":
        return (
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
            Boleta
          </Badge>
        )
      case "LIQUIDACION":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
          >
            Liquidación
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            Otro
          </Badge>
        )
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.supplier?.businessName || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (doc.fullNumber || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (doc.supplier?.documentNumber || "").includes(filters.search) ||
      (doc.description || "").toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = !filters.status || filters.status === "all" || doc.status === filters.status
    const matchesType = !filters.type || filters.type === "all" || doc.documentType === filters.type
    const matchesDate =
      !filters.dateRange.from ||
      (new Date(doc.issueDate) >= new Date(filters.dateRange.from) &&
        (!filters.dateRange.to || new Date(doc.issueDate) <= new Date(filters.dateRange.to)))

    return matchesSearch && matchesStatus && matchesType && matchesDate
  })

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "RUC, Serie, Proveedor...",
    },
    {
      key: "type",
      type: "select" as const,
      placeholder: "Tipo de documento",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "FACTURA", label: "Facturas" },
        { value: "NOTA_CREDITO", label: "N. Crédito" },
        { value: "NOTA_DEBITO", label: "N. Débito" },
        { value: "RECIBO_HONORARIOS", label: "RH" },
        { value: "BOLETA", label: "Boletas" },
        { value: "LIQUIDACION", label: "Liquidaciones" },
      ],
      className: "min-w-40",
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Estado del documento",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "PENDING", label: "Pendiente" },
        { value: "VALIDATED", label: "Validado" },
        { value: "PARTIALLY_CONCILIATED", label: "Parcial" },
        { value: "CONCILIATED", label: "Conciliado" },
        { value: "PAID", label: "Pagado" },
        { value: "OVERDUE", label: "Vencido" },
        { value: "REJECTED", label: "Rechazado" },
        { value: "CANCELLED", label: "Anulado" },
      ],
      className: "min-w-40",
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período de emisión",
    },
  ]

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const formatCurrency = (amount: number, currency = "PEN") => {
    return `${currency} ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  return (
    < >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Documentos</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administre facturas, recibos por honorarios y notas de crédito
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setXmlImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar XML
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos ({loading ? "..." : pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={8} columns={14} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Tipo</th>
                        <th className="text-left p-3">Serie - Número</th>
                        <th className="text-left p-3">Fecha Emisión</th>
                        <th className="text-left p-3">Fecha Vencimiento</th>
                        <th className="text-left p-3">Proveedor</th>
                        <th className="text-left p-3">RUC</th>
                        <th className="text-right p-3">Subtotal</th>
                        <th className="text-right p-3">IGV</th>
                        <th className="text-right p-3">Total</th>
                        <th className="text-right p-3">Detracción</th>
                        <th className="text-right p-3">Neto a Pagar</th>
                        <th className="text-center p-3">Estado</th>
                        <th className="text-center p-3">SUNAT</th>
                        <th className="text-center p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3">{getTypeBadge(doc.documentType)}</td>
                          <td className="p-3 font-mono">{doc.fullNumber}</td>
                          <td className="p-3">{formatDate(doc.issueDate)}</td>
                          <td className="p-3">{doc.dueDate ? formatDate(doc.dueDate) : "-"}</td>
                          <td className="p-3 max-w-48 truncate" title={doc.supplier?.businessName || ""}>
                            {doc.supplier?.businessName || "Sin proveedor"}
                          </td>
                          <td className="p-3 font-mono">{doc.supplier?.documentNumber || "Sin RUC"}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(doc.subtotal, doc.currency)}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(doc.igv, doc.currency)}</td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {formatCurrency(doc.total, doc.currency)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {doc.detractionAmount && doc.detractionAmount > 0
                              ? formatCurrency(doc.detractionAmount, doc.currency)
                              : "-"}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(doc.netPayableAmount, doc.currency)}
                          </td>
                          <td className="p-3 text-center">{getStatusBadge(doc.status)}</td>
                          <td className="p-3 text-center">
                            {doc.sunatResponseCode ? (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              >
                                Válido
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleValidateSunat(doc.id)}
                                className="text-amber-600 hover:text-amber-700"
                              >
                                Validar
                              </Button>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/documents/${doc.id}`}>
                                <Button variant="ghost" size="sm" title="Ver detalles">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                           
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Eliminar"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-700"
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

                {filteredDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron documentos con los filtros aplicados</p>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                      {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} documentos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <XMLImportModal
        open={xmlImportOpen}
        onOpenChange={setXmlImportOpen}
        onImportComplete={handleXMLImport}
        companyId={user?.companyId || ""}
      />
    </ >
  )
}
