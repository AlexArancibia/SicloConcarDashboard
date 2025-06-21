"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  FileUp,
  Database,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code,
  Bug,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTransactionsStore } from "@/stores/transactions-store"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import type { TransactionType, CreateTransactionDto } from "@/types/transactions"
import type { BankAccount } from "@/types/bank-accounts"
import * as XLSX from "xlsx"
import { useAuthStore } from "@/stores/authStore"

interface TransactionImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (hasSuccessfulImports: boolean) => void
}

// Actualizar la interface ParsedTransaction para incluir los nuevos tipos
interface ParsedTransaction {
  transactionDate: string
  valueDate?: string
  description: string
  amount: number
  balance: number
  branch?: string
  operationNumber: string
  operationTime?: string
  operatorUser?: string
  utc?: string
  reference?: string
  channel?: string
  transactionType: TransactionType
  // Remover los flags booleanos ya que ahora son tipos de transacción
}

interface ImportSummary {
  totalProcessed: number
  successCount: number
  errorCount: number
  warningCount: number
  duplicateCount: number
  startTime: Date
  endTime?: Date
  duration?: string
}

interface DetailedError {
  transaction: ParsedTransaction
  index: number
  error: string
  errorType: "VALIDATION" | "NETWORK" | "SERVER" | "DUPLICATE" | "UNKNOWN"
  payload?: CreateTransactionDto
  httpStatus?: number
  timestamp: Date
  details?: string[]
}

export default function TransactionImportModal({ open, onOpenChange, onImportComplete }: TransactionImportModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentOperation, setCurrentOperation] = useState<string>("")
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importDetails, setImportDetails] = useState<{
    successTransactions: Array<{ transaction: ParsedTransaction; index: number }>
    failedTransactions: DetailedError[]
    warnings: string[]
  }>({
    successTransactions: [],
    failedTransactions: [],
    warnings: [],
  })
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stores
  const { createTransaction } = useTransactionsStore()
  const { bankAccounts, loading: bankAccountsLoading, getBankAccountsByCompany } = useBankAccountsStore()
  const { user } = useAuthStore()

  // Estado local para las cuentas bancarias activas
  const [activeBankAccounts, setActiveBankAccounts] = useState<BankAccount[]>([])
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([])

  // Cargar cuentas bancarias activas al abrir el modal
  useEffect(() => {
    if (open && user?.companyId) {
      console.log("Cargando cuentas bancarias activas para companyId:", user.companyId)
      loadActiveBankAccounts()
    }
  }, [open, user?.companyId])

  const loadActiveBankAccounts = async () => {
    if (!user?.companyId) return

    try {
      const accounts = await getBankAccountsByCompany(user.companyId)
      setActiveBankAccounts(accounts)
      console.log("Cuentas bancarias activas cargadas:", accounts.length)
    } catch (error) {
      console.error("Error cargando cuentas bancarias activas:", error)
      setActiveBankAccounts([])
    }
  }

  // Actualizar opciones cuando cambian las cuentas activas
  useEffect(() => {
    if (activeBankAccounts && activeBankAccounts.length > 0) {
      console.log("Actualizando opciones de cuentas con:", activeBankAccounts.length, "cuentas activas")

      const options = activeBankAccounts.map((account: BankAccount) => ({
        label: `${account.accountNumber} - ${account.bank?.name || "Banco"}${account.alias ? ` (${account.alias})` : ""}`,
        value: account.id,
      }))

      setAccountOptions(options)
      console.log("Opciones de cuentas generadas:", options)
    } else {
      console.log("No hay cuentas bancarias activas disponibles")
      setAccountOptions([])
    }
  }, [activeBankAccounts])

  // Función para categorizar errores
  const categorizeError = (error: any): { type: DetailedError["errorType"]; details: string[] } => {
    const details: string[] = []

    if (error?.response) {
      const status = error.response.status
      const data = error.response.data

      if (status >= 400 && status < 500) {
        if (status === 400) {
          details.push(`Error de validación (HTTP ${status})`)
          if (data?.message) {
            if (Array.isArray(data.message)) {
              details.push(...data.message.map((msg: string) => `• ${msg}`))
            } else {
              details.push(`• ${data.message}`)
            }
          }
          return { type: "VALIDATION", details }
        } else if (status === 409) {
          details.push(`Conflicto - posible duplicado (HTTP ${status})`)
          return { type: "DUPLICATE", details }
        } else {
          details.push(`Error del cliente (HTTP ${status})`)
          return { type: "VALIDATION", details }
        }
      } else if (status >= 500) {
        details.push(`Error del servidor (HTTP ${status})`)
        if (data?.message) {
          details.push(`• ${data.message}`)
        }
        return { type: "SERVER", details }
      }
    } else if (error?.code === "NETWORK_ERROR" || error?.message?.includes("Network")) {
      details.push("Error de conexión de red")
      details.push("• Verifique su conexión a internet")
      details.push("• El servidor podría estar temporalmente no disponible")
      return { type: "NETWORK", details }
    }

    details.push("Error desconocido")
    if (error?.message) {
      details.push(`• ${error.message}`)
    }
    return { type: "UNKNOWN", details }
  }

  // Función para leer archivos Excel usando SheetJS
  const parseExcelFile = async (file: File): Promise<string[][]> => {
    console.log("Procesando archivo Excel con SheetJS:", file.name)

    try {
      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Usar SheetJS para leer el archivo Excel
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      console.log("Hojas disponibles:", workbook.SheetNames)

      // Tomar la primera hoja
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      console.log("Procesando hoja:", firstSheetName)

      // Convertir la hoja a array de arrays
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Usar arrays en lugar de objetos
        defval: "", // Valor por defecto para celdas vacías
        raw: false, // Convertir todo a strings
      }) as string[][]

      console.log("Datos extraídos del Excel:", jsonData.length, "filas")
      console.log("Muestra de las primeras 10 filas:", jsonData.slice(0, 10))

      // Filtrar filas vacías
      const filteredData = jsonData.filter(
        (row) => row && row.length > 0 && row.some((cell) => cell && cell.toString().trim().length > 0),
      )

      console.log("Filas con datos:", filteredData.length)

      return filteredData
    } catch (error) {
      console.error("Error procesando archivo Excel con SheetJS:", error)
      throw new Error(`No se pudo procesar el archivo Excel: ${error}`)
    }
  }

  const parseTransactionFile = async (
    file: File,
    bankAccountId: string,
  ): Promise<{
    transactions: ParsedTransaction[]
    errors: string[]
    warnings: string[]
  }> => {
    console.log("Parsing file:", file.name, "Type:", file.type)

    try {
      let rows: string[][] = []

      // Determinar cómo procesar el archivo basado en su extensión
      const fileName = file.name.toLowerCase()

      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        console.log("Procesando como archivo Excel con SheetJS")
        rows = await parseExcelFile(file)
      } else if (fileName.endsWith(".csv")) {
        console.log("Procesando como archivo CSV")
        const text = await file.text()
        const lines = text.split("\n")
        rows = lines.map((line) => line.split(/[,;]/)).filter((row) => row.some((cell) => cell.trim().length > 0))
      } else {
        console.log("Procesando como archivo de texto")
        const text = await file.text()
        const lines = text.split("\n")
        rows = lines.map((line) => line.split(/\t/)).filter((row) => row.some((cell) => cell.trim().length > 0))
      }

      console.log("Total rows procesadas:", rows.length)
      console.log("Muestra de las primeras 10 filas:", rows.slice(0, 10))

      const transactions: ParsedTransaction[] = []
      const errors: string[] = []
      const warnings: string[] = []

      // Buscar la fila de encabezados
      let headerRowIndex = -1

      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const rowText = row.join(" ").toLowerCase()

        console.log(`Analizando fila ${i} para encabezados:`, row)
        console.log(`Texto de la fila: "${rowText}"`)

        // Buscar la fila que contiene los encabezados de las transacciones
        if (
          rowText.includes("fecha") &&
          (rowText.includes("descripción") ||
            rowText.includes("descripcion") ||
            rowText.includes("operación") ||
            rowText.includes("operacion")) &&
          rowText.includes("monto") &&
          rowText.includes("saldo")
        ) {
          headerRowIndex = i
          console.log("✅ Encabezados encontrados en fila:", headerRowIndex, row)
          break
        }
      }

      if (headerRowIndex === -1) {
        console.error("❌ No se encontraron encabezados en el archivo")

        // Mostrar todas las filas para debugging
        console.log("Todas las filas del archivo:")
        rows.forEach((row, index) => {
          if (index < 20) {
            // Solo mostrar las primeras 20 filas
            console.log(`Fila ${index}:`, row)
          }
        })

        return {
          transactions: [],
          errors: [
            "No se encontraron los encabezados en el archivo.",
            "Verifique que el archivo tenga las columnas: Fecha, Descripción operación, Monto, Saldo.",
            `Se analizaron ${Math.min(15, rows.length)} filas buscando encabezados.`,
            "Revise la consola del navegador para ver el contenido del archivo.",
          ],
          warnings: [],
        }
      }

      // Determinar los índices de las columnas basados en los encabezados
      const headers = rows[headerRowIndex].map((h) => (h || "").toLowerCase().trim())
      console.log("Encabezados detectados:", headers)

      const getColumnIndex = (keywords: string[]): number => {
        return headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword)))
      }

      const dateIndex = getColumnIndex(["fecha"])
      const valueDateIndex = getColumnIndex(["valuta", "valor"])
      const descriptionIndex = getColumnIndex(["descripción", "descripcion", "operación", "operacion"])
      const amountIndex = getColumnIndex(["monto", "importe"])
      const balanceIndex = getColumnIndex(["saldo"])
      const branchIndex = getColumnIndex(["sucursal", "agencia"])
      const operationNumberIndex = getColumnIndex(["número", "numero"])
      const operationTimeIndex = getColumnIndex(["hora"])
      const userIndex = getColumnIndex(["usuario"])
      const utcIndex = getColumnIndex(["utc"])
      const referenceIndex = getColumnIndex(["referencia"])
      const channelIndex = getColumnIndex(["canal", "channel"])

      console.log("Índices de columnas:", {
        dateIndex,
        valueDateIndex,
        descriptionIndex,
        amountIndex,
        balanceIndex,
        branchIndex,
        operationNumberIndex,
        operationTimeIndex,
        userIndex,
        utcIndex,
        referenceIndex,
        channelIndex,
      })

      // Verificar que se encontraron las columnas esenciales
      if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
        return {
          transactions: [],
          errors: [
            "No se encontraron todas las columnas necesarias.",
            `Columnas requeridas: Fecha (${dateIndex >= 0 ? "✅" : "❌"}), Descripción (${descriptionIndex >= 0 ? "✅" : "❌"}), Monto (${amountIndex >= 0 ? "✅" : "❌"})`,
            `Encabezados encontrados: ${headers.join(", ")}`,
          ],
          warnings: [],
        }
      }

      // Advertencias sobre columnas faltantes
      if (operationNumberIndex === -1) {
        warnings.push("No se encontró la columna 'Número de operación'. Se generarán números automáticos.")
      }
      if (balanceIndex === -1) {
        warnings.push("No se encontró la columna 'Saldo'. Se usará 0 como valor por defecto.")
      }

      // Procesar TODAS las filas de datos (a partir de headerRowIndex + 1)
      let processedRows = 0
      let skippedRows = 0

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i]

        // Saltar filas vacías
        if (!row || row.length === 0 || row.every((cell) => !cell || cell.toString().trim() === "")) {
          skippedRows++
          continue
        }

        // Verificar que la fila tenga suficientes columnas
        if (row.length <= Math.max(dateIndex, descriptionIndex, amountIndex)) {
          console.log(`Fila ${i} tiene columnas insuficientes:`, row)
          skippedRows++
          continue
        }

        try {
          processedRows++

          // Extraer datos usando los índices de columnas
          const date = dateIndex >= 0 && row[dateIndex] ? row[dateIndex].toString().trim() : ""
          const valueDate =
            valueDateIndex >= 0 && row[valueDateIndex] && row[valueDateIndex].toString().trim()
              ? row[valueDateIndex].toString().trim()
              : ""
          const description =
            descriptionIndex >= 0 && row[descriptionIndex] ? row[descriptionIndex].toString().trim() : ""

          // Procesar monto
          let amount = 0
          if (amountIndex >= 0 && row[amountIndex]) {
            const amountStr = row[amountIndex].toString().trim().replace(/[,\s]/g, "")
            amount = Number.parseFloat(amountStr)
            if (isNaN(amount)) {
              // Intentar limpiar más agresivamente
              const cleanAmount = row[amountIndex]
                .toString()
                .trim()
                .replace(/[^\d.-]/g, "")
              amount = Number.parseFloat(cleanAmount)
            }
          }

          // Procesar saldo
          let balance = 0
          if (balanceIndex >= 0 && row[balanceIndex]) {
            const balanceStr = row[balanceIndex].toString().trim().replace(/[,\s]/g, "")
            balance = Number.parseFloat(balanceStr)
            if (isNaN(balance)) {
              const cleanBalance = row[balanceIndex]
                .toString()
                .trim()
                .replace(/[^\d.-]/g, "")
              balance = Number.parseFloat(cleanBalance)
            }
          }

          // Extraer datos adicionales
          const branch =
            branchIndex >= 0 && row[branchIndex] && row[branchIndex].toString().trim()
              ? row[branchIndex].toString().trim()
              : ""

          // Generar número de operación si no existe
          let operationNumber = ""
          if (operationNumberIndex >= 0 && row[operationNumberIndex] && row[operationNumberIndex].toString().trim()) {
            operationNumber = row[operationNumberIndex].toString().trim()
          } else {
            // Generar número de operación automático
            operationNumber = `AUTO${Date.now()}${i.toString().padStart(4, "0")}`
            warnings.push(`Fila ${i + 1}: Se generó número de operación automático: ${operationNumber}`)
          }

          const operationTime =
            operationTimeIndex >= 0 && row[operationTimeIndex] && row[operationTimeIndex].toString().trim()
              ? row[operationTimeIndex].toString().trim()
              : ""
          const operatorUser =
            userIndex >= 0 && row[userIndex] && row[userIndex].toString().trim() ? row[userIndex].toString().trim() : ""
          const utc =
            utcIndex >= 0 && row[utcIndex] && row[utcIndex].toString().trim() ? row[utcIndex].toString().trim() : ""
          const reference =
            referenceIndex >= 0 && row[referenceIndex] && row[referenceIndex].toString().trim()
              ? row[referenceIndex].toString().trim()
              : ""
          const channel =
            channelIndex >= 0 && row[channelIndex] && row[channelIndex].toString().trim()
              ? row[channelIndex].toString().trim()
              : ""

          // Validar datos mínimos y fechas
          if (!date || !description || isNaN(amount)) {
            console.log(`Fila ${i} tiene datos insuficientes:`, { date, description, amount, row })
            errors.push(`Fila ${i + 1}: Datos insuficientes o inválidos (fecha, descripción y monto son requeridos)`)
            continue
          }

          // Validar que la fecha se pueda parsear correctamente
          try {
            parseDate(date)
            if (valueDate) {
              parseDate(valueDate)
            }
          } catch (error) {
            console.log(`Fila ${i} tiene fecha inválida:`, { date, valueDate, error })
            errors.push(`Fila ${i + 1}: Formato de fecha inválido - ${error}`)
            continue
          }

          // Actualizar la lógica de clasificación automática en parseTransactionFile
          // Reemplazar la sección de clasificación automática:

          // Determinar el tipo de transacción basado en el monto y descripción
          let transactionType: TransactionType = "CREDIT" // Default

          const descLower = description.toLowerCase()

          // Clasificación más específica basada en la descripción
          if (descLower.includes("itf") || descLower.includes("impuesto")) {
            transactionType = "ITF"
          } else if (descLower.includes("detr") || descLower.includes("detrac")) {
            transactionType = "DETRACTION"
          } else if (descLower.includes("comis") || descLower.includes("manten") || descLower.includes("portes")) {
            transactionType = "FEE"
          } else if (
            descLower.includes("transfer") ||
            descLower.includes("cce") ||
            descLower.includes("interbancaria")
          ) {
            transactionType = "TRANSFER"
          } else if (descLower.includes("pago") || descLower.includes("payment")) {
            transactionType = "PAYMENT"
          } else if (
            descLower.includes("depósito") ||
            descLower.includes("deposito") ||
            descLower.includes("deposit")
          ) {
            transactionType = "DEPOSIT"
          } else if (descLower.includes("retiro") || descLower.includes("withdrawal")) {
            transactionType = "WITHDRAWAL"
          } else if (descLower.includes("interés") || descLower.includes("interes") || descLower.includes("interest")) {
            transactionType = "INTEREST"
          } else {
            // Clasificación por monto como fallback
            transactionType = amount < 0 ? "DEBIT" : "CREDIT"
          }

          // Crear el objeto de transacción (actualizar para remover los flags booleanos)
          const transaction: ParsedTransaction = {
            transactionDate: date,
            valueDate: valueDate || undefined,
            description,
            amount: Math.abs(amount), // Guardar el monto como positivo
            balance,
            branch: branch || undefined,
            operationNumber,
            operationTime: operationTime || undefined,
            operatorUser: operatorUser || undefined,
            utc: utc || undefined,
            reference: reference || undefined,
            channel: channel || undefined,
            transactionType,
          }

          transactions.push(transaction)

          // Log cada 100 transacciones para no saturar la consola
          if (transactions.length % 100 === 0) {
            console.log(`Procesadas ${transactions.length} transacciones...`)
          }
        } catch (error) {
          console.error(`Error procesando fila ${i}:`, error, row)
          errors.push(`Error en fila ${i + 1}: ${error}`)
        }
      }

      console.log("✅ Resumen de procesamiento:")
      console.log(`- Total filas: ${rows.length}`)
      console.log(`- Filas procesadas: ${processedRows}`)
      console.log(`- Filas omitidas: ${skippedRows}`)
      console.log(`- Transacciones válidas: ${transactions.length}`)
      console.log(`- Errores: ${errors.length}`)
      console.log(`- Advertencias: ${warnings.length}`)

      return { transactions, errors, warnings }
    } catch (error) {
      console.error("Error general al procesar el archivo:", error)
      return {
        transactions: [],
        errors: [`Error al procesar el archivo: ${error}`],
        warnings: [],
      }
    }
  }

  const parseDate = (dateStr: string): string => {
    try {
      // Limpiar la cadena de fecha
      const cleanDateStr = dateStr.toString().trim()

      if (!cleanDateStr) {
        throw new Error("Fecha vacía")
      }

      console.log("Parseando fecha:", cleanDateStr)

      let date: Date

      // Formato DD/MM/YYYY o DD/MM/YY
      if (cleanDateStr.includes("/")) {
        const parts = cleanDateStr.split("/")
        if (parts.length === 3) {
          let [day, month, year] = parts.map((p) => p.trim())

          // Convertir año de 2 dígitos a 4 dígitos
          if (year.length === 2) {
            const currentYear = new Date().getFullYear()
            const currentCentury = Math.floor(currentYear / 100) * 100
            const yearNum = Number.parseInt(year)
            year = (yearNum + currentCentury).toString()
          }

          const dayNum = Number.parseInt(day)
          const monthNum = Number.parseInt(month)
          const yearNum = Number.parseInt(year)

          if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
            throw new Error("Componentes de fecha inválidos")
          }

          if (monthNum < 1 || monthNum > 12) {
            throw new Error("Mes inválido")
          }

          if (dayNum < 1 || dayNum > 31) {
            throw new Error("Día inválido")
          }

          // Crear fecha (mes - 1 porque Date usa 0-11 para meses)
          date = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0)
        } else {
          throw new Error("Formato de fecha con / inválido")
        }
      }
      // Formato DD-MM-YYYY o YYYY-MM-DD
      else if (cleanDateStr.includes("-")) {
        const parts = cleanDateStr.split("-")
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // Formato YYYY-MM-DD (ISO)
            const [year, month, day] = parts.map((p) => p.trim())
            const yearNum = Number.parseInt(year)
            const monthNum = Number.parseInt(month)
            const dayNum = Number.parseInt(day)

            if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
              throw new Error("Componentes de fecha inválidos")
            }

            date = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0)
          } else {
            // Formato DD-MM-YYYY
            let [day, month, year] = parts.map((p) => p.trim())

            // Convertir año de 2 dígitos a 4 dígitos
            if (year.length === 2) {
              const currentYear = new Date().getFullYear()
              const currentCentury = Math.floor(currentYear / 100) * 100
              const yearNum = Number.parseInt(year)
              year = (yearNum + currentCentury).toString()
            }

            const dayNum = Number.parseInt(day)
            const monthNum = Number.parseInt(month)
            const yearNum = Number.parseInt(year)

            if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
              throw new Error("Componentes de fecha inválidos")
            }

            date = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0)
          }
        } else {
          throw new Error("Formato de fecha con - inválido")
        }
      }
      // Formato DD.MM.YYYY
      else if (cleanDateStr.includes(".")) {
        const parts = cleanDateStr.split(".")
        if (parts.length === 3) {
          let [day, month, year] = parts.map((p) => p.trim())

          // Convertir año de 2 dígitos a 4 dígitos
          if (year.length === 2) {
            const currentYear = new Date().getFullYear()
            const currentCentury = Math.floor(currentYear / 100) * 100
            const yearNum = Number.parseInt(year)
            year = (yearNum + currentCentury).toString()
          }

          const dayNum = Number.parseInt(day)
          const monthNum = Number.parseInt(month)
          const yearNum = Number.parseInt(year)

          if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
            throw new Error("Componentes de fecha inválidos")
          }

          date = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0)
        } else {
          throw new Error("Formato de fecha con . inválido")
        }
      }
      // Intentar parsear como fecha ISO o formato que Date pueda entender
      else {
        date = new Date(cleanDateStr)
      }

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        throw new Error("Fecha resultante inválida")
      }

      // Verificar que la fecha esté en un rango razonable (últimos 10 años hasta 1 año en el futuro)
      const now = new Date()
      const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1)
      const oneYearFromNow = new Date(now.getFullYear() + 1, 11, 31)

      if (date < tenYearsAgo || date > oneYearFromNow) {
        console.warn("Fecha fuera del rango esperado:", date.toISOString())
      }

      // Generar ISO string con timezone UTC
      const isoString = date.toISOString()
      console.log("Fecha parseada exitosamente:", cleanDateStr, "->", isoString)

      return isoString
    } catch (error) {
      console.error("Error parseando fecha:", dateStr, error)

      // Como último recurso, usar la fecha actual
      const fallbackDate = new Date()
      fallbackDate.setHours(0, 0, 0, 0) // Resetear a medianoche
      const fallbackIso = fallbackDate.toISOString()

      console.warn("Usando fecha actual como fallback:", fallbackIso)
      return fallbackIso
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
    setImportDetails({ successTransactions: [], failedTransactions: [], warnings: [] })
    setImportSummary(null)
  }

  const handleUpload = async () => {
    if (files.length === 0 || !selectedBankAccountId) {
      setImportDetails({ successTransactions: [], failedTransactions: [], warnings: [] })
      setImportSummary(null)
      return
    }

    console.log("Iniciando importación con:")
    console.log("- Archivo:", files[0].name)
    console.log("- Cuenta bancaria ID:", selectedBankAccountId)
    console.log("- Company ID:", user?.companyId)

    // Verificar que la cuenta bancaria exista
    const selectedAccount = activeBankAccounts.find((account) => account.id === selectedBankAccountId)
    if (!selectedAccount) {
      console.error("Cuenta bancaria no encontrada:", selectedBankAccountId)
      setImportDetails({ successTransactions: [], failedTransactions: [], warnings: [] })
      setImportSummary(null)
      return
    }

    console.log("Cuenta bancaria seleccionada:", selectedAccount)

    setUploading(true)
    setProgress(0)
    setCurrentOperation("Procesando archivo...")

    const startTime = new Date()
    setImportSummary({
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
      duplicateCount: 0,
      startTime: startTime,
    })

    const allSuccessTransactions: Array<{ transaction: ParsedTransaction; index: number }> = []
    const allFailedTransactions: DetailedError[] = []
    const allWarnings: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          setCurrentOperation(`Procesando archivo ${i + 1}/${files.length}: ${file.name}`)
          const { transactions, errors, warnings } = await parseTransactionFile(file, selectedBankAccountId)
          allWarnings.push(...warnings)

          // Si hay transacciones exitosas, enviarlas al servidor una por una
          if (transactions.length > 0 && user?.companyId) {
            try {
              console.log("Preparando transacciones para importación individual...")

              // Procesar transacciones una por una
              for (let j = 0; j < transactions.length; j++) {
                const transaction = transactions[j]

                try {
                  setCurrentOperation(`Creando transacción ${j + 1}/${transactions.length}`)

                  // Preparar los datos de la transacción según CreateTransactionDto
                  // IMPORTANTE: Enviar las fechas como strings ISO 8601, no como objetos Date
                  // Actualizar la creación del payload en handleUpload
                  const transactionData: CreateTransactionDto = {
                    companyId: user.companyId,
                    bankAccountId: selectedBankAccountId,
                    transactionDate: parseDate(transaction.transactionDate), // String ISO 8601
                    valueDate: transaction.valueDate ? parseDate(transaction.valueDate) : undefined, // String ISO 8601 o undefined
                    description: transaction.description,
                    transactionType: transaction.transactionType,
                    amount: Number.parseFloat(transaction.amount.toFixed(2)),
                    balance: Number.parseFloat(transaction.balance.toFixed(2)),
                    branch: transaction.branch || undefined,
                    operationNumber: transaction.operationNumber || undefined,
                    operationTime: transaction.operationTime || undefined,
                    operatorUser: transaction.operatorUser || undefined,
                    utc: transaction.utc || undefined,
                    reference: transaction.reference || undefined,
                    channel: transaction.channel || undefined,
                    fileName: files[0].name,
                    importedAt: new Date().toISOString(), // String ISO 8601
                    status: "PENDING",
                    conciliatedAmount: undefined, // Ahora es opcional
                    pendingAmount: undefined, // Ahora es opcional
                  }

                  console.log(`Creando transacción ${j + 1}/${transactions.length}:`, {
                    date: transactionData.transactionDate,
                    description: transactionData.description,
                    amount: transactionData.amount,
                    operationNumber: transactionData.operationNumber,
                  })

                  // Log del payload completo para debugging (solo las primeras 3)
                  if (j < 3) {
                    console.log(`Payload completo transacción ${j + 1}:`, JSON.stringify(transactionData, null, 2))
                  }

                  // Llamar al método createTransaction del store
                  const createdTransaction = await createTransaction(transactionData)

                  if (createdTransaction) {
                    allSuccessTransactions.push({ transaction, index: j })
                    console.log(`✅ Transacción ${j + 1} creada exitosamente`)
                  } else {
                    const detailedError: DetailedError = {
                      transaction,
                      index: j,
                      error: `Error creando transacción ${j + 1}: ${transaction.description}`,
                      errorType: "UNKNOWN",
                      payload: transactionData,
                      timestamp: new Date(),
                      details: ["No se recibió respuesta del servidor"],
                    }
                    allFailedTransactions.push(detailedError)
                    console.log(`❌ Error creando transacción ${j + 1}`)
                  }

                  // Actualizar progreso (50% base + 50% para creación)
                  setProgress(50 + ((i + 1) / files.length) * 50 * ((j + 1) / transactions.length))

                  // Pequeña pausa para no saturar el servidor
                  if (j < transactions.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                  }
                } catch (error: any) {
                  console.error(`Error procesando transacción ${j + 1}:`, error)

                  // Categorizar el error
                  const { type, details } = categorizeError(error)

                  const detailedError: DetailedError = {
                    transaction,
                    index: j,
                    error: `Error en transacción ${j + 1}: ${transaction.description}`,
                    errorType: type,
                    payload: undefined, // No incluir payload si falló antes de crearlo
                    httpStatus: error?.response?.status,
                    timestamp: new Date(),
                    details,
                  }

                  allFailedTransactions.push(detailedError)
                }
              }
            } catch (error: any) {
              console.error("Error general al importar transacciones:", error)
              const { type, details } = categorizeError(error)

              const detailedError: DetailedError = {
                transaction: {} as ParsedTransaction,
                index: i,
                error: `Error general al importar transacciones: ${error?.message || error}`,
                errorType: type,
                timestamp: new Date(),
                details,
              }
              allFailedTransactions.push(detailedError)
            }
          }
        } catch (error) {
          console.error(`Error al procesar ${file.name}:`, error)
          const { type, details } = categorizeError(error)

          const detailedError: DetailedError = {
            transaction: {} as ParsedTransaction,
            index: i,
            error: `Error al procesar ${file.name}: ${error}`,
            errorType: type,
            timestamp: new Date(),
            details,
          }
          allFailedTransactions.push(detailedError)
        }

        setProgress(((i + 1) / files.length) * 50) // 50% para procesamiento de archivos
      }
    } catch (error: any) {
      console.error("Error crítico durante la importación:", error)
      const { type, details } = categorizeError(error)

      const detailedError: DetailedError = {
        transaction: {} as ParsedTransaction,
        index: 0,
        error: `Error crítico: ${error?.message || error}`,
        errorType: type,
        timestamp: new Date(),
        details,
      }
      allFailedTransactions.push(detailedError)
    } finally {
      const endTime = new Date()
      const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2) + " segundos"

      setImportSummary({
        totalProcessed: allSuccessTransactions.length + allFailedTransactions.length,
        successCount: allSuccessTransactions.length,
        errorCount: allFailedTransactions.length,
        warningCount: allWarnings.length,
        duplicateCount: allFailedTransactions.filter((e) => e.errorType === "DUPLICATE").length,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
      })

      setImportDetails({
        successTransactions: allSuccessTransactions,
        failedTransactions: allFailedTransactions,
        warnings: allWarnings,
      })

      setUploading(false)
      setCurrentOperation("")
      setProgress(100)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    // Solo resetear si no hay resultados importantes que mostrar
    if (!importSummary || (importSummary.successCount === 0 && importSummary.errorCount === 0)) {
      setFiles([])
      setSelectedBankAccountId("")
      setImportDetails({ successTransactions: [], failedTransactions: [], warnings: [] })
      setImportSummary(null)
      setProgress(0)
      setCurrentOperation("")
    }
    onOpenChange(false)
  }

  const resetForm = () => {
    setFiles([])
    setImportDetails({ successTransactions: [], failedTransactions: [], warnings: [] })
    setImportSummary(null)
    setProgress(0)
    setCurrentOperation("")
    setShowErrorDetails(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getErrorTypeColor = (type: DetailedError["errorType"]) => {
    switch (type) {
      case "VALIDATION":
        return "text-orange-600 dark:text-orange-400"
      case "NETWORK":
        return "text-blue-600 dark:text-blue-400"
      case "SERVER":
        return "text-red-600 dark:text-red-400"
      case "DUPLICATE":
        return "text-yellow-600 dark:text-yellow-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getErrorTypeIcon = (type: DetailedError["errorType"]) => {
    switch (type) {
      case "VALIDATION":
        return <AlertTriangle className="w-4 h-4" />
      case "NETWORK":
        return <AlertCircle className="w-4 h-4" />
      case "SERVER":
        return <X className="w-4 h-4" />
      case "DUPLICATE":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Bug className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Importar Transacciones Bancarias
          </DialogTitle>
          <DialogDescription>
            Seleccione un archivo de extracto bancario para importar las transacciones al sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selección de cuenta bancaria */}
          <div>
            <Label htmlFor="bank-account">Cuenta Bancaria</Label>
            <div className="mt-2">
              {bankAccountsLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 py-2 border border-input rounded-md text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>Cargando cuentas bancarias...</span>
                </div>
              ) : (
                <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                  <SelectTrigger id="bank-account">
                    <SelectValue placeholder="Seleccione una cuenta bancaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions.length === 0 ? (
                      <SelectItem value="no-accounts" disabled>
                        No hay cuentas bancarias activas
                      </SelectItem>
                    ) : (
                      accountOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Seleccione la cuenta bancaria a la que pertenece este extracto ({accountOptions.length} cuentas
              disponibles)
            </p>
          </div>

          {/* Selección de archivo */}
          <div>
            <Label htmlFor="transaction-file">Archivo de Extracto Bancario</Label>
            <Input
              id="transaction-file"
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleFileChange}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos soportados: Excel (.xlsx, .xls), CSV (.csv) y texto (.txt).
              <br />
              <strong>Excel:</strong> Ahora soportado completamente con SheetJS.
            </p>
          </div>

          {/* Archivos seleccionados */}
          {files.length > 0 && (
            <div>
              <Label>Archivos Seleccionados ({files.length})</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                      <div>
                        <span className="text-sm font-medium">{file.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB •{" "}
                          {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progreso */}
          {uploading && (
            <div>
              <Label>Procesando...</Label>
              <Progress value={progress} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round(progress)}% completado
                {currentOperation && ` - ${currentOperation}`}
              </p>
            </div>
          )}

          {/* Resultados */}
          {importDetails.successTransactions.length > 0 && (
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                ✅ Se procesaron {importDetails.successTransactions.length} transacciones exitosamente:
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <div className="text-xs space-y-1">
                    {importDetails.successTransactions.slice(0, 5).map((success, index) => (
                      <div key={index} className="text-emerald-700 dark:text-emerald-300">
                        • {success.transaction.transactionDate} - {success.transaction.description} -{" "}
                        {success.transaction.transactionType === "DEBIT" ? "-" : "+"}{" "}
                        {success.transaction.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </div>
                    ))}
                    {importDetails.successTransactions.length > 5 && (
                      <div className="text-emerald-600 dark:text-emerald-400">
                        ... y {importDetails.successTransactions.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importDetails.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                ⚠️ Advertencias encontradas ({importDetails.warnings.length}):
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="text-xs space-y-1">
                    {importDetails.warnings.slice(0, 5).map((warning, index) => (
                      <li key={index} className="text-yellow-700 dark:text-yellow-300">
                        • {warning}
                      </li>
                    ))}
                    {importDetails.warnings.length > 5 && (
                      <li className="text-yellow-600 dark:text-yellow-400">
                        ... y {importDetails.warnings.length - 5} más
                      </li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importDetails.failedTransactions.length > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="flex items-center justify-between">
                  <span>❌ Errores encontrados ({importDetails.failedTransactions.length}):</span>
                  <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Code className="w-3 h-3 mr-1" />
                        {showErrorDetails ? "Ocultar detalles" : "Ver detalles"}
                        {showErrorDetails ? (
                          <ChevronUp className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {importDetails.failedTransactions.map((failed, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg p-3"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <div className={getErrorTypeColor(failed.errorType)}>
                                {getErrorTypeIcon(failed.errorType)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-red-700 dark:text-red-300 text-sm">
                                  Fila {failed.index + 1}: {failed.transaction.description || "Sin descripción"}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Tipo:{" "}
                                  <span className={`font-medium ${getErrorTypeColor(failed.errorType)}`}>
                                    {failed.errorType}
                                  </span>
                                  {failed.httpStatus && <span className="ml-2">HTTP {failed.httpStatus}</span>}
                                  <span className="ml-2">{failed.timestamp.toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>

                            {failed.details && failed.details.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                  Detalles del error:
                                </div>
                                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                  {failed.details.map((detail, detailIndex) => (
                                    <li key={detailIndex}>• {detail}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {failed.payload && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                  Payload enviado:
                                </div>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border overflow-x-auto text-gray-700 dark:text-gray-300">
                                  {JSON.stringify(failed.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="text-xs space-y-1">
                    {importDetails.failedTransactions.slice(0, 3).map((failed, index) => (
                      <li key={index} className="text-red-700 dark:text-red-300 flex items-center gap-2">
                        <div className={getErrorTypeColor(failed.errorType)}>{getErrorTypeIcon(failed.errorType)}</div>
                        <span>
                          Fila {failed.index + 1}: {failed.errorType} -{" "}
                          {failed.transaction.description || "Error de procesamiento"}
                        </span>
                      </li>
                    ))}
                    {importDetails.failedTransactions.length > 3 && (
                      <li className="text-red-600 dark:text-red-400">
                        ... y {importDetails.failedTransactions.length - 3} más (ver detalles arriba)
                      </li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Resumen de importación */}
          {importSummary && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Database className="w-5 h-5 text-primary" />
                  Resumen de Importación
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {importSummary.successCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Exitosas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importSummary.errorCount}</div>
                    <div className="text-sm text-muted-foreground">Fallidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {importSummary.warningCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Advertencias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{importSummary.totalProcessed}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Tiempo de procesamiento: {importSummary.duration}</p>
                  <p>Iniciado: {importSummary.startTime.toLocaleString()}</p>
                  {importSummary.endTime && <p>Finalizado: {importSummary.endTime.toLocaleString()}</p>}
                </div>
              </div>

              {/* Transacciones exitosas (muestra) */}
              {importDetails.successTransactions.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <h5 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                    Transacciones Exitosas ({importDetails.successTransactions.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importDetails.successTransactions.slice(0, 10).map((success, index) => (
                      <div key={index} className="text-sm text-emerald-700 dark:text-emerald-300">
                        • {success.transaction.transactionDate} - {success.transaction.description} -
                        {success.transaction.transactionType === "DEBIT" ? "-" : "+"}
                        {success.transaction.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </div>
                    ))}
                    {importDetails.successTransactions.length > 10 && (
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        ... y {importDetails.successTransactions.length - 10} más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formato esperado */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2 text-foreground">Formatos soportados:</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <div>
                <strong>Excel (.xlsx, .xls):</strong> Completamente soportado con SheetJS
                <div className="font-mono bg-muted p-2 rounded mt-1 text-foreground">
                  Fila 5: Fecha | Fecha valuta | Descripción operación | Monto | Saldo | Número | ...
                  <br />
                  Fila 6+: 09/05/2025 | | IMPUESTO ITF | -2.90 | 174653.71 | 123456 | ...
                </div>
              </div>
              <div>
                <strong>CSV:</strong> Separado por comas o punto y coma
              </div>
              <div>
                <strong>TXT:</strong> Separado por tabulaciones
              </div>
              <div>
                <strong>Campos requeridos:</strong> Fecha, Descripción, Monto
              </div>
              <div>
                <strong>Campos opcionales:</strong> Número de operación (se genera automáticamente si falta), Saldo,
                Sucursal, etc.
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={files.length === 0 || uploading}>
              <FileUp className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || !selectedBankAccountId || uploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploading ? (
                <>Procesando...</>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Importar {files.length} archivo(s)
                </>
              )}
            </Button>
            {importSummary && (
              <Button variant="outline" onClick={resetForm} disabled={uploading}>
                <FileUp className="w-4 h-4 mr-2" />
                Nuevo Proceso
              </Button>
            )}
            <Button
              onClick={() => {
                const hasSuccessfulImports = importSummary && importSummary.successCount > 0
                if (hasSuccessfulImports && onImportComplete) {
                  onImportComplete(hasSuccessfulImports)
                }
                handleClose()
              }}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {importSummary && importSummary.successCount > 0 ? "Cerrar" : "Cerrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
