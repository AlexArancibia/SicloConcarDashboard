"use client"

import { useState, useEffect } from "react"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus as PlusIcon, Minus as MinusIcon, Code } from "lucide-react"

interface ConditionField {
  field: string
  operator: string
  value: string
}

interface ConditionGroup {
  operator: "AND" | "OR"
  conditions: ConditionField[]
  groups: ConditionGroup[]
}

interface ConditionEditorProps {
  conditions: ConditionGroup[]
  onChange: (conditions: ConditionGroup[]) => void
  disabled?: boolean
}

// Opciones de campo disponibles (se han eliminado Moneda, Cliente, Tipo de Transacción y Tipo de Documento)
const FIELD_OPTIONS = [
  { value: "amount", label: "Monto" },
  { value: "supplier", label: "Proveedor" },
  { value: "description", label: "Descripción" },
]

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Igual a" },
  { value: "not_equals", label: "No igual a" },
  { value: "contains", label: "Contiene" },
  { value: "not_contains", label: "No contiene" },
  { value: "starts_with", label: "Empieza con" },
  { value: "ends_with", label: "Termina con" },
  { value: "greater_than", label: "Mayor que" },
  { value: "less_than", label: "Menor que" },
  { value: "greater_than_or_equal", label: "Mayor o igual que" },
  { value: "less_than_or_equal", label: "Menor o igual que" },
]

export function ConditionEditor({ conditions, onChange, disabled = false }: ConditionEditorProps) {
  const [showJson, setShowJson] = useState(false)

  const { user } = useAuthStore()
  const { suppliers, fetchSuppliers } = useSuppliersStore()

  // Cargar proveedores si es necesario
  useEffect(() => {
    const needsSuppliers = conditions.some((g) => g.conditions.some((c) => c.field === "supplier"))
    if (needsSuppliers && user?.companyId && suppliers.length === 0) {
      fetchSuppliers(user.companyId, { page: 1, limit: 1000 })
    }
  }, [conditions, suppliers.length, user?.companyId, fetchSuppliers])

  const addCondition = (groupIndex: number) => {
    const newConditions = [...conditions]
    newConditions[groupIndex].conditions.push({ field: "", operator: "equals", value: "" })
    onChange(newConditions)
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newConditions = [...conditions]
    newConditions[groupIndex].conditions.splice(conditionIndex, 1)
    if (newConditions[groupIndex].conditions.length === 0) {
      newConditions[groupIndex].conditions.push({ field: "", operator: "equals", value: "" })
    }
    onChange(newConditions)
  }

  const updateCondition = (groupIndex: number, conditionIndex: number, field: string, value: string) => {
    const newConditions = [...conditions]
    newConditions[groupIndex].conditions[conditionIndex] = {
      ...newConditions[groupIndex].conditions[conditionIndex],
      [field]: value,
    }
    onChange(newConditions)
  }

  const updateGroupOperator = (groupIndex: number, operator: "AND" | "OR") => {
    const newConditions = [...conditions]
    newConditions[groupIndex].operator = operator
    onChange(newConditions)
  }

  const convertToJson = (groups: ConditionGroup[]): any => {
    if (groups.length === 0) return {}
    
    const result: any = {
      operator: groups[0].operator,
      conditions: groups[0].conditions.filter(c => c.field && c.value).map(c => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
    }
    
    if (groups[0].groups.length > 0) {
      result.groups = groups[0].groups.map(g => convertToJson([g]))
    }
    
    return result
  }

  const getFieldLabel = (value: string) => {
    return FIELD_OPTIONS.find(f => f.value === value)?.label || value
  }

  const getOperatorLabel = (value: string) => {
    return OPERATOR_OPTIONS.find(o => o.value === value)?.label || value
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Condiciones de Aplicación</h3>
          <p className="text-sm text-gray-500">Define cuándo se aplicará esta plantilla</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowJson(!showJson)}
          disabled={disabled}
        >
          <Code className="w-4 h-4 mr-2" />
          {showJson ? "Vista Formulario" : "Vista JSON"}
        </Button>
      </div>

      {showJson ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">JSON de Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(convertToJson(conditions), null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conditions.map((group, groupIndex) => (
            <Card key={groupIndex}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Label>Operador:</Label>
                  <Select
                    value={group.operator}
                    onValueChange={(value: "AND" | "OR") => updateGroupOperator(groupIndex, value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">Y</SelectItem>
                      <SelectItem value="OR">O</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="ml-2">
                    {group.conditions.filter(c => c.field && c.value).length} condición(es)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.conditions.map((condition, conditionIndex) => (
                    <div key={conditionIndex} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "field", value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "operator", value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {condition.field === "supplier" ? (
                        <Select
                          value={condition.value}
                          onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "value", value)}
                          disabled={disabled || suppliers.length === 0}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.businessName}>
                                {s.businessName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(groupIndex, conditionIndex, "value", e.target.value)}
                          placeholder="Valor"
                          className="flex-1"
                          disabled={disabled}
                        />
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(groupIndex, conditionIndex)}
                        disabled={group.conditions.length === 1 || disabled}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCondition(groupIndex)}
                    className="w-full"
                    disabled={disabled}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Agregar Condición
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vista previa de condiciones */}

    </div>
  )
} 