"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Eye,
  DollarSign,
  CreditCard,
  Banknote,
} from "lucide-react"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { useDocumentsStore } from "@/stores/documents-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useAuthStore } from "@/stores/authStore"
import type { Supplier, SupplierType, SupplierStatus } from "@/types"
import type { DocumentStatus } from "@/types"

interface SupplierDetailPageProps {
  id: string
}

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

const DocumentStatusLabels: Record<DocumentStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
}

export default function SupplierDetailPage({ id }: SupplierDetailPageProps) {
  const router = useRouter()
  const { company } = useAuthStore()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)

  const { loading, error, getSupplierById, deleteSupplier } = useSuppliersStore()
  const { documents, getDocumentsBySupplier, clearDocuments } = useDocumentsStore()

  useEffect(() => {
    const fetchSupplier = async () => {
      if (id) {
        const data = await getSupplierById(id)
        if (data) {
          setSupplier(data)
        }
      }
    }

    fetchSupplier()
  }, [id, getSupplierById])

  useEffect(() => {
    const fetchDocuments = async () => {
      if (supplier?.id && company?.id) {
        setDocumentsLoading(true)
        try {
          await getDocumentsBySupplier(company.id, supplier.id, { page: 1, limit: 50 })
        } catch (error) {
          console.error("Error fetching documents:", error)
        } finally {
          setDocumentsLoading(false)
        }
      }
    }

    fetchDocuments()

    // Cleanup documents when component unmounts
    return () => {
      clearDocuments()
    }
  }, [supplier?.id, company?.id, getDocumentsBySupplier, clearDocuments])

  const handleDelete = async () => {
    if (supplier && window.confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      try {
        await deleteSupplier(supplier.id)
        router.push("/suppliers")
      } catch (error) {
        console.error("Error deleting supplier:", error)
      }
    }
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

  const formatCurrency = (amount: string | number, currency = "PEN") => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    const symbol = currency === "USD" ? "$" : "S/"
    return `${symbol} ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDocumentStatusBadge = (status: DocumentStatus) => {
    const statusConfig = {
      DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
      PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      PAID: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      CANCELLED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    }

    return (
      <Badge
        variant="outline"
        className={statusConfig[status] || "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"}
      >
        {DocumentStatusLabels[status] || status}
      </Badge>
    )
  }

  // Calculate document statistics
  const documentStats = {
    total: documents.length,
    totalAmount: documents.reduce((sum, doc) => sum + Number.parseFloat(doc.total), 0),
    currency: documents[0]?.currency || "PEN",
    lastDocument:
      documents.length > 0
        ? documents.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0]
        : null,
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <Button onClick={() => router.push("/suppliers")}>Volver a Proveedores</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">ID de proveedor no válido</div>
            <Button onClick={() => router.push("/suppliers")}>Volver a Proveedores</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/suppliers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detalle de Proveedor</h1>
        </div>
        {supplier && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {loading || !supplier ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={1} columns={3} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={5} columns={2} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Supplier Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full md:w-32 h-32">
                  <Building2 className="w-16 h-16 text-gray-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">{supplier.businessName}</h2>
                    {getStatusBadge(supplier.status)}
                  </div>

                  {supplier.tradeName && <p className="text-gray-600 dark:text-gray-400">{supplier.tradeName}</p>}

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {getDocumentTypeName(supplier.documentType)}: {supplier.documentNumber}
                    </Badge>

                    <Badge variant="outline" className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {getSupplierTypeName(supplier.supplierType)}
                    </Badge>

                    {supplier.isRetentionAgent && (
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      >
                        Agente de Retención
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{supplier.phone || "No registrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{supplier.email || "No registrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {supplier.address
                          ? `${supplier.address}${supplier.district ? `, ${supplier.district}` : ""}`
                          : "No registrado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold">{documentStats.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(documentStats.totalAmount, documentStats.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Último Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Calendar className="w-8 h-8 text-amber-500" />
                  <span className="text-lg font-medium">
                    {documentStats.lastDocument ? formatDate(documentStats.lastDocument.issueDate) : "Sin documentos"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Accounts Section */}
          {supplier.supplierBankAccounts && supplier.supplierBankAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Cuentas Bancarias ({supplier.supplierBankAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplier.supplierBankAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{account.bank?.name || "Banco"}</span>
                        </div>
                        <div className="flex gap-1">
                          {account.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Principal
                            </Badge>
                          )}
                          <Badge variant={account.isActive ? "default" : "secondary"} className="text-xs">
                            {account.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Número:</span>
                          <span className="font-mono">{account.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo:</span>
                          <span>{account.accountType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Moneda:</span>
                          <span>{account.currency}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Detallada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Información Fiscal</h3>
                    <Separator className="my-2" />
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Categoría Tributaria:</dt>
                        <dd className="text-sm">{supplier.taxCategory || "No especificado"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Agente de Retención:</dt>
                        <dd className="text-sm">{supplier.isRetentionAgent ? "Sí" : "No"}</dd>
                      </div>
                      {supplier.isRetentionAgent && supplier.retentionRate && (
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Tasa de Retención:</dt>
                          <dd className="text-sm">{supplier.retentionRate}%</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Condiciones Comerciales</h3>
                    <Separator className="my-2" />
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Límite de Crédito:</dt>
                        <dd className="text-sm">
                          {supplier.creditLimit ? `S/ ${Number(supplier.creditLimit).toFixed(2)}` : "No especificado"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Plazo de Pago:</dt>
                        <dd className="text-sm">
                          {supplier.paymentTerms ? `${supplier.paymentTerms} días` : "No especificado"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación</h3>
                    <Separator className="my-2" />
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Dirección:</dt>
                        <dd className="text-sm">{supplier.address || "No especificado"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Distrito:</dt>
                        <dd className="text-sm">{supplier.district || "No especificado"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Provincia:</dt>
                        <dd className="text-sm">{supplier.province || "No especificado"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Departamento:</dt>
                        <dd className="text-sm">{supplier.department || "No especificado"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">País:</dt>
                        <dd className="text-sm">{supplier.country || "Perú"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fechas</h3>
                    <Separator className="my-2" />
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Fecha de Registro:</dt>
                        <dd className="text-sm">{formatDate(supplier.createdAt)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Última Actualización:</dt>
                        <dd className="text-sm">{formatDate(supplier.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos ({documents.length})</CardTitle>
              <CardDescription>Documentos emitidos por este proveedor</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Tipo</th>
                        <th className="text-left p-3">Número</th>
                        <th className="text-left p-3">Fecha Emisión</th>
                        <th className="text-left p-3">Fecha Vencimiento</th>
                        <th className="text-right p-3">Subtotal</th>
                        <th className="text-right p-3">IGV</th>
                        <th className="text-right p-3">Total</th>
                        <th className="text-center p-3">Estado</th>
                        <th className="text-center p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr key={document.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3">
                            <Badge variant="outline">{document.documentType}</Badge>
                          </td>
                          <td className="p-3 font-mono">{document.fullNumber}</td>
                          <td className="p-3">{formatDate(document.issueDate)}</td>
                          <td className="p-3">{document.dueDate ? formatDate(document.dueDate) : "-"}</td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(document.subtotal, document.currency)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(document.igv, document.currency)}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {formatCurrency(document.total, document.currency)}
                          </td>
                          <td className="p-3 text-center">{getDocumentStatusBadge(document.status)}</td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/documents/${document.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay documentos registrados para este proveedor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
