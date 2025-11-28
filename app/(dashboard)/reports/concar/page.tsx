"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/stores/authStore"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import apiClient from "@/lib/axiosConfig"
import { Loader2, Download, FileText, Database, BarChart3, ChevronDown, FileSpreadsheet } from "lucide-react"
import { ScrollableTable } from "@/components/ui/scrollable-table"
import { MonthYearPicker } from "@/components/ui/month-year-picker"

interface ConcarQueryParams {
  companyId?: string
  startDate?: string
  endDate?: string
  bankAccountId?: string | "all"
  conciliationType?: string
  documentClassification?: string
  limit?: number
  offset?: number
}

// Interfaz según el formato CONCAR Export (39 campos A-AD)
interface ConcarResult {
  campo: string // A - Identificador único
  subDiario: string // B - Código del subdiario (15 o 11)
  numeroComprobante: string // C - Número de comprobante (MMNNNN)
  fechaComprobante: string // D - Fecha del comprobante (dd/mm/yyyy)
  codigoMoneda: string // E - Código de moneda
  glosaPrincipal: string // F - Descripción principal
  tipoCambio: string // G - Tipo de cambio
  tipoConversion: string // H - Tipo de conversión (V)
  flagConversionMoneda: string // I - Flag de conversión (S)
  fechaTipoCambio: string // J - Fecha del tipo de cambio
  cuentaContable: string // K - Código de cuenta contable
  codigoAnexo: string // L - Código anexo/auxiliar
  centroCosto: string // M - Centro de costo
  debeHaber: string // N - Tipo de movimiento (D o H)
  importeOriginal: string // O - Importe original (formato: 1,234.56)
  importeDolares: string // P - Importe en dólares
  importeSoles: string // Q - Importe en soles
  tipoDocumento: string // R - Tipo de documento (RH o FACTURA)
  numeroDocumento: string // S - Número de documento
  fechaDocumento: string // T - Fecha de emisión (dd/mm/yyyy)
  fechaVencimiento: string // U - Fecha de vencimiento (dd/mm/yyyy)
  codigoArea: string // V - Código de área
  glosaDetalle: string // W - Glosa detalle
  codigoAnexoAuxiliar: string // X - Código anexo auxiliar
  medioPago: string // Y - Medio de pago
  tipoDocumentoReferencia: string // Z - Tipo de documento de referencia
  numeroDocumentoReferencia: string // AA - Número de documento de referencia
  fechaDocumentoReferencia: string // AB - Fecha de documento de referencia
  nroRegRegistradorTipoDocRef: string // AC - Número de registro registrador
  baseImponibleDocumentoReferencia: string // AD - Base imponible de documento de referencia
}

interface ConcarExportSummary {
  totalRecords: number
  totalEntries: number
  period: string
  subDiario: string
}

interface ConcarExportResponse {
  data: ConcarResult[]
  summary: ConcarExportSummary
}

export default function ConcarReportPage() {
  const [queryParams, setQueryParams] = useState<ConcarQueryParams>({
    companyId: "",
    startDate: "",
    endDate: "",
    bankAccountId: "all",
    conciliationType: "",
    documentClassification: ""
  })

  // Estados para mes y año
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const [results, setResults] = useState<ConcarResult[]>([])
  const [loading, setLoading] = useState(false)
  const [responseInfo, setResponseInfo] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)

  const { toast } = useToast()
  const { company } = useAuthStore()
  const { bankAccounts, loading: bankAccountsLoading, getBankAccountsByCompany } = useBankAccountsStore()

  // Función para obtener el primer y último día del mes
  const getMonthDateRange = (year: string, month: string) => {
    if (!year || !month) return { startDate: "", endDate: "" }
    
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    const firstDay = new Date(yearNum, monthNum - 1, 1)
    const lastDay = new Date(yearNum, monthNum, 0) // Último día del mes
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(lastDay)
    }
  }

  // Actualizar fechas cuando cambie el mes o año
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const { startDate, endDate } = getMonthDateRange(selectedYear, selectedMonth)
      setQueryParams(prev => ({
        ...prev,
        startDate,
        endDate
      }))
    }
  }, [selectedMonth, selectedYear])

  // Inicializar mes actual si no hay uno seleccionado
  useEffect(() => {
    if (!selectedMonth) {
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
      setSelectedMonth(currentMonth)
    }
  }, [selectedMonth])

  // Inicializar companyId y cargar cuentas bancarias cuando esté disponible
  useEffect(() => {
    if (company?.id) {
      setQueryParams(prev => ({ ...prev, companyId: company.id }))
      // Cargar cuentas bancarias de la empresa
      getBankAccountsByCompany(company.id)
    }
  }, [company?.id, getBankAccountsByCompany])

  const handleParamChange = (key: keyof ConcarQueryParams, value: string | number) => {
    setQueryParams(prev => ({ ...prev, [key]: value }))
  }

  const executeQuery = async () => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar la empresa",
        variant: "destructive"
      })
      return
    }

    // Validar campos requeridos
    if (!queryParams.bankAccountId || queryParams.bankAccountId === "all") {
      toast({
        title: "Error",
        description: "Por favor selecciona una cuenta bancaria",
        variant: "destructive"
      })
      return
    }

    if (!queryParams.conciliationType) {
      toast({
        title: "Error",
        description: "Por favor selecciona un tipo de conciliación",
        variant: "destructive"
      })
      return
    }

    if (!queryParams.documentClassification) {
      toast({
        title: "Error",
        description: "Por favor selecciona una clasificación de documento",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResults([])
    setResponseInfo(null)

    try {
      // Construir query string según el formato del nuevo endpoint
      const queryString = new URLSearchParams()
      
      // Parámetros requeridos
      queryString.append("companyId", company.id)
      queryString.append("bankAccountIds", queryParams.bankAccountId)
      queryString.append("conciliationType", queryParams.conciliationType)
      queryString.append("documentType", queryParams.documentClassification)
      
      // Parámetros opcionales de fecha (si están disponibles)
      if (selectedYear && selectedMonth) {
        queryString.append("year", selectedYear)
        queryString.append("month", selectedMonth)
        
        // Calcular startDay y endDay del mes
        const { startDate, endDate } = getMonthDateRange(selectedYear, selectedMonth)
        if (startDate && endDate) {
          const startDay = parseInt(startDate.split('-')[2])
          const endDay = parseInt(endDate.split('-')[2])
          queryString.append("startDay", startDay.toString())
          queryString.append("endDay", endDay.toString())
        }
      }

      console.log("Sending query to /accounting-entries/concar-export:", {
        companyId: company.id,
        bankAccountIds: queryParams.bankAccountId,
        conciliationType: queryParams.conciliationType,
        documentType: queryParams.documentClassification,
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
        startDay: selectedYear && selectedMonth ? parseInt(getMonthDateRange(selectedYear, selectedMonth).startDate.split('-')[2]) : undefined,
        endDay: selectedYear && selectedMonth ? parseInt(getMonthDateRange(selectedYear, selectedMonth).endDate.split('-')[2]) : undefined,
      })
      console.log("Query string:", queryString.toString())
      
      const response = await apiClient.get<ConcarExportResponse>(`/accounting-entries/concar-export?${queryString.toString()}`)
      
      console.log("Concar export response:", response.data)
      
      if (response.data && response.data.data) {
        const data = response.data.data || []
        const summary = response.data.summary || {
          totalRecords: data.length,
          totalEntries: 0,
          period: selectedYear && selectedMonth ? `${selectedMonth}/${selectedYear}` : "Todos",
          subDiario: queryParams.documentClassification || ""
        }
        
        setResults(data)
        setResponseInfo({
          success: true,
          message: `Reporte generado exitosamente`,
          count: summary.totalRecords,
          summary: summary,
          query: Object.fromEntries(queryString)
        })
        
        toast({
          title: "Éxito",
          description: `Reporte generado con ${summary.totalRecords} registros (${summary.totalEntries} entradas)`,
        })
      } else {
        setResponseInfo({
          success: false,
          message: "Formato de respuesta no reconocido",
          error: "La respuesta del servidor no tiene el formato esperado",
          query: Object.fromEntries(queryString)
        })
        
        toast({
          title: "Error",
          description: "Formato de respuesta no reconocido",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error executing Concar export query:", error)
      
      const errorMessage = error.response?.data?.message 
        ? (Array.isArray(error.response.data.message) 
            ? error.response.data.message.join(", ")
            : error.response.data.message)
        : error.message || "Error desconocido"
      
      setResponseInfo({
        success: false,
        message: "Error de conexión",
        error: errorMessage,
        query: queryParams
      })
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadResultsCSV = () => {
    if (results.length === 0) return

    // Definir los nombres de las columnas según el formato CONCAR (39 campos A-AD)
    const columnNames = [
      "Campo", "Subdiario", "Número Comprobante", "Fecha Comprobante", "Código Moneda",
      "Glosa Principal", "Tipo Cambio", "Tipo Conversión", "Flag Conversión Moneda", "Fecha Tipo Cambio",
      "Cuenta Contable", "Código Anexo", "Centro Costo", "Debe/Haber", "Importe Original",
      "Importe Dólares", "Importe Soles", "Tipo Documento", "Número Documento", "Fecha Documento",
      "Fecha Vencimiento", "Código Área", "Glosa Detalle", "Código Anexo Auxiliar", "Medio Pago",
      "Tipo Documento Referencia", "Número Documento Referencia", "Fecha Documento Referencia",
      "Nro Reg Registrador Tipo Doc Ref", "Base Imponible Documento Referencia"
    ]

    const csvContent = [
      // Headers
      columnNames.join(","),
      // Data rows
      ...results.map(row => 
        columnNames.map((_, index) => {
          const value = Object.values(row)[index]
          if (value === null || value === undefined || value === "") return ""
          if (typeof value === "string") {
            // Escapar comillas y envolver en comillas si contiene comas
            const escaped = value.replace(/"/g, '""')
            return `"${escaped}"`
          }
          return `"${String(value)}"`
        }).join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const period = responseInfo?.summary?.period || new Date().toISOString().split("T")[0]
    a.download = `concar-export-${period.replace(/\//g, "-")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadResultsXLSX = async () => {
    if (results.length === 0) return

    setDownloading(true)
    
    try {
      // Dynamic import of xlsx library
      const xlsx = await import('xlsx')
      
      // Definir los nombres de las columnas según el formato CONCAR (39 campos A-AD)
      const columnHeaders = [
        "Campo", "Subdiario", "Número Comprobante", "Fecha Comprobante", "Código Moneda",
        "Glosa Principal", "Tipo Cambio", "Tipo Conversión", "Flag Conversión Moneda", "Fecha Tipo Cambio",
        "Cuenta Contable", "Código Anexo", "Centro Costo", "Debe/Haber", "Importe Original",
        "Importe Dólares", "Importe Soles", "Tipo Documento", "Número Documento", "Fecha Documento",
        "Fecha Vencimiento", "Código Área", "Glosa Detalle", "Código Anexo Auxiliar", "Medio Pago",
        "Tipo Documento Referencia", "Número Documento Referencia", "Fecha Documento Referencia",
        "Nro Reg Registrador Tipo Doc Ref", "Base Imponible Documento Referencia"
      ]

      // Preparar datos para Excel
      const excelData = results.map(row => ({
        "Campo": row.campo || "",
        "Subdiario": row.subDiario || "",
        "Número Comprobante": row.numeroComprobante || "",
        "Fecha Comprobante": row.fechaComprobante || "",
        "Código Moneda": row.codigoMoneda || "",
        "Glosa Principal": row.glosaPrincipal || "",
        "Tipo Cambio": row.tipoCambio || "",
        "Tipo Conversión": row.tipoConversion || "",
        "Flag Conversión Moneda": row.flagConversionMoneda || "",
        "Fecha Tipo Cambio": row.fechaTipoCambio || "",
        "Cuenta Contable": row.cuentaContable || "",
        "Código Anexo": row.codigoAnexo || "",
        "Centro Costo": row.centroCosto || "",
        "Debe/Haber": row.debeHaber || "",
        "Importe Original": row.importeOriginal || "",
        "Importe Dólares": row.importeDolares || "",
        "Importe Soles": row.importeSoles || "",
        "Tipo Documento": row.tipoDocumento || "",
        "Número Documento": row.numeroDocumento || "",
        "Fecha Documento": row.fechaDocumento || "",
        "Fecha Vencimiento": row.fechaVencimiento || "",
        "Código Área": row.codigoArea || "",
        "Glosa Detalle": row.glosaDetalle || "",
        "Código Anexo Auxiliar": row.codigoAnexoAuxiliar || "",
        "Medio Pago": row.medioPago || "",
        "Tipo Documento Referencia": row.tipoDocumentoReferencia || "",
        "Número Documento Referencia": row.numeroDocumentoReferencia || "",
        "Fecha Documento Referencia": row.fechaDocumentoReferencia || "",
        "Nro Reg Registrador Tipo Doc Ref": row.nroRegRegistradorTipoDocRef || "",
        "Base Imponible Documento Referencia": row.baseImponibleDocumentoReferencia || ""
      }))

      // Create workbook and worksheet
      const wb = xlsx.utils.book_new()
      const ws = xlsx.utils.json_to_sheet(excelData)

      // Auto-size columns
      const colWidths = columnHeaders.map(header => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map(row => String(row[header as keyof typeof row] || "").length)
        )
        return { wch: Math.min(maxLength + 2, 50) } // Máximo 50 caracteres de ancho
      })
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      const sheetName = responseInfo?.summary?.subDiario 
        ? `CONCAR ${responseInfo.summary.subDiario}` 
        : "CONCAR Export"
      xlsx.utils.book_append_sheet(wb, ws, sheetName)

      // Generate Excel file
      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      const period = responseInfo?.summary?.period 
        ? responseInfo.summary.period.replace(/\//g, "-") 
        : new Date().toISOString().split("T")[0]
      link.setAttribute('download', `concar-export-${period}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Éxito",
        description: "Archivo Excel descargado correctamente",
      })
    } catch (error: any) {
      console.error('Error exporting to Excel:', error)
      toast({
        title: "Error",
        description: error.message || "Error al exportar a Excel",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-"
    if (typeof value === "boolean") return value ? "Sí" : "No"
    if (value instanceof Date) return value.toLocaleDateString()
    if (Array.isArray(value)) return value.join(", ")
    return String(value)
  }

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined || value === "") return "-"
    const numValue = Number(value)
    if (isNaN(numValue)) return "-"
    return `S/ ${numValue.toFixed(2)}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporte Concar</h1>
          <p className="text-gray-600">Genera reportes personalizados de conciliaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Database className="w-4 h-4 mr-1" />
            Modo Prueba
          </Badge>
          {company && (
            <Badge variant="secondary" className="text-sm">
              Empresa: {company.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Formulario de parámetros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Parámetros de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primera fila: Empresa, Período, Fecha Inicio, Fecha Fin */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">Empresa</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-md">
                  <div className="font-medium">{company?.name || "Cargando..."}</div>
                  <div className="text-sm text-gray-500">{company?.id || "ID no disponible"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Período (Mes y Año)</Label>
                <MonthYearPicker
                  month={selectedMonth}
                  year={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                  placeholder="Seleccionar mes y año"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-md text-sm font-mono">
                  {queryParams.startDate || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-md text-sm font-mono">
                  {queryParams.endDate || "-"}
                </div>
              </div>
            </div>

            {/* Resto de campos en grid de 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankAccountId">Cuenta Bancaria</Label>
                <Select
                  value={queryParams.bankAccountId}
                  onValueChange={(value) => handleParamChange("bankAccountId", value)}
                  disabled={bankAccountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={bankAccountsLoading ? "Cargando..." : "Seleccionar cuenta"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountNumber} - {account.alias || account.description || "Sin alias"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conciliationType">Tipo Conciliación</Label>
                <Select
                  value={queryParams.conciliationType}
                  onValueChange={(value) => handleParamChange("conciliationType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENTS">Documentos</SelectItem>
                    <SelectItem value="DETRACTIONS">Detracciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentClassification">Clasificación de Documento</Label>
                <Select
                  value={queryParams.documentClassification}
                  onValueChange={(value) => handleParamChange("documentClassification", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar clasificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 - RH</SelectItem>
                    <SelectItem value="11">11 - COMPRAS (FACTURAS)</SelectItem>
                    <SelectItem value="22" disabled className="text-muted-foreground/50">22 - LIBRO DE EGRESOS</SelectItem>
                    <SelectItem value="21" disabled className="text-muted-foreground/50">21 - LIBRO DE INGRESOS</SelectItem>
                    <SelectItem value="31" disabled className="text-muted-foreground/50">31 - LIBRO DIARIO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button 
              onClick={executeQuery} 
              disabled={loading || !company?.id}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Ejecutar Consulta
                </>
              )}
            </Button>

            {results.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={downloadResultsCSV}>
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadResultsXLSX}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Descargar XLSX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de respuesta */}
      {responseInfo && (
        <Card className={responseInfo.success ? "border-green-200" : "border-red-200"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              responseInfo.success ? "text-green-700" : "text-red-700"
            }`}>
              {responseInfo.success ? "✅ Respuesta Exitosa" : "❌ Error en Consulta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Mensaje:</strong> {responseInfo.message}</p>
              {responseInfo.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Registros</p>
                    <p className="text-lg font-semibold">{responseInfo.summary.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Entradas</p>
                    <p className="text-lg font-semibold">{responseInfo.summary.totalEntries}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Período</p>
                    <p className="text-lg font-semibold">{responseInfo.summary.period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subdiario</p>
                    <p className="text-lg font-semibold">{responseInfo.summary.subDiario}</p>
                  </div>
                </div>
              )}
              {responseInfo.count !== undefined && !responseInfo.summary && (
                <p><strong>Resultados:</strong> {responseInfo.count}</p>
              )}
              {responseInfo.error && (
                <p><strong>Error:</strong> <code className="bg-red-100 px-2 py-1 rounded">{responseInfo.error}</code></p>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Ver parámetros enviados</summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
                  {JSON.stringify(responseInfo.query, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados ({results.length})</span>
              <Badge variant="secondary">
                {results.length} registros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Vista Tabla</TabsTrigger>
                <TabsTrigger value="json">Vista JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="mt-4">
                <ScrollableTable
                  data={results}
                  columns={[
                    {
                      key: "subDiario",
                      header: "Subdiario",
                      render: (result) => (
                        <Badge variant="outline">{result.subDiario}</Badge>
                      ),
                    },
                    {
                      key: "numeroComprobante",
                      header: "Comprobante",
                      render: (result) => (
                        <div className="font-mono">{result.numeroComprobante}</div>
                      ),
                    },
                    {
                      key: "fechaComprobante",
                      header: "Fecha",
                      render: (result) => result.fechaComprobante || "-",
                    },
                    {
                      key: "cuentaContable",
                      header: "Cuenta Contable",
                      render: (result) => (
                        <div className="font-mono">{result.cuentaContable || "-"}</div>
                      ),
                    },
                    {
                      key: "debeHaber",
                      header: "D/H",
                      render: (result) => (
                        <Badge variant={result.debeHaber === "D" ? "default" : "secondary"}>
                          {result.debeHaber}
                        </Badge>
                      ),
                    },
                    {
                      key: "importeOriginal",
                      header: "Importe",
                      render: (result) => (
                        <div className="font-medium text-right">
                          {result.importeOriginal || "-"}
                        </div>
                      ),
                    },
                    {
                      key: "tipoDocumento",
                      header: "Tipo Doc.",
                      render: (result) => (
                        <Badge variant="outline">{result.tipoDocumento || "-"}</Badge>
                      ),
                    },
                    {
                      key: "numeroDocumento",
                      header: "N° Documento",
                      render: (result) => (
                        <div className="text-sm">{result.numeroDocumento || "-"}</div>
                      ),
                    },
                    {
                      key: "fechaDocumento",
                      header: "F. Documento",
                      render: (result) => result.fechaDocumento || "-",
                    },
                    {
                      key: "glosaPrincipal",
                      header: "Glosa",
                      render: (result) => (
                        <div className="text-sm max-w-md truncate" title={result.glosaPrincipal}>
                          {result.glosaPrincipal || "-"}
                        </div>
                      ),
                    },
                    {
                      key: "codigoMoneda",
                      header: "Moneda",
                      render: (result) => result.codigoMoneda || "-",
                    },
                  ]}
                  emptyTitle="No hay resultados"
                  emptyDescription="No se encontraron registros con los parámetros especificados"
                  emptyIcon={<FileText className="h-10 w-10" />}
                />
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(results.slice(0, 10), null, 2)}
                  </pre>
                  {results.length > 10 && (
                    <div className="mt-2 text-sm text-gray-500">
                      Mostrando 10 de {results.length} resultados en formato JSON
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}