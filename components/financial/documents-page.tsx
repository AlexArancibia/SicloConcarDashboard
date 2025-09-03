"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, Eye, Edit, Trash2, MoreHorizontal, CheckCircle } from "lucide-react"
import { useDocumentsStore } from "@/stores/documents-store"
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
import type { DocumentStatus, DocumentType } from "@/types/documents"
import { useAuthStore } from "@/stores/authStore"
import XMLImportModal from "./xml-import-modal"
import { Checkbox } from "../ui/checkbox"
import SunatValidationDialog from "./sunat-validation-dialog"
import { ScrollableTable, type ScrollableTableColumn } from "@/components/ui/scrollable-table"

export default function DocumentsPage() {
  const [filters, setFilters] = useState<{
    search: string
    type: string // DocumentType
    status: string // DocumentStatus
    dateRange: { from: Date | undefined; to: Date | undefined } // IssueDate
    dueDateRange: { from: Date | undefined; to: Date | undefined } // DueDate
    currency: string
    minAmount: string
    maxAmount: string
    hasRetention: string // "yes", "no", "all"
    hasDetraction: string // "yes", "no", "all"
  }>({
    search: "",
    type: "all",
    status: "all",
    dateRange: { from: undefined, to: undefined },
    dueDateRange: { from: undefined, to: undefined },
    currency: "all",
    minAmount: "",
    maxAmount: "",
    hasRetention: "all",
    hasDetraction: "all",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [xmlImportOpen, setXmlImportOpen] = useState(false)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [sunatValidationOpen, setSunatValidationOpen] = useState(false)

  const { toast } = useToast()
  const { company, user } = useAuthStore() // Assuming user has updatedById

  // Zustand store
  const { documents, loading, error, pagination, fetchDocuments, deleteDocument, bulkDeleteDocuments, clearError } = useDocumentsStore()

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
  }, [
    filters.search, 
    filters.type, 
    filters.status, 
    filters.dateRange, 
    filters.dueDateRange, 
    filters.currency, 
    filters.minAmount, 
    filters.maxAmount, 
    filters.hasRetention, 
    filters.hasDetraction
  ])

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

  const loadDocuments = async (opts?: { page?: number; limit?: number }) => {
    if (!company?.id) {
      console.log("No company ID available")
      return
    }

    console.log("Loading documents for company:", company.id)
    console.log("Current filters:", filters)
    console.log("Current page:", opts?.page ?? currentPage)

    try {
      const query = {
        page: opts?.page ?? currentPage,
        limit: opts?.limit ?? pagination.limit ?? 10,
        ...(filters.search && filters.search.trim() !== "" && { search: filters.search }),
        ...(filters.type && filters.type !== "" && filters.type !== "all" && { documentType: filters.type as DocumentType }),
        ...(filters.status && filters.status !== "" && filters.status !== "all" && { status: filters.status as DocumentStatus }),
        ...(filters.dateRange.from && { issueDateFrom: filters.dateRange.from.toISOString().split("T")[0] }),
        ...(filters.dateRange.to && { issueDateTo: filters.dateRange.to.toISOString().split("T")[0] }),
        ...(filters.dueDateRange.from && { dueDateFrom: filters.dueDateRange.from.toISOString().split("T")[0] }),
        ...(filters.dueDateRange.to && { dueDateTo: filters.dueDateRange.to.toISOString().split("T")[0] }),
        ...(filters.currency && filters.currency !== "" && filters.currency !== "all" && { currency: filters.currency }),
        ...(filters.minAmount && filters.minAmount.trim() !== "" && { minAmount: parseFloat(filters.minAmount) }),
        ...(filters.maxAmount && filters.maxAmount.trim() !== "" && { maxAmount: parseFloat(filters.maxAmount) }),
        ...(filters.hasRetention !== "all" && { hasRetention: filters.hasRetention === "yes" }),
        ...(filters.hasDetraction !== "all" && { hasDetraction: filters.hasDetraction === "yes" }),
      }

      console.log("Query being sent:", query)
      console.log("Query keys:", Object.keys(query))
      console.log("Query values:", Object.values(query))
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
      priority: "high" as const,
    },
    {
      key: "dateRange",
      type: "daterange" as const,
      placeholder: "Período de emisión",
      priority: "high" as const,
    },
    {
      key: "type",
      type: "select" as const,
      placeholder: "Seleccionar tipo de documento",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "INVOICE", label: "Facturas" },
        { value: "CREDIT_NOTE", label: "N. Crédito" },
        { value: "DEBIT_NOTE", label: "N. Débito" },
        { value: "RECEIPT", label: "Recibos" },
        { value: "PURCHASE_ORDER", label: "O. Compra" },
        { value: "CONTRACT", label: "Contratos" },
      ],
      maxWidth: "w-44",
      priority: "medium" as const,
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Seleccionar estado del documento",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "DRAFT", label: "Borrador" },
        { value: "PENDING", label: "Pendiente" },
        { value: "APPROVED", label: "Aprobado" },
        { value: "REJECTED", label: "Rechazado" },
        { value: "PAID", label: "Pagado" },
        { value: "CANCELLED", label: "Cancelado" },
      ],
      maxWidth: "w-44",
      priority: "medium" as const,
    },
    {
      key: "dueDateRange",
      type: "daterange" as const,
      placeholder: "Seleccionar período de vencimiento",
      priority: "medium" as const,
    },
    {
      key: "currency",
      type: "select" as const,
      placeholder: "Seleccionar tipo de moneda",
      options: [
        { value: "all", label: "Todas las monedas" },
        { value: "PEN", label: "PEN" },
        { value: "USD", label: "USD" },
      ],
      maxWidth: "w-32",
      priority: "low" as const,
    },
    {
      key: "minAmount",
      type: "search" as const,
      placeholder: "Ingresar monto mínimo",
      maxWidth: "w-28",
      priority: "low" as const,
    },
    {
      key: "maxAmount",
      type: "search" as const,
      placeholder: "Ingresar monto máximo",
      maxWidth: "w-28",
      priority: "low" as const,
    },
    {
      key: "hasRetention",
      type: "select" as const,
      placeholder: "Seleccionar estado de retención",
      options: [
        { value: "all", label: "Cualquier estado" },
        { value: "yes", label: "Con retención" },
        { value: "no", label: "Sin retención" },
      ],
      maxWidth: "w-40",
      priority: "low" as const,
    },
    {
      key: "hasDetraction",
      type: "select" as const,
      placeholder: "Seleccionar estado de detracción",
      options: [
        { value: "all", label: "Cualquier estado" },
        { value: "yes", label: "Con detracción" },
        { value: "no", label: "Sin detracción" },
      ],
      maxWidth: "w-40",
      priority: "low" as const,
    },
  ]

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setCurrentPage(1)
    // Fetch immediately with new limit and reset to page 1
    loadDocuments({ page: 1, limit: newLimit })
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

  const handleDeleteSelectedDocuments = async () => {
    if (selectedDocumentIds.length === 0) {
      toast({ title: "Nada seleccionado", description: "Por favor, seleccione al menos un documento para eliminar."  });
      return;
    }

    if (confirm(`¿Está seguro de que desea eliminar ${selectedDocumentIds.length} documento(s) seleccionado(s)? Esta acción no se puede deshacer.`)) {
      try {
        // Assuming user.id is available for updatedById. Adjust if not.
        // If user or user.id is not available, you might need to pass a default or handle it differently in the store.
        const updatedById = user?.id 
        if (!updatedById) {
            toast({ title: "Error de autenticación", description: "No se pudo identificar al usuario para la operación.", variant: "destructive" });
            return;
        }

        await bulkDeleteDocuments({ documentIds: selectedDocumentIds });
        toast({ title: "Éxito", description: `${selectedDocumentIds.length} documento(s) eliminado(s) correctamente.` });
        setSelectedDocumentIds([]);
        loadDocuments(); // Refresh data
      } catch (error: any) {
        console.error("Error eliminando documentos:", error);
        toast({ title: "Error", description: error.response?.data?.message || "Error al eliminar los documentos. Es posible que algunos no se hayan eliminado.", variant: "destructive" });
        loadDocuments(); // Refresh data even on error
      }
    }
  };

  console.log("Render state:", {
    loading,
    error,
    documentsCount: documents.length,
    pagination,
    companyId: company?.id,
  })

  return (
    <>
      {/* Header Section - Título, descripción y botones por fuera */}
      <div className="space-y-4 sm:space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center py-4 sm:py-8 pl-2 sm:pb-2 pb-2">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Documentos</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button size="default" onClick={() => setXmlImportOpen(true)} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Importar XML
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => setSunatValidationOpen(true)}
              disabled={documents.length === 0}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Validación SUNAT</span>
              <span className="sm:hidden">SUNAT</span>
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {documents.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

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

        {/* Documents Table Card */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <div>
                  <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
                    Documentos ({loading ? "..." : pagination.total})
                  </CardTitle>
                  {selectedDocumentIds.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-normal">
                      {selectedDocumentIds.length} documento(s) seleccionado(s)
                    </p>
                  )}
                </div>
              </div>
              {selectedDocumentIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={handleDeleteSelectedDocuments}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Eliminar Seleccionados ({selectedDocumentIds.length})</span>
                  <span className="sm:hidden">Eliminar ({selectedDocumentIds.length})</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const columns: ScrollableTableColumn<any>[] = [
                {
                  key: "select",
                  header: (
                    <Checkbox
                      checked={documents.length > 0 && selectedDocumentIds.length === documents.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDocumentIds(documents.map((d) => d.id))
                        } else {
                          setSelectedDocumentIds([])
                        }
                      }}
                      aria-label="Seleccionar todos los documentos en esta página"
                    />
                  ),
                  className: "w-12 px-2",
                  width: "48px",
                  render: (doc: any) => (
                    <Checkbox
                      checked={selectedDocumentIds.includes(doc.id)}
                      onCheckedChange={(checked) => {
                        setSelectedDocumentIds((prev) =>
                          checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id),
                        )
                      }}
                      aria-label={`Seleccionar documento ${doc.fullNumber}`}
                    />
                  ),
                },
                { key: "type", header: "Tipo", render: (doc: any) => getTypeBadge(doc.documentType) },
                { key: "fullNumber", header: "Serie - Número", className: "font-avenir", render: (doc: any) => doc.fullNumber },
                { key: "issueDate", header: "Fecha Emisión", render: (doc: any) => formatDate(doc.issueDate) },
                { key: "dueDate", header: "Fecha Vencimiento", render: (doc: any) => (doc.dueDate ? formatDate(doc.dueDate) : "-") },
                {
                  key: "supplier",
                  header: "Proveedor",
                  className: "max-w-[200px] truncate",
                  render: (doc: any) => (
                    <span title={doc.supplier?.businessName || ""}>{doc.supplier?.businessName || "Sin proveedor"}</span>
                  ),
                },
                { key: "ruc", header: "RUC", className: "font-avenir", render: (doc: any) => doc.supplier?.documentNumber || "Sin RUC" },
                {
                  key: "subtotal",
                  header: "Subtotal",
                  className: "text-right font-avenir",
                  render: (doc: any) => formatCurrency(doc.subtotal, doc.currency),
                },
                {
                  key: "igv",
                  header: "IGV/ Ret.",
                  className: "text-right font-avenir",
                  render: (doc: any) => formatCurrency(doc.igv, doc.currency),
                },
                {
                  key: "total",
                  header: "Total",
                  className: "text-right font-avenir font-medium",
                  render: (doc: any) => formatCurrency(doc.total, doc.currency),
                },
                {
                  key: "detraction",
                  header: "Detracción",
                  className: "text-right font-avenir",
                  render: (doc: any) =>
                    doc.detraction?.amount && Number.parseFloat(doc.detraction.amount) > 0
                      ? formatCurrency(doc.detraction.amount, doc.currency)
                      : "-",
                },
                {
                  key: "pendingAmount",
                  header: "Pendiente",
                  className: "text-right font-avenir font-medium text-green-600 dark:text-green-400",
                  render: (doc: any) => formatCurrency(doc.pendingAmount, doc.currency),
                },
                { key: "status", header: "Estado", className: "text-center", render: (doc: any) => getStatusBadge(doc.status) },
                {
                  key: "actions",
                  header: "Acciones",
                  className: "text-center",
                  render: (doc: any) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-700/20 dark:focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]

              return (
                <ScrollableTable
                  data={documents}
                  columns={columns}
                  loading={loading}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  emptyTitle="No se encontraron documentos"
                  emptyDescription="No se encontraron documentos con los filtros aplicados."
                  stickyHeader
                />
              )
            })()}
          </CardContent>
        </Card>

        {/* Summary Statistics Cards */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              Resumen de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                  {loading ? "..." : pagination.total}
                </div>
                <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Total Documentos</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-2xl sm:text-3xl font-medium text-amber-600 dark:text-amber-400 mb-2">
                  {loading ? "..." : documents.filter((d) => d.status === "PENDING").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-amber-700 dark:text-amber-300">Pendientes</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                  {loading ? "..." : documents.filter((d) => d.status === "APPROVED").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Aprobados</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl sm:text-3xl font-medium text-green-600 dark:text-green-400 mb-2">
                  {loading ? "..." : documents.filter((d) => d.status === "PAID").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-green-700 dark:text-green-300">Pagados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <XMLImportModal
        open={xmlImportOpen}
        onOpenChange={setXmlImportOpen}
        onImportComplete={loadDocuments}
        companyId={company?.id || ""}
      />
      <SunatValidationDialog
        open={sunatValidationOpen}
        onOpenChange={setSunatValidationOpen}
        documents={documents}
        companyId={company?.id || ""}
        userId={user?.id || ""}
        onValidationComplete={loadDocuments}
      />
    </>
  )
}
