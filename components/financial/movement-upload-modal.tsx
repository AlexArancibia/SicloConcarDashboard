"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react"

interface MovementUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (movements: any[]) => void
}

interface BankMovement {
  id: string
  date: string
  valueDate: string
  description: string
  amount: number
  balance: number
  branch: string
  operationNumber: string
  operationTime: string
  user: string
  utc: string
  reference: string
  accountNumber: string
  accountHolder: string
  currency: string
  accountType: string
  uploadDate: string
  fileName: string
}

export default function MovementUploadModal({ open, onOpenChange, onUploadComplete }: MovementUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: BankMovement[]; errors: string[] }>({
    success: [],
    errors: [],
  })

  const parseMovementFile = async (file: File): Promise<{ movements: BankMovement[]; errors: string[] }> => {
    try {
      // For Excel files, we need to use a different approach
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        return await parseExcelFile(file)
      } else {
        // Keep the existing CSV parsing for CSV files
        return await parseCSVFile(file)
      }
    } catch (error) {
      return { movements: [], errors: [`Error al procesar archivo: ${error}`] }
    }
  }

  const parseExcelFile = async (file: File): Promise<{ movements: BankMovement[]; errors: string[] }> => {
    try {
      // For demo purposes, we'll simulate Excel parsing
      // In a real implementation, you'd use a library like xlsx or exceljs
      const arrayBuffer = await file.arrayBuffer()

      // Simulate reading Excel data - in reality you'd use:
      // const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      // const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      // const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // For now, we'll create mock data based on the expected format
      const movements: BankMovement[] = []
      const errors: string[] = []

      // Simulate account information extraction (would come from cells A1:B3)
      const accountNumber = "193-2519100-0-54"
      const accountHolder = "GRUPO REVOLUCIONES S.A.C."
      const currency = "PEN" // "Soles" -> "PEN"
      const accountType = "Corriente"

      // Simulate movement data (would come from row 6 onwards)
      const mockMovements = [
        {
          date: "09/05/2025",
          valueDate: "",
          description: "IMPUESTO ITF",
          amount: -2.9,
          balance: 174653.71,
          branch: "000-000",
          operationNumber: "00000000",
          operationTime: "00:00:00",
          user: "BATCH",
          utc: "0909",
          reference: "",
        },
        {
          date: "09/05/2025",
          valueDate: "",
          description: "DETR.MASIVA 7624786714",
          amount: -14164.0,
          balance: 174656.61,
          branch: "111-034",
          operationNumber: "01026656",
          operationTime: "21:55:13",
          user: "SNTPEA",
          utc: "4709",
          reference: "",
        },
        {
          date: "09/05/2025",
          valueDate: "",
          description: "DETR.MASIVA 7624797240",
          amount: -6103.0,
          balance: 188820.61,
          branch: "111-034",
          operationNumber: "01026852",
          operationTime: "22:18:02",
          user: "SNTPEA",
          utc: "4709",
          reference: "",
        },
        {
          date: "09/05/2025",
          valueDate: "",
          description: "A 193 94566597 0",
          amount: -3115.2,
          balance: 194923.61,
          branch: "111-065",
          operationNumber: "01049061",
          operationTime: "10:27:54",
          user: "OBEB94",
          utc: "4401",
          reference: "Bicicletas almacen",
        },
        {
          date: "09/05/2025",
          valueDate: "",
          description: "PAGO DETRAC 7624810089",
          amount: -2771.0,
          balance: 198038.81,
          branch: "111-034",
          operationNumber: "01027034",
          operationTime: "22:47:25",
          user: "SNTPEA",
          utc: "4709",
          reference: "",
        },
        {
          date: "09/05/2025",
          valueDate: "",
          description: "A 193 94566597 0",
          amount: -2200.0,
          balance: 200809.81,
          branch: "111-065",
          operationNumber: "01048093",
          operationTime: "10:27:54",
          user: "OBE741",
          utc: "4401",
          reference: "Zapatillas",
        },
      ]

      // Convert mock data to BankMovement format
      mockMovements.forEach((movement, index) => {
        try {
          const bankMovement: BankMovement = {
            id: `${accountNumber}-${index}-${Date.now()}`,
            date: movement.date,
            valueDate: movement.valueDate,
            description: movement.description,
            amount: movement.amount,
            balance: movement.balance,
            branch: movement.branch,
            operationNumber: movement.operationNumber,
            operationTime: movement.operationTime,
            user: movement.user,
            utc: movement.utc,
            reference: movement.reference,
            accountNumber,
            accountHolder,
            currency,
            accountType,
            uploadDate: new Date().toISOString().split("T")[0],
            fileName: file.name,
          }

          movements.push(bankMovement)
        } catch (error) {
          errors.push(`Error procesando movimiento ${index + 1}: ${error}`)
        }
      })

      return { movements, errors }
    } catch (error) {
      return { movements: [], errors: [`Error al procesar archivo Excel: ${error}`] }
    }
  }

  const parseCSVFile = async (file: File): Promise<{ movements: BankMovement[]; errors: string[] }> => {
    try {
      const text = await file.text()
      const lines = text.split("\n")

      // Extract account information from first 3 lines
      let accountNumber = ""
      let currency = ""
      let accountType = ""
      let accountHolder = ""

      // Parse account info (assuming CSV format for simplicity)
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i]
        if (line.includes("Cuenta")) {
          const parts = line.split("\t")
          if (parts.length > 1) {
            const accountInfo = parts[1].trim()
            const match = accountInfo.match(/(\d{3}-\d{7}-\d-\d{2})\s*-\s*(.+)/)
            if (match) {
              accountNumber = match[1]
              accountHolder = match[2]
            }
          }
        } else if (line.includes("Moneda")) {
          const parts = line.split("\t")
          if (parts.length > 1) {
            currency = parts[1].trim() === "Soles" ? "PEN" : "USD"
          }
        } else if (line.includes("Tipo de Cuenta")) {
          const parts = line.split("\t")
          if (parts.length > 1) {
            accountType = parts[1].trim()
          }
        }
      }

      // Find header row (should be around line 5)
      let headerRowIndex = -1
      for (let i = 4; i < Math.min(10, lines.length); i++) {
        if (lines[i].includes("Fecha") && lines[i].includes("Descripción")) {
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1) {
        return { movements: [], errors: ["No se encontraron los encabezados en el archivo"] }
      }

      const movements: BankMovement[] = []
      const errors: string[] = []

      // Parse movement data starting from headerRowIndex + 1
      for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const columns = line.split("\t")
        if (columns.length < 10) continue

        try {
          const movement: BankMovement = {
            id: `${accountNumber}-${i}-${Date.now()}`,
            date: columns[0]?.trim() || "",
            valueDate: columns[1]?.trim() || "",
            description: columns[2]?.trim() || "",
            amount: Number.parseFloat(columns[3]?.replace(/[,\s]/g, "").replace("-", "-") || "0"),
            balance: Number.parseFloat(columns[4]?.replace(/[,\s]/g, "") || "0"),
            branch: columns[5]?.trim() || "",
            operationNumber: columns[6]?.trim() || "",
            operationTime: columns[7]?.trim() || "",
            user: columns[8]?.trim() || "",
            utc: columns[9]?.trim() || "",
            reference: columns[10]?.trim() || "",
            accountNumber,
            accountHolder,
            currency,
            accountType,
            uploadDate: new Date().toISOString().split("T")[0],
            fileName: file.name,
          }

          if (movement.date && movement.description) {
            movements.push(movement)
          }
        } catch (error) {
          errors.push(`Error en línea ${i + 1}: ${error}`)
        }
      }

      return { movements, errors }
    } catch (error) {
      return { movements: [], errors: [`Error al procesar archivo CSV: ${error}`] }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
    setResults({ success: [], errors: [] })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    const allMovements: BankMovement[] = []
    const allErrors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const { movements, errors } = await parseMovementFile(file)
        allMovements.push(...movements)
        allErrors.push(...errors)
      } catch (error) {
        allErrors.push(`Error al procesar ${file.name}: ${error}`)
      }

      setProgress(((i + 1) / files.length) * 100)
    }

    setResults({ success: allMovements, errors: allErrors })
    setUploading(false)

    if (allMovements.length > 0) {
      setTimeout(() => {
        onUploadComplete(allMovements)
        setFiles([])
        setResults({ success: [], errors: [] })
        setProgress(0)
      }, 1500)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    setFiles([])
    setResults({ success: [], errors: [] })
    setProgress(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] overflow-y-auto"
        style={{
          backgroundColor: "hsl(230 18% 7%)",
          borderColor: "hsl(230 18% 13%)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Upload className="w-5 h-5 text-emerald-400" />
            Subir Movimientos Bancarios
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Seleccione los archivos de movimientos bancarios para importar al sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <Label htmlFor="movement-files" className="text-slate-300">
              Archivos de Movimientos
            </Label>
            <Input
              id="movement-files"
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-2 bg-slate-800/50 border-slate-700 text-slate-200"
            />
            <p className="text-xs text-slate-400 mt-1">
              Formatos soportados: Excel (.xlsx, .xls) y CSV. El archivo debe tener la información de cuenta en las
              primeras 3 filas y los encabezados en la fila 5.
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div>
              <Label className="text-slate-300">Archivos Seleccionados ({files.length})</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-sm text-slate-200 font-medium">{file.name}</span>
                        <p className="text-xs text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB •{" "}
                          {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div>
              <Label className="text-slate-300">Procesando archivos...</Label>
              <Progress value={progress} className="mt-2" />
              <p className="text-sm text-slate-400 mt-1">{Math.round(progress)}% completado</p>
            </div>
          )}

          {/* Results */}
          {results.success.length > 0 && (
            <Alert className="bg-emerald-500/20 border-emerald-500/30">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-emerald-300">
                Se importaron exitosamente {results.success.length} movimiento(s) bancarios:
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <div className="text-xs space-y-1">
                    {results.success.slice(0, 5).map((movement, index) => (
                      <div key={index} className="text-emerald-200">
                        • {movement.date} - {movement.description} - {movement.currency}{" "}
                        {movement.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </div>
                    ))}
                    {results.success.length > 5 && (
                      <div className="text-emerald-200">... y {results.success.length - 5} más</div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {results.errors.length > 0 && (
            <Alert className="bg-red-500/20 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Errores encontrados:
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="text-xs space-y-1">
                    {results.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-red-200">
                        • {error}
                      </li>
                    ))}
                    {results.errors.length > 5 && (
                      <li className="text-red-200">... y {results.errors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Format Example */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-200 mb-2">Formato esperado del archivo Excel:</h4>
            <div className="text-xs font-mono text-slate-400 space-y-1">
              <div>Fila 1: Cuenta → 193-2519100-0-54 - GRUPO REVOLUCIONES S.A.C.</div>
              <div>Fila 2: Moneda → Soles</div>
              <div>Fila 3: Tipo de Cuenta → Corriente</div>
              <div className="mt-2">
                Fila 5: Encabezados (Fecha, Fecha valuta, Descripción operación, Monto, Saldo, etc.)
              </div>
              <div>Fila 6+: Datos de movimientos bancarios</div>
              <div className="mt-2 text-amber-400">
                Nota: Para archivos Excel reales, se requiere una librería como 'xlsx' para el parsing completo.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploading ? "Procesando..." : `Subir ${files.length} archivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
