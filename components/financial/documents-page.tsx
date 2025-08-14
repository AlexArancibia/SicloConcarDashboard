"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, Eye, Edit, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, CheckCircle } from "lucide-react"
import { useDocumentsStore } from "@/stores/documents-store"
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
import type { DocumentStatus, DocumentType } from "@/types/documents"
import { useAuthStore } from "@/stores/authStore"
import XMLImportModal from "./xml-import-modal"
import { Checkbox } from "../ui/checkbox"
import SunatValidationDialog from "./sunat-validation-dialog"

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
    type: "",
    status: "",
    dateRange: { from: undefined, to: undefined },
    dueDateRange: { from: undefined, to: undefined },
    currency: "",
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
        limit: 1000, // Aumentar límite para validación SUNAT
        ...(filters.search && { search: filters.search }),
        ...(filters.type && filters.type !== "all" && { documentType: filters.type as DocumentType }),
        ...(filters.status && filters.status !== "all" && { status: filters.status as DocumentStatus }),
        ...(filters.dateRange.from && { issueDateFrom: filters.dateRange.from.toISOString().split("T")[0] }),
        ...(filters.dateRange.to && { issueDateTo: filters.dateRange.to.toISOString().split("T")[0] }),
        ...(filters.dueDateRange.from && { dueDateFrom: filters.dueDateRange.from.toISOString().split("T")[0] }),
        ...(filters.dueDateRange.to && { dueDateTo: filters.dueDateRange.to.toISOString().split("T")[0] }),
        ...(filters.currency && filters.currency !== "all" && { currency: filters.currency }),
        ...(filters.minAmount && { minAmount: parseFloat(filters.minAmount) }),
        ...(filters.maxAmount && { maxAmount: parseFloat(filters.maxAmount) }),
        ...(filters.hasRetention !== "all" && { hasRetention: filters.hasRetention === "yes" }),
        ...(filters.hasDetraction !== "all" && { hasDetraction: filters.hasDetraction === "yes" }),
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
    {
      key: "dueDateRange",
      type: "daterange" as const,
      placeholder: "Período de vencimiento",
    },
    {
      key: "currency",
      type: "select" as const,
      placeholder: "Moneda",
      options: [
        { value: "all", label: "Todas" },
        { value: "PEN", label: "PEN" },
        { value: "USD", label: "USD" },
      ],
      className: "min-w-28",
    },
    {
      key: "minAmount",
      type: "search" as const,
      placeholder: "Monto Mín.",
      className: "w-32",
    },
    {
      key: "maxAmount",
      type: "search" as const,
      placeholder: "Monto Máx.",
      className: "w-32",
    },
    {
      key: "hasRetention",
      type: "select" as const,
      placeholder: "Retención",
      options: [
        { value: "all", label: "Ambos" },
        { value: "yes", label: "Sí" },
        { value: "no", label: "No" },
      ],
      className: "min-w-28",
    },
    {
      key: "hasDetraction",
      type: "select" as const,
      placeholder: "Detracción",
      options: [
        { value: "all", label: "Ambos" },
        { value: "yes", label: "Sí" },
        { value: "no", label: "No" },
      ],
      className: "min-w-28",
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSunatValidationOpen(true)}
              disabled={documents.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validación SUNAT
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {documents.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
        </Card>

        {/* Documents Table */}
 
            <div className="flex justify-start items-center font-semibold">
   
                <FileText className="w-5 h-5 mr-2" />
                  Documentos ({loading ? "..." : pagination.total})
                {selectedDocumentIds.length > 0 && (
                  <span className="text-sm text-primary font-medium ml-2">
                    ({selectedDocumentIds.length} seleccionado(s))
                  </span>
                )}
               <div>
                {selectedDocumentIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelectedDocuments}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Seleccionados ({selectedDocumentIds.length})
                  </Button>
                )}
              </div>
            </div>
  
            {loading ? (
              <TableSkeleton rows={8} columns={14} />
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 px-2">
                           <Checkbox
                            checked={
                              documents.length > 0 &&
                              selectedDocumentIds.length === documents.length 
                              // This checks against all loaded documents. 
                              // For true paginated select-all, this logic would need to fetch all IDs or handle server-side.
                              // For now, it selects all on the current page.
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocumentIds(documents.map((d) => d.id))
                              } else {
                                setSelectedDocumentIds([])
                              }
                            }}
                            aria-label="Seleccionar todos los documentos en esta página"
                          />
                        </TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Serie - Número</TableHead>
                        <TableHead>Fecha Emisión</TableHead>
                        <TableHead>Fecha Vencimiento</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>RUC</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">IGV</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Detracción</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={13} className="h-24 text-center">
                            No se encontraron documentos con los filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.map((doc) => (
                          <TableRow 
                            key={doc.id}
                            data-state={selectedDocumentIds.includes(doc.id) && "selected"}
                          >
                            <TableCell className="px-2">
                              <Checkbox
                                checked={selectedDocumentIds.includes(doc.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedDocumentIds((prev) =>
                                    checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id),
                                  )
                                }}
                                aria-label={`Seleccionar documento ${doc.fullNumber}`}
                              />
                            </TableCell>
                            <TableCell>{getTypeBadge(doc.documentType)}</TableCell>
                            <TableCell className="font-mono">{doc.fullNumber}</TableCell>
                            <TableCell>{formatDate(doc.issueDate)}</TableCell>
                            <TableCell>{doc.dueDate ? formatDate(doc.dueDate) : "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={doc.supplier?.businessName || ""}>
                              {doc.supplier?.businessName || "Sin proveedor"}
                            </TableCell>
                            <TableCell className="font-mono">{doc.supplier?.documentNumber || "Sin RUC"}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(doc.subtotal, doc.currency)}
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(doc.igv, doc.currency)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {formatCurrency(doc.total, doc.currency)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {doc.detraction?.amount && Number.parseFloat(doc.detraction.amount) > 0
                                ? formatCurrency(doc.detraction.amount, doc.currency)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(doc.pendingAmount, doc.currency)}
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(doc.status)}</TableCell>
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
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
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
