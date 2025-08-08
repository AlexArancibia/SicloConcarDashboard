"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus as PlusIcon, Minus as MinusIcon, ArrowUp, ArrowDown, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type {
  CreateAccountingEntryTemplateLineDto,
  MovementType,
  ApplicationType,
  CalculationBase,
} from "@/types/accounting"
import type { AccountingAccount } from "@/types/accounting"

interface TemplateLinesEditorProps {
  lines: CreateAccountingEntryTemplateLineDto[]
  accountingAccounts: AccountingAccount[]
  onChange: (lines: CreateAccountingEntryTemplateLineDto[]) => void
  disabled?: boolean
}

const APPLICATION_TYPE_LABELS = {
  FIXED_AMOUNT: "Monto Fijo",
  PERCENTAGE: "Porcentaje",
  TRANSACTION_AMOUNT: "Monto Transacción",
}

const CALCULATION_BASE_LABELS = {
  SUBTOTAL: "Subtotal",
  IGV: "IGV",
  TOTAL: "Total",
  RENT: "Renta",
  TAX: "Impuesto",
  OTHER: "Otro",
}

export function TemplateLinesEditor({ 
  lines, 
  accountingAccounts, 
  onChange, 
  disabled = false 
}: TemplateLinesEditorProps) {
  
  const addLine = () => {
    const newLine: CreateAccountingEntryTemplateLineDto = {
      accountCode: "",
      movementType: "DEBIT",
      applicationType: "FIXED_AMOUNT",
      calculationBase: undefined,
      value: 0,
      executionOrder: lines.length + 1,
    }
    onChange([...lines, newLine])
  }

  const removeLine = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index)
    // Reordenar los números de ejecución
    newLines.forEach((line, i) => {
      line.executionOrder = i + 1
    })
    onChange(newLines)
  }

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    onChange(newLines)
  }

  const moveLine = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === lines.length - 1)
    ) {
      return
    }

    const newLines = [...lines]
    const targetIndex: number = direction === "up" ? index - 1 : index + 1
    
    // Intercambiar líneas
    const temp = newLines[index]
    newLines[index] = newLines[targetIndex]
    newLines[targetIndex] = temp
    
    // Actualizar órdenes de ejecución
    newLines.forEach((line, i) => {
      line.executionOrder = i + 1
    })
    
    onChange(newLines)
  }

  const getAccountName = (accountCode: string) => {
    const account = accountingAccounts.find(a => a.accountCode === accountCode)
    return account ? account.accountName : ""
  }

  const getTotalDebit = () => {
    return lines
      .filter(line => line.movementType === "DEBIT")
      .reduce((sum, line) => sum + (Number(line.value) || 0), 0)
  }

  const getTotalCredit = () => {
    return lines
      .filter(line => line.movementType === "CREDIT")
      .reduce((sum, line) => sum + (Number(line.value) || 0), 0)
  }

  const isLineValid = (line: CreateAccountingEntryTemplateLineDto) => {
    return line.accountCode && line.accountCode.trim() !== ""
  }

  const getInvalidLines = () => {
    return lines.filter((line) => !isLineValid(line))
  }

  const isBalanced = () => {
    const totalDebit = getTotalDebit()
    const totalCredit = getTotalCredit()
    return Math.abs(totalDebit - totalCredit) < 0.01
  }

  const hasValidLines = lines.length > 0 && lines.every(isLineValid)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Líneas del Asiento</h3>
          <p className="text-sm text-gray-500">Define las cuentas y montos del asiento contable</p>
        </div>
        <Button variant="outline" size="sm" onClick={addLine} disabled={disabled}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Agregar Línea
        </Button>
      </div>

      {/* Alertas de validación */}
      {getInvalidLines().length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Hay {getInvalidLines().length} línea(s) sin cuenta contable asignada. 
            Complete todos los campos requeridos.
          </AlertDescription>
        </Alert>
      )}

      {lines.length > 0 && !isBalanced() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El asiento no está balanceado. Los totales de débitos y créditos deben ser iguales.
          </AlertDescription>
        </Alert>
      )}

      {lines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              <p>No hay líneas definidas</p>
              <p className="text-sm">Agregue al menos una línea para continuar</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Cuenta Contable</th>
                    <th className="text-left p-3 font-medium">Aplicación</th>
                    <th className="text-left p-3 font-medium">Base</th>
                    <th className="text-right p-3 font-medium">Valor</th>
                    <th className="text-center p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr 
                      key={index} 
                      className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        !isLineValid(line) ? "bg-red-50 border-red-200" : ""
                      }`}
                    >
                      {/* Número de línea */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {line.executionOrder}
                          </Badge>
                        </div>
                      </td>

                      {/* Tipo de movimiento */}
                      <td className="p-3">
                        <Select
                          value={line.movementType}
                          onValueChange={(value: MovementType) => updateLine(index, "movementType", value)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEBIT">D</SelectItem>
                            <SelectItem value="CREDIT">H</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Cuenta contable */}
                      <td className="p-3">
                        <Select
                          value={line.accountCode}
                          onValueChange={(value) => updateLine(index, "accountCode", value)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccionar cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {accountingAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.accountCode}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{account.accountCode}</span>
                                  <span className="text-xs text-muted-foreground truncate">{account.accountName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {line.accountCode && (
                          <div className="text-xs text-gray-500 truncate max-w-48 mt-1">
                            {getAccountName(line.accountCode)}
                          </div>
                        )}
                      </td>

                      {/* Tipo de aplicación */}
                      <td className="p-3">
                        <Select
                          value={line.applicationType}
                          onValueChange={(value: ApplicationType) => updateLine(index, "applicationType", value)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FIXED_AMOUNT">Monto Fijo</SelectItem>
                            <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                            <SelectItem value="TRANSACTION_AMOUNT">Monto Trans.</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Base de cálculo */}
                      <td className="p-3">
                        <Select
                          value={line.calculationBase || ""}
                          onValueChange={(value: CalculationBase) => updateLine(index, "calculationBase", value || undefined)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUBTOTAL">Subtotal</SelectItem>
                            <SelectItem value="IGV">IGV</SelectItem>
                            <SelectItem value="TOTAL">Total</SelectItem>
                            <SelectItem value="RENT">Renta</SelectItem>
                            <SelectItem value="TAX">Impuesto</SelectItem>
                            <SelectItem value="OTHER">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Valor */}
                      <td className="p-3">
                        <Input
                          type="number"
                          value={line.value || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : Number(e.target.value)
                            updateLine(index, "value", value)
                          }}
                          placeholder="0.00"
                          disabled={disabled}
                          step="0.01"
                          min="0"
                          className="w-24 text-right"
                        />
                      </td>

                      {/* Acciones */}
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLine(index, "up")}
                            disabled={index === 0 || disabled}
                            title="Mover arriba"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLine(index, "down")}
                            disabled={index === lines.length - 1 || disabled}
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                            className="text-red-600 hover:text-red-700"
                            disabled={disabled}
                            title="Eliminar línea"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
} 