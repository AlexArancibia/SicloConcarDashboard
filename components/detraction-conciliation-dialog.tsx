"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, X, Plus, Trash2, Code } from "lucide-react"
import { useConciliationsStore } from "@/stores/conciliation-store"
import { useAuthStore } from "@/stores/authStore"
import { useAccountingAccountsStore } from "@/stores/accounting-accounts-store"
import type { CreateConciliationDto, ExpenseType } from "@/types/conciliations"
import type { Transaction } from "@/types/transactions"
import type { BankAccount } from "@/types/bank-accounts"
import type { Document } from "@/types/documents"

interface ConciliationExpense {
  id: string
  description: string
  amount: number
  expenseType: ExpenseType
  accountId?: string
  notes?: string
  isTaxDeductible: boolean
}

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
  const { accountingAccounts, fetchAccountingAccounts } = useAccountingAccountsStore()

  const [conciliationData, setConciliationData] = useState({
    reference: "",
    notes: "",
  })
  const [expenses, setExpenses] = useState<ConciliationExpense[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showPayload, setShowPayload] = useState(false)

  // Cargar cuentas contables cuando se abre el diálogo
  useEffect(() => {
    if (open && user?.companyId) {
      fetchAccountingAccounts(user.companyId, { page: 1, limit: 1000 })
    }
  }, [open, user?.companyId])

  const totals = useMemo(() => {
    const documentsTotal = selectedDocuments.reduce((sum, doc) => {
      return sum + (documentConciliationAmounts[doc.id] || 0)
    }, 0)

    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const transactionAmount = selectedTransaction ? Math.abs(Number.parseFloat(selectedTransaction.amount)) : 0
    const difference = Math.abs(transactionAmount - (documentsTotal + expensesTotal))
    const isBalanced = difference <= 5.0

    return {
      documentsTotal,
      expensesTotal,
      transactionAmount,
      difference,
      isBalanced,
      totalConciliated: documentsTotal + expensesTotal,
    }
  }, [selectedDocuments, selectedTransaction, documentConciliationAmounts, expenses])

  const generatePayload = (): CreateConciliationDto => {
    return {
      companyId: user?.companyId || "",
      bankAccountId: selectedTransaction?.bankAccountId || "",
      transactionId: selectedTransaction?.id || "",
      type: "DETRACTIONS",
      reference: conciliationData.reference,
      periodStart: new Date().toISOString().split("T")[0],
      periodEnd: new Date().toISOString().split("T")[0],
      totalDocuments: selectedDocuments.length,
      bankBalance: Number.parseFloat(totals.transactionAmount.toFixed(2)),
      bookBalance: Number.parseFloat(totals.documentsTotal.toFixed(2)),
      difference: Number.parseFloat(totals.difference.toFixed(2)),
      toleranceAmount: 5.0,
      status: "COMPLETED",
      additionalExpensesTotal: Number.parseFloat(totals.expensesTotal.toFixed(2)),
      totalAmount: Number.parseFloat(totals.totalConciliated.toFixed(2)),
      notes: conciliationData.notes,
      createdById: user?.id || "",
      detractionIds: selectedDocuments
        .map(doc => doc.detraction?.id)
        .filter((id): id is string => id !== undefined),
      expenses: expenses.map((expense) => ({
        description: expense.description,
        amount: Number.parseFloat(expense.amount.toFixed(2)),
        expenseType: expense.expenseType,
        accountId: expense.accountId,
        notes: expense.notes,
        isTaxDeductible: expense.isTaxDeductible,
        supportingDocument: "",
        expenseDate: new Date(),
      })),
    }
  }

  const addExpense = () => {
    const newExpense: ConciliationExpense = {
      id: `temp_${Date.now()}`,
      description: "",
      amount: totals.difference,
      expenseType: "FINANCIAL",
      isTaxDeductible: false,
    }
    setExpenses((prev) => [...prev, newExpense])
  }

  const updateExpense = (id: string, field: keyof ConciliationExpense, value: any) => {
    setExpenses((prev) => prev.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)))
  }

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
  }

  const handleSubmit = async () => {
    setError(null)

    if (!user?.companyId || !selectedTransaction) {
      setError("Información de usuario o transacción no disponible")
      return
    }

    if (!totals.isBalanced) {
      setError(`La diferencia de ${formatCurrency(totals.difference)} excede la tolerancia permitida (S/ 5.00)`)
      return
    }

    try {
      await createConciliation(generatePayload())
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      setError(error?.message || "Error al crear la conciliación de detracciones")
    }
  }

  const resetForm = () => {
    setConciliationData({
      reference: "",
      notes: "",
    })
    setExpenses([])
    setError(null)
    setShowPayload(false)
  }

  const formatCurrency = (amount: number, currencySymbol = "S/") => {
    return `${currencySymbol} ${amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (!selectedTransaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span>Conciliación de Detracciones</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPayload(!showPayload)}
                className="flex items-center gap-1"
              >
                <Code className="h-3 w-3" />
                <span className="text-xs">Ver Payload</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {showPayload ? (
          <div className="h-[calc(95vh-120px)] bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Payload que se enviará</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(generatePayload(), null, 2))}
                className="h-7 text-xs"
              >
                Copiar
              </Button>
            </div>
            <ScrollArea className="h-[calc(95vh-160px)] border rounded bg-white p-2">
              <pre className="text-xs">
                {JSON.stringify(generatePayload(), null, 2)}
              </pre>
            </ScrollArea>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 h-[calc(95vh-120px)]">
            {/* Left Column - Transaction Info */}
            <div className="col-span-4 space-y-3">
              <Card className="h-fit">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Información de la Transacción</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Proveedor</Label>
                      <div className="font-medium">
                        {selectedDocuments.length > 0 
                          ? `${selectedDocuments[0].supplier?.businessName || 'N/A'} (${selectedDocuments[0].supplier?.documentNumber || 'N/A'})`
                          : "No disponible"
                        }
                      </div>
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
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        Gastos adicionales:
                      </span>
                      <span className="font-bold">{formatCurrency(totals.expensesTotal)}</span>
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
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Conciliado:</span>
                      <span className="font-bold">{formatCurrency(totals.totalConciliated)}</span>
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

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Documents List and Expenses */}
            <div className="col-span-8">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {/* Documents Section */}
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm">Documentos con Detracción</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
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
                        </CardContent>
                      </Card>

                      {/* Expenses Section */}
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">Gasto sin documento</CardTitle>
                            <Button onClick={addExpense} size="sm" variant="outline" className="h-7 text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="p-4 space-y-2">
                            {expenses.map((expense) => (
                              <div key={expense.id} className="p-3 border rounded space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Tipo de Gasto</Label>
                                    <Select
                                      value={expense.expenseType}
                                      onValueChange={(value) => updateExpense(expense.id, "expenseType", value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="FINANCIAL" className="text-xs">Financiero</SelectItem>
                                        <SelectItem value="OPERATIONAL" className="text-xs">Operacional</SelectItem>
                                        <SelectItem value="ADMINISTRATIVE" className="text-xs">Administrativo</SelectItem>
                                        <SelectItem value="TAX" className="text-xs">Tributario</SelectItem>
                                        <SelectItem value="OTHER" className="text-xs">Otro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Cuenta Contable</Label>
                                    <Select
                                      value={expense.accountId || ""}
                                      onValueChange={(value) => updateExpense(expense.id, "accountId", value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Seleccionar cuenta" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {accountingAccounts.map((account) => (
                                          <SelectItem key={account.id} value={account.id} className="text-xs">
                                            {account.accountCode} - {account.accountName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Monto</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={expense.amount}
                                      onChange={(e) =>
                                        updateExpense(expense.id, "amount", Number.parseFloat(e.target.value) || 0)
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2 pt-6">
                                    <input
                                      type="checkbox"
                                      id={`tax-deductible-${expense.id}`}
                                      checked={expense.isTaxDeductible}
                                      onChange={(e) => updateExpense(expense.id, "isTaxDeductible", e.target.checked)}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`tax-deductible-${expense.id}`} className="text-xs">
                                      Deducible
                                    </Label>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Descripción</Label>
                                  <Input
                                    value={expense.description}
                                    onChange={(e) => updateExpense(expense.id, "description", e.target.value)}
                                    placeholder="Descripción del gasto"
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <Label className="text-xs">Observaciones</Label>
                                    <Textarea
                                      value={expense.notes || ""}
                                      onChange={(e) => updateExpense(expense.id, "notes", e.target.value)}
                                      placeholder="Observaciones adicionales"
                                      className="text-xs"
                                      rows={2}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExpense(expense.id)}
                                    className="h-8 w-8 p-0 ml-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {expenses.length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-xs">
                                <p>No hay gastos adicionales</p>
                                <p>Agregue gastos para completar la conciliación</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}