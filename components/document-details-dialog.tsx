"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
} from "lucide-react"
import type { Document } from "@/types/documents"

interface DocumentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
}

const getDocumentTypeBadge = (type: string) => {
  const typeConfig: Record<string, { class: string; label: string; icon: any }> = {
    INVOICE: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", label: "Factura", icon: Receipt },
    CREDIT_NOTE: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Nota de Crédito", icon: FileText },
    DEBIT_NOTE: { class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30", label: "Nota de Débito", icon: FileText },
    RECEIPT: { class: "bg-purple-100 text-purple-800 dark:bg-purple-900/30", label: "Recibo", icon: Receipt },
    PURCHASE_ORDER: { class: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30", label: "Orden de Compra", icon: FileText },
    CONTRACT: { class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30", label: "Contrato", icon: FileText },
  }
  
  const config = typeConfig[type] || { class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30", label: type.replace(/_/g, " "), icon: FileText }
  const Icon = config.icon
  return <Badge className={config.class}><Icon className="h-3 w-3 mr-1" />{config.label}</Badge>
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { class: string; icon: any }> = {
    DRAFT: { class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30", icon: Clock },
    PENDING: { class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30", icon: Clock },
    APPROVED: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", icon: CheckCircle },
    REJECTED: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", icon: AlertCircle },
    PAID: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", icon: CheckCircle },
    CANCELLED: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", icon: AlertCircle },
  }
  
  const config = statusConfig[status] || { class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30", icon: Clock }
  const Icon = config.icon
  return <Badge className={config.class}><Icon className="h-3 w-3 mr-1" />{status}</Badge>
}

const formatCurrency = (amount: string | number, currency = "PEN") => {
  if (amount === null || amount === undefined || amount === "") return "-"
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(num)) return "-"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
  }).format(num)
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "-"
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

const formatShortDate = (date: string | Date | null | undefined) => {
  if (!date) return "-"
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function DocumentDetailsDialog({ open, onOpenChange, document }: DocumentDetailsDialogProps) {
  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Detalles del Documento
          </DialogTitle>
          <DialogDescription>
            Información completa del documento seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con información principal */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {document.fullNumber}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {document.documentType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatShortDate(document.issueDate)}
                    </span>
                    {document.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Vence: {formatShortDate(document.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total</div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(document.total, document.currency)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Pendiente: {formatCurrency(document.pendingAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del proveedor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-green-600" />
                  Información del Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800/30 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {document.supplier?.businessName || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {document.supplier?.documentNumber || "Sin documento"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del documento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Detalles del Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Tipo:</span>
                    <div className="mt-1">
                      {getDocumentTypeBadge(document.documentType)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                    <div className="mt-1">
                      {getStatusBadge(document.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Serie:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {document.series}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Número:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {document.number}
                    </p>
                  </div>
                </div>

                {document.description && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Descripción:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {document.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información financiera */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrency(document.subtotal, document.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">IGV:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrency(document.igv, document.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrency(document.total, document.currency)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Monto Pendiente:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrency(document.pendingAmount, document.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Monto Conciliado:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrency(document.conciliatedAmount, document.currency)}
                  </p>
                </div>
              </div>

              {/* Información de retención */}
              {document.hasRetention && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Retención:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(document.retentionAmount, document.currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Porcentaje:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                        {document.retentionPercentage}%
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Neto a Pagar:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(document.netPayableAmount, document.currency)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Información de detracción */}
              {document.detraction?.hasDetraction && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Monto Detracción:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(document.detraction.amount, document.currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                        {document.detraction.isConciliated ? "Conciliada" : "Pendiente"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="h-5 w-5 text-slate-600" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Moneda:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {document.currency}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Tipo de Cambio:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {document.exchangeRate || "1.00"}
                  </p>
                </div>
                {document.receptionDate && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Fecha de Recepción:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {formatDate(document.receptionDate)}
                    </p>
                  </div>
                )}
                {document.paymentMethod && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Método de Pago:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {document.paymentMethod}
                    </p>
                  </div>
                )}
                {document.observations && (
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400">Observaciones:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {document.observations}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            ID: {document.id}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
