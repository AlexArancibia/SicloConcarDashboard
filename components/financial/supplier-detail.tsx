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
} from "lucide-react"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { useDocumentsStore } from "@/stores/documents-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import type { Supplier } from "@/types/suppliers"
import type { Document } from "@/types/documents"

interface SupplierDetailPageProps {
  id: string
}

export default function SupplierDetailPage({ id }: SupplierDetailPageProps) {
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)

  const { loading, error, getSupplierById } = useSuppliersStore()
  const { getDocumentsBySupplier } = useDocumentsStore()

  useEffect(() => {
    const fetchSupplier = async () => {
      const data = await getSupplierById(id)
      if (data) {
        setSupplier(data)
      }
    }

    fetchSupplier()
  }, [id, getSupplierById])

  useEffect(() => {
    const fetchDocuments = async () => {
      if (supplier?.id) {
        setDocumentsLoading(true)
        try {
          const docs = await getDocumentsBySupplier(supplier.id)
          setDocuments(docs)
        } catch (error) {
          console.error("Error fetching documents:", error)
        } finally {
          setDocumentsLoading(false)
        }
      }
    }

    fetchDocuments()
  }, [supplier?.id, getDocumentsBySupplier])

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
            Pendiente de Validación
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

  const formatCurrency = (amount: string | number, currency = "PEN") => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    const symbol = currency === "USD" ? "$" : "S/"
    return `${symbol} ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "PAID":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            Pagado
          </Badge>
        )
      case "OVERDUE":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Vencido
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
            {status}
          </Badge>
        )
    }
  }

  if (error) {
    return (
 
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
 
    )
  }

  return (
 
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detalle de Proveedor</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
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
                        <span>{supplier.phone || "No registrado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{supplier.email || "No registrado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>
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
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <span className="text-2xl font-bold">{documents.length}</span>
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
                      {documents.length > 0
                        ? formatCurrency(
                            documents.reduce((sum, doc) => sum + doc.total, 0),
                            documents[0]?.currency || "PEN",
                          )
                        : "S/ 0.00"}
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
                      {documents.length > 0
                        ? formatDate(
                            documents.sort(
                              (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
                            )[0].issueDate,
                          )
                        : "Sin documentos"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div> */}

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
                          <dd>{supplier.taxCategory || "No especificado"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Agente de Retención:</dt>
                          <dd>{supplier.isRetentionAgent ? "Sí" : "No"}</dd>
                        </div>
                        {supplier.isRetentionAgent && supplier.retentionRate && (
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium">Tasa de Retención:</dt>
                            <dd>{supplier.retentionRate}%</dd>
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
                          <dd>
                            {supplier.creditLimit ? `S/ ${Number(supplier.creditLimit).toFixed(2)}` : "No especificado"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Plazo de Pago:</dt>
                          <dd>{supplier.paymentTerms ? `${supplier.paymentTerms} días` : "No especificado"}</dd>
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
                          <dd>{supplier.address || "No especificado"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Distrito:</dt>
                          <dd>{supplier.district || "No especificado"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Provincia:</dt>
                          <dd>{supplier.province || "No especificado"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Departamento:</dt>
                          <dd>{supplier.department || "No especificado"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">País:</dt>
                          <dd>{supplier.country || "Perú"}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fechas</h3>
                      <Separator className="my-2" />
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Fecha de Registro:</dt>
                          <dd>{formatDate(supplier.createdAt)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium">Última Actualización:</dt>
                          <dd>{formatDate(supplier.updatedAt)}</dd>
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
                            <td className="p-3">{formatDate(document.dueDate || "")}</td>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/documents/${document.id}`)}
                              >
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
