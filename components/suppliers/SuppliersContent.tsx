'use client'

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Eye, Edit, Plus, Phone, Mail, FileText, ChevronLeft, ChevronRight, Download, ChevronDown } from "lucide-react"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useAuthStore } from "@/stores/authStore"
import type { SupplierType, SupplierStatus } from "@/types/suppliers"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { TableSkeleton } from "../ui/table-skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SupplierTypeLabels: Record<SupplierType, string> = {
  INDIVIDUAL: "Persona Natural",
  COMPANY: "Persona Jurídica",
  GOVERNMENT: "Entidad Gubernamental",
  FOREIGN: "Extranjero",
}

const SupplierStatusLabels: Record<SupplierStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
  PENDING_APPROVAL: "Pendiente",
}

export default function SuppliersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { company } = useAuthStore()
  
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [filters, setFilters] = useState({
    search: "",
    documentType: "",
    status: "",
    supplierType: "",
  })
  const [exporting, setExporting] = useState(false)

  const {
    suppliers,
    loading,
    error,
    pagination,
    fetchSuppliers,
    searchSuppliers,
    getSuppliersByStatusPaginated,
    getSuppliersByTypePaginated,
    clearError,
  } = useSuppliersStore()

  useEffect(() => {
    if (company?.id) {
      loadSuppliers()
    }
  }, [company?.id, currentPage])

  const loadSuppliers = async () => {
    if (!company?.id) return

    const paginationParams = { page: currentPage, limit: 10 }

    try {
      if (filters.search) {
        await searchSuppliers(company.id, filters.search, paginationParams)
      } else if (filters.status && filters.status !== "all") {
        await getSuppliersByStatusPaginated(company.id, filters.status as SupplierStatus, paginationParams)
      } else if (filters.supplierType && filters.supplierType !== "all") {
        await getSuppliersByTypePaginated(company.id, filters.supplierType as SupplierType, paginationParams)
      } else {
        await fetchSuppliers(company.id, paginationParams)
      }
    } catch (err) {
      console.error("Error loading suppliers:", err)
    }
  }

  useEffect(() => {
    if (company?.id) {
      setCurrentPage(1)
      loadSuppliers()
    }
  }, [filters.search, filters.status, filters.supplierType])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const navigateToSupplier = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', currentPage.toString())
    router.push(`/suppliers/${id}?${params.toString()}`)
  }

  const navigateToEdit = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', currentPage.toString())
    router.push(`/suppliers/${id}/edit?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const getStatusBadge = (status: SupplierStatus) => {
    const statusConfig = {
      ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      INACTIVE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      BLOCKED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      PENDING_APPROVAL: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    }

    return (
      <Badge
        variant="secondary"
        className={statusConfig[status] || "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"}
      >
        {SupplierStatusLabels[status] || "Desconocido"}
      </Badge>
    )
  }

  const getDocumentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      DNI: "DNI",
      RUC: "RUC",
      CE: "CE",
      PASSPORT: "Pasaporte",
      OTHER: "Otro",
    }
    return typeMap[type] || "Otro"
  }

  const getSupplierTypeName = (type: SupplierType) => {
    return SupplierTypeLabels[type] || "Desconocido"
  }

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesDocumentType =
        !filters.documentType || filters.documentType === "all" || supplier.documentType === filters.documentType
      return matchesDocumentType
    })
  }, [suppliers, filters.documentType])

  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => 
      a.businessName.localeCompare(b.businessName, 'es', { sensitivity: 'base' }))
  }, [filteredSuppliers])

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "RUC, Razón Social, Nombre...",
      priority: "high" as const,
    },
    {
      key: "documentType",
      type: "select" as const,
      placeholder: "Seleccionar tipo de documento",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "DNI", label: "DNI" },
        { value: "RUC", label: "RUC" },
        { value: "CE", label: "CE" },
        { value: "PASSPORT", label: "Pasaporte" },
      ],
      maxWidth: "min-w-40 max-w-48",
      priority: "medium" as const,
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Seleccionar estado del proveedor",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "ACTIVE", label: "Activo" },
        { value: "INACTIVE", label: "Inactivo" },
        { value: "BLOCKED", label: "Bloqueado" },
        { value: "PENDING_APPROVAL", label: "Pendiente" },
      ],
      maxWidth: "min-w-40 max-w-48",
      priority: "medium" as const,
    },
    {
      key: "supplierType",
      type: "select" as const,
      placeholder: "Seleccionar tipo de proveedor",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "INDIVIDUAL", label: "Persona Natural" },
        { value: "COMPANY", label: "Persona Jurídica" },
        { value: "GOVERNMENT", label: "Entidad Gubernamental" },
        { value: "FOREIGN", label: "Extranjero" },
      ],
      maxWidth: "min-w-40 max-w-48",
      priority: "low" as const,
    },
  ]

  const exportSuppliersToCSV = () => {
    if (!suppliers.length) return

    setExporting(true)
    
    try {
      // Prepare CSV headers - only include fields that exist in the database
      const headers = [
        "Tipo Documento",
        "Número Documento", 
        "Razón Social",
        "Nombre Comercial",
        "Tipo Proveedor",
        "Email",
        "Teléfono",
        "Dirección",
        "Distrito",
        "Provincia",
        "Departamento",
        "País",
        "Estado",
        "Límite de Crédito",
        "Términos de Pago",
        "Categoría Tributaria",
        "Agente de Retención",
        "Tasa de Retención"
      ]

      // Prepare CSV data - only include fields that exist in the database
      const csvData = suppliers.map(supplier => [
        getDocumentTypeName(supplier.documentType),
        supplier.documentNumber,
        supplier.businessName,
        supplier.tradeName || "",
        getSupplierTypeName(supplier.supplierType),
        supplier.email || "",
        supplier.phone || "",
        supplier.address || "",
        supplier.district || "",
        supplier.province || "",
        supplier.department || "",
        supplier.country || "PE",
        SupplierStatusLabels[supplier.status] || "Desconocido",
        supplier.creditLimit ? supplier.creditLimit.toString() : "",
        supplier.paymentTerms ? supplier.paymentTerms.toString() : "",
        supplier.taxCategory || "",
        supplier.isRetentionAgent ? "Sí" : "No",
        supplier.retentionRate ? supplier.retentionRate.toString() : ""
      ])

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `proveedores_${company?.name || 'empresa'}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting suppliers:', error)
    } finally {
      setExporting(false)
    }
  }

  const exportSuppliersToExcel = async () => {
    if (!suppliers.length) return

    setExporting(true)
    
    try {
      // Dynamic import of xlsx library
      const xlsx = await import('xlsx')
      
      // Prepare Excel data - only include fields that exist in the database
      const excelData = suppliers.map(supplier => ({
        'Tipo Documento': getDocumentTypeName(supplier.documentType),
        'Número Documento': supplier.documentNumber,
        'Razón Social': supplier.businessName,
        'Nombre Comercial': supplier.tradeName || "",
        'Tipo Proveedor': getSupplierTypeName(supplier.supplierType),
        'Email': supplier.email || "",
        'Teléfono': supplier.phone || "",
        'Dirección': supplier.address || "",
        'Distrito': supplier.district || "",
        'Provincia': supplier.province || "",
        'Departamento': supplier.department || "",
        'País': supplier.country || "PE",
        'Estado': SupplierStatusLabels[supplier.status] || "Desconocido",
        'Límite de Crédito': supplier.creditLimit || "",
        'Términos de Pago': supplier.paymentTerms || "",
        'Categoría Tributaria': supplier.taxCategory || "",
        'Agente de Retención': supplier.isRetentionAgent ? "Sí" : "No",
        'Tasa de Retención': supplier.retentionRate || ""
      }))

      // Create workbook and worksheet
      const wb = xlsx.utils.book_new()
      const ws = xlsx.utils.json_to_sheet(excelData)

      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...excelData.map(row => String(row[key as keyof typeof row]).length))
      }))
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(wb, ws, "Proveedores")

      // Generate Excel file
      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `proveedores_${company?.name || 'empresa'}_${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting suppliers to Excel:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleExport = (format: 'csv' | 'excel') => {
    if (format === 'csv') {
      exportSuppliersToCSV()
    } else if (format === 'excel') {
      exportSuppliersToExcel()
    }
  }

  const handleExportWithFilters = async (format: 'csv' | 'excel') => {
    setExporting(true)
    
    try {
      // Check if any filters are applied
      const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all')
      
      if (hasActiveFilters && company?.id) {
        // Use backend export with filters
        await useSuppliersStore.getState().exportSuppliers(company.id, format, filters)
      } else {
        // Use frontend export
        handleExport(format)
      }
    } catch (error) {
      console.error('Error exporting with filters:', error)
      // Fall back to frontend export
      handleExport(format)
    } finally {
      setExporting(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <Button
              onClick={() => {
                clearError()
                loadSuppliers()
              }}
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header Section - Título, descripción y botones por fuera */}
      <div className="space-y-4 sm:space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center py-4 sm:py-8 pl-2 sm:pb-2 pb-2">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Proveedores</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Administre la información de sus proveedores y emisores
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="default" 
                  disabled={exporting || suppliers.length === 0}
                  className="w-full sm:w-auto"
                >
                  {exporting ? (
                    <>
                      <Download className="w-4 h-4 mr-2 animate-pulse" />
                      <span className="hidden sm:inline">Exportando...</span>
                      <span className="sm:hidden">Exportando</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Exportar</span>
                      <span className="sm:hidden">Exportar</span>
                    </>
                  )}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportWithFilters('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportWithFilters('excel')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="default" onClick={() => router.push("/suppliers/new")} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Proveedor</span>
              <span className="sm:hidden">Nuevo</span>
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

        {/* Suppliers Table Card */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
                Proveedores ({loading ? "..." : pagination.total})
              </CardTitle>
            </div>
          </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} columns={8} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Tipo Doc.</th>
                      <th className="text-left p-3">Número Documento</th>
                      <th className="text-left p-3">Razón Social</th>
                      <th className="text-left p-3">Nombre Comercial</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">Contacto</th>
                      <th className="text-center p-3">Estado</th>
                      <th className="text-center p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          <Badge variant="outline">{getDocumentTypeName(supplier.documentType)}</Badge>
                        </td>
                        <td className="p-3 font-mono">{supplier.documentNumber}</td>
                        <td className="p-3 max-w-48 truncate" title={supplier.businessName}>
                          {supplier.businessName}
                        </td>
                        <td className="p-3 max-w-32 truncate" title={supplier.tradeName || ""}>
                          {supplier.tradeName || "-"}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {getSupplierTypeName(supplier.supplierType)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3" />
                                <span className="truncate max-w-24" title={supplier.phone}>
                                  {supplier.phone}
                                </span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-24" title={supplier.email}>
                                  {supplier.email}
                                </span>
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-gray-400 text-xs">Sin contacto</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">{getStatusBadge(supplier.status)}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Ver detalles"
                              onClick={() => navigateToSupplier(supplier.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar"
                              onClick={() => navigateToEdit(supplier.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sortedSuppliers.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron proveedores con los filtros aplicados</p>
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} proveedores
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

        {/* Summary Statistics Cards */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              Resumen de Proveedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                  {loading ? "..." : pagination.total}
                </div>
                <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Total Proveedores</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl sm:text-3xl font-medium text-green-600 dark:text-green-400 mb-2">
                  {loading ? "..." : suppliers.filter((s) => s.status === "ACTIVE").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-green-700 dark:text-green-300">Activos</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                  {loading ? "..." : suppliers.filter((s) => s.supplierType === "INDIVIDUAL").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Persona Natural</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-2xl sm:text-3xl font-medium text-amber-600 dark:text-amber-400 mb-2">
                  {loading ? "..." : suppliers.filter((s) => s.supplierType === "COMPANY").length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-amber-700 dark:text-amber-300">Persona Jurídica</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}