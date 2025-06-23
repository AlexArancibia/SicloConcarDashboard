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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Code,
  Database,
  FileSpreadsheet,
  Zap,
  Filter,
  Info,
  ChevronRight,
  Activity,
  BarChart3,
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
  skipped: number
  errorDetails: Array<{ row: number; error: string }>
  skippedDetails: Array<{ row: number; reason: string; ruc: string }>
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
  const [excludePersonalRuc, setExcludePersonalRuc] = useState(true)
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

  const shouldExcludeRuc = (ruc: string) => {
    if (!excludePersonalRuc) return false
    return ruc.startsWith("10")
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
      const identityDocumentNumber = getValueByHeader(row, headers, "Nro Doc Identidad") || ""
      const customerName = getValueByHeader(row, headers, "Apellidos Nombres/ Razón  Social") || ""
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
        identityDocumentNumber,
        customerName,
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
        if (type === "invoices") {
          const providerRuc = getValueByHeader(row, parsedData.headers, "Nro Doc Identidad") || ""
          if (shouldExcludeRuc(providerRuc)) {
            return {
              rowNumber: index + 1,
              payload: "",
              error: null,
              skipped: true,
              skipReason: `RUC ${providerRuc} excluido (persona natural)`,
            }
          }
        }

        const payload =
          type === "rhe" ? mapRowToRheDto(row, parsedData.headers) : mapRowToInvoiceDto(row, parsedData.headers)

        return {
          rowNumber: index + 1,
          payload: JSON.stringify(payload, null, 2),
          error: null,
          skipped: false,
        }
      } catch (error) {
        return {
          rowNumber: index + 1,
          payload: "",
          error: error instanceof Error ? error.message : "Error desconocido",
          skipped: false,
        }
      }
    })
  }

  const getFilteredRowsCount = () => {
    if (!parsedData || type !== "invoices" || !excludePersonalRuc) {
      return parsedData?.totalRows || 0
    }

    return parsedData.rows.filter((row) => {
      const providerRuc = getValueByHeader(row, parsedData.headers, "Nro Doc Identidad") || ""
      return !shouldExcludeRuc(providerRuc)
    }).length
  }

  const handleImport = async () => {
    if (!parsedData || !user?.companyId || !user?.id) return

    setImporting(true)
    setImportProgress(0)

    const result: ImportResult = {
      success: 0,
      errors: 0,
      skipped: 0,
      errorDetails: [],
      skippedDetails: [],
    }

    const totalRows = parsedData.rows.length

    for (let i = 0; i < totalRows; i++) {
      const row = parsedData.rows[i]
      const rowNumber = i + 1

      try {
        if (type === "invoices") {
          const providerRuc = getValueByHeader(row, parsedData.headers, "Nro Doc Identidad") || ""
          if (shouldExcludeRuc(providerRuc)) {
            result.skipped++
            result.skippedDetails.push({
              row: rowNumber,
              reason: "RUC de persona natural excluido",
              ruc: providerRuc,
            })
            console.log(`⏭️ Row ${rowNumber} skipped: RUC ${providerRuc} (persona natural)`)
            continue
          }
        }

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

      const progress = Math.round(((i + 1) / totalRows) * 100)
      setImportProgress(progress)

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

  const title = type === "rhe" ? "Importar RHE" : "Importar Facturas"
  const description = type === "rhe" ? "Registro de Honorarios Electrónicos" : "Comprobantes de Pago"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {/* File Upload Section */}
              {!showPreview && !importResult && (
                <div className="space-y-4">
                  {/* Filter Options */}
                  {type === "invoices" && (
                    <Card className="border-0 bg-slate-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Filter className="h-4 w-4 text-slate-600" />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="exclude-personal-ruc"
                              checked={excludePersonalRuc}
                              onCheckedChange={(checked) => setExcludePersonalRuc(checked as boolean)}
                            />
                            <Label htmlFor="exclude-personal-ruc" className="text-sm font-medium">
                              Excluir personas naturales (RUC 10xxxxxxxxx)
                            </Label>
                          </div>
                          {parsedData && (
                            <Badge variant="secondary" className="ml-auto">
                              {getFilteredRowsCount()} de {parsedData.totalRows} registros
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upload Area */}
                  <Card className="border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-8">
                      <div
                        className={`text-center transition-all duration-200 ${dragActive ? "scale-105" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <div
                          className={`p-4 rounded-full mx-auto w-fit mb-4 transition-colors ${
                            dragActive ? "bg-primary/20" : "bg-slate-100"
                          }`}
                        >
                          <Upload
                            className={`h-8 w-8 transition-colors ${dragActive ? "text-primary" : "text-slate-500"}`}
                          />
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          {dragActive ? "Suelta el archivo aquí" : "Selecciona tu archivo"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Archivos TXT con formato SUNAT (delimitado por |)
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importing}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Examinar archivos
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

                  {/* File Info */}
                  {selectedFile && parsedData && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                              <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-medium text-lg">{selectedFile.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-slate-500" />
                                  <span className="text-sm font-medium">{parsedData.totalRows}</span>
                                  <span className="text-sm text-muted-foreground">registros</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4 text-slate-500" />
                                  <span className="text-sm font-medium">{parsedData.headers.length}</span>
                                  <span className="text-sm text-muted-foreground">columnas</span>
                                </div>
                                {type === "invoices" && excludePersonalRuc && (
                                  <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-600">{getFilteredRowsCount()}</span>
                                    <span className="text-sm text-muted-foreground">a procesar</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              Previsualizar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={importing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Preview Section */}
              {showPreview && parsedData && (
                <div className="space-y-6">
                  {/* Preview Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Vista Previa</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedFile?.name} • {parsedData.totalRows} registros
                          {type === "invoices" && excludePersonalRuc && (
                            <span className="text-blue-600"> • {getFilteredRowsCount()} a procesar</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="gap-2">
                      <EyeOff className="h-4 w-4" />
                      Ocultar
                    </Button>
                  </div>

                  {/* Preview Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview" className="gap-2">
                        <Info className="h-4 w-4" />
                        Resumen
                      </TabsTrigger>
                      <TabsTrigger value="data" className="gap-2">
                        <Database className="h-4 w-4" />
                        Datos
                      </TabsTrigger>
                      <TabsTrigger value="payload" className="gap-2">
                        <Code className="h-4 w-4" />
                        API Preview
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6 text-center">
                            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                              <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold">{parsedData.totalRows}</div>
                            <div className="text-sm text-muted-foreground">Total de registros</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6 text-center">
                            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="text-2xl font-bold text-green-600">{getFilteredRowsCount()}</div>
                            <div className="text-sm text-muted-foreground">A procesar</div>
                          </CardContent>
                        </Card>

                        {type === "invoices" && excludePersonalRuc && (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-3">
                                <Filter className="h-6 w-6 text-amber-600" />
                              </div>
                              <div className="text-2xl font-bold text-amber-600">
                                {parsedData.totalRows - getFilteredRowsCount()}
                              </div>
                              <div className="text-sm text-muted-foreground">Excluidos</div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Key Fields Preview */}
                      <Card>
                        <CardHeader>
                          <h4 className="font-medium">Campos principales detectados</h4>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {parsedData.headers.slice(0, 8).map((header, index) => (
                              <Badge key={index} variant="secondary" className="justify-center py-2">
                                {header}
                              </Badge>
                            ))}
                            {parsedData.headers.length > 8 && (
                              <Badge variant="outline" className="justify-center py-2">
                                +{parsedData.headers.length - 8} más
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Data Tab */}
                    <TabsContent value="data">
                      <Card>
                        <CardContent className="p-0">
                          <div className="overflow-auto max-h-[500px]">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  {parsedData.headers.slice(0, 6).map((header, index) => (
                                    <TableHead key={index} className="min-w-[150px]">
                                      {header}
                                    </TableHead>
                                  ))}
                                  {parsedData.headers.length > 6 && <TableHead>...</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {parsedData.rows.slice(0, 20).map((row, rowIndex) => {
                                  const isExcluded =
                                    type === "invoices" &&
                                    excludePersonalRuc &&
                                    shouldExcludeRuc(
                                      getValueByHeader(row, parsedData.headers, "Nro Doc Identidad") || "",
                                    )

                                  return (
                                    <TableRow key={rowIndex} className={isExcluded ? "opacity-50 bg-red-50" : ""}>
                                      <TableCell className="font-mono text-xs">
                                        <div
                                          className={`px-2 py-1 rounded text-center ${
                                            isExcluded ? "bg-red-100 text-red-700" : "bg-slate-100"
                                          }`}
                                        >
                                          {rowIndex + 1}
                                        </div>
                                      </TableCell>
                                      {row.slice(0, 6).map((cell, cellIndex) => (
                                        <TableCell key={cellIndex} className="text-sm">
                                          <div className="truncate max-w-[200px]" title={cell}>
                                            {cell || <span className="text-muted-foreground">—</span>}
                                          </div>
                                        </TableCell>
                                      ))}
                                      {row.length > 6 && <TableCell className="text-muted-foreground">...</TableCell>}
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="p-4 border-t bg-slate-50 text-center text-sm text-muted-foreground">
                            Mostrando primeras 20 filas de {parsedData.totalRows}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Payload Tab */}
                    <TabsContent value="payload" className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Vista previa del payload JSON que se enviará a la API para las primeras 3 filas
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        {generatePayloadsPreview()
                          .slice(0, 3)
                          .map((item, index) => (
                            <Card key={index} className={item.skipped ? "border-amber-200" : ""}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant={item.skipped ? "destructive" : "default"}>
                                    Fila {item.rowNumber}
                                  </Badge>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                    {item.skipped
                                      ? "EXCLUIDA"
                                      : type === "rhe"
                                        ? "createSunatRhe()"
                                        : "createSunatInvoice()"}
                                  </code>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {item.skipped ? (
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{item.skipReason}</AlertDescription>
                                  </Alert>
                                ) : item.error ? (
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{item.error}</AlertDescription>
                                  </Alert>
                                ) : (
                                  <div className="bg-slate-50 rounded-lg overflow-hidden">
                                    <div className="p-3 border-b bg-slate-100">
                                      <span className="text-xs font-mono text-slate-600">JSON Payload</span>
                                    </div>
                                    <ScrollArea className="h-48">
                                      <pre className="p-3 text-xs font-mono text-slate-700">{item.payload}</pre>
                                    </ScrollArea>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Import Progress */}
              {importing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Importando registros</h3>
                            <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{importProgress}%</div>
                          <div className="text-sm text-muted-foreground">
                            {parsedData && Math.round((importProgress / 100) * parsedData.totalRows)} de{" "}
                            {parsedData?.totalRows}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso</span>
                          <span>{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {Math.round((importProgress / 100) * (parsedData?.totalRows || 0))}
                          </div>
                          <div className="text-xs text-green-700">Procesados</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {(parsedData?.totalRows || 0) -
                              Math.round((importProgress / 100) * (parsedData?.totalRows || 0))}
                          </div>
                          <div className="text-xs text-blue-700">Pendientes</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-600">{parsedData?.totalRows || 0}</div>
                          <div className="text-xs text-slate-700">Total</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Importación completada</h3>
                      <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-green-200">
                      <CardContent className="p-6 text-center">
                        <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-600">{importResult.success}</div>
                        <div className="text-sm text-green-700 font-medium">Exitosos</div>
                        <div className="text-xs text-green-600 mt-1">
                          {parsedData && `${((importResult.success / parsedData.totalRows) * 100).toFixed(1)}%`}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardContent className="p-6 text-center">
                        <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-600">{importResult.errors}</div>
                        <div className="text-sm text-red-700 font-medium">Errores</div>
                        <div className="text-xs text-red-600 mt-1">
                          {parsedData && `${((importResult.errors / parsedData.totalRows) * 100).toFixed(1)}%`}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200">
                      <CardContent className="p-6 text-center">
                        <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-3">
                          <Filter className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">{importResult.skipped}</div>
                        <div className="text-sm text-amber-700 font-medium">Omitidos</div>
                        <div className="text-xs text-amber-600 mt-1">
                          {parsedData && `${((importResult.skipped / parsedData.totalRows) * 100).toFixed(1)}%`}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Error Details */}
                  {(importResult.errorDetails.length > 0 || importResult.skippedDetails.length > 0) && (
                    <Tabs defaultValue={importResult.errorDetails.length > 0 ? "errors" : "skipped"}>
                      <TabsList>
                        {importResult.errorDetails.length > 0 && (
                          <TabsTrigger value="errors" className="gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Errores ({importResult.errorDetails.length})
                          </TabsTrigger>
                        )}
                        {importResult.skippedDetails.length > 0 && (
                          <TabsTrigger value="skipped" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Omitidos ({importResult.skippedDetails.length})
                          </TabsTrigger>
                        )}
                      </TabsList>

                      {importResult.errorDetails.length > 0 && (
                        <TabsContent value="errors">
                          <Card>
                            <CardContent className="p-4">
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {importResult.errorDetails.slice(0, 10).map((error, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                                      <Badge variant="destructive" className="shrink-0">
                                        Fila {error.row}
                                      </Badge>
                                      <p className="text-sm text-red-800">{error.error}</p>
                                    </div>
                                  ))}
                                  {importResult.errorDetails.length > 10 && (
                                    <div className="text-center py-2">
                                      <Badge variant="outline">
                                        +{importResult.errorDetails.length - 10} errores más
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      )}

                      {importResult.skippedDetails.length > 0 && (
                        <TabsContent value="skipped">
                          <Card>
                            <CardContent className="p-4">
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {importResult.skippedDetails.slice(0, 10).map((skipped, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                                      <Badge variant="secondary" className="shrink-0">
                                        Fila {skipped.row}
                                      </Badge>
                                      <div className="text-sm">
                                        <span className="font-medium">RUC:</span> {skipped.ruc} - {skipped.reason}
                                      </div>
                                    </div>
                                  ))}
                                  {importResult.skippedDetails.length > 10 && (
                                    <div className="text-center py-2">
                                      <Badge variant="outline">
                                        +{importResult.skippedDetails.length - 10} omitidos más
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      )}
                    </Tabs>
                  )}
                </div>
              )}

              {/* Error Messages */}
              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {parsedData && (
              <>
                <span>{parsedData.totalRows} registros</span>
                {type === "invoices" && excludePersonalRuc && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-blue-600">{getFilteredRowsCount()} a procesar</span>
                  </>
                )}
                <Separator orientation="vertical" className="h-4" />
                <span>{selectedFile?.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              {importResult ? "Cerrar" : "Cancelar"}
            </Button>
            {parsedData && !importing && !importResult && (
              <Button onClick={handleImport} disabled={!selectedFile || importing || !!parseError} className="gap-2">
                <Zap className="h-4 w-4" />
                Importar {type === "invoices" && excludePersonalRuc ? getFilteredRowsCount() : parsedData.totalRows}{" "}
                registros
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
