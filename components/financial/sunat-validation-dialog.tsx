"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText, Calendar, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Document } from "@/types/documents"
import { useSunatStore } from "@/stores/sunat-store"
import { useDocumentsStore } from "@/stores/documents-store"
import apiClient from "@/lib/axiosConfig"

interface SunatValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: Document[]
  companyId: string
  userId: string
  onValidationComplete: () => void
}

interface ValidationResult {
  documentId: string
  documentNumber: string
  supplierName: string
  found: boolean
  sunatSource?: "invoice" | "rhe"
  sunatData?: any
  error?: string
  previousStatus?: string
  newStatus?: string
  statusChanged?: boolean
}

interface ValidationResponse {
  results: ValidationResult[]
  summary: {
    total: number
    found: number
    notFound: number
    errors: number
  }
}

export default function SunatValidationDialog({
  open,
  onOpenChange,
  documents,
  companyId,
  userId,
  onValidationComplete
}: SunatValidationDialogProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showDateSelector, setShowDateSelector] = useState(true)

  const { toast } = useToast()
  const { updateDocumentStatus } = useDocumentsStore()

  // Inicializar cuando se abre el diálogo
  useEffect(() => {
    if (open && documents.length > 0) {
      setValidationResults([])
      setShowDateSelector(true)
      setStartDate("")
      setEndDate("")
    }
  }, [open, documents])

  const startValidation = async () => {
    if (!companyId || !userId) {
      toast({
        title: "Error",
        description: "No se pudo identificar la empresa o usuario",
        variant: "destructive"
      })
      return
    }

    if (!startDate || !endDate) {
      toast({
        title: "Fechas requeridas",
        description: "Por favor seleccione un rango de fechas para la validación",
        variant: "destructive"
      })
      return
    }

    setIsValidating(true)
    setShowDateSelector(false)

    try {
      // Llamar al endpoint de validación
      const response = await apiClient.post<ValidationResponse>("/sunat/validate", {
        companyId,
        startDate,
        endDate
      })

      const { results, summary } = response.data
      
      // Enriquecer resultados con información de estado anterior y posterior
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          if (result.documentId) {
            try {
              // Buscar el documento actual para obtener su estado anterior
              const currentDoc = documents.find(doc => doc.id === result.documentId)
              const previousStatus = currentDoc?.status || "UNKNOWN"
              
              let newStatus = previousStatus
              let statusChanged = false
              
              // Solo actualizar si se encontró en SUNAT y no está ya aprobado
              if (result.found && previousStatus !== "APPROVED") {
                try {
                  await updateDocumentStatus(result.documentId, "APPROVED", userId)
                  newStatus = "APPROVED"
                  statusChanged = true
                } catch (error) {
                  console.error("Error actualizando estado:", error)
                  newStatus = previousStatus
                }
              } else if (result.found && previousStatus === "APPROVED") {
                // Ya estaba aprobado
                newStatus = "APPROVED"
                statusChanged = false
              }
              
              return {
                ...result,
                previousStatus,
                newStatus,
                statusChanged
              }
            } catch (error) {
              console.error("Error procesando documento:", error)
              return {
                ...result,
                previousStatus: "UNKNOWN",
                newStatus: "UNKNOWN",
                statusChanged: false
              }
            }
          }
          return result
        })
      )
      
      setValidationResults(enrichedResults)

      const changedCount = enrichedResults.filter(r => r.statusChanged).length
      const alreadyApprovedCount = enrichedResults.filter(r => r.found && !r.statusChanged).length
      
      toast({
        title: "Validación completada",
        description: `Se encontraron ${summary.found} documentos en SUNAT. ${changedCount} estados cambiaron a "Aprobado". ${alreadyApprovedCount} ya estaban aprobados.`,
        duration: 12000, // 12 segundos para este toast importante
      })
      
      onValidationComplete()
    } catch (error: any) {
      console.error("Error en la validación:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error durante la validación SUNAT",
        variant: "destructive",
        duration: 10000, // 10 segundos para errores
      })
    } finally {
      setIsValidating(false)
    }
  }

  const getStatusIcon = (found: boolean) => {
    if (found) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusBadge = (found: boolean) => {
    if (found) {
      return <Badge className="bg-green-100 text-green-600">Encontrado</Badge>
    }
    return <Badge className="bg-red-100 text-red-600">No encontrado</Badge>
  }

  const handleClose = () => {
    if (!isValidating) {
      onOpenChange(false)
      setValidationResults([])
      setShowDateSelector(true)
      setStartDate("")
      setEndDate("")
    }
  }

  const handleRestart = () => {
    setValidationResults([])
    setShowDateSelector(true)
    setStartDate("")
    setEndDate("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Validación SUNAT
          </DialogTitle>
          <DialogDescription>
            Valida los documentos contra la base de datos de SUNAT en un rango de fechas específico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de fechas */}
          {showDateSelector && !isValidating && (
            <div className="space-y-6 text-center py-8">
              <div className="text-sm text-gray-600 max-w-md mx-auto">
                <p>Seleccione el rango de fechas para validar los documentos contra SUNAT.</p>
                <p className="mt-2">Los documentos encontrados se marcarán automáticamente como "Aprobados".</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium">
                        Fecha de inicio
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-40"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium">
                        Fecha de fin
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-40"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Se validarán {documents.length} documento(s) en el rango seleccionado
                    {documents.length >= 1000 && (
                      <span className="block text-orange-600 font-medium mt-1">
                        ⚠️ Límite de 1000 documentos alcanzado. Considere usar un rango de fechas más específico.
                      </span>
                    )}
                  </p>
                </div>
                
                <Button 
                  onClick={startValidation} 
                  size="lg"
                  disabled={!startDate || !endDate}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Iniciar Validación SUNAT
                </Button>
              </div>
            </div>
          )}

          {/* Progreso */}
          {isValidating && (
            <div className="space-y-4 text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-lg font-medium">Validando documentos contra SUNAT...</span>
              </div>
              <div className="text-sm text-gray-600">
                Por favor espere mientras se procesan {documents.length} documento(s)
              </div>
            </div>
          )}

          {/* Resultados */}
          {validationResults.length > 0 && !isValidating && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-5 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700">{validationResults.length}</div>
                  <div className="text-xs text-blue-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {validationResults.filter(r => r.found).length}
                  </div>
                  <div className="text-xs text-green-600">Encontrados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {validationResults.filter(r => r.statusChanged).length}
                  </div>
                  <div className="text-xs text-orange-600">Estados Cambiados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-700">
                    {validationResults.filter(r => !r.found).length}
                  </div>
                  <div className="text-xs text-red-600">No encontrados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">
                    {validationResults.filter(r => r.error).length}
                  </div>
                  <div className="text-xs text-red-500">Errores</div>
                </div>
              </div>

              {/* Lista de resultados */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {validationResults.map((result) => (
                  <div
                    key={result.documentId || result.documentNumber}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.found ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.found)}
                      <div className="flex-1">
                        <div className="font-medium">{result.documentNumber}</div>
                        <div className="text-sm text-gray-600">{result.supplierName}</div>
                        {result.found && result.sunatSource && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <div className="font-medium text-green-700">Encontrado en SUNAT:</div>
                            <div className="text-green-600">
                              Fuente: {result.sunatSource === "invoice" ? "Factura" : "RHE"}
                            </div>
                            {result.previousStatus && result.newStatus && (
                              <div className="mt-1 pt-1 border-t border-green-200">
                                <div className="text-green-600">
                                  Estado: <span className="font-medium">{result.previousStatus}</span> → <span className="font-medium">{result.newStatus}</span>
                                  {result.statusChanged && (
                                    <Badge className="ml-2 bg-orange-100 text-orange-600 text-xs">Cambió</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {result.error && (
                          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                            <div className="text-orange-600">Error: {result.error}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.found)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div>
              {!isValidating && validationResults.length > 0 && (
                <Button variant="outline" onClick={handleRestart} size="sm">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Nueva Validación
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!isValidating && (
                <Button variant="outline" onClick={handleClose}>
                  Cerrar
                </Button>
              )}
              {isValidating && (
                <Button variant="outline" disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validando...
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
