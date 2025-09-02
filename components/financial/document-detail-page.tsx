"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useDocumentsStore } from "@/stores/documents-store"
import type { DocumentStatus, DocumentType, Document } from "@/types/documents"
import { useAuthStore } from "@/stores/authStore"
import { JsonViewerDialog } from "@/components/ui/json-viewer-dialog"

interface DocumentDetailPageProps {
  params: {
    id: string
  }
}

const documentTypeLabels: Record<DocumentType, string> = {
  INVOICE: "Factura",
  CREDIT_NOTE: "Nota de Crédito",
  DEBIT_NOTE: "Nota de Débito",
  RECEIPT: "Recibo por Honorarios",
  PURCHASE_ORDER: "Orden de Compra",
  CONTRACT: "Contrato",
}

const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
}

const statusColors: Record<DocumentStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { company } = useAuthStore()
  const { loading, error, getDocumentById, clearError } = useDocumentsStore()

  const [document, setDocument] = useState<Document | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    const loadDocument = async () => {
      if (params.id) {
        console.log("🔍 Cargando documento con ID:", params.id)
        const doc = await getDocumentById(params.id)
        console.log("📄 Documento cargado:", doc)
        setDocument(doc)
      }
    }
    loadDocument()
  }, [params.id, getDocumentById])

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

  const handleValidateSunat = async () => {
    if (!document) return

    setIsValidating(true)
    try {
      // Esta funcionalidad se implementará más adelante
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La validación con SUNAT estará disponible próximamente.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la validación con SUNAT",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const formatCurrency = (amount: string | number | null, currency = "PEN") => {
    if (amount === null || amount === undefined) return "-"
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    const symbol = currency === "USD" ? "$" : "S/"
    return `${symbol} ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatPercentage = (percentage: string | number | null) => {
    if (percentage === null || percentage === undefined) return "-"
    const numPercentage = typeof percentage === "string" ? Number.parseFloat(percentage) : percentage
    // Si el porcentaje está en formato 0-1, multiplicar por 100
    const displayPercentage = numPercentage < 1 ? numPercentage * 100 : numPercentage
    return `${displayPercentage.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudo cargar el documento. Verifique que el ID sea correcto.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document.fullNumber}</h1>
            <p className="text-muted-foreground">{documentTypeLabels[document.documentType]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusColors[document.status]}>{statusLabels[document.status]}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateSunat}
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Validar SUNAT
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
          <JsonViewerDialog
            title={`Documento ${document?.series}-${document?.number}`}
            description="Visualiza todos los datos del documento en formato JSON"
            data={document}
            size="xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información del Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Serie</label>
                  <p className="font-medium">{document.series}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número</label>
                  <p className="font-medium">{document.number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Emisión</label>
                  <p className="font-medium">{formatDate(document.issueDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</label>
                  <p className="font-medium">{formatDate(document.dueDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                  <p className="font-medium">{document.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Cambio</label>
                  <p className="font-medium">{document.exchangeRate || "-"}</p>
                </div>
              </div>

              {document.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="font-medium">{document.description}</p>
                </div>
              )}

              {document.observations && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observaciones</label>
                  <p className="font-medium">{document.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información del Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Razón Social</label>
                  <p className="font-medium">{document.supplier?.businessName || "Sin información"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RUC/DNI</label>
                  <p className="font-medium">{document.supplier?.documentNumber || "Sin información"}</p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Document Lines */}
          {document.lines && document.lines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Líneas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      {/* ✅ Ocultar columna IGV para documentos tipo RECEIPT ya que no generan IGV */}
                      {document.documentType !== "RECEIPT" && (
                        <TableHead className="text-right">IGV</TableHead>
                      )}
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {document.lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{line.description}</p>
                            {line.productCode && (
                              <p className="text-sm text-muted-foreground">Código: {line.productCode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(line.unitPrice, document.currency)}
                        </TableCell>
                        {/* ✅ Ocultar celda IGV para documentos tipo RECEIPT ya que no generan IGV */}
                        {document.documentType !== "RECEIPT" && (
                          <TableCell className="text-right">
                            {formatCurrency(line.igvAmount || 0, document.currency)}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-medium">
                          {formatCurrency(line.lineTotal, document.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(document.subtotal, document.currency)}</span>
                </div>
                {/* ✅ Ocultar IGV para documentos tipo RECEIPT ya que no generan IGV */}
                {document.documentType !== "RECEIPT" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGV:</span>
                    <span className="font-medium">{formatCurrency(document.igv, document.currency)}</span>
                  </div>
                )}
                {document.otherTaxes && Number.parseFloat(document.otherTaxes) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Otros Impuestos:</span>
                    <span className="font-medium">{formatCurrency(document.otherTaxes, document.currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(document.total, document.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>Neto a Pagar:</span>
                  <span>{formatCurrency(document.netPayableAmount, document.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-orange-600">
                  <span>Pendiente:</span>
                  <span>{formatCurrency(document.pendingAmount, document.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retention & Detraction */}
          {(document.hasRetention || document.detraction?.hasDetraction) && (
            <Card>
              <CardHeader>
                <CardTitle>Retenciones y Detracciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.hasRetention && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Retención ({formatPercentage(document.retentionPercentage)}):
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(document.retentionAmount, document.currency)}
                      </span>
                    </div>
                  </div>
                )}
                {document.detraction?.hasDetraction && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Detracción ({formatPercentage(document.detraction.percentage)}):
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(document.detraction.amount, document.currency)}
                      </span>
                    </div>
                    {document.detraction.code && (
                      <p className="text-sm text-muted-foreground">Código: {document.detraction.code}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Recepción</label>
                  <p className="font-medium">{formatDate(document.receptionDate)}</p>
                </div>
                {document.xmlData?.xmlFileName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Archivo XML</label>
                    <p className="font-medium">{document.xmlData.xmlFileName}</p>
                  </div>
                )}
                {document.tags && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Etiquetas</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.tags.split(",").map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actualizado</label>
                  <p className="font-medium">{formatDate(document.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
