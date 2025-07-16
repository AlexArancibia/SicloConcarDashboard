"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Eye, Edit, Plus, Phone, Mail, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useAuthStore } from "@/stores/authStore"
import type { SupplierType, SupplierStatus } from "@/types/suppliers"
import { useSuppliersStore } from "@/stores/suppliers-store"

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

export default function SuppliersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { company } = useAuthStore()
  
  // Obtener la página de los query params o usar 1 por defecto
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [filters, setFilters] = useState({
    search: "",
    documentType: "",
    status: "",
    supplierType: "",
  })

  // Usar el store de proveedores actualizado
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

  // Cargar los proveedores al montar el componente
  useEffect(() => {
    if (company?.id) {
      loadSuppliers()
    }
  }, [company?.id, currentPage])

  // Función para cargar proveedores según filtros
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

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (company?.id) {
      setCurrentPage(1) // Reset to first page when filters change
      loadSuppliers()
    }
  }, [filters.search, filters.status, filters.supplierType])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Función para navegar a un proveedor manteniendo la página actual
  const navigateToSupplier = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', currentPage.toString())
    router.push(`/suppliers/${id}?${params.toString()}`)
  }

  // Función para navegar a la edición manteniendo la página actual
  const navigateToEdit = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', currentPage.toString())
    router.push(`/suppliers/${id}/edit?${params.toString()}`)
  }

  // Modificar las funciones de cambio de página para actualizar la URL
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

  // Filter suppliers locally for document type (since this isn't handled by backend)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesDocumentType =
        !filters.documentType || filters.documentType === "all" || supplier.documentType === filters.documentType
      return matchesDocumentType
    })
  }, [suppliers, filters.documentType])

  // Ordenar los proveedores alfabéticamente por razón social
  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => 
      a.businessName.localeCompare(b.businessName, 'es', { sensitivity: 'base' }))
  }, [filteredSuppliers])

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "RUC, Razón Social, Nombre...",
    },
    {
      key: "documentType",
      type: "select" as const,
      placeholder: "Tipo de documento",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "DNI", label: "DNI" },
        { value: "RUC", label: "RUC" },
        { value: "CE", label: "CE" },
        { value: "PASSPORT", label: "Pasaporte" },
      ],
      className: "min-w-40",
    },
    {
      key: "status",
      type: "select" as const,
      placeholder: "Estado del proveedor",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "ACTIVE", label: "Activo" },
        { value: "INACTIVE", label: "Inactivo" },
        { value: "BLOCKED", label: "Bloqueado" },
        { value: "PENDING_APPROVAL", label: "Pendiente" },
      ],
      className: "min-w-40",
    },
    {
      key: "supplierType",
      type: "select" as const,
      placeholder: "Tipo de proveedor",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "INDIVIDUAL", label: "Persona Natural" },
        { value: "COMPANY", label: "Persona Jurídica" },
        { value: "GOVERNMENT", label: "Entidad Gubernamental" },
        { value: "FOREIGN", label: "Extranjero" },
      ],
      className: "min-w-40",
    },
  ]

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Proveedores</h1>
          <p className="text-gray-600 dark:text-gray-400">Administre la información de sus proveedores y emisores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => router.push("/suppliers/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Proveedores ({loading ? "..." : pagination.total})
            </div>
          </CardTitle>
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

              {/* Pagination */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Proveedores</p>
              <p className="text-2xl font-bold">{loading ? "..." : pagination.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? "..." : suppliers.filter((s) => s.status === "ACTIVE").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Persona Natural</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? "..." : suppliers.filter((s) => s.supplierType === "INDIVIDUAL").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Persona Jurídica</p>
              <p className="text-2xl font-bold text-amber-600">
                {loading ? "..." : suppliers.filter((s) => s.supplierType === "COMPANY").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}