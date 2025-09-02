"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, CheckCircle, Clock } from "lucide-react"
import { useAccountingEntryTemplatesStore } from "@/stores/accounting-entry-templates-store"
import { useAuthStore } from "@/stores/authStore"
import { useToast } from "@/hooks/use-toast"
import type { AccountingEntryTemplate, AccountingEntryFilter } from "@/types/accounting"

interface TemplateSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateSelect: (template: AccountingEntryTemplate) => void
}

export function TemplateSearchDialog({ open, onOpenChange, onTemplateSelect }: TemplateSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<AccountingEntryFilter | "ALL">("ALL")
  const [selectedTemplate, setSelectedTemplate] = useState<AccountingEntryTemplate | null>(null)
  
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { templates, loading, fetchTemplates } = useAccountingEntryTemplatesStore()

  // Cargar plantillas cuando se abre el diálogo
  useEffect(() => {
    if (open && user?.companyId) {
      loadTemplates()
    }
  }, [open, user?.companyId])

  const loadTemplates = async () => {
    try {
      if (user?.companyId) {
        await fetchTemplates(user.companyId)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al cargar las plantillas",
        variant: "destructive",
      })
    }
  }

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.templateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === "ALL" || template.filter === filterType
    
    return matchesSearch && matchesFilter
  })

  const getFilterBadge = (filter: AccountingEntryFilter) => {
    const config = {
      INVOICES: { label: "FACTURAS", variant: "default" as const },
      PAYROLL: { label: "RH", variant: "secondary" as const },
      BOTH: { label: "AMBOS", variant: "outline" as const },
    }
    const configItem = config[filter]
    return <Badge variant={configItem.variant}>{configItem.label}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-100 text-green-800" : ""}>
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  )

  const handleTemplateSelect = (template: AccountingEntryTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate)
      onOpenChange(false)
      setSelectedTemplate(null)
      setSearchTerm("")
      setFilterType("ALL")
    }
  }

  const handleCancel = () => {
    setSelectedTemplate(null)
    setSearchTerm("")
    setFilterType("ALL")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Buscar plantilla de asiento contable
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar número, nombre o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as AccountingEntryFilter | "ALL")}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="INVOICES">FACTURAS</option>
                <option value="PAYROLL">RH</option>
                <option value="BOTH">AMBOS</option>
              </select>
            </div>
          </div>

          {/* Lista de plantillas */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Cargando plantillas...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No se encontraron plantillas</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <div className="font-mono font-semibold text-[11px] sm:text-sm bg-gray-100 px-2 py-0.5 rounded">
                              {template.templateNumber}
                            </div>
                            <h3 className="font-medium text-sm truncate">{template.name}</h3>
                            {getFilterBadge(template.filter)}
                            {getStatusBadge(template.isActive)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                            <div className="truncate"><span className="font-medium">Tipo:</span> {template.transactionType}</div>
                            <div className="truncate"><span className="font-medium">Moneda:</span> {template.currency}</div>
                            <div className="truncate"><span className="font-medium">Líneas:</span> {template.lines?.length || 0}</div>
                            <div className="truncate"><span className="font-medium">Condiciones:</span> {template.condition ? "Sí" : "No"}</div>
                          </div>

                          {template.description && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                          )}
                        </div>

                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t">
            <div className="text-xs sm:text-sm text-gray-500">
              {selectedTemplate ? (
                <span>Plantilla seleccionada: <strong>{selectedTemplate.name}</strong></span>
              ) : (
                "Selecciona una plantilla para continuar"
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none h-9 text-sm">
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={!selectedTemplate}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                Seleccionar Plantilla
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 