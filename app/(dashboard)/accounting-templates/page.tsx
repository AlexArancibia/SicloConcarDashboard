"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2, FileText, AlertCircle } from "lucide-react"
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
    setTemplateForm({
      templateNumber: template.templateNumber,
      name: template.name,
      filter: template.filter,
      currency: template.currency,
      transactionType: template.transactionType,
      document: template.document,
      condition: template.condition,
      description: template.description,
      isActive: template.isActive,
      lines: template.lines.map(line => ({
        accountCode: line.accountCode,
        movementType: line.movementType,
        applicationType: line.applicationType,
        calculationBase: line.calculationBase,
        value: line.value ? Number(line.value) : undefined,
        executionOrder: line.executionOrder,
      })),
    })
    if (template.condition && typeof template.condition === 'object') {
      setConditionGroups(convertJsonToConditions(template.condition))
    }
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
        {filter === "INVOICES" ? "Facturas" : filter === "PAYROLL" ? "Planillas" : "Ambos"}
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
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); resetTemplateForm() }}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{editingTemplate ? "Editar Plantilla" : "Crear Plantilla"}</span>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  {templateForm.templateNumber && <Badge variant="outline">{templateForm.templateNumber}</Badge>}
                  {templateForm.name && <Badge variant="secondary">{templateForm.name}</Badge>}
                  {templateForm.isActive !== undefined && getStatusBadge(!!templateForm.isActive)}
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Validation summary */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((e, i) => (<li key={i}>{e}</li>))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="conditions">Condiciones</TabsTrigger>
                <TabsTrigger value="lines">Líneas</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateNumber">Número de Plantilla *</Label>
                    <Input id="templateNumber" value={templateForm.templateNumber} onChange={(e) => setTemplateForm({ ...templateForm, templateNumber: e.target.value })} placeholder="Ej: TEMP001" />
                  </div>
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input id="name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Ej: Plantilla para Facturas" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="filter">Filtro *</Label>
                    <Select value={templateForm.filter} onValueChange={(value: AccountingEntryFilter) => setTemplateForm({ ...templateForm, filter: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INVOICES">FACTURAS</SelectItem>
                        <SelectItem value="PAYROLL">RH (Recibo por Honorarios)</SelectItem>
                        <SelectItem value="BOTH">AMBOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Moneda *</Label>
                    <Select value={templateForm.currency} onValueChange={(value: AccountingEntryCurrency) => setTemplateForm({ ...templateForm, currency: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas</SelectItem>
                        <SelectItem value="PEN">Soles</SelectItem>
                        <SelectItem value="USD">Dólares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="transactionType">Tipo de Transacción *</Label>
                  <Input id="transactionType" value={templateForm.transactionType} onChange={(e) => setTemplateForm({ ...templateForm, transactionType: e.target.value })} placeholder="Ej: VENTA, COMPRA, etc." />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" value={templateForm.description || ""} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Descripción de la plantilla" />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="isActive" checked={templateForm.isActive} onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })} />
                  <Label htmlFor="isActive">Activo</Label>
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="space-y-4">
                <ConditionEditor conditions={conditionGroups} onChange={setConditionGroups} disabled={false} />
              </TabsContent>

              <TabsContent value="lines" className="space-y-4">
                <TemplateLinesEditor lines={templateForm.lines || []} accountingAccounts={accountingAccounts} onChange={(lines) => setTemplateForm({ ...templateForm, lines })} disabled={false} />
              </TabsContent>
            </Tabs>

            {/* Live preview */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Número</div>
                    <div className="font-medium">{templateForm.templateNumber || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Nombre</div>
                    <div className="font-medium truncate">{templateForm.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Filtro</div>
                    <div>{templateForm.filter && getFilterBadge(templateForm.filter)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Moneda</div>
                    <Badge variant="outline">{templateForm.currency || "-"}</Badge>
                  </div>
                  <div>
                    <div className="text-gray-500">Transacción</div>
                    <div className="font-medium">{templateForm.transactionType || "-"}</div>
                  </div>

                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-gray-500 text-sm">Débitos</div>
                      <div className="text-lg font-bold text-green-600">S/ {linesTotals.debit.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Créditos</div>
                      <div className="text-lg font-bold text-red-600">S/ {linesTotals.credit.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <Badge variant={linesTotals.balanced ? "default" : "destructive"} className={linesTotals.balanced ? "bg-green-100 text-green-800" : ""}>
                      {linesTotals.balanced ? "✓ Balanceado" : "✗ Desbalanceado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 mt-4 -mx-6 px-6 py-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {canSubmit ? "Listo para guardar" : `${validationErrors.length} validación(es) pendiente(s)`}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setTemplateDialogOpen(false); setEditingTemplate(null); resetTemplateForm() }}>
                  Cancelar
                </Button>
                <Button disabled={!canSubmit} onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  {editingTemplate ? "Guardar cambios" : "Crear plantilla"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
    </div>
  )
}

