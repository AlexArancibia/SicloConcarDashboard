"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, X, Code, Copy } from "lucide-react"
import { useConciliationsStore } from "@/stores/conciliation-store"
import { useAuthStore } from "@/stores/authStore"
import type { CreateConciliationDto } from "@/types/conciliations"
import type { Transaction } from "@/types/transactions"
import type { BankAccount } from "@/types/bank-accounts"
import type { Document } from "@/types/documents"
import { toast } from "@/hooks/use-toast"

export function DetractionConciliationDialog({
  open,
  onOpenChange,
  selectedTransaction,
  selectedDocuments,
  documentConciliationAmounts,
  bankAccounts,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTransaction: Transaction | null
  selectedDocuments: Document[]
  documentConciliationAmounts: Record<string, number>
  bankAccounts: BankAccount[]
}) {
  const { user } = useAuthStore()
  const { createConciliation, loading } = useConciliationsStore()

  const [conciliationData, setConciliationData] = useState({
    reference: "",
    notes: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [showPayload, setShowPayload] = useState(false)
  const [payload, setPayload] = useState<CreateConciliationDto | null>(null)

  const totals = useMemo(() => {
    const documentsTotal = selectedDocuments.reduce((sum, doc) => {
      return sum + (documentConciliationAmounts[doc.id] || 0)
    }, 0)

    const transactionAmount = selectedTransaction ? Math.abs(Number.parseFloat(selectedTransaction.amount)) : 0
    const difference = Math.abs(transactionAmount - documentsTotal)
    const isBalanced = difference <= 55

    return {
      documentsTotal,
      transactionAmount,
      difference,
      isBalanced,
    }
  }, [selectedDocuments, selectedTransaction, documentConciliationAmounts])

  const buildPayload = (): CreateConciliationDto => {
  if (!user?.companyId || !selectedTransaction) {
    throw new Error("Información de usuario o transacción no disponible")
  }

  // Obtener los IDs de detracción válidos
  const validDetractionIds = selectedDocuments
    .map(doc => doc.detraction?.id)
    .filter((id): id is string => !!id) // Filtramos solo los IDs que existen

  if (validDetractionIds.length === 0) {
    throw new Error("No se encontraron IDs de detracción válidos en los documentos seleccionados")
  }

    return {
      companyId: user.companyId,
      bankAccountId: selectedTransaction.bankAccountId,
      transactionId: selectedTransaction.id,
      type: "DETRACTIONS",
      reference: conciliationData.reference,
      periodStart: new Date().toISOString().split("T")[0],
      periodEnd: new Date().toISOString().split("T")[0],
      bankBalance: Number.parseFloat(totals.transactionAmount.toFixed(2)),
      bookBalance: Number.parseFloat(totals.documentsTotal.toFixed(2)),
      difference: Number.parseFloat(totals.difference.toFixed(2)),
      toleranceAmount: 5.0,
      status: "COMPLETED",
      totalAmount: Number.parseFloat(totals.documentsTotal.toFixed(2)),
      notes: conciliationData.notes,
      createdById: user.id,
      detractionIds: validDetractionIds,
    }
  }

  const handleSubmit = async () => {
    setError(null)

    try {
      const payload = buildPayload()
      setPayload(payload) // Guardar el payload para inspección
      
      if (!totals.isBalanced) {
        throw new Error(`La diferencia de ${formatCurrency(totals.difference)} excede la tolerancia permitida (S/ 5.00)`)
      }

      await createConciliation(payload)
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      setError(error?.message || "Error al crear la conciliación de detracciones")
    }
  }

  const handleShowPayload = () => {
    try {
      const payload = buildPayload()
      setPayload(payload)
      setShowPayload(true)
    } catch (error: any) {
      setError(error?.message || "Error al construir el payload")
    }
  }

  const handleCopyPayload = () => {
    if (payload) {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      toast({
        title: "Copiado",
        description: "El payload ha sido copiado al portapapeles",
      })
    }
  }

  const resetForm = () => {
    setConciliationData({
      reference: "",
      notes: "",
    })
    setError(null)
    setPayload(null)
  }

  const formatCurrency = (amount: number, currencySymbol = "S/") => {
    return `${currencySymbol} ${amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (!selectedTransaction) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-5">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-between text-lg">
              <span>Conciliación de Detracciones</span>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-12 gap-4 h-[calc(95vh-120px)]">
            {/* Left Column - Transaction Info */}
            <div className="col-span-4 space-y-3">
              <Card className="h-fit">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Información de la Transacción</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">RUC</Label>
                      <div className="font-medium">{selectedTransaction.supplier?.businessName || "No disponible"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mov. Bancario</Label>
                      <div className="font-medium">{selectedTransaction.operationNumber}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha</Label>
                      <div className="font-medium">
                        {new Date(selectedTransaction.transactionDate).toLocaleDateString("es-PE")}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Detracciones</Label>
                      <div className="font-medium">{selectedDocuments.length}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Banco</Label>
                    <div className="font-medium text-xs">
                      {selectedTransaction.bankAccount?.bank?.name || "No disponible"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Resumen
                    {totals.isBalanced ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Transacción:
                      </span>
                      <span className="font-bold">{formatCurrency(totals.transactionAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Detracciones:
                      </span>
                      <span className="font-bold">{formatCurrency(totals.documentsTotal)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Diferencia:</span>
                      <span className={`font-bold ${totals.isBalanced ? "text-green-600" : "text-orange-600"}`}>
                        {formatCurrency(totals.difference)}
                      </span>
                    </div>
                  </div>

                  {!totals.isBalanced && (
                    <Alert className="py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">Diferencia excede tolerancia de S/ 5.00</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div>
                    <Label className="text-xs">Referencia</Label>
                    <Input
                      value={conciliationData.reference}
                      onChange={(e) => setConciliationData((prev) => ({ ...prev, reference: e.target.value }))}
                      placeholder="Referencia"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Observaciones</Label>
                    <Textarea
                      value={conciliationData.notes}
                      onChange={(e) => setConciliationData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observaciones generales"
                      className="text-xs"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Conciliar Detracciones
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleShowPayload}
                      title="Ver payload"
                    >
                      <Code className="h-3 w-3" />
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Documents List */}
            <div className="col-span-8">
              <Card className="h-full">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Documentos con Detracción</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(95vh-180px)]">
                    <div className="p-4 space-y-2">
                      {selectedDocuments.map((document) => {
                        const conciliationAmount = documentConciliationAmounts[document.id] || 0
                        const detractionAmount = document.detraction?.amount || 0

                        return (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-3 border rounded text-xs"
                          >
                            <div>
                              <div className="font-medium">{document.fullNumber}</div>
                              <div className="text-muted-foreground truncate max-w-48">
                                {document.supplier?.businessName}
                              </div>
                              <div className="text-muted-foreground">
                                Emisión: {new Date(document.issueDate).toLocaleDateString("es-PE")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(conciliationAmount)}</div>
                              <div className="text-muted-foreground">de {formatCurrency(Number(detractionAmount))}</div>
                              {document.detraction?.document?.fullNumber && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {document.detraction.document.fullNumber}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payload Inspection Dialog */}
      <Dialog open={showPayload} onOpenChange={setShowPayload}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Payload de Conciliación</span>
              <Button variant="ghost" size="sm" onClick={handleCopyPayload}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <pre className="text-xs overflow-auto">
              {payload ? JSON.stringify(payload, null, 2) : "No hay payload disponible"}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPayload(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}