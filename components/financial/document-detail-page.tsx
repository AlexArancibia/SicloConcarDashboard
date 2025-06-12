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

interface DocumentDetailPageProps {
  documentId: string
}

const documentTypeLabels: Record<DocumentType, string> = {
  FACTURA: "Factura",
  BOLETA: "Boleta",
  NOTA_CREDITO: "Nota de Crédito",
  NOTA_DEBITO: "Nota de Débito",
  RECIBO_HONORARIOS: "Recibo por Honorarios",
  LIQUIDACION: "Liquidación de Compra",
  OTROS: "Otros",
}

const statusLabels: Record<DocumentStatus, string> = {
  PENDING: "Pendiente",
  VALIDATED: "Validado",
  REJECTED: "Rechazado",
  CONCILIATED: "Conciliado",
  PARTIALLY_CONCILIATED: "Parcialmente Conciliado",
  PAID: "Pagado",
  OVERDUE: "Vencido",
  CANCELLED: "Anulado",
}

const statusColors: Record<DocumentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  VALIDATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CONCILIATED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PARTIALLY_CONCILIATED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

export default function DocumentDetailPage({ documentId }: DocumentDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { loading, error, getDocumentById, validateWithSunat, generateCdr, clearError } = useDocumentsStore()

  const [document, setDocument] = useState<Document | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isGeneratingCdr, setIsGeneratingCdr] = useState(false)

  useEffect(() => {
    const loadDocument = async () => {
      if (documentId) {
        const doc = await getDocumentById(documentId)
        setDocument(doc)
      }
    }
    loadDocument()
  }, [documentId, getDocumentById])

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
      const success = await validateWithSunat(document.id)
      if (success) {
        toast({
          title: "Validación exitosa",
          description: "El documento ha sido validado con SUNAT correctamente.",
        })
        // Recargar el documento
        const updatedDoc = await getDocumentById(document.id)
        setDocument(updatedDoc)
      } else {
        toast({
          title: "Error en validación",
          description: "No se pudo validar el documento con SUNAT",
          variant: "destructive",
        })
      }
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

  const handleGenerateCdr = async () => {
    if (!document) return

    setIsGeneratingCdr(true)
    try {
      const cdrPath = await generateCdr(document.id)
      if (cdrPath) {
        toast({
          title: "CDR generado",
          description: `CDR generado exitosamente: ${cdrPath}`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar el CDR",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el CDR",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCdr(false)
    }
  }

  const formatCurrency = (amount: number | null, currency = "PEN") => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCdr}
            disabled={isGeneratingCdr}
            className="flex items-center gap-2"
          >
            {isGeneratingCdr ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Generar CDR
          </Button>
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
                  <p className="font-medium">{document.supplier?.businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RUC/DNI</label>
                  <p className="font-medium">{document.supplier?.documentNumber}</p>
                </div>
                {document.supplier?.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-medium">{document.supplier.email}</p>
                  </div>
                )}
                {document.supplier?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p className="font-medium">{document.supplier.phone}</p>
                  </div>
                )}
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
                      <TableHead className="text-right">IGV</TableHead>
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
                        <TableCell className="text-right">
                          {formatCurrency(line.igvAmount || 0, document.currency)}
                        </TableCell>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IGV:</span>
                  <span className="font-medium">{formatCurrency(document.igv, document.currency)}</span>
                </div>
                {document.otherTaxes && document.otherTaxes > 0 && (
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
                  <span>Monto Neto a Pagar:</span>
                  <span>{formatCurrency(document.netPayableAmount, document.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-orange-600">
                  <span>Monto Pendiente:</span>
                  <span>{formatCurrency(document.pendingAmount, document.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retention & Detraction */}
          {(document.hasRetention || document.hasDetraction) && (
            <Card>
              <CardHeader>
                <CardTitle>Retenciones y Detracciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.hasRetention && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retención ({document.retentionPercentage}%):</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(document.retentionAmount, document.currency)}
                      </span>
                    </div>
                  </div>
                )}
                {document.hasDetraction && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Detracción ({document.detractionPercentage}%):</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(document.detractionAmount, document.currency)}
                      </span>
                    </div>
                    {document.detractionCode && (
                      <p className="text-sm text-muted-foreground">Código: {document.detractionCode}</p>
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
                {document.xmlFileName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Archivo XML</label>
                    <p className="font-medium">{document.xmlFileName}</p>
                  </div>
                )}
                {document.tags && document.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Etiquetas</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
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
