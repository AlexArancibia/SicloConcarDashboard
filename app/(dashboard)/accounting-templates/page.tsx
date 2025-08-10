"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TemplateDialog } from "@/components/financial/template-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2, FileText, AlertCircle, Code } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAccountingEntryTemplatesStore } from "@/stores/accounting-entry-templates-store"
import { useAccountingAccountsStore } from "@/stores/accounting-accounts-store"
import { useAuthStore } from "@/stores/authStore"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConditionEditor } from "@/components/financial/condition-editor"
import { TemplateLinesEditor } from "@/components/financial/template-lines-editor"
import type {
  AccountingEntryTemplate,
  CreateAccountingEntryTemplateDto,
  UpdateAccountingEntryTemplateDto,
  AccountingEntryFilter,
  AccountingEntryCurrency,
} from "@/types/accounting"

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

export default function AccountingTemplatesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AccountingEntryTemplate | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  // NUEVO: Definición de pasos para el asistente
  const STEPS = [
    { key: "general", label: "General" },
    { key: "conditions", label: "Condiciones" },
    { key: "lines", label: "Líneas" },
  ]

  // Índice del paso actual
  const currentStepIndex = STEPS.findIndex((s) => s.key === activeTab)

  // Form states
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

  // Condition editor states
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([
    {
      operator: "AND",
      conditions: [{ field: "", operator: "equals", value: "" }],
      groups: [],
    },
  ])

  // Developer dialog states
  const [devDialogOpen, setDevDialogOpen] = useState(false)
  const [selectedTemplateRaw, setSelectedTemplateRaw] = useState<AccountingEntryTemplate | null>(null)

  const openDevDialog = (template: AccountingEntryTemplate) => {
    setSelectedTemplateRaw(template)
    setDevDialogOpen(true)
  }

  const { toast } = useToast()
  const { user } = useAuthStore()

  // Stores
  const {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    removeTemplate,
    clearError,
  } = useAccountingEntryTemplatesStore()

  const { accountingAccounts, fetchAccountingAccounts } = useAccountingAccountsStore()

  // Load initial data
  useEffect(() => {
    if (user?.companyId) {
      loadData()
    }
  }, [user?.companyId, currentPage])

  // Search effect
  useEffect(() => {
    if (user?.companyId) {
      setCurrentPage(1)
      handleSearch()
    }
  }, [searchTerm])

  // Error handling
  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" })
      clearError()
    }
  }, [error, toast, clearError])

  const loadData = async () => {
    if (!user?.companyId) return
    try {
      await Promise.all([
        fetchTemplates(user.companyId),
        fetchAccountingAccounts(user.companyId, { page: 1, limit: 1000 }),
      ])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleSearch = async () => {
    if (!user?.companyId) return
    try {
      if (searchTerm.trim()) {
        await fetchTemplates(user.companyId)
      } else {
        loadData()
      }
    } catch (error) {
      console.error("Error searching:", error)
    }
  }

  // Helpers: totals and validation
  const linesTotals = useMemo(() => {
    const debit = (templateForm.lines || []).filter(l => l.movementType === "DEBIT").reduce((s, l) => s + (Number(l.value) || 0), 0)
    const credit = (templateForm.lines || []).filter(l => l.movementType === "CREDIT").reduce((s, l) => s + (Number(l.value) || 0), 0)
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 }
  }, [templateForm.lines])

  const validationErrors = useMemo(() => {
    const errs: string[] = []
    if (!templateForm.templateNumber?.trim()) errs.push("Número de plantilla es requerido")
    if (!templateForm.name?.trim()) errs.push("Nombre es requerido")
    if (!templateForm.transactionType?.trim()) errs.push("Tipo de transacción es requerido")
    if (!templateForm.filter) errs.push("Filtro es requerido")
    if (!templateForm.currency) errs.push("Moneda es requerida")

    const lines = templateForm.lines || []
    if (lines.length === 0) errs.push("Agrega al menos una línea de asiento")
    if (lines.some(l => !l.accountCode)) errs.push("Todas las líneas deben tener cuenta contable")
    if (!linesTotals.balanced) errs.push("El asiento debe estar balanceado (D = H)")
    return errs
  }, [templateForm, linesTotals.balanced])

  const canSubmit = validationErrors.length === 0

  const handleCreateTemplate = async () => {
    if (!user?.companyId || !canSubmit) return
    try {
      const templateData: CreateAccountingEntryTemplateDto = {
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
      const result = await createTemplate(user.companyId, templateData)
      if (result) {
        toast({ title: "Éxito", description: "Plantilla creada correctamente" })
        setTemplateDialogOpen(false)
        resetTemplateForm()
        loadData()
      }
    } catch {
      toast({ title: "Error", description: "Error al crear la plantilla", variant: "destructive" })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !canSubmit) return
    try {
      const updateData: UpdateAccountingEntryTemplateDto = {
        templateNumber: templateForm.templateNumber || undefined,
        name: templateForm.name || undefined,
        filter: templateForm.filter || undefined,
        currency: templateForm.currency || undefined,
        transactionType: templateForm.transactionType || undefined,
        document: templateForm.document || undefined,
        condition: convertConditionsToJson(conditionGroups),
        description: templateForm.description || undefined,
        isActive: templateForm.isActive,
        lines: templateForm.lines || undefined,
      }
      await updateTemplate(editingTemplate.id, updateData)
      toast({ title: "Éxito", description: "Plantilla actualizada correctamente" })
      setTemplateDialogOpen(false)
      setEditingTemplate(null)
      resetTemplateForm()
      loadData()
    } catch {
      toast({ title: "Error", description: "Error al actualizar la plantilla", variant: "destructive" })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("¿Está seguro de que desea eliminar esta plantilla?")) {
      try {
        await removeTemplate(templateId)
        toast({ title: "Éxito", description: "Plantilla eliminada correctamente" })
        loadData()
      } catch {
        toast({ title: "Error", description: "Error al eliminar la plantilla", variant: "destructive" })
      }
    }
  }

  const openEditTemplateDialog = async (template: AccountingEntryTemplate) => {
    setEditingTemplate(template)
    setTemplateDialogOpen(true)
  }

  const resetTemplateForm = () => {
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
    setConditionGroups([
      { operator: "AND", conditions: [{ field: "", operator: "equals", value: "" }], groups: [] },
    ])
    setActiveTab("general")
  }

  const convertConditionsToJson = (groups: ConditionGroup[]): any => {
    if (groups.length === 0) return {}
    const result: any = {
      operator: groups[0].operator,
      conditions: groups[0].conditions.filter(c => c.field && c.value).map(c => ({ field: c.field, operator: c.operator, value: c.value })),
    }
    if (groups[0].groups.length > 0) {
      result.groups = groups[0].groups.map(g => convertConditionsToJson([g]))
    }
    return result
  }

  const convertJsonToConditions = (json: any): ConditionGroup[] => {
    if (!json || typeof json !== 'object') {
      return [{ operator: "AND", conditions: [{ field: "", operator: "equals", value: "" }], groups: [] }]
    }
    return [{
      operator: json.operator || "AND",
      conditions: json.conditions?.map((c: any) => ({ field: c.field || "", operator: c.operator || "equals", value: c.value || "" })) || [{ field: "", operator: "equals", value: "" }],
      groups: json.groups?.map((g: any) => convertJsonToConditions(g)[0]) || [],
    }]
  }

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-100 text-green-800" : ""}>
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  )

  const getFilterBadge = (filter: AccountingEntryFilter) => {
    const variants = { INVOICES: "bg-blue-100 text-blue-800", PAYROLL: "bg-purple-100 text-purple-800", BOTH: "bg-gray-100 text-gray-800" }
    return (
      <Badge variant="outline" className={variants[filter]}>
        {filter === "INVOICES" ? "Facturas" : filter === "PAYROLL" ? "RH" : "Ambos"}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error: {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={() => { clearError(); loadData() }}>Reintentar</Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plantillas de Asientos Contables</h1>
          <p className="text-gray-600 dark:text-gray-400">Administre plantillas para generar asientos contables automáticamente</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar plantillas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button onClick={() => { setEditingTemplate(null); setTemplateDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Plantilla
        </Button>

        <TemplateDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          editingTemplate={editingTemplate}
          onSaved={loadData}
        />
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Plantillas ({loading ? "..." : templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Número</th>
                      <th className="text-left p-3">Nombre</th>
                      <th className="text-left p-3">Filtro</th>
                      <th className="text-left p-3">Moneda</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-center p-3">Líneas</th>
                      <th className="text-center p-3">Estado</th>
                      <th className="text-center p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No se encontraron plantillas</p>
                        </td>
                      </tr>
                    ) : (
                      templates.map((template) => (
                        <tr key={template.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3 font-mono font-semibold">{template.templateNumber}</td>
                          <td className="p-3">
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-gray-500 truncate max-w-48" title={template.description}>
                                {template.description}
                              </div>
                            )}
                          </td>
                          <td className="p-3">{getFilterBadge(template.filter)}</td>
                          <td className="p-3">
                            <Badge variant="outline">{template.currency}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div className="font-medium">{template.transactionType}</div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">{template.lines?.length || 0}</Badge>
                          </td>
                          <td className="p-3 text-center">{getStatusBadge(template.isActive)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditTemplateDialog(template)} title="Editar">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)} title="Eliminar" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openDevDialog(template)} title="Ver JSON">
                                <Code className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Plantillas</p>
              <p className="text-2xl font-bold">{loading ? "..." : templates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Plantillas Activas</p>
              <p className="text-2xl font-bold text-green-600">{loading ? "..." : templates.filter((t) => t.isActive).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Líneas</p>
              <p className="text-2xl font-bold text-blue-600">{loading ? "..." : templates.reduce((acc, t) => acc + (t.lines?.length || 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer JSON Dialog */}
      <Dialog open={devDialogOpen} onOpenChange={setDevDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista JSON de Plantilla</DialogTitle>
          </DialogHeader>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto">
            {selectedTemplateRaw ? JSON.stringify(selectedTemplateRaw, null, 2) : "No data"}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

