"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Eye, Edit, Plus, Phone, Mail, FileText } from "lucide-react"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import { useAuthStore } from "@/stores/authStore"

export default function SuppliersPage() {
  const router = useRouter()
  const { company } = useAuthStore()
  const [filters, setFilters] = useState({
    search: "",
    documentType: "",
    status: "",
  })

  // Usar el store de proveedores
  const { suppliers, loading, error, fetchSuppliers } = useSuppliersStore()

  // Cargar los proveedores al montar el componente
  useEffect(() => {
    if (company?.id) {
      fetchSuppliers(company.id)
    }
  }, [fetchSuppliers, company])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Activo
          </Badge>
        )
      case "INACTIVE":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Inactivo
          </Badge>
        )
      case "BLOCKED":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Bloqueado
          </Badge>
        )
      case "PENDING_VALIDATION":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Pendiente
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

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "DNI":
        return "DNI"
      case "RUC":
        return "RUC"
      case "CE":
        return "CE"
      default:
        return "Otro"
    }
  }

  const getSupplierTypeName = (type: string) => {
    switch (type) {
      case "PERSONA_NATURAL":
        return "Persona Natural"
      case "PERSONA_JURIDICA":
        return "Persona Jurídica"
      case "EXTRANJERO":
        return "Extranjero"
      default:
        return "Desconocido"
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.businessName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      supplier.documentNumber?.includes(filters.search) ||
      supplier.tradeName?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesStatus = !filters.status || filters.status === "all" || supplier.status === filters.status
    const matchesType =
      !filters.documentType || filters.documentType === "all" || supplier.documentType === filters.documentType

    return matchesSearch && matchesStatus && matchesType
  })

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
        { value: "PENDING_VALIDATION", label: "Pendiente" },
      ],
      className: "min-w-40",
    },
  ]

  if (error) {
    return (
 
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
 
    )
  }

  return (
 
      <div className="space-y-6 ">
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
            <Button size="sm">
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
                Proveedores ({loading ? "..." : filteredSuppliers.length})
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
                      {filteredSuppliers.map((supplier) => (
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
                                onClick={() => router.push(`/suppliers/${supplier.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {/* <Button variant="ghost" size="sm" title="Editar">
                                <Edit className="w-4 h-4" />
                              </Button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredSuppliers.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron proveedores con los filtros aplicados</p>
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
                <p className="text-2xl font-bold">{loading ? "..." : suppliers.length}</p>
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
                  {loading ? "..." : suppliers.filter((s) => s.supplierType === "PERSONA_NATURAL").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Persona Jurídica</p>
                <p className="text-2xl font-bold text-amber-600">
                  {loading ? "..." : suppliers.filter((s) => s.supplierType === "PERSONA_JURIDICA").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
 
  )
}
