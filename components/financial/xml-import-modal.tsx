"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, AlertCircle, CheckCircle, Info, FolderOpen, Eye } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useDocumentsStore } from "@/stores/documents-store"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { useTaxSchemesStore } from "@/stores/tax-schemes-store"
import type { CreateDocumentDto, DocumentType,  } from "@/types/documents"
import { useAuthStore } from "@/stores/authStore"
import { CreateSupplierDto, SupplierType } from "@/types/suppliers"

interface XMLImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
  companyId: string
}

interface FileWithStatus {
  file: File
  status: "pending" | "processing" | "success" | "error"
  error?: string
  progress: number
  documentId?: string
  supplierId?: string
  preview?: boolean
}

interface SupplierData {
  businessName: string
  documentNumber: string
  documentType: string
  email?: string | null
  address?: string | null
  district?: string | null
  province?: string | null
  department?: string | null
  phone?: string | null
}

export default function XMLImportModal({ open, onOpenChange, onImportComplete, companyId }: XMLImportModalProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [processing, setProcessing] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewXml, setPreviewXml] = useState<{ content: string; fileName: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const { createDocument, error: documentError, clearError: clearDocumentError } = useDocumentsStore()
  const {
    getSupplierByDocument,
    createSupplier,
    error: supplierError,
    clearError: clearSupplierError,
  } = useSuppliersStore()
  const {
    loadTaxSchemes,
    getTaxSchemeByName,
    getTaxSchemeBySchemeId,
    taxSchemes,
    loading: taxSchemesLoading,
    error: taxSchemeError,
    clearError: clearTaxSchemeError,
  } = useTaxSchemesStore()
  const { user, company } = useAuthStore()

  // Load tax schemes when modal opens
  useEffect(() => {
    if (open) {
      console.log("🚀 Modal abierto - Verificando tax schemes...")
      console.log("📋 Tax schemes actuales en store:", taxSchemes.length)
      console.log("🔄 Loading state:", taxSchemesLoading)

      if (taxSchemes.length === 0 && !taxSchemesLoading) {
        console.log("🔄 Cargando tax schemes para importación XML...")
        loadTaxSchemes({ isActive: true })
      } else if (taxSchemes.length > 0) {
        console.log("✅ Tax schemes ya cargados:")
        taxSchemes.forEach((ts, index) => {
          console.log(`  ${index + 1}. ${ts.taxSchemeName} (${ts.taxSchemeId}) - ${(ts.taxPercentage || 0 )* 100}%`)
        })
      }
    }
  }, [open, taxSchemes.length, taxSchemesLoading, loadTaxSchemes])

  // Debug tax schemes state
  useEffect(() => {
    console.log("🔍 Tax Schemes State Update:")
    console.log("  - Count:", taxSchemes.length)
    console.log("  - Loading:", taxSchemesLoading)
    console.log("  - Error:", taxSchemeError)
    console.log(
      "  - Schemes:",
      taxSchemes.map((ts) => `${ts.taxSchemeName} (${ts.taxSchemeId})`),
    )
  }, [taxSchemes, taxSchemesLoading, taxSchemeError])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      console.log("🔄 Modal cerrado - Limpiando estado")
      setFiles([])
      setOverallProgress(0)
      setProcessing(false)
      setIsDragOver(false)
      setPreviewXml(null)
      clearDocumentError()
      clearSupplierError()
      clearTaxSchemeError()
    } else {
      console.log("🚀 Modal abierto - Iniciando importación XML")
      console.log("📋 Company ID:", companyId)
    }
  }, [open, clearDocumentError, clearSupplierError, clearTaxSchemeError, companyId])

  // Show error toast if stores have errors
  useEffect(() => {
    if (documentError) {
      console.error("❌ Error en documento store:", documentError)
      toast({
        title: "Error al procesar documentos",
        description: documentError,
        variant: "destructive",
      })
      clearDocumentError()
    }
  }, [documentError, toast, clearDocumentError])

  useEffect(() => {
    if (supplierError) {
      console.error("❌ Error en supplier store:", supplierError)
      toast({
        title: "Error al procesar proveedores",
        description: supplierError,
        variant: "destructive",
      })
      clearSupplierError()
    }
  }, [supplierError, toast, clearSupplierError])

  useEffect(() => {
    if (taxSchemeError) {
      console.error("❌ Error en tax scheme store:", taxSchemeError)
      toast({
        title: "Error al cargar esquemas tributarios",
        description: taxSchemeError,
        variant: "destructive",
      })
      clearTaxSchemeError()
    }
  }, [taxSchemeError, toast, clearTaxSchemeError])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    console.log(
      "📁 Archivos soltados:",
      droppedFiles.length,
      droppedFiles.map((f) => f.name),
    )
    processFiles(droppedFiles)
  }, [])

  // File processing function
  const processFiles = useCallback(
    (selectedFiles: File[]) => {
      console.log("🔍 Procesando archivos seleccionados:", selectedFiles.length)

      const xmlFiles = selectedFiles.filter(
        (file) =>
          file.name.toLowerCase().endsWith(".xml") || file.type === "text/xml" || file.type === "application/xml",
      )

      console.log(
        "📄 Archivos XML válidos:",
        xmlFiles.length,
        xmlFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      )

      if (xmlFiles.length === 0 && selectedFiles.length > 0) {
        console.warn("⚠️ No se encontraron archivos XML válidos")
        toast({
          title: "Formato no soportado",
          description: "Solo se permiten archivos XML",
          variant: "destructive",
        })
        return
      }

      const newFiles = xmlFiles.map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
        preview: false,
      }))

      setFiles((prev) => {
        const updated = [...prev, ...newFiles]
        console.log("📋 Lista de archivos actualizada:", updated.length, "archivos totales")
        return updated
      })
    },
    [toast],
  )

  // File input change handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      console.log("📁 Archivos seleccionados desde input:", selectedFiles.length)
      processFiles(selectedFiles)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [processFiles],
  )

  const openFileDialog = useCallback(() => {
    console.log("📁 Abriendo diálogo de selección de archivos")
    fileInputRef.current?.click()
  }, [])

  const removeFile = (index: number) => {
    console.log("🗑️ Removiendo archivo en índice:", index)
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    console.log("🗑️ Limpiando todos los archivos")
    setFiles([])
  }

  const togglePreview = async (index: number) => {
    try {
      // If already previewing, close preview
      if (files[index].preview) {
        setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, preview: false } : f)))
        setPreviewXml(null)
        return
      }

      // Read file content
      const fileContent = await files[index].file.text()

      // Update file status
      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, preview: true } : { ...f, preview: false })))

      // Set preview content
      setPreviewXml({
        content: fileContent,
        fileName: files[index].file.name,
      })
    } catch (error) {
      console.error("Error reading file for preview:", error)
      toast({
        title: "Error al previsualizar",
        description: "No se pudo leer el contenido del archivo XML",
        variant: "destructive",
      })
    }
  }

  // Extract supplier information from XML
  const extractSupplierFromXML = (xmlContent: string): SupplierData | null => {
    console.log("🔍 Extrayendo información del proveedor del XML")

    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        console.error("❌ Error de parsing XML:", parseError.textContent)
        throw new Error("XML mal formado")
      }

      // Helper function to get text with multiple selectors
      const getElementText = (...selectors: string[]): string => {
        for (const selector of selectors) {
          try {
            const element = xmlDoc.querySelector(selector)
            if (element?.textContent?.trim()) {
              return element.textContent.trim()
            }
          } catch (e) {
            continue
          }
        }
        return ""
      }

      const supplierName = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PartyLegalEntity cbc\\:RegistrationName",
        "AccountingSupplierParty Party PartyLegalEntity RegistrationName",
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PartyName cbc\\:Name",
        "AccountingSupplierParty Party PartyName Name",
      )

      const supplierRuc = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PartyIdentification cbc\\:ID",
        "AccountingSupplierParty Party PartyIdentification ID",
        "cac\\:AccountingSupplierParty cbc\\:CustomerAssignedAccountID",
        "AccountingSupplierParty CustomerAssignedAccountID",
      )

      const supplierEmail = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:Contact cbc\\:ElectronicMail",
        "AccountingSupplierParty Party Contact ElectronicMail",
      )

      const supplierPhone = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:Contact cbc\\:Telephone",
        "AccountingSupplierParty Party Contact Telephone",
      )

      const supplierAddress = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cbc\\:StreetName",
        "AccountingSupplierParty Party PostalAddress StreetName",
      )

      const supplierDistrict = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cbc\\:CitySubdivisionName",
        "AccountingSupplierParty Party PostalAddress CitySubdivisionName",
      )

      const supplierProvince = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cbc\\:CountrySubentity",
        "AccountingSupplierParty Party PostalAddress CountrySubentity",
      )

      const supplierDepartment = getElementText(
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cbc\\:District",
        "AccountingSupplierParty Party PostalAddress District",
      )

      if (!supplierName || !supplierRuc) {
        console.error("❌ Información insuficiente del proveedor:", { supplierName, supplierRuc })
        return null
      }

      const supplierData: SupplierData = {
        businessName: supplierName,
        documentNumber: supplierRuc,
        documentType: supplierRuc.length === 11 ? "RUC" : "DNI",
        email: supplierEmail || null,
        phone: supplierPhone || null,
        address: supplierAddress || null,
        district: supplierDistrict || null,
        province: supplierProvince || null,
        department: supplierDepartment || null,
      }

      console.log("✅ Información del proveedor extraída:", supplierData)
      return supplierData
    } catch (error) {
      console.error("❌ Error extrayendo información del proveedor:", error)
      return null
    }
  }

  // Parse XML to document data - PAYLOAD COMPLETO
  const parseXMLToDocument = (xmlContent: string, fileName: string, supplierId: string): CreateDocumentDto | null => {
    console.log("🔍 Parseando XML a estructura de documento COMPLETA")
    console.log("🏷️ Tax schemes disponibles para parsing:", taxSchemes.length)

    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        console.error("❌ Error de parsing XML:", parseError.textContent)
        throw new Error("XML mal formado")
      }

      // Helper functions
      const getElementText = (...selectors: string[]): string => {
        for (const selector of selectors) {
          try {
            const element = xmlDoc.querySelector(selector)
            if (element?.textContent?.trim()) {
              return element.textContent.trim()
            }
          } catch (e) {
            continue
          }
        }
        return ""
      }

      const getNumericValue = (...selectors: string[]): number => {
        const text = getElementText(...selectors)
        return text ? Number.parseFloat(text) || 0 : 0
      }

      const getAttribute = (selector: string, attribute: string): string => {
        try {
          const element = xmlDoc.querySelector(selector)
          return element?.getAttribute(attribute) || ""
        } catch (e) {
          return ""
        }
      }

      // Basic document information
      const documentId = getElementText("cbc\\:ID", "ID")
      const issueDate = getElementText("cbc\\:IssueDate", "IssueDate")
      const issueTime = getElementText("cbc\\:IssueTime", "IssueTime")
      const dueDate = getElementText("cbc\\:DueDate", "DueDate") || issueDate
      const currency = getElementText("cbc\\:DocumentCurrencyCode", "DocumentCurrencyCode") || "PEN"
      const exchangeRate = getNumericValue("cbc\\:SourceCurrencyBaseRate", "SourceCurrencyBaseRate") || 1.0

      // UBL versions
      const xmlUblVersion =
        getAttribute("Invoice", "UBLVersionID") ||
        getAttribute("CreditNote", "UBLVersionID") ||
        getAttribute("DebitNote", "UBLVersionID") ||
        getElementText("cbc\\:UBLVersionID", "UBLVersionID") ||
        "2.1"

      const xmlCustomizationId =
        getAttribute("Invoice", "customizationID") ||
        getAttribute("CreditNote", "customizationID") ||
        getAttribute("DebitNote", "customizationID") ||
        getElementText("cbc\\:CustomizationID", "CustomizationID") ||
        "2.0"

      // Document type
      const invoiceTypeCode = getElementText(
        "cbc\\:InvoiceTypeCode",
        "InvoiceTypeCode",
        "cbc\\:CreditNoteTypeCode",
        "CreditNoteTypeCode",
        "cbc\\:DebitNoteTypeCode",
        "DebitNoteTypeCode",
      )

      let documentType: DocumentType = "INVOICE"
      let documentTypeDescription = "Factura Electrónica"

      if (invoiceTypeCode === "01") {
        documentType = "INVOICE"
        documentTypeDescription = "Factura Electrónica"
      } else if (invoiceTypeCode === "03") {
        documentType = "RECEIPT"
        documentTypeDescription = "Boleta de Venta Electrónica"
      } else if (invoiceTypeCode === "07") {
        documentType = "CREDIT_NOTE"
        documentTypeDescription = "Nota de Crédito Electrónica"
      } else if (invoiceTypeCode === "08") {
        documentType = "DEBIT_NOTE"
        documentTypeDescription = "Nota de Débito Electrónica"
      } else if (fileName.toUpperCase().includes("RH") || fileName.toUpperCase().includes("RHE")) {
        documentType = "RECEIPT"
        documentTypeDescription = "Recibo por Honorarios Electrónico"
      }

      // Extract series and number
      let series = ""
      let number = ""

      if (documentId) {
        if (documentId.includes("-")) {
          const parts = documentId.split("-")
          series = parts[0] || ""
          number = parts.slice(1).join("-") || ""
        } else {
          if (documentId.length >= 4) {
            series = documentId.substring(0, 4)
            number = documentId.substring(4)
          } else {
            series = documentId
            number = "0"
          }
        }
      }

      // Amounts
      const subtotal = getNumericValue(
        "cac\\:LegalMonetaryTotal cbc\\:LineExtensionAmount",
        "LegalMonetaryTotal LineExtensionAmount",
      )
      const igv = getNumericValue("cac\\:TaxTotal cbc\\:TaxAmount", "TaxTotal TaxAmount")
      const total = getNumericValue("cac\\:LegalMonetaryTotal cbc\\:PayableAmount", "LegalMonetaryTotal PayableAmount")
      const otherTaxes = getNumericValue(
        "cac\\:LegalMonetaryTotal cbc\\:AllowanceTotalAmount",
        "LegalMonetaryTotal AllowanceTotalAmount",
      )

      // Retentions and detractions
      const retentionElements = xmlDoc.querySelectorAll("cac\\:PaymentTerms, PaymentTerms")
      let retentionAmount = 0
      let hasRetention = false
      let retentionPercentage = 0
      let detractionAmount = 0
      let detractionCode = ""
      let detractionPercentage = 0
      let hasDetraction = false
      let detractionServiceCode = ""
      let detractionAccount = ""
      let detractionPaymentDate: Date | null = null
      let detractionPaymentReference = ""

      Array.from(retentionElements).forEach((element) => {
        const paymentTermsId = element.querySelector("cbc\\:ID, ID")?.textContent?.trim()?.toLowerCase() || ""
        if (paymentTermsId.includes("retencion")) {
          const amount = element.querySelector("cbc\\:Amount, Amount")?.textContent?.trim()
          const percent = element.querySelector("cbc\\:Percent, Percent")?.textContent?.trim()
          if (amount) {
            retentionAmount = Number.parseFloat(amount) || 0
            hasRetention = retentionAmount > 0
          }
          if (percent) {
            retentionPercentage = (Number.parseFloat(percent) || 0) / 100 // Convertir a 0-1
          }
        }
        if (paymentTermsId.includes("detraccion")) {
          const amount = element.querySelector("cbc\\:Amount, Amount")?.textContent?.trim()
          const code = element.querySelector("cbc\\:PaymentMeansID, PaymentMeansID")?.textContent?.trim()
          const percent = element.querySelector("cbc\\:PaymentPercent, PaymentPercent")?.textContent?.trim()
          const account = element.querySelector("cbc\\:PaymentID, PaymentID")?.textContent?.trim()
          const paymentDate = element.querySelector("cbc\\:PaymentDueDate, PaymentDueDate")?.textContent?.trim()
          const paymentRef = element.querySelector("cbc\\:PaymentNote, PaymentNote")?.textContent?.trim()

          if (amount) {
            detractionAmount = Number.parseFloat(amount) || 0
            hasDetraction = detractionAmount > 0
          }
          if (code) {
            detractionCode = code
            detractionServiceCode = code
          }
          if (percent) {
            detractionPercentage = (Number.parseFloat(percent) || 0) / 100 // Convertir a 0-1
          }
          if (account) {
            detractionAccount = account
          }
          if (paymentDate) {
            detractionPaymentDate = new Date(paymentDate)
          }
          if (paymentRef) {
            detractionPaymentReference = paymentRef
          }
        }
      })

      // Calculate percentages if not found
      if (hasRetention && retentionPercentage === 0 && subtotal > 0) {
        retentionPercentage = retentionAmount / subtotal // Ya está en 0-1
      }

      if (hasDetraction && detractionPercentage === 0 && total > 0) {
        detractionPercentage = detractionAmount / total // Ya está en 0-1
      }

      // Check for RET 4TA in invoice lines (for recibos por honorarios)
      const lineElements = xmlDoc.querySelectorAll(
        "cac\\:InvoiceLine, InvoiceLine, cac\\:CreditNoteLine, CreditNoteLine, cac\\:DebitNoteLine, DebitNoteLine",
      )

      Array.from(lineElements).forEach((line) => {
        try {
          const taxCategoryId = line.querySelector("cac\\:TaxCategory cbc\\:ID, TaxCategory ID")?.textContent
          if (taxCategoryId === "RET 4TA") {
            hasRetention = true
            documentType = "RECEIPT"
            documentTypeDescription = "Recibo por Honorarios Electrónico"

            // Extract retention amount and percentage
            const taxAmount = line.querySelector("cac\\:TaxTotal cbc\\:TaxAmount, TaxTotal TaxAmount")?.textContent
            const taxPercent = line.querySelector("cac\\:TaxCategory cbc\\:Percent, TaxCategory Percent")?.textContent

            if (taxAmount) {
              retentionAmount = Number.parseFloat(taxAmount) || 0
            }

            if (taxPercent) {
              retentionPercentage = (Number.parseFloat(taxPercent) || 8) / 100 // Convertir a 0-1
            }
          }
        } catch (e) {
          // Ignore errors in line processing
        }
      })

      // QR Code and notes
      const noteElements = xmlDoc.querySelectorAll("cbc\\:Note, Note")
      let qrCode = ""
      const documentNotes: string[] = []
      const operationNotes: string[] = []

      Array.from(noteElements).forEach((note) => {
        const noteText = note.textContent?.trim() || ""
        const noteLocaleID = note.getAttribute("languageLocaleID")

        if (noteText) {
          if (noteText.includes("|") || noteText.length > 100) {
            qrCode = noteText
          } else {
            if (noteLocaleID === "1000") {
              documentNotes.push(noteText)
            } else if (noteLocaleID === "2006") {
              operationNotes.push(noteText)
            } else if (
              noteText.toLowerCase().includes("detracción") ||
              noteText.toLowerCase().includes("retencion") ||
              noteText.toLowerCase().includes("operación")
            ) {
              operationNotes.push(noteText)
            } else {
              documentNotes.push(noteText)
            }
          }
        }
      })

      // Document lines - COMPLETAS con tax scheme
      const lines = Array.from(lineElements).map((lineElement, index) => {
        const getLineText = (selector: string): string => {
          try {
            const element = lineElement.querySelector(selector)
            return element?.textContent?.trim() || ""
          } catch (e) {
            return ""
          }
        }

        const getLineNumber = (selector: string): number => {
          const text = getLineText(selector)
          return text ? Number.parseFloat(text) || 0 : 0
        }

        const getLineAttribute = (selector: string, attribute: string): string => {
          try {
            const element = lineElement.querySelector(selector)
            return element?.getAttribute(attribute) || ""
          } catch (e) {
            return ""
          }
        }

        // Determinar tax scheme basado en el tipo de impuesto
        const taxSchemeIdFromXml =
          getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cac\\:TaxScheme cbc\\:ID") ||
          getLineText("TaxTotal TaxSubtotal TaxCategory TaxScheme ID")

        const taxCategoryId =
          getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cbc\\:ID") ||
          getLineText("TaxTotal TaxSubtotal TaxCategory ID")

        console.log(`🏷️ Procesando línea ${index + 1}:`)
        console.log(`  - taxSchemeIdFromXml: "${taxSchemeIdFromXml}"`)
        console.log(`  - taxCategoryId: "${taxCategoryId}"`)

        let taxSchemeId = ""

        // Buscar tax scheme por ID del XML
        if (taxSchemeIdFromXml) {
          const taxScheme = getTaxSchemeBySchemeId(taxSchemeIdFromXml)
          if (taxScheme) {
            taxSchemeId = taxScheme.id
            console.log(`✅ Tax scheme encontrado por ID XML "${taxSchemeIdFromXml}":`, taxScheme.taxSchemeName)
          } else {
            console.warn(`❌ Tax scheme NO encontrado por ID XML "${taxSchemeIdFromXml}"`)
          }
        }

        // Si no se encuentra, buscar por categoría
        if (!taxSchemeId) {
          console.log("🔍 Buscando tax scheme por categoría...")
          if (taxCategoryId === "S" || taxSchemeIdFromXml === "1000") {
            const igvScheme = getTaxSchemeByName("IGV")
            taxSchemeId = igvScheme?.id || ""
            console.log("🏷️ Usando tax scheme IGV para línea gravada:", taxSchemeId)
          } else if (taxCategoryId === "E" || taxSchemeIdFromXml === "9997") {
            const exoneradoScheme = getTaxSchemeByName("Exonerado")
            taxSchemeId = exoneradoScheme?.id || ""
            console.log("🏷️ Usando tax scheme Exonerado:", taxSchemeId)
          } else if (taxCategoryId === "O" || taxSchemeIdFromXml === "9998") {
            const inafectoScheme = getTaxSchemeByName("Inafecto")
            taxSchemeId = inafectoScheme?.id || ""
            console.log("🏷️ Usando tax scheme Inafecto:", taxSchemeId)
          } else {
            const otrosScheme = getTaxSchemeByName("Otros")
            taxSchemeId = otrosScheme?.id || ""
            console.log("🏷️ Usando tax scheme Otros por defecto:", taxSchemeId)
          }
        }

        const lineData = {
          description:
            getLineText("cac\\:Item cbc\\:Description") || getLineText("Item Description") || "Producto/Servicio",
          quantity:
            getLineNumber("cbc\\:InvoicedQuantity") ||
            getLineNumber("InvoicedQuantity") ||
            getLineNumber("cbc\\:CreditedQuantity") ||
            getLineNumber("CreditedQuantity") ||
            getLineNumber("cbc\\:DebitedQuantity") ||
            getLineNumber("DebitedQuantity") ||
            1,
          productCode:
            getLineText("cac\\:Item cbc\\:SellersItemIdentification cbc\\:ID") ||
            getLineText("Item SellersItemIdentification ID") ||
            `PROD${String(index + 1).padStart(3, "0")}`,
          unitCode:
            getLineAttribute("cbc\\:InvoicedQuantity", "unitCode") ||
            getLineAttribute("cbc\\:CreditedQuantity", "unitCode") ||
            getLineAttribute("cbc\\:DebitedQuantity", "unitCode") ||
            "NIU",
          unitPrice: getLineNumber("cac\\:Price cbc\\:PriceAmount") || getLineNumber("Price PriceAmount"),
          unitPriceWithTax: 0, // Se calculará después
          lineTotal: getLineNumber("cbc\\:LineExtensionAmount") || getLineNumber("LineExtensionAmount"),
          igvAmount: getLineNumber("cac\\:TaxTotal cbc\\:TaxAmount") || getLineNumber("TaxTotal TaxAmount") || 0,
          taxExemptionCode:
            getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cbc\\:TaxExemptionReasonCode") ||
            getLineText("TaxTotal TaxSubtotal TaxCategory TaxExemptionReasonCode") ||
            null,
          taxExemptionReason:
            getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cbc\\:TaxExemptionReason") ||
            getLineText("TaxTotal TaxSubtotal TaxCategory TaxExemptionReason") ||
            null,
          taxSchemeId,
          priceTypeCode:
            getLineText("cac\\:PricingReference cac\\:AlternativeConditionPrice cbc\\:PriceTypeCode") ||
            getLineText("PricingReference AlternativeConditionPrice PriceTypeCode") ||
            "01",
          referencePrice:
            getLineNumber("cac\\:PricingReference cac\\:AlternativeConditionPrice cbc\\:PriceAmount") ||
            getLineNumber("PricingReference AlternativeConditionPrice PriceAmount") ||
            null,
          itemClassificationCode:
            getLineText("cac\\:Item cac\\:CommodityClassification cbc\\:ItemClassificationCode") ||
            getLineText("Item CommodityClassification ItemClassificationCode") ||
            null,
          freeOfChargeIndicator:
            getLineText("cac\\:PricingReference cac\\:AlternativeConditionPrice cbc\\:PriceTypeCode") === "02" ||
            getLineText("PricingReference AlternativeConditionPrice PriceTypeCode") === "02",
          allowanceAmount: getLineNumber("cac\\:AllowanceCharge cbc\\:Amount") || 0,
          allowanceIndicator: getLineText("cac\\:AllowanceCharge cbc\\:ChargeIndicator") === "false",
          chargeAmount: getLineNumber("cac\\:AllowanceCharge cbc\\:Amount") || 0,
          chargeIndicator: getLineText("cac\\:AllowanceCharge cbc\\:ChargeIndicator") === "true",
          orderLineReference:
            getLineText("cac\\:OrderLineReference cbc\\:LineID") || getLineText("OrderLineReference LineID") || null,
          lineNotes: getLineText("cbc\\:Note") || getLineText("Note") || null,
          taxableAmount:
            getLineNumber("cac\\:TaxTotal cac\\:TaxSubtotal cbc\\:TaxableAmount") ||
            getLineNumber("TaxTotal TaxSubtotal TaxableAmount") ||
            0,
          exemptAmount:
            taxCategoryId === "E"
              ? getLineNumber("cbc\\:LineExtensionAmount") || getLineNumber("LineExtensionAmount")
              : 0,
          inaffectedAmount:
            taxCategoryId === "O"
              ? getLineNumber("cbc\\:LineExtensionAmount") || getLineNumber("LineExtensionAmount")
              : 0,
          xmlLineData: JSON.stringify({
            taxCategoryId,
            taxSchemeIdFromXml,
            originalData: {
              itemDescription: getLineText("cac\\:Item cbc\\:Description") || getLineText("Item Description"),
              sellersItemId:
                getLineText("cac\\:Item cbc\\:SellersItemIdentification cbc\\:ID") ||
                getLineText("Item SellersItemIdentification ID"),
            },
          }),
        }

        // Calcular unitPriceWithTax
        if (lineData.unitPrice > 0 && lineData.igvAmount > 0) {
          lineData.unitPriceWithTax = lineData.unitPrice + lineData.igvAmount / lineData.quantity
        } else {
          lineData.unitPriceWithTax = lineData.unitPrice
        }

        console.log(`✅ Línea ${index + 1} procesada:`, {
          description: lineData.description,
          taxSchemeId: lineData.taxSchemeId,
          unitPrice: lineData.unitPrice,
          igvAmount: lineData.igvAmount,
        })

        return lineData
      })

      // Payment Terms
      const paymentTerms = Array.from(retentionElements)
        .filter((element) => {
          const paymentTermsId = element.querySelector("cbc\\:ID, ID")?.textContent?.trim()?.toLowerCase() || ""
          return !paymentTermsId.includes("retencion") && !paymentTermsId.includes("detraccion")
        })
        .map((element) => ({
          amount: getNumericValue("cbc\\:Amount", "Amount") || total / 2, // Default split payment
          dueDate: new Date(getElementText("cbc\\:PaymentDueDate", "PaymentDueDate") || dueDate),
          description: getElementText("cbc\\:Note", "Note") || "Pago según términos acordados",
        }))

      // Si no hay payment terms, crear uno por defecto
      if (paymentTerms.length === 0) {
        paymentTerms.push({
          amount: total,
          dueDate: new Date(dueDate),
          description: "Pago total",
        })
      }

      // Description from lines
      const description = lines.length > 0 ? lines.map((line) => line.description).join(", ") : "Documento electrónico"

      // Tags
      const baseWords = description
        .toLowerCase()
        .split(/\s+|,/)
        .filter((word) => word.length > 2)
      const tags = ["importado", "xml", documentType.toLowerCase(), ...baseWords.slice(0, 3)]
        .filter((tag, index, array) => tag.length > 2 && array.indexOf(tag) === index)
        .join(",")

      // Validations
      if (!documentId || !total) {
        throw new Error("Información insuficiente en el XML: falta ID del documento o monto")
      }

      // Generate hash
      const xmlHash = `${documentId}-${supplierId}-${total}`.replace(/\s/g, "")

      // PAYLOAD COMPLETO
      const documentPayload: CreateDocumentDto = {
        companyId,
        documentType,
        series,
        number,
        supplierId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        issueTime: issueTime || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        receptionDate: new Date(),
        currency,
        exchangeRate,
        subtotal,
        igv,
        otherTaxes,
        total,
        hasRetention,
        retentionAmount: hasRetention ? retentionAmount : 0,
        retentionPercentage: hasRetention ? retentionPercentage : 0,
        paymentMethod: null,
        description,
        observations: documentNotes.join("; ") || "Factura electrónica procesada automáticamente",
        tags,
        status: "PENDING",
        orderReference: null,
        contractNumber: null,
        additionalNotes: operationNotes.join("; ") || null,
        documentNotes: documentNotes.join("; ") || null,
        operationNotes: operationNotes.join("; ") || null,
        createdById: user?.id || "",
        lines,
        xmlData: {
          xmlFileName: fileName,
          xmlContent,
          xmlHash,
          xmlUblVersion,
          xmlCustomizationId,
          documentTypeDescription,
          sunatResponseCode: null,
          cdrStatus: null,
          sunatProcessDate: null,
          pdfFile: null,
          qrCode: qrCode || null,
          xmlAdditionalData: JSON.stringify({
            version: "1.0",
            importedAt: new Date().toISOString(),
            processingInfo: {
              linesCount: lines.length,
              hasRetention,
              hasDetraction,
              currency,
              exchangeRate,
            },
          }),
        },
        detraction: hasDetraction
          ? {
              hasDetraction: true,
              amount: detractionAmount,
              code: detractionCode,
              percentage: detractionPercentage,
              serviceCode: detractionServiceCode,
              account: detractionAccount || null,
              paymentDate: detractionPaymentDate,
              paymentReference: detractionPaymentReference || null,
            }
          : undefined,
        paymentTerms,
      }

      console.log("📤 PAYLOAD COMPLETO PARA CREAR DOCUMENTO:")
      console.log("=".repeat(80))
      console.log("📋 Información básica:")
      console.log("  - companyId:", companyId)
      console.log("  - documentType:", documentType)
      console.log("  - series:", series)
      console.log("  - number:", number)
      console.log("  - supplierId:", supplierId)
      console.log("💰 Montos:")
      console.log("  - subtotal:", subtotal)
      console.log("  - igv:", igv)
      console.log("  - total:", total)
      console.log("  - exchangeRate:", exchangeRate)
      console.log("🏷️ Retenciones:")
      console.log("  - hasRetention:", hasRetention)
      console.log("  - retentionAmount:", hasRetention ? retentionAmount : 0)
      console.log("  - retentionPercentage:", hasRetention ? retentionPercentage : 0, "(0-1 format)")
      console.log("💸 Detracciones:")
      console.log("  - hasDetraction:", hasDetraction)
      console.log("  - detractionAmount:", hasDetraction ? detractionAmount : 0)
      console.log("  - detractionPercentage:", hasDetraction ? detractionPercentage : 0, "(0-1 format)")
      console.log("  - detractionCode:", detractionCode)
      console.log("📄 Líneas del documento:", lines.length)
      lines.forEach((line, index) => {
        console.log(`  Línea ${index + 1}:`, {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          igvAmount: line.igvAmount,
          taxSchemeId: line.taxSchemeId,
          productCode: line.productCode,
        })
      })
      console.log("💳 Payment Terms:", paymentTerms.length)
      paymentTerms.forEach((term, index) => {
        console.log(`  Término ${index + 1}:`, {
          amount: term.amount,
          dueDate: term.dueDate,
          description: term.description,
        })
      })

      console.log("✅ Documento parseado correctamente con payload completo")
      return documentPayload
    } catch (error) {
      console.error("❌ Error parseando XML:", error)
      return null
    }
  }

  // Find or create supplier
  const findOrCreateSupplier = async (supplierData: SupplierData): Promise<string | null> => {
    console.log("🔍 Buscando o creando proveedor:", supplierData.documentNumber)

    try {
      // Try to find existing supplier
      console.log("📋 Buscando proveedor existente...")
      const existingSupplier = await getSupplierByDocument(companyId, supplierData.documentNumber)

      if (existingSupplier) {
        console.log("✅ Proveedor existente encontrado:", {
          id: existingSupplier.id,
          businessName: existingSupplier.businessName,
          documentNumber: existingSupplier.documentNumber,
        })
        return existingSupplier.id
      }

      // Create new supplier
      console.log("➕ Creando nuevo proveedor...")

      const getSupplierType = (documentType: string): SupplierType => {
        if (documentType === "RUC") return "COMPANY"
        if (documentType === "DNI") return "INDIVIDUAL"
        return "FOREIGN"
      }

      const newSupplierPayload: CreateSupplierDto = {
        companyId,
        businessName: supplierData.businessName,
        tradeName: supplierData.businessName,
        documentType: supplierData.documentType,
        documentNumber: supplierData.documentNumber,
        supplierType: getSupplierType(supplierData.documentType),
        email: supplierData.email,
        phone: supplierData.phone,
        address: supplierData.address,
        district: supplierData.district,
        province: supplierData.province,
        department: supplierData.department,
        country: "PE",
        status: "ACTIVE",
        creditLimit: 0,
        paymentTerms: 30,
        taxCategory: supplierData.documentType === "RUC" ? "Régimen General" : "Persona Natural",
        isRetentionAgent: false,
        retentionRate: null,
      }

      console.log("📤 Payload para crear proveedor:", JSON.stringify(newSupplierPayload, null, 2))

      const newSupplier = await createSupplier(newSupplierPayload)

      if (newSupplier) {
        console.log("✅ Proveedor creado exitosamente:", {
          id: newSupplier.id,
          businessName: newSupplier.businessName,
          documentNumber: newSupplier.documentNumber,
        })
        return newSupplier.id
      } else {
        console.error("❌ No se pudo crear el proveedor - createSupplier retornó null")
        return null
      }
    } catch (error) {
      console.error("❌ Error en findOrCreateSupplier:", error)
      return null
    }
  }

  // Process single file
  const processSingleFile = async (fileWithStatus: FileWithStatus, index: number): Promise<boolean> => {
    console.log(`\n🔄 Procesando archivo ${index + 1}: ${fileWithStatus.file.name}`)

    try {
      // Update status to processing
      setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, status: "processing", progress: 10 } : f)))

      // Read file content
      console.log("📖 Leyendo contenido del archivo...")
      const xmlContent = await fileWithStatus.file.text()
      console.log("✅ Archivo leído, tamaño:", xmlContent.length, "caracteres")

      // Update progress
      setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, progress: 30 } : f)))

      // Extract supplier information
      console.log("🔍 Extrayendo información del proveedor...")
      const supplierData = extractSupplierFromXML(xmlContent)

      if (!supplierData) {
        throw new Error("No se pudo extraer información del proveedor del XML")
      }

      // Update progress
      setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, progress: 50 } : f)))

      // Find or create supplier
      console.log("👤 Procesando proveedor...")
      const supplierId = await findOrCreateSupplier(supplierData)

      if (!supplierId) {
        throw new Error("No se pudo crear o encontrar el proveedor")
      }

      console.log("✅ Proveedor procesado, ID:", supplierId)

      // Update progress
      setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, progress: 70, supplierId } : f)))

      // Parse XML to document data
      console.log("📄 Parseando XML a datos de documento...")
      const documentData = parseXMLToDocument(xmlContent, fileWithStatus.file.name, supplierId)

      if (!documentData) {
        throw new Error("No se pudo parsear el XML a datos de documento")
      }

      // Update progress
      setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, progress: 90 } : f)))

      // Create document
      console.log("📄 Creando documento...")
      const createdDocument = await createDocument(documentData)

      if (createdDocument) {
        console.log("✅ Documento creado exitosamente:", {
          id: createdDocument.id,
          fullNumber: createdDocument.fullNumber,
          total: createdDocument.total,
          supplierId: createdDocument.supplierId,
        })

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === index
              ? {
                  ...f,
                  status: "success",
                  progress: 100,
                  documentId: createdDocument.id,
                }
              : f,
          ),
        )

        return true
      } else {
        throw new Error("createDocument retornó null")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      console.error(`❌ Error procesando archivo ${fileWithStatus.file.name}:`, error)

      // Update status to error
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === index
            ? {
                ...f,
                status: "error",
                progress: 100,
                error: errorMessage,
              }
            : f,
        ),
      )

      return false
    }
  }

  // Main import handler
  const handleImport = async () => {
    if (files.length === 0 || !user?.id || !company?.id) {
      console.warn("⚠️ No hay archivos para procesar, usuario no autenticado, o empresa no seleccionada")
      return
    }

    if (taxSchemes.length === 0) {
      console.error("❌ No hay tax schemes cargados")
      toast({
        title: "Error",
        description: "No se han cargado los esquemas tributarios. Intente recargar la página.",
        variant: "destructive",
      })
      return
    }

    console.log("\n🚀 Iniciando proceso de importación")
    console.log("📋 Archivos a procesar:", files.length)
    console.log("🏢 Empresa:", companyId)
    console.log(
      "🏷️ Tax schemes disponibles:",
      taxSchemes.map((ts) => `${ts.taxSchemeName} (${ts.taxSchemeId})`),
    )

    setProcessing(true)
    setOverallProgress(0)
    setPreviewXml(null) // Close preview during processing

    let successCount = 0
    let errorCount = 0
    let completedCount = 0

    const pendingFiles = files.filter((f) => f.status === "pending")
    console.log("📋 Archivos pendientes:", pendingFiles.length)

    for (let i = 0; i < files.length; i++) {
      const fileWithStatus = files[i]

      if (fileWithStatus.status !== "pending") {
        console.log(`⏭️ Saltando archivo ${i + 1} (estado: ${fileWithStatus.status})`)
        continue
      }

      const success = await processSingleFile(fileWithStatus, i)

      if (success) {
        successCount++
        console.log(`✅ Archivo ${i + 1} procesado exitosamente`)
      } else {
        errorCount++
        console.log(`❌ Error procesando archivo ${i + 1}`)
      }

      completedCount++
      const progress = Math.round((completedCount / pendingFiles.length) * 100)
      setOverallProgress(progress)
      console.log(`📊 Progreso general: ${progress}% (${completedCount}/${pendingFiles.length})`)
    }

    setProcessing(false)

    // Show summary
    console.log("\n📊 Resumen de importación:")
    console.log("✅ Exitosos:", successCount)
    console.log("❌ Errores:", errorCount)
    console.log("📋 Total procesados:", completedCount)

    if (successCount > 0) {
      toast({
        title: "Importación completada",
        description: `${successCount} documento(s) importado(s) exitosamente${errorCount > 0 ? `, ${errorCount} con errores` : ""}`,
      })

      // Call completion callback
      if (onImportComplete) {
        console.log("🔄 Ejecutando callback de finalización")
        onImportComplete()
      }
    } else if (errorCount > 0) {
      toast({
        title: "Error en importación",
        description: `No se pudo importar ningún documento. ${errorCount} archivo(s) con errores.`,
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: FileWithStatus["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "processing":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (file: FileWithStatus) => {
    switch (file.status) {
      case "pending":
        return "Pendiente"
      case "processing":
        return "Procesando..."
      case "success":
        return `Éxito - Doc: ${file.documentId?.substring(0, 8)}...`
      case "error":
        return `Error: ${file.error}`
    }
  }

  const canStartImport = files.length > 0 && files.some((f) => f.status === "pending") && !processing

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Documentos XML
            </DialogTitle>
            <DialogDescription>
              Selecciona archivos XML para importar documentos electrónicos. Los proveedores se crearán automáticamente
              si no existen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Left Panel - File Upload and List */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Upload Area */}
              <div
                ref={dropZoneRef}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragOver ? "Suelta los archivos aquí" : "Arrastra archivos XML aquí"}
                </p>
                <p className="text-sm text-gray-500 mb-4">o</p>
                <Button type="button" variant="outline" onClick={openFileDialog} disabled={processing}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Seleccionar archivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xml,text/xml,application/xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Tax Schemes Status */}
              {taxSchemesLoading && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Cargando esquemas tributarios...</AlertDescription>
                </Alert>
              )}

              {taxSchemes.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    ✅ {taxSchemes.length} esquemas tributarios cargados:{" "}
                    {taxSchemes.map((ts) => ts.taxSchemeName).join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              {taxSchemeError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error cargando esquemas tributarios: {taxSchemeError}</AlertDescription>
                </Alert>
              )}

              {/* Files List */}
              {files.length > 0 && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Archivos ({files.length})</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={clearAllFiles} disabled={processing}>
                      <X className="h-4 w-4" />
                      Limpiar
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto border rounded-lg">
                    <div className="divide-y">
                      {files.map((fileWithStatus, index) => (
                        <div key={index} className="p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getStatusIcon(fileWithStatus.status)}
                              <span className="text-sm font-medium truncate">{fileWithStatus.file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(fileWithStatus.file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePreview(index)}
                                disabled={processing}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                disabled={processing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 mb-1">{getStatusText(fileWithStatus)}</div>
                            {fileWithStatus.status === "processing" && (
                              <Progress value={fileWithStatus.progress} className="h-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Progress */}
              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso general</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleImport} disabled={!canStartImport}>
                  {processing
                    ? "Procesando..."
                    : `Importar ${files.filter((f) => f.status === "pending").length} archivo(s)`}
                </Button>
              </div>
            </div>

            {/* Right Panel - XML Preview */}
            {previewXml && (
              <div className="w-1/2 flex flex-col border-l pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Vista previa: {previewXml.fileName}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewXml(null)
                      setFiles((prev) => prev.map((f) => ({ ...f, preview: false })))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <pre className="text-xs bg-gray-50 p-3 rounded border h-full overflow-auto">{previewXml.content}</pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
