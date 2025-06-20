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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, AlertCircle, CheckCircle, X, Eye, EyeOff, Loader2, Code, Database } from "lucide-react"
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
      if (isValidFileType(file)) {
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
      if (isValidFileType(file)) {
        setSelectedFile(file)
        setParseError(null)
        parseFile(file)
      } else {
        setParseError("Solo se permiten archivos TXT")
      }
    }
  }

  const isValidFileType = (file: File) => {
    return file.name.toLowerCase().endsWith(".txt")
  }

  const parseFile = async (file: File) => {
    try {
      const text = await file.text()

      const lines = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line !== "|")

      if (lines.length < 2) {
        setParseError("El archivo debe contener al menos una fila de encabezados y una fila de datos")
        return
      }

      const headerLine = lines[0]
      const headers = headerLine
        .split("|")
        .map((h) => h.trim())
        .filter((h) => h.length > 0)

      if (headers.length === 0) {
        setParseError("No se pudieron detectar los encabezados del archivo")
        return
      }

      const dataLines = lines.slice(1)
      const rows: string[][] = []
      const warnings: string[] = []

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]
        let cells = line.split("|").map((cell) => cell.trim())

        while (cells.length < headers.length) {
          cells.push("")
        }

        if (cells.length > headers.length) {
          const extraCells = cells.slice(headers.length - 1)
          cells = cells.slice(0, headers.length - 1)
          cells.push(extraCells.join("|"))
          warnings.push(`Fila ${i + 2}: Se detectaron columnas adicionales que fueron combinadas`)
        }

        rows.push(cells)
      }

      setParsedData({
        headers,
        rows,
        totalRows: rows.length,
        warnings,
      })
      setParseError(null)
    } catch (error) {
      console.error("Parse error:", error)
      setParseError("Error al leer el archivo. Asegúrate de que sea un archivo TXT válido con encoding UTF-8.")
    }
  }

  const mapRowToRheDto = (row: string[], headers: string[]) => {
    const getValueByHeader = (headerName: string) => {
      const index = headers.findIndex((h) => h.toLowerCase().includes(headerName.toLowerCase()))
      return index >= 0 ? row[index] : ""
    }

    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr === "" || dateStr === "-") return new Date()
      try {
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? new Date() : date
      } catch {
        return new Date()
      }
    }

    const parseNumber = (numStr: string, defaultValue = 0) => {
      if (!numStr || numStr === "" || numStr === "-") return defaultValue
      const num = Number.parseFloat(numStr.replace(/,/g, ""))
      return isNaN(num) ? defaultValue : num
    }

    const parseBoolean = (boolStr: string) => {
      if (!boolStr || boolStr === "" || boolStr === "-") return false
      return boolStr.toLowerCase() === "true" || boolStr.toLowerCase() === "1" || boolStr.toLowerCase() === "si"
    }

    return {
      issueDate: parseDate(getValueByHeader("fecha") || getValueByHeader("fecha_emision")),
      documentType: getValueByHeader("tipo_documento") || getValueByHeader("tipo") || "RETENCION",
      documentNumber:
        getValueByHeader("numero") || getValueByHeader("documento") || getValueByHeader("numero_documento") || "",
      status: getValueByHeader("estado") || "VIGENTE",
      issuerDocumentType: getValueByHeader("tipo_doc_emisor") || "RUC",
      issuerRuc: getValueByHeader("ruc") || getValueByHeader("ruc_emisor") || "",
      issuerName:
        getValueByHeader("nombre") || getValueByHeader("razon_social") || getValueByHeader("nombre_emisor") || "",
      rentType: getValueByHeader("tipo_renta") || "CUARTA_CATEGORIA",
      isFree: parseBoolean(getValueByHeader("gratuito") || getValueByHeader("es_gratuito")),
      description: getValueByHeader("descripcion") || undefined,
      observation: getValueByHeader("observacion") || getValueByHeader("observaciones") || undefined,
      currency: getValueByHeader("moneda") || "PEN",
      grossIncome: parseNumber(getValueByHeader("ingreso_bruto") || getValueByHeader("monto_bruto")),
      incomeTax: parseNumber(getValueByHeader("impuesto_renta") || getValueByHeader("retencion")),
      netIncome: parseNumber(getValueByHeader("ingreso_neto") || getValueByHeader("monto_neto")),
      netPendingAmount: parseNumber(getValueByHeader("monto_pendiente")) || undefined,
      sourceFile: selectedFile?.name || "",
      companyId: user?.companyId || "",
      userId: user?.id || "",
    }
  }

  const mapRowToInvoiceDto = (row: string[], headers: string[]) => {
    const getValueByHeader = (headerName: string) => {
      const index = headers.findIndex((h) => h.toLowerCase().includes(headerName.toLowerCase()))
      return index >= 0 ? row[index] : ""
    }

    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr === "" || dateStr === "-") return new Date()
      try {
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? new Date() : date
      } catch {
        return new Date()
      }
    }

    const parseNumber = (numStr: string, defaultValue = 0) => {
      if (!numStr || numStr === "" || numStr === "-") return defaultValue
      const num = Number.parseFloat(numStr.replace(/,/g, ""))
      return isNaN(num) ? defaultValue : num
    }

    const parseOptionalNumber = (numStr: string) => {
      if (!numStr || numStr === "" || numStr === "-") return undefined
      const num = Number.parseFloat(numStr.replace(/,/g, ""))
      return isNaN(num) ? undefined : num
    }

    const parseOptionalDate = (dateStr: string) => {
      if (!dateStr || dateStr === "" || dateStr === "-") return undefined
      try {
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? undefined : date
      } catch {
        return undefined
      }
    }

    return {
      period: getValueByHeader("periodo") || "",
      carSunat: getValueByHeader("car") || getValueByHeader("car_sunat") || "",
      ruc: getValueByHeader("ruc") || "",
      name: getValueByHeader("nombre") || getValueByHeader("razon_social") || "",
      issueDate: parseDate(getValueByHeader("fecha_emision") || getValueByHeader("fecha")),
      expirationDate: parseOptionalDate(getValueByHeader("fecha_vencimiento")),
      documentType: getValueByHeader("tipo_documento") || "FACTURA",
      series: getValueByHeader("serie") || "",
      year: getValueByHeader("año") || getValueByHeader("anio") || new Date().getFullYear().toString(),
      documentNumber: getValueByHeader("numero") || getValueByHeader("numero_documento") || "",
      identityDocumentType:
        getValueByHeader("tipo_doc_identidad") || getValueByHeader("tipo_documento_cliente") || undefined,
      identityDocumentNumber:
        getValueByHeader("num_doc_identidad") || getValueByHeader("documento_cliente") || undefined,
      customerName: getValueByHeader("cliente") || getValueByHeader("nombre_cliente") || undefined,
      taxableBase: parseNumber(getValueByHeader("base_imponible") || getValueByHeader("base_gravada")),
      igv: parseNumber(getValueByHeader("igv")),
      taxableBaseNg: parseOptionalNumber(getValueByHeader("base_ng") || getValueByHeader("base_no_gravada")),
      igvNg: parseOptionalNumber(getValueByHeader("igv_ng")),
      taxableBaseDng: parseOptionalNumber(getValueByHeader("base_dng")),
      igvDng: parseOptionalNumber(getValueByHeader("igv_dng")),
      valueNgAcquisition: parseOptionalNumber(getValueByHeader("valor_adquisicion")),
      isc: parseOptionalNumber(getValueByHeader("isc")),
      icbper: parseOptionalNumber(getValueByHeader("icbper")),
      otherCharges: parseOptionalNumber(getValueByHeader("otros_cargos") || getValueByHeader("otros_tributos")),
      total: parseNumber(getValueByHeader("total") || getValueByHeader("importe_total")),
      currency: getValueByHeader("moneda") || "PEN",
      exchangeRate: parseOptionalNumber(getValueByHeader("tipo_cambio")),
      modifiedIssueDate: parseOptionalDate(getValueByHeader("fecha_modificacion")),
      modifiedDocType: getValueByHeader("tipo_doc_modificado") || undefined,
      modifiedDocSeries: getValueByHeader("serie_modificada") || undefined,
      modifiedDocNumber: getValueByHeader("numero_modificado") || undefined,
      damCode: getValueByHeader("codigo_dam") || undefined,
      goodsServicesClass: getValueByHeader("clase_bienes") || getValueByHeader("tipo_bien_servicio") || undefined,
      projectOperatorId: getValueByHeader("operador_proyecto") || undefined,
      participationPercent: parseOptionalNumber(getValueByHeader("porcentaje_participacion")),
      imb: getValueByHeader("imb") || undefined,
      carOrigin: getValueByHeader("car_origen") || undefined,
      detraction: getValueByHeader("detraccion") || undefined,
      noteType: getValueByHeader("tipo_nota") || undefined,
      invoiceStatus: getValueByHeader("estado_factura") || getValueByHeader("estado") || "VIGENTE",
      incal: getValueByHeader("incal") || undefined,
      sourceFile: selectedFile?.name || "",
      companyId: user?.companyId || "",
      userId: user?.id || "",
    }
  }

  const generatePayloadsPreview = () => {
    if (!parsedData) return []

    return parsedData.rows.slice(0, 10).map((row, index) => {
      const payload =
        type === "rhe" ? mapRowToRheDto(row, parsedData.headers) : mapRowToInvoiceDto(row, parsedData.headers)

      return {
        rowNumber: index + 1,
        payload: JSON.stringify(payload, null, 2),
      }
    })
  }

  const handleImport = async () => {
    if (!parsedData || !user?.companyId || !user?.id) return

    console.log("🚀 Starting import process...")
    console.log("📊 Import details:", {
      type,
      totalRows: parsedData.rows.length,
      headers: parsedData.headers,
      companyId: user.companyId,
      userId: user.id,
      fileName: selectedFile?.name,
    })

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
      console.log(`\n📝 Processing row ${i + 1}/${totalRows}:`, row)

      try {
        if (type === "rhe") {
          const dto = mapRowToRheDto(row, parsedData.headers)
          console.log("✅ Sending RHE request...")
          const response = await createSunatRhe(dto)
          console.log("✅ RHE created successfully:", response)
        } else {
          const dto = mapRowToInvoiceDto(row, parsedData.headers)
          console.log("✅ Sending Invoice request...")
          const response = await createSunatInvoice(dto)
          console.log("✅ Invoice created successfully:", response)
        }

        result.success++
        console.log(`✅ Row ${i + 1} processed successfully`)
      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error)
        result.errors++
        result.errorDetails.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }

      // Update progress
      const progress = Math.round(((i + 1) / totalRows) * 100)
      setImportProgress(progress)
      console.log(`📈 Progress: ${progress}%`)

      // Small delay to prevent overwhelming the API
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log("🏁 Import process completed!")
    console.log("📊 Final results:", result)
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

  const formatCurrency = (value: string) => {
    if (!value || value === "" || value === "-") return "-"
    const num = Number.parseFloat(value)
    return isNaN(num) ? value : `S/ ${num.toFixed(2)}`
  }

  const formatDate = (value: string) => {
    if (!value || value === "" || value === "-") return "-"
    try {
      const date = new Date(value)
      return date.toLocaleDateString("es-PE")
    } catch {
      return value
    }
  }

  const getColumnType = (header: string) => {
    const lowerHeader = header.toLowerCase()
    if (lowerHeader.includes("fecha")) return "date"
    if (
      lowerHeader.includes("monto") ||
      lowerHeader.includes("total") ||
      lowerHeader.includes("igv") ||
      lowerHeader.includes("base") ||
      lowerHeader.includes("renta") ||
      lowerHeader.includes("impuesto") ||
      lowerHeader.includes("cambio") ||
      lowerHeader.includes("ingreso")
    )
      return "currency"
    return "text"
  }

  const formatCellValue = (value: string, columnType: string) => {
    switch (columnType) {
      case "date":
        return formatDate(value)
      case "currency":
        return formatCurrency(value)
      default:
        return value || "-"
    }
  }

  const title = type === "rhe" ? "Importar Archivo RHE" : "Importar Archivo de Facturas"
  const description =
    type === "rhe"
      ? "Selecciona el archivo TXT de Registro de Honorarios Electrónicos de SUNAT"
      : "Selecciona el archivo TXT de facturas/comprobantes de SUNAT"

  const isComplete = importResult !== null && !importing

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">{description}</p>

              {!showPreview && !isComplete && (
                <>
                  {/* File Upload Area */}
                  <Card>
                    <CardContent className="p-6">
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          dragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          {dragActive ? "Suelta el archivo aquí" : "Arrastra tu archivo TXT aquí"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Solo archivos TXT delimitados por pipes (|)
                        </p>

                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                          Seleccionar Archivo TXT
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
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{selectedFile.name}</h4>
                            <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          {parsedData && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{parsedData.totalRows} filas</Badge>
                              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Vista Previa
                              </Button>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={importing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Preview */}
              {showPreview && parsedData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Vista Previa del Archivo</CardTitle>
                        <CardDescription>
                          {parsedData.totalRows} filas • {parsedData.headers.length} columnas
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Ocultar Vista Previa
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Warnings section */}
                    {parsedData.warnings.length > 0 && (
                      <div className="p-6 pb-0">
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Advertencias encontradas:</p>
                              {parsedData.warnings.slice(0, 3).map((warning, index) => (
                                <p key={index} className="text-xs">
                                  {warning}
                                </p>
                              ))}
                              {parsedData.warnings.length > 3 && (
                                <p className="text-xs">... y {parsedData.warnings.length - 3} advertencias más</p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Tabs for Raw Data vs Payload Preview */}
                    <Tabs defaultValue="raw-data" className="w-full">
                      <div className="px-6">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="raw-data" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Datos del Archivo
                          </TabsTrigger>
                          <TabsTrigger value="payload-preview" className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Payload a Enviar
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="raw-data" className="mt-0">
                        {/* Raw Data Table */}
                        <div className="border rounded-lg overflow-hidden bg-background">
                          <div className="h-[400px] overflow-auto">
                            <div className="min-w-max">
                              <Table>
                                <TableHeader className="sticky top-0 z-30 bg-background">
                                  <TableRow className="bg-muted/50 border-b-2">
                                    <TableHead className="w-16 sticky left-0 bg-muted/50 z-40 border-r-2 font-semibold shadow-sm">
                                      #
                                    </TableHead>
                                    {parsedData.headers.map((header, index) => (
                                      <TableHead
                                        key={index}
                                        className="min-w-[150px] max-w-[250px] px-4 py-3 font-semibold whitespace-nowrap"
                                      >
                                        <div className="truncate" title={header}>
                                          {header}
                                        </div>
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {parsedData.rows.slice(0, 50).map((row, rowIndex) => (
                                    <TableRow key={rowIndex} className="hover:bg-muted/30">
                                      <TableCell className="sticky left-0 bg-background z-20 border-r font-mono text-xs font-medium shadow-sm">
                                        <div className="w-12 text-center">{rowIndex + 1}</div>
                                      </TableCell>
                                      {row.map((cell, cellIndex) => {
                                        const header = parsedData.headers[cellIndex] || ""
                                        const columnType = getColumnType(header)
                                        const displayValue = formatCellValue(cell, columnType)

                                        return (
                                          <TableCell
                                            key={cellIndex}
                                            className="px-4 py-3 text-sm min-w-[150px] max-w-[250px] whitespace-nowrap"
                                          >
                                            <div className="truncate" title={cell || ""}>
                                              {displayValue}
                                            </div>
                                          </TableCell>
                                        )
                                      })}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="payload-preview" className="mt-0">
                        {/* Payload Preview */}
                        <div className="space-y-4 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Payload que se enviará a la API</h4>
                              <p className="text-sm text-muted-foreground">
                                Mostrando las primeras 10 filas de {parsedData.totalRows} total
                              </p>
                            </div>
                            <Badge variant="outline">{type === "rhe" ? "RHE" : "Facturas"} Format</Badge>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {generatePayloadsPreview().map((item, index) => (
                              <Card key={index} className="border-l-4 border-l-primary">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                                      Fila {item.rowNumber}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-muted-foreground text-xs">
                                      {type === "rhe" ? "createSunatRhe()" : "createSunatInvoice()"}
                                    </span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="bg-muted/30 rounded-lg p-3 overflow-x-auto">
                                    <pre className="text-xs font-mono whitespace-pre-wrap">{item.payload}</pre>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {parsedData.totalRows > 10 && (
                            <div className="text-center py-4 border-t">
                              <p className="text-sm text-muted-foreground">
                                ... y {parsedData.totalRows - 10} registros más que se procesarán de la misma manera
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Footer info */}
                    <div className="p-6 pt-0 border-t">
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Archivo: {selectedFile?.name}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                            <span>↕</span>
                            <span>Scroll vertical</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                            <span>↔</span>
                            <span>Scroll horizontal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress */}
              {importing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Procesando archivo...</span>
                            <span>{importProgress}%</span>
                          </div>
                          <Progress value={importProgress} className="h-2" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Creando registros en la base de datos. Este proceso puede tomar varios minutos.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Results */}
              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Importación Completada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                        <div className="text-sm text-green-700">Registros creados</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                        <div className="text-sm text-red-700">Errores</div>
                      </div>
                    </div>

                    {importResult.errorDetails.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Detalles de errores:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importResult.errorDetails.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                              <span className="font-medium">Fila {error.row}:</span> {error.error}
                            </div>
                          ))}
                          {importResult.errorDetails.length > 10 && (
                            <p className="text-xs text-muted-foreground">
                              ... y {importResult.errorDetails.length - 10} errores más
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            {isComplete ? "Cerrar" : "Cancelar"}
          </Button>
          {!isComplete && parsedData && !importing && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importing || !!parseError || !user?.companyId || !user?.id}
            >
              Importar {parsedData.totalRows} registros
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
