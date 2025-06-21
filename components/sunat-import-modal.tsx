"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Loader2,
  Code,
  Database,
  FileSpreadsheet,
  Zap,
} from "lucide-react"
import { useSunatStore } from "@/stores/sunat-store"
import { useAuthStore } from "@/stores/authStore"

interface SunatImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "rhe" | "invoices"
}

interface ParsedData {
  headers: string[]
  rows: string[][]
  totalRows: number
  warnings: string[]
}

interface ImportResult {
  success: number
  errors: number
  errorDetails: Array<{ row: number; error: string }>
}

export function SunatImportModal({ open, onOpenChange, type }: SunatImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuthStore()
  const { createSunatRhe, createSunatInvoice } = useSunatStore()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.toLowerCase().endsWith(".txt")) {
        setSelectedFile(file)
        setParseError(null)
        parseFile(file)
      } else {
        setParseError("Solo se permiten archivos TXT")
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.toLowerCase().endsWith(".txt")) {
        setSelectedFile(file)
        setParseError(null)
        parseFile(file)
      } else {
        setParseError("Solo se permiten archivos TXT")
      }
    }
  }

  const parseFile = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)

      if (lines.length < 2) {
        setParseError("El archivo debe contener al menos una fila de encabezados y una fila de datos")
        return
      }

      const headers = lines[0].split("|").map((h) => h.trim())
      const rows = lines.slice(1).map((line) => {
        const cells = line.split("|").map((cell) => cell.trim())
        // Asegurar que todas las filas tengan el mismo número de columnas
        while (cells.length < headers.length) {
          cells.push("")
        }
        return cells.slice(0, headers.length)
      })

      setParsedData({
        headers,
        rows,
        totalRows: rows.length,
        warnings: [],
      })
      setParseError(null)
    } catch (error) {
      console.error("Parse error:", error)
      setParseError("Error al leer el archivo. Asegúrate de que sea un archivo TXT válido.")
    }
  }

  const getValueByHeader = (row: string[], headers: string[], headerName: string) => {
    const index = headers.findIndex((h) => h.trim() === headerName)
    return index >= 0 ? row[index]?.trim() || "" : ""
  }

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === "" || dateStr === "-") {
      return new Date()
    }
    try {
      const [day, month, year] = dateStr.split("/")
      if (day && month && year) {
        return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      }
      return new Date()
    } catch {
      return new Date()
    }
  }

  const parseNumber = (numStr: string, defaultValue = 0) => {
    if (!numStr || numStr === "" || numStr === "-") return defaultValue
    const num = Number.parseFloat(numStr.replace(/,/g, ""))
    return isNaN(num) ? defaultValue : num
  }

  const mapRowToRheDto = (row: string[], headers: string[]) => {
    try {
      const issueDate = parseDate(getValueByHeader(row, headers, "Fecha de Emisión"))
      const documentType = getValueByHeader(row, headers, "Tipo Doc. Emitido") || "RH"
      const documentNumber = getValueByHeader(row, headers, "Nro. Doc. Emitido") || `AUTO-${Date.now()}`
      const issuerRuc = getValueByHeader(row, headers, "Nro. Doc. Emisor") || ""
      const issuerName =
        getValueByHeader(row, headers, "Apellidos y Nombres, Denominación o Razón Social del Emisor") || ""
      const grossIncome = parseNumber(getValueByHeader(row, headers, "Renta Bruta"))
      const incomeTax = parseNumber(getValueByHeader(row, headers, "Impuesto a la Renta"))
      const netIncome = parseNumber(getValueByHeader(row, headers, "Renta Neta"))

      return {
        issueDate,
        documentType,
        documentNumber,
        status: "VIGENTE",
        issuerDocumentType: "RUC",
        issuerRuc,
        issuerName,
        rentType: "CUARTA_CATEGORIA",
        isFree: false,
        currency: "PEN",
        grossIncome,
        incomeTax,
        netIncome,
        sourceFile: selectedFile?.name || "",
        companyId: user?.companyId || "",
        userId: user?.id || "",
      }
    } catch (error) {
      console.error("Error mapping RHE row:", error)
      throw new Error(`Error procesando fila: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  const mapRowToInvoiceDto = (row: string[], headers: string[]) => {
    try {
      const period = getValueByHeader(row, headers, "Periodo") || ""
      const carSunat = getValueByHeader(row, headers, "CAR SUNAT") || ""
      const ruc = getValueByHeader(row, headers, "RUC") || ""
      const name = getValueByHeader(row, headers, "Apellidos y Nombres o Razón social") || ""
      const issueDate = parseDate(getValueByHeader(row, headers, "Fecha de emisión"))
      const documentType = getValueByHeader(row, headers, "Tipo CP/Doc.") || "01"
      const series = getValueByHeader(row, headers, "Serie del CDP") || ""
      const documentNumber = getValueByHeader(row, headers, "Nro CP o Doc. Nro Inicial (Rango)") || `AUTO-${Date.now()}`
      const taxableBase = parseNumber(getValueByHeader(row, headers, "BI Gravado DG"))
      const igv = parseNumber(getValueByHeader(row, headers, "IGV / IPM DG"))
      const total = parseNumber(getValueByHeader(row, headers, "Total CP"))

      return {
        period,
        carSunat,
        ruc,
        name,
        issueDate,
        documentType,
        series,
        year: new Date().getFullYear().toString(),
        documentNumber,
        taxableBase,
        igv,
        total,
        currency: "PEN",
        invoiceStatus: "VIGENTE",
        sourceFile: selectedFile?.name || "",
        companyId: user?.companyId || "",
        userId: user?.id || "",
      }
    } catch (error) {
      console.error("Error mapping Invoice row:", error)
      throw new Error(`Error procesando fila: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  const generatePayloadsPreview = () => {
    if (!parsedData) return []

    return parsedData.rows.slice(0, 5).map((row, index) => {
      try {
        const payload =
          type === "rhe" ? mapRowToRheDto(row, parsedData.headers) : mapRowToInvoiceDto(row, parsedData.headers)

        return {
          rowNumber: index + 1,
          payload: JSON.stringify(payload, null, 2),
          error: null,
        }
      } catch (error) {
        return {
          rowNumber: index + 1,
          payload: "",
          error: error instanceof Error ? error.message : "Error desconocido",
        }
      }
    })
  }

  const handleImport = async () => {
    if (!parsedData || !user?.companyId || !user?.id) return

    setImporting(true)
    setImportProgress(0)

    const result: ImportResult = {
      success: 0,
      errors: 0,
      errorDetails: [],
    }

    const totalRows = parsedData.rows.length

    for (let i = 0; i < totalRows; i++) {
      const row = parsedData.rows[i]
      const rowNumber = i + 1

      try {
        let response
        if (type === "rhe") {
          const dto = mapRowToRheDto(row, parsedData.headers)
          response = await createSunatRhe(dto)
        } else {
          const dto = mapRowToInvoiceDto(row, parsedData.headers)
          response = await createSunatInvoice(dto)
        }

        result.success++
        console.log(`✅ Row ${rowNumber} processed successfully`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        console.error(`❌ Error processing row ${rowNumber}:`, error)
        result.errors++
        result.errorDetails.push({
          row: rowNumber,
          error: errorMessage,
        })
      }

      // Update progress
      const progress = Math.round(((i + 1) / totalRows) * 100)
      setImportProgress(progress)

      // Small delay to prevent overwhelming the API
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    setImportResult(result)
    setImporting(false)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setDragActive(false)
    setParsedData(null)
    setShowPreview(false)
    setParseError(null)
    setImporting(false)
    setImportProgress(0)
    setImportResult(null)
    onOpenChange(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setParsedData(null)
    setShowPreview(false)
    setParseError(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const title = type === "rhe" ? "Importar Archivo RHE" : "Importar Archivo de Facturas"
  const description =
    type === "rhe"
      ? "Selecciona el archivo TXT de Registro de Honorarios Electrónicos de SUNAT"
      : "Selecciona el archivo TXT de facturas/comprobantes de SUNAT"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{description}</p>

              {!showPreview && !importResult && (
                <>
                  {/* File Upload */}
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-6">
                      <div
                        className={`p-8 text-center border-2 border-dashed rounded-lg transition-colors ${
                          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          {dragActive ? "¡Suelta el archivo aquí!" : "Arrastra tu archivo TXT"}
                        </h3>
                        <p className="text-muted-foreground mb-4">Archivos TXT delimitados por pipes (|)</p>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                          <FileText className="h-4 w-4 mr-2" />
                          Seleccionar Archivo
                        </Button>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected File */}
                  {selectedFile && (
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-lg">{selectedFile.name}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>📁 {(selectedFile.size / 1024).toFixed(2)} KB</span>
                                {parsedData && (
                                  <>
                                    <span>📊 {parsedData.totalRows} filas</span>
                                    <span>📋 {parsedData.headers.length} columnas</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {parsedData && (
                              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Vista Previa
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={importing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Enhanced Preview */}
              {showPreview && parsedData && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Vista Previa del Archivo
                        </h3>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            📊 <strong>{parsedData.totalRows}</strong> filas
                          </span>
                          <span className="flex items-center gap-1">
                            📋 <strong>{parsedData.headers.length}</strong> columnas
                          </span>
                          <span className="flex items-center gap-1">
                            📁 <strong>{selectedFile?.name}</strong>
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Ocultar Vista Previa
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="data" className="w-full">
                      <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="data" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Datos del Archivo
                          </TabsTrigger>
                          <TabsTrigger value="payload" className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Vista Previa API
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="data" className="mt-0">
                        <div className="border-t">
                          <div className="p-4 bg-muted/20 border-b">
                            <p className="text-sm text-muted-foreground">
                              💡 <strong>Tip:</strong> Usa scroll horizontal para ver todas las columnas. 
                              Pasa el mouse sobre las celdas para ver el contenido completo.
                            </p>
                          </div>
                          <div className="overflow-auto max-h-[500px]">
                            <div className="min-w-max">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="w-16 sticky left-0 bg-muted/50 z-20 border-r font-bold">
                                      #
                                    </TableHead>
                                    {parsedData.headers.map((header, index) => (
                                      <TableHead 
                                        key={index} 
                                        className="min-w-[200px] max-w-[300px] px-4 py-3 font-semibold bg-muted/30"
                                        title={header}
                                      >
                                        <div className="truncate">
                                          {header}
                                        </div>
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {parsedData.rows.slice(0, 50).map((row, rowIndex) => (
                                    <TableRow key={rowIndex} className="hover:bg-muted/20">
                                      <TableCell className="sticky left-0 bg-background z-10 border-r font-mono text-sm font-bold">
                                        <div className="w-12 text-center bg-muted/20 rounded px-2 py-1">
                                          {rowIndex + 1}
                                        </div>
                                      </TableCell>
                                      {row.map((cell, cellIndex) => (
                                        <TableCell 
                                          key={cellIndex} 
                                          className="px-4 py-3 text-sm min-w-[200px] max-w-[300px] cursor-help"
                                          title={cell || "Valor vacío"}
                                        >
                                          <div className="truncate">
                                            {cell || <span className="text-muted-foreground italic">Sin datos</span>}
                                          </div>
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          <div className="border-t bg-muted/10 p-3">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>Mostrando primeras 50 filas de {parsedData.totalRows} total</span>
                              <div className="flex items-center gap-4">
                                <span>↕️ Scroll vertical</span>
                                <span>↔️ Scroll horizontal</span>
                                <span>🖱️ Hover para detalles</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="payload" className="mt-0">
                        <div className="p-6 space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">
                              🚀 Payload que se enviará a la API
                            </h4>
                            <p className="text-sm text-blue-700">
                              Vista previa de las primeras 3 filas de <strong>{parsedData.totalRows}</strong> total
                            </p>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {generatePayloadsPreview().slice(0, 3).map((item, index) => (
                              <Card key={index} className="border-l-4 border-l-primary">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                                        Fila #{item.rowNumber}
                                      </div>
                                      <span className="text-muted-foreground">→</span>
                                      <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {type === "rhe" ? "createSunatRhe()" : "createSunatInvoice()"}
                                      </code>
                                    </h4>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {item.error ? (
                                    <Alert variant="destructive">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>{item.error}</AlertDescription>
                                    </Alert>
                                  ) : (
                                    <div className="bg-slate-50 border rounded-lg overflow-hidden">
                                      <div className="bg-slate-100 px-3 py-2 border-b">
                                        <span className="text-xs font-mono text-slate-600">JSON Payload</span>
                                      </div>
                                      <div className="p-3 overflow-auto max-h-48">
                                        <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                                          {item.payload}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Import Progress */}
              {importing && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-900">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          Importando Registros...
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Procesando archivo: <strong>{selectedFile?.name}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-blue-600 mb-1">
                          {importProgress}%
                        </div>
                        <div className="text-sm text-blue-700">
                          {parsedData && Math.round((importProgress / 100) * parsedData.totalRows)} de {parsedData?.totalRows} registros
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Progreso General</span>
                          <span>{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} className="h-3" />
                      </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white/50 rounded-lg p-3 border">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((importProgress / 100) * (parsedData?.totalRows || 0))}
                        </div>
                        <div className="text-xs text-green-700 font-medium">Procesados</div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 border">
                        <div className="text-2xl font-bold text-blue-600">
                          {(parsedData?.totalRows || 0) - Math.round((importProgress / 100) * (parsedData?.totalRows || 0))}
                        </div>
                        <div className="text-xs text-blue-700 font-medium">Pendientes</div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 border">
                        <div className="text-2xl font-bold text-gray-600">
                          {parsedData?.totalRows || 0}
                        </div>
                        <div className="text-xs text-gray-700 font-medium">Total</div>
                      </div>
                    </div>

                    <div className="bg-white/30 rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium">Estado:</span>
                        <span>Enviando datos a la API de SUNAT...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Import Results */}
            {importResult && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2 text-green-900">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Importación Completada
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Archivo: <strong>{selectedFile?.name}</strong> procesado exitosamente
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">100%</div>
                      <div className="text-sm text-green-700">Completado</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="text-center p-6">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <div className="text-4xl font-bold text-green-700 mb-2">{importResult.success}</div>
                        <div className="text-sm font-medium text-green-800">Registros Exitosos</div>
                        <div className="text-xs text-green-600 mt-1">
                          {parsedData && `${((importResult.success / parsedData.totalRows) * 100).toFixed(1)}% del total`}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="text-center p-6">
                        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                        <div className="text-4xl font-bold text-red-700 mb-2">{importResult.errors}</div>
                        <div className="text-sm font-medium text-red-800">Errores Encontrados</div>
                        <div className="text-xs text-red-600 mt-1">
                          {parsedData && `${((importResult.errors / parsedData.totalRows) * 100).toFixed(1)}% del total`}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {importResult.errorDetails.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader className="pb-3">
                        <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Detalles de Errores ({importResult.errorDetails.length})
                        </h4>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-48 overflow-auto space-y-2">
                          {importResult.errorDetails.slice(0, 10).map((error, index) => (
                            <div key={index} className="bg-white border border-amber-200 rounded p-3">
                              <div className="flex items-start gap-2">
                                <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-mono font-bold">
                                  Fila {error.row}
                                </div>
                                <div className="flex-1 text-sm text-amber-800">
                                  {error.error}
                                </div>
                              </div>
                            </div>
                          ))}
                          {importResult.errorDetails.length > 10 && (
                            <div className="text-center py-2">
                              <div className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block">
                                ... y {importResult.errorDetails.length - 10} errores más
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error Messages */}
            {parseError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">{parseError}</AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Enhanced Actions */}
      <div className="flex justify-between items-center pt-4 border-t bg-muted/20 -mx-6 px-6 -mb-6 pb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {parsedData && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                📊 <strong>{parsedData.totalRows}</strong> registros
              </span>
              <span className="flex items-center gap-1">
                📁 <strong>{selectedFile?.name}</strong>
              </span>
              {importing && (
                <span className="flex items-center gap-1 text-blue-600">
                  ⚡ <strong>{importProgress}%</strong> completado
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {importResult ? "Cerrar" : "Cancelar"}
          </Button>
          {parsedData && !importing && !importResult && (
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || importing || !!parseError}
              className="bg-primary hover:bg-primary/90"
            >
              <Zap className="h-4 w-4 mr-2" />
              Importar {parsedData.totalRows} registros
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
)
}