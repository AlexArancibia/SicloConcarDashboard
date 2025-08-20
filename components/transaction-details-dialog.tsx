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
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import type { Transaction } from "@/types/transactions"

interface TransactionDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

const getTransactionTypeBadge = (type: string) => {
  const typeConfig: Record<string, { class: string; label: string }> = {
    // INCOME
    INCOME_SALARY: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Haber" },
    INCOME_BONUS: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Bono" },
    INCOME_INTEREST: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Interés" },
    INCOME_SALES: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Venta" },
    INCOME_SERVICES: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Servicio" },
    INCOME_TRANSFER: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Transferencia" },
    INCOME_REFUND: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Reembolso" },
    
    // EXPENSE
    PAYROLL_SALARY: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Sueldo" },
    PAYROLL_CTS: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "CTS" },
    PAYROLL_BONUS: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Gratificación" },
    PAYROLL_AFP: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "AFP" },
    TAX_PAYMENT: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Impuesto" },
    TAX_DETRACTION: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Detracción" },
    EXPENSE_UTILITIES: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Servicio" },
    EXPENSE_PURCHASE: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Compra" },
    TRANSFER_INBANK: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", label: "Transferencia" },
    TRANSFER_EXTERNAL: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", label: "Transfer. Ext" },
    WITHDRAWAL_CASH: { class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30", label: "Retiro" },
  }
  
  const config = typeConfig[type] || { class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30", label: type.replace(/_/g, " ") }
  return <Badge className={config.class}>{config.label}</Badge>
}

const getAmountIndicator = (amount: string) => {
  const numAmount = Number.parseFloat(amount)
  if (numAmount > 0) return { icon: TrendingUp, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-800/30" }
  if (numAmount < 0) return { icon: TrendingDown, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-800/30" }
  return { icon: Minus, color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-50 dark:bg-gray-800" }
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

export function TransactionDetailsDialog({ open, onOpenChange, transaction }: TransactionDetailsDialogProps) {
  if (!transaction) return null

  const AmountIcon = getAmountIndicator(transaction.amount).icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Detalles de la Transacción
          </DialogTitle>
          <DialogDescription>
            Información completa de la transacción bancaria seleccionada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con información principal */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {transaction.description}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      {transaction.operationNumber || "Sin número"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatShortDate(transaction.transactionDate)}
                    </span>
                    {transaction.operationTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {transaction.operationTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Monto</div>
                  <div className={`text-3xl font-bold ${getAmountIndicator(transaction.amount).color}`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Saldo: {formatCurrency(transaction.balance)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información de la cuenta bancaria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Cuenta Bancaria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {transaction.bankAccount?.alias || "Sin alias"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {transaction.bankAccount?.bank?.name} ({transaction.bankAccount?.bank?.code})
                      {transaction.bankAccount?.bank?.country && ` • ${transaction.bankAccount.bank.country}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {transaction.bankAccount?.accountNumber}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Tipo de Cuenta:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {transaction.bankAccount?.accountType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Moneda:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {transaction.bankAccount?.currencyRef?.code || "N/A"}
                    </p>
                  </div>
                  {transaction.bankAccount?.description && (
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400">Descripción:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {transaction.bankAccount.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de la transacción */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Detalles de la Transacción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Tipo:</span>
                    <div className="mt-1">
                      {getTransactionTypeBadge(transaction.transactionType)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {transaction.status || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Referencia:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {transaction.reference || "Sin referencia"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Canal:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {transaction.channel || "N/A"}
                    </p>
                  </div>
                </div>

                {transaction.branch && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Sucursal:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {transaction.branch}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
                  <span className="text-slate-500 dark:text-slate-400">Fecha de Valor:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {transaction.valueDate ? formatDate(transaction.valueDate) : "Misma fecha"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Hora de Operación:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {transaction.operationTime || "No especificada"}
                  </p>
                </div>
                {transaction.operatorUser && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Usuario Operador:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {transaction.operatorUser}
                    </p>
                  </div>
                )}
                {transaction.utc && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">UTC:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {transaction.utc}
                    </p>
                  </div>
                )}
                {transaction.fileName && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Archivo:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {transaction.fileName}
                    </p>
                  </div>
                )}
                {transaction.importedAt && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Importado el:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {formatDate(transaction.importedAt)}
                    </p>
                  </div>
                )}
                {transaction.transactionHash && (
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400">Hash de Transacción:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1 font-mono text-xs break-all">
                      {transaction.transactionHash}
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
            ID: {transaction.id}
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
