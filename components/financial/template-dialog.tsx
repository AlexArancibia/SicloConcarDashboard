"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, 
  FileText, 
  Settings, 
  List,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus
} from "lucide-react"
import {
  AccountingEntryTemplate,
  CreateAccountingEntryTemplateDto,
  UpdateAccountingEntryTemplateDto,
  AccountingEntryFilter,
  AccountingEntryCurrency,
} from "@/types/accounting"
import { ConditionEditor } from "@/components/financial/condition-editor"
import { TemplateLinesEditor } from "@/components/financial/template-lines-editor"
import { useAccountingEntryTemplatesStore } from "@/stores/accounting-entry-templates-store"
import { useAccountingAccountsStore } from "@/stores/accounting-accounts-store"
import { useAuthStore } from "@/stores/authStore"
import { useToast } from "@/hooks/use-toast"

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

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTemplate?: AccountingEntryTemplate | null
  onSaved?: () => void
}

// Step configuration with icons
const STEPS = [
  { key: "general", label: "Información General", icon: FileText, description: "Datos básicos de la plantilla" },
  { key: "conditions", label: "Condiciones", icon: Settings, description: "Reglas de aplicación" },
  { key: "lines", label: "Líneas Contables", icon: List, description: "Asientos contables" },
] as const

type StepKey = typeof STEPS[number]['key']

// Form validation hook
const useFormValidation = (templateForm: any, linesTotals: any) => {
  return useMemo(() => {
    const errors: string[] = []
    
    if (!templateForm.templateNumber?.trim()) errors.push("Número de plantilla es requerido")
    if (!templateForm.name?.trim()) errors.push("Nombre es requerido")
    if (!templateForm.transactionType?.trim()) errors.push("Tipo de transacción es requerido")
    if (!templateForm.filter) errors.push("Filtro es requerido")
    if (!templateForm.currency) errors.push("Moneda es requerida")

    const lines = templateForm.lines || []
    // Nueva validación: al menos un Debe y un Haber y que todas las líneas estén completas
    const hasDebit = lines.some((l: any) => l.movementType === "DEBIT")
    const hasCredit = lines.some((l: any) => l.movementType === "CREDIT")

    if (!hasDebit || !hasCredit) errors.push("Debe haber al menos un Debe y un Haber")
    if (lines.some((l: any) => !l.accountCode || l.value === undefined || l.value === null || l.value === "")) {
      errors.push("Completa todos los campos de las líneas")
    }
    
    return { errors, isValid: errors.length === 0 }
  }, [templateForm])
}

// Step Progress Component
const StepProgress = ({ currentStep, steps, onStepClick }: {
  currentStep: string
  steps: typeof STEPS
  onStepClick: (step: StepKey) => void
}) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep)
  
  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
      </div>
      
      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.key === currentStep
          const isCompleted = index < currentIndex
          
          return (
            <button
              key={step.key}
              onClick={() => onStepClick(step.key)}
              className="flex flex-col items-center group"
            >
              <div className={`
                relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all
                ${isActive ? 'bg-primary text-primary-foreground shadow-lg scale-110' : 
                  isCompleted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                hover:scale-105
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-3 text-center">
                <div className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1 max-w-24">
                  {step.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Status badges with improved styling
const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <Badge 
    variant={isActive ? "default" : "secondary"} 
    className={`${isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600'} font-medium`}
  >
    {isActive ? (
      <>
        <CheckCircle className="w-3 h-3 mr-1" />
        Activo
      </>
    ) : (
      <>
        <XCircle className="w-3 h-3 mr-1" />
        Inactivo
      </>
    )}
  </Badge>
)

const FilterBadge = ({ filter }: { filter: AccountingEntryFilter }) => {
  const config = {
    INVOICES: { label: "Facturas", className: "bg-blue-50 text-blue-700 border-blue-200" },
    PAYROLL: { label: "RH", className: "bg-purple-50 text-purple-700 border-purple-200" },
    BOTH: { label: "Ambos", className: "bg-gray-50 text-gray-700 border-gray-200" },
  }
  
  const { label, className } = config[filter]
  
  return <Badge variant="outline" className={className}>{label}</Badge>
}



export function TemplateDialog({
  open,
  onOpenChange,
  editingTemplate = null,
  onSaved,
}: TemplateDialogProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { createTemplate, updateTemplate } = useAccountingEntryTemplatesStore()
  const { accountingAccounts, fetchAccountingAccounts } = useAccountingAccountsStore()

  const [activeTab, setActiveTab] = useState<StepKey>("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  // Form state
  const [templateForm, setTemplateForm] = useState<Partial<CreateAccountingEntryTemplateDto>>({
    templateNumber: "",
    name: "",
    filter: "BOTH",
    currency: "ALL",
    transactionType: "",
    document: "",
    condition: {},
    description: "",
    isActive: true,
    lines: [],
  })

  // Conditions state
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([
    { operator: "AND", conditions: [{ field: "", operator: "equals", value: "" }], groups: [] },
  ])

  // Computed values
  const linesTotals = useMemo(() => {
    const debit = (templateForm.lines || []).filter((l: any) => l.movementType === "DEBIT").reduce((s: number, l: any) => s + (Number(l.value) || 0), 0)
    const credit = (templateForm.lines || []).filter((l: any) => l.movementType === "CREDIT").reduce((s: number, l: any) => s + (Number(l.value) || 0), 0)
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 }
  }, [templateForm.lines])

  const { errors: validationErrors, isValid: canSubmit } = useFormValidation(templateForm, linesTotals)
  const currentStepIndex = STEPS.findIndex((s) => s.key === activeTab)

  // Load accounts when dialog opens
  useEffect(() => {
    if (open && user?.companyId) {
      fetchAccountingAccounts(user.companyId, { page: 1, limit: 1000 })
    }
  }, [open, user?.companyId, fetchAccountingAccounts])

  // Initialize form for editing
  useEffect(() => {
    if (editingTemplate) {
      setTemplateForm({
        templateNumber: editingTemplate.templateNumber,
        name: editingTemplate.name,
        filter: editingTemplate.filter,
        currency: editingTemplate.currency,
        transactionType: editingTemplate.transactionType,
        document: editingTemplate.document || "",
        condition: editingTemplate.condition,
        description: editingTemplate.description || "",
        isActive: editingTemplate.isActive,
        lines: editingTemplate.lines.map((l) => ({
          accountCode: l.accountCode,
          movementType: l.movementType,
          applicationType: l.applicationType,
          calculationBase: l.calculationBase || undefined,
          value: l.value ? Number(l.value) : undefined,
          executionOrder: l.executionOrder,
        })),
      })
      
      if (editingTemplate.condition && typeof editingTemplate.condition === "object") {
        setConditionGroups(convertJsonToConditions(editingTemplate.condition))
      }
      setActiveTab("general")
      setAttemptedSubmit(false)
    } else {
      resetForm()
    }
  }, [editingTemplate])

  // Helper functions
  const convertConditionsToJson = (groups: ConditionGroup[]): any => {
    if (groups.length === 0) return {}
    const result: any = {
      operator: groups[0].operator,
      conditions: groups[0].conditions.filter((c) => c.field && c.value).map((c) => ({ field: c.field, operator: c.operator, value: c.value })),
    }
    if (groups[0].groups.length > 0) {
      result.groups = groups[0].groups.map((g) => convertConditionsToJson([g]))
    }
    return result
  }

  function convertJsonToConditions(json: any): ConditionGroup[] {
    if (!json || typeof json !== "object") {
      return [{ operator: "AND", conditions: [{ field: "", operator: "equals", value: "" }], groups: [] }]
    }
    return [
      {
        operator: json.operator || "AND",
        conditions:
          json.conditions?.map((c: any) => ({ field: c.field || "", operator: c.operator || "equals", value: c.value || "" })) || [
            { field: "", operator: "equals", value: "" },
          ],
        groups: json.groups?.map((g: any) => convertJsonToConditions(g)[0]) || [],
      },
    ]
  }

  const resetForm = () => {
    setTemplateForm({
      templateNumber: "",
      name: "",
      filter: "BOTH",
      currency: "ALL",
      transactionType: "",
      document: "",
      condition: {},
      description: "",
      isActive: true,
      lines: [],
    })
    setConditionGroups([{ operator: "AND", conditions: [{ field: "", operator: "equals", value: "" }], groups: [] }])
    setActiveTab("general")
  }

  const handleCreate = async () => {
    setAttemptedSubmit(true)
    if (!user?.companyId || isSubmitting) return
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const payload: CreateAccountingEntryTemplateDto = {
        templateNumber: templateForm.templateNumber || "",
        name: templateForm.name || "",
        filter: templateForm.filter || "BOTH",
        currency: templateForm.currency || "ALL",
        transactionType: templateForm.transactionType || "",
        document: templateForm.document || undefined,
        condition: convertConditionsToJson(conditionGroups),
        description: templateForm.description || undefined,
        isActive: templateForm.isActive ?? true,
        lines: templateForm.lines || [],
      }
      
      const res = await createTemplate(user.companyId, payload)
      if (res) {
        toast({ title: "¡Éxito!", description: "Plantilla creada correctamente" })
        onOpenChange(false)
        onSaved?.()
        resetForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    setAttemptedSubmit(true)
    if (!editingTemplate || isSubmitting) return
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const payload: UpdateAccountingEntryTemplateDto = {
        templateNumber: templateForm.templateNumber,
        name: templateForm.name,
        filter: templateForm.filter,
        currency: templateForm.currency,
        transactionType: templateForm.transactionType,
        document: templateForm.document || undefined,
        condition: convertConditionsToJson(conditionGroups),
        description: templateForm.description || undefined,
        isActive: templateForm.isActive,
        lines: templateForm.lines,
      }
      
      const res = await updateTemplate(editingTemplate.id, payload)
      if (res) {
        toast({ title: "¡Éxito!", description: "Plantilla actualizada correctamente" })
        onOpenChange(false)
        onSaved?.()
        resetForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateStep = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? currentStepIndex + 1 : currentStepIndex - 1
    if (newIndex >= 0 && newIndex < STEPS.length) {
      setActiveTab(STEPS[newIndex].key)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            {editingTemplate ? "Editar Plantilla de Asiento" : "Nueva Plantilla de Asiento"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          {/* Step Progress */}
          <StepProgress 
            currentStep={activeTab} 
            steps={STEPS} 
            onStepClick={setActiveTab}
          />

          {/* Validation Errors */}
          {attemptedSubmit && validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Corrige los siguientes errores:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {activeTab === "general" && (
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateNumber" className="text-sm font-medium">
                    Número de Plantilla *
                  </Label>
                  <Input
                    id="templateNumber"
                    value={templateForm.templateNumber}
                    onChange={(e) => setTemplateForm({ ...templateForm, templateNumber: e.target.value })}
                    placeholder="Ej: TEMP-001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre de la Plantilla *
                  </Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Ej: Plantilla para Ventas"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Aplicar a *</Label>
                  <Select
                    value={templateForm.filter}
                    onValueChange={(v: AccountingEntryFilter) => setTemplateForm({ ...templateForm, filter: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INVOICES">Solo Facturas</SelectItem>
                      <SelectItem value="PAYROLL">Solo RH</SelectItem>
                      <SelectItem value="BOTH">Facturas y RH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Moneda *</Label>
                  <Select
                    value={templateForm.currency}
                    onValueChange={(v: AccountingEntryCurrency) => setTemplateForm({ ...templateForm, currency: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas las monedas</SelectItem>
                      <SelectItem value="PEN">Soles (PEN)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-3 pt-6">
                  <Switch
                    id="isActive"
                    checked={templateForm.isActive}
                    onCheckedChange={(c) => setTemplateForm({ ...templateForm, isActive: c })}
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Plantilla activa
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="transactionType" className="text-sm font-medium">
                  Tipo de Transacción *
                </Label>
                <Input
                  id="transactionType"
                  value={templateForm.transactionType}
                  onChange={(e) => setTemplateForm({ ...templateForm, transactionType: e.target.value })}
                  placeholder="Ej: VENTA, COMPRA, SERVICIO"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={templateForm.description || ""}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Describe el propósito y uso de esta plantilla..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === "conditions" && (
            <div className="py-6">

              <ConditionEditor conditions={conditionGroups} onChange={setConditionGroups} disabled={false} />
            </div>
          )}

          {activeTab === "lines" && (
            <div className="py-6">
              <div className="mb-4">
                <h3 className="font-medium">Líneas del Asiento Contable</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configura las cuentas contables y movimientos que se generarán
                </p>
              </div>
              <TemplateLinesEditor
                lines={templateForm.lines || []}
                accountingAccounts={accountingAccounts}
                onChange={(lines) => setTemplateForm({ ...templateForm, lines })}
                showValidationErrors={attemptedSubmit}
              />
            </div>
          )}


        </div>

        {/* Action Bar */}
        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              {attemptedSubmit && (canSubmit ? (
                <div className="flex items-center text-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Lista para guardar
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.length} error{validationErrors.length !== 1 ? 'es' : ''} pendiente{validationErrors.length !== 1 ? 's' : ''}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              
              {currentStepIndex > 0 && (
                <Button variant="secondary" onClick={() => navigateStep('prev')}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}
              
              {currentStepIndex < STEPS.length - 1 ? (
                <Button onClick={() => navigateStep('next')}>
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : editingTemplate ? (
                <Button 
                  disabled={!canSubmit || isSubmitting} 
                  onClick={handleUpdate}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  disabled={!canSubmit || isSubmitting} 
                  onClick={handleCreate}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>Creando...</>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Crear
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}