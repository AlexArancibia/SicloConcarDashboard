"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useDocumentsStore } from "@/stores/documents-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useToast } from "@/hooks/use-toast"
import type { DocumentStatus, DocumentType } from "@/types"
import { useAuthStore } from "@/stores/authStore"
import XMLImportModal from "./xml-import-modal"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [xmlImportOpen, setXmlImportOpen] = useState(false)

  const { toast } = useToast()
  const { company } = useAuthStore()

  // Zustand store
  const { documents, loading, error, pagination, fetchDocuments, deleteDocument, clearError } = useDocumentsStore()

  // Initial load
  useEffect(() => {
    if (company?.id) {
      console.log("Initial load triggered")
      loadDocuments()
    }
  }, [company?.id])

  // Page change
  useEffect(() => {
    if (company?.id && currentPage > 1) {
      console.log("Page change triggered:", currentPage)
      loadDocuments()
    }
  }, [currentPage])

  // Filter changes
  useEffect(() => {
    if (company?.id) {
      console.log("Filters changed, resetting to page 1")
      setCurrentPage(1)
      loadDocuments()
    }
  }, [filters.search, filters.type, filters.status, filters.dateRange])

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

  const loadDocuments = async () => {
    if (!company?.id) {
      console.log("No company ID available")
      return
    }

    console.log("Loading documents for company:", company.id)
    console.log("Current filters:", filters)
    console.log("Current page:", currentPage)

    try {
      const query = {
        page: currentPage,
        limit: 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.type && filters.type !== "all" && { documentType: filters.type as DocumentType }),
        ...(filters.status && filters.status !== "all" && { status: filters.status as DocumentStatus }),
        ...(filters.dateRange.from && { issueDateFrom: filters.dateRange.from.toISOString().split("T")[0] }),
        ...(filters.dateRange.to && { issueDateTo: filters.dateRange.to.toISOString().split("T")[0] }),
      }

      console.log("Query being sent:", query)
      await fetchDocuments(company.id, query)
      console.log("Documents loaded successfully")
    } catch (err) {
      console.error("Error loading documents:", err)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("¿Está seguro de que desea eliminar este documento?")) {
      try {
        await deleteDocument(documentId)
        toast({
          title: "Éxito",
          description: "Documento eliminado correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar el documento",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusBadge = (status: DocumentStatus) => {
    const statusConfig = {
      DRAFT: { class: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", label: "Borrador" },
      PENDING: { class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Pendiente" },
      APPROVED: { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Aprobado" },
      REJECTED: { class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", label: "Rechazado" },
      PAID: { class: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", label: "Pagado" },
      CANCELLED: {
        class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
        label: "Cancelado",
      },
    }

    const config = statusConfig[status] || {
      class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
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
      INVOICE: { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Factura" },
      CREDIT_NOTE: {
        class: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        label: "N. Crédito",
      },
      DEBIT_NOTE: {
        class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        label: "N. Débito",
      },
      RECEIPT: {
        class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        label: "Recibo",
      },
      PURCHASE_ORDER: {
        class: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        label: "O. Compra",
      },
      CONTRACT: {
        class: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        label: "Contrato",
      },
    }

    const config = typeConfig[type] || {
      class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      label: "Otro",
    }

    return (
      <Badge variant="outline" className={config.class}>
        {config.label}
      </Badge>
    )
  }

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
      placeholder: "Estado del documento",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "DRAFT", label: "Borrador" },
        { value: "PENDING", label: "Pendiente" },
        { value: "APPROVED", label: "Aprobado" },
        { value: "REJECTED", label: "Rechazado" },
        { value: "PAID", label: "Pagado" },
        { value: "CANCELLED", label: "Cancelado" },
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

  const formatCurrency = (amount: string | number, currency = "PEN") => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    const symbol = currency === "USD" ? "$" : "S/"
    return `${symbol} ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  console.log("Render state:", {
    loading,
    error,
    documentsCount: documents.length,
    pagination,
    companyId: company?.id,
  })

  return (
    <>
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
                        <th className="text-center p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
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
                            {doc.detraction?.amount && Number.parseFloat(doc.detraction.amount) > 0
                              ? formatCurrency(doc.detraction.amount, doc.currency)
                              : "-"}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(doc.netPayableAmount, doc.currency)}
                          </td>
                          <td className="p-3 text-center">{getStatusBadge(doc.status)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/documents/${doc.id}`}>
                                <Button variant="ghost" size="sm" title="Ver detalles">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link href={`/documents/${doc.id}/edit`}>
                                <Button variant="ghost" size="sm" title="Editar">
                                  <Edit className="w-4 h-4" />
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

                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron documentos con los filtros aplicados</p>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} documentos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Documentos</p>
                <p className="text-2xl font-bold">{loading ? "..." : pagination.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">
                  {loading ? "..." : documents.filter((d) => d.status === "PENDING").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprobados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? "..." : documents.filter((d) => d.status === "APPROVED").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pagados</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? "..." : documents.filter((d) => d.status === "PAID").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <XMLImportModal
        open={xmlImportOpen}
        onOpenChange={setXmlImportOpen}
        onImportComplete={loadDocuments}
        companyId={company?.id || ""}
      />
    </>
  )
}
