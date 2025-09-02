"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Eye, MoreHorizontal, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react"
import { useDocumentsStore } from "@/stores/documents-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useToast } from "@/hooks/use-toast"
import type { Document, DocumentStatus, DocumentType } from "@/types/documents"
import { useAuthStore } from "@/stores/authStore"

// Helper to format date
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// Helper to format currency
const formatCurrency = (amount: string | number | null | undefined, currency = "PEN") => {
  if (amount === null || amount === undefined) return "-";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const symbol = currency === "USD" ? "$" : "S/";
  return `${symbol} ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Status and Type Badges
const getDocumentStatusBadge = (status?: DocumentStatus) => {
  if (!status) return <Badge variant="outline">Desconocido</Badge>;
  const statusConfig = {
    DRAFT: { class: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", label: "Borrador" },
    PENDING: { class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Pendiente" },
    APPROVED: { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Aprobado" },
    REJECTED: { class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", label: "Rechazado" },
    PAID: { class: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", label: "Pagado" },
    CANCELLED: { class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Cancelado" },
  };
  const config = statusConfig[status] || { class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Desconocido" };
  return <Badge variant="secondary" className={config.class}>{config.label}</Badge>;
}

const getDocumentTypeBadge = (type?: DocumentType) => {
  if (!type) return <Badge variant="outline">N/A</Badge>;
  const typeConfig = {
    INVOICE: { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Factura" },
    CREDIT_NOTE: { class: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", label: "N. Crédito" },
    DEBIT_NOTE: { class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", label: "N. Débito" },
    RECEIPT: { class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Recibo" },
    PURCHASE_ORDER: { class: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20", label: "O. Compra" },
    CONTRACT: { class: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", label: "Contrato" },
  };
  const config = typeConfig[type] || { class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Otro" };
  return <Badge variant="outline" className={config.class}>{config.label}</Badge>;
}

const getDetractionStatusBadge = (paymentDate?: Date | string | null) => {
  if (!paymentDate) {
    return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Pendiente</Badge>;
  }
  return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Pagada</Badge>;
};

export default function DetractionsPage() {
  const { company, user } = useAuthStore();
  const { documents: allDocuments, loading, error, pagination, fetchDocuments, bulkDeleteDocuments, clearError } = useDocumentsStore();
  const { toast } = useToast();

  const [filters, setFilters] = useState<{
    search: string;
    status: string; // DocumentStatus
    dateRange: { from: Date | undefined; to: Date | undefined }; // IssueDate
    detractionStatus: string; // "paid", "pending", "all"
  }>({
    search: "",
    status: "",
    dateRange: { from: undefined, to: undefined },
    detractionStatus: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedDetractionIds, setSelectedDetractionIds] = useState<string[]>([]);

  useEffect(() => {
    if (company?.id) {
      fetchDocuments(company.id, { page: 1, limit: 1000 });
    }
  }, [company?.id, fetchDocuments]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      clearError();
    }
  }, [error, toast, clearError]);

  const detractionDocuments = useMemo(() => {
    return allDocuments
      .filter(doc => doc.detraction?.hasDetraction)
      .filter(doc => {
        let passes = true;
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          passes = passes && Boolean(
            doc.fullNumber?.toLowerCase().includes(searchTerm) ||
            doc.supplier?.businessName?.toLowerCase().includes(searchTerm) ||
            doc.supplier?.documentNumber?.toLowerCase().includes(searchTerm)
          );
        }
        if (filters.status && filters.status !== "all") {
          passes = passes && doc.status === filters.status;
        }
        if (filters.dateRange.from) {
          passes = passes && new Date(doc.issueDate) >= filters.dateRange.from;
        }
        if (filters.dateRange.to) {
          passes = passes && new Date(doc.issueDate) <= filters.dateRange.to;
        }
        if (filters.detractionStatus !== "all") {
          const hasPayment = !!doc.detraction?.paymentDate;
          if (filters.detractionStatus === "paid") {
            passes = passes && hasPayment;
          } else if (filters.detractionStatus === "pending") {
            passes = passes && !hasPayment;
          }
        }
        return passes;
      });
  }, [allDocuments, filters]);

  const paginatedDetractions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return detractionDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [detractionDocuments, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(detractionDocuments.length / itemsPerPage);
  }, [detractionDocuments, itemsPerPage]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const filterConfigs = [
    { key: "search", type: "search" as const, placeholder: "Buscar N°, Proveedor, RUC..." },
    {
      key: "status", type: "select" as const, placeholder: "Estado Documento",
      options: [
        { value: "all", label: "Todos los Estados" },
        { value: "DRAFT", label: "Borrador" },
        { value: "PENDING", label: "Pendiente" },
        { value: "APPROVED", label: "Aprobado" },
        { value: "REJECTED", label: "Rechazado" },
        { value: "PAID", label: "Pagado" },
        { value: "CANCELLED", label: "Cancelado" },
      ],
      className: "min-w-40",
    },
    { key: "dateRange", type: "daterange" as const, placeholder: "Fecha Emisión Doc." },
    {
      key: "detractionStatus", type: "select" as const, placeholder: "Estado Detracción",
      options: [
        { value: "all", label: "Todos" },
        { value: "pending", label: "Pendiente de Pago" },
        { value: "paid", label: "Pagada" },
      ],
      className: "min-w-40",
    },
  ];

  return (
    <>
      {/* Header Section - Título, descripción y botones por fuera */}
      <div className="space-y-4 sm:space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center py-4 sm:py-8 pl-2 sm:pb-2 pb-2">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Detracciones</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualiza y gestiona las detracciones de documentos.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="default" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
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

        {/* Detractions Table Card */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
                Lista de Detracciones ({loading ? "..." : detractionDocuments.length})
              </CardTitle>
              {selectedDetractionIds.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-normal">
                  {selectedDetractionIds.length} detracción(es) seleccionada(s)
                </p>
              )}
            </div>
          </CardHeader>
        <CardContent>
          {loading && paginatedDetractions.length === 0 ? (
            <TableSkeleton rows={itemsPerPage} columns={9} />
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo Doc.</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha Emisión</TableHead>
                      <TableHead className="text-right">Monto Total</TableHead>
                      <TableHead>Cod. Detracción</TableHead>
                      <TableHead className="text-right">Monto Detracción</TableHead>
                      <TableHead>Estado Detracción</TableHead>
                      <TableHead>Fecha Pago Det.</TableHead>
                      <TableHead className="text-center">Estado Doc.</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDetractions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          No se encontraron detracciones con los filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDetractions.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{getDocumentTypeBadge(doc.documentType)}</TableCell>
                          <TableCell className="font-mono">{doc.fullNumber}</TableCell>
                          <TableCell className="max-w-xs truncate" title={doc.supplier?.businessName || ""}>
                            {doc.supplier?.businessName || "N/A"}
                          </TableCell>
                          <TableCell>{formatDate(doc.issueDate)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(doc.total, doc.currency)}</TableCell>
                          <TableCell>{doc.detraction?.code || "-"}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(doc.detraction?.amount, doc.currency)}</TableCell>
                          <TableCell>{getDetractionStatusBadge(doc.detraction?.paymentDate)}</TableCell>
                          <TableCell>{doc.detraction?.paymentDate ? formatDate(doc.detraction.paymentDate) : "-"}</TableCell>
                          <TableCell className="text-center">{getDocumentStatusBadge(doc.status)}</TableCell>
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
                                    <Eye className="mr-2 h-4 w-4" /> Ver Documento
                                  </Link>
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
                <div className="flex items-center justify-end space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({detractionDocuments.length} detracciones)
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
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
            Resumen de Detracciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                {detractionDocuments.length}
              </div>
              <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Total Detracciones</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-2xl sm:text-3xl font-medium text-amber-600 dark:text-amber-400 mb-2">
                {detractionDocuments.filter(doc => !doc.detraction?.paymentDate).length}
              </div>
              <p className="text-xs sm:text-sm font-normal text-amber-700 dark:text-amber-300">Pendientes</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl sm:text-3xl font-medium text-green-600 dark:text-green-400 mb-2">
                {detractionDocuments.filter(doc => doc.detraction?.paymentDate).length}
              </div>
              <p className="text-xs sm:text-sm font-normal text-green-700 dark:text-green-300">Pagadas</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl sm:text-3xl font-medium text-purple-600 dark:text-purple-400 mb-2">
                S/ {detractionDocuments.reduce((sum, doc) => sum + (parseFloat(doc.detraction?.amount || "0") || 0), 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs sm:text-sm font-normal text-purple-700 dark:text-purple-300">Monto Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}