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
import type { Document } from "@/types/documents"
import { useAuthStore } from "@/stores/authStore"
import XMLVisualizer from "./xml-visualizer"

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

interface CreateSupplierPayload {
  companyId: string
  businessName: string
  tradeName: string
  documentType: "DNI" | "RUC"
  documentNumber: string
  supplierType: "PERSONA_NATURAL" | "PERSONA_JURIDICA" | "EXTRANJERO"
  email: string | null
  phone: string | null
  address: string | null
  district: string | null
  province: string | null
  department: string | null
  country: string
  status: "ACTIVE"
  creditLimit: number
  paymentTerms: number
  taxCategory: string
  isRetentionAgent: boolean
  retentionRate: number | null
}

// Tipo que coincide exactamente con lo que espera el store
type CreateDocumentPayload = Omit<Document, "id" | "createdAt" | "updatedAt">

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
  const { user } = useAuthStore()

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
    } else {
      console.log("🚀 Modal abierto - Iniciando importación XML")
      console.log("📋 Company ID:", companyId)
      console.log("👤 Usuario:", user?.id, user?.email)
    }
  }, [open, clearDocumentError, clearSupplierError, companyId, user])

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

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
    console.log("📁 Archivo arrastrado sobre la zona de drop")
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
      console.log("📁 Archivo salió de la zona de drop")
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
            // Ignore invalid selector errors
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
        "cac\\:AccountingSupplierParty cac\\:Party cac\\:PartyTaxScheme cac\\:RegistrationAddress cbc\\:ElectronicMail",
        "AccountingSupplierParty Party PartyTaxScheme RegistrationAddress ElectronicMail",
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

  // Parse XML to document data - ahora enviamos TODOS los campos tal como vienen del XML
  const parseXMLToDocument = (
    xmlContent: string,
    fileName: string,
    supplierId: string,
  ): CreateDocumentPayload | null => {
    console.log("🔍 Parseando XML a estructura de documento para API")

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
            // Ignore invalid selector errors
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

      let documentType: "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "RECIBO_HONORARIOS" = "FACTURA"
      let documentTypeDescription = "Factura Electrónica"

      if (invoiceTypeCode === "01") {
        documentType = "FACTURA"
        documentTypeDescription = "Factura Electrónica"
      } else if (invoiceTypeCode === "03") {
        documentType = "BOLETA"
        documentTypeDescription = "Boleta de Venta Electrónica"
      } else if (invoiceTypeCode === "07") {
        documentType = "NOTA_CREDITO"
        documentTypeDescription = "Nota de Crédito Electrónica"
      } else if (invoiceTypeCode === "08") {
        documentType = "NOTA_DEBITO"
        documentTypeDescription = "Nota de Débito Electrónica"
      } else if (fileName.toUpperCase().includes("RH") || fileName.toUpperCase().includes("RHE")) {
        documentType = "RECIBO_HONORARIOS"
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
            retentionPercentage = Number.parseFloat(percent) || 0
          }
        }
        if (paymentTermsId.includes("detraccion")) {
          const amount = element.querySelector("cbc\\:Amount, Amount")?.textContent?.trim()
          const code = element.querySelector("cbc\\:PaymentMeansID, PaymentMeansID")?.textContent?.trim()
          const percent = element.querySelector("cbc\\:PaymentPercent, PaymentPercent")?.textContent?.trim()
          if (amount) {
            detractionAmount = Number.parseFloat(amount) || 0
            hasDetraction = detractionAmount > 0
          }
          if (code) {
            detractionCode = code
          }
          if (percent) {
            detractionPercentage = Number.parseFloat(percent) || 0
          }
        }
      })

      // Calculate percentages if not found
      if (hasRetention && retentionPercentage === 0 && subtotal > 0) {
        retentionPercentage = (retentionAmount / subtotal) * 100
      }

      if (hasDetraction && detractionPercentage === 0 && total > 0) {
        detractionPercentage = (detractionAmount / total) * 100
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
            documentType = "RECIBO_HONORARIOS"
            documentTypeDescription = "Recibo por Honorarios Electrónico"

            // Extract retention amount and percentage
            const taxAmount = line.querySelector("cac\\:TaxTotal cbc\\:TaxAmount, TaxTotal TaxAmount")?.textContent
            const taxPercent = line.querySelector("cac\\:TaxCategory cbc\\:Percent, TaxCategory Percent")?.textContent

            if (taxAmount) {
              retentionAmount = Number.parseFloat(taxAmount) || 0
            }

            if (taxPercent) {
              retentionPercentage = Number.parseFloat(taxPercent) || 8
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

      // Document lines - incluir TODOS los campos, incluso lineNumber
      const lines: any[] = Array.from(lineElements).map((lineElement, index) => {
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

        return {
          // Incluir lineNumber del XML o generar uno
          lineNumber: index + 1,
          productCode:
            getLineText("cac\\:Item cbc\\:SellersItemIdentification cbc\\:ID") ||
            getLineText("Item SellersItemIdentification ID") ||
            `PROD${String(index + 1).padStart(3, "0")}`,
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
          unitCode:
            getLineAttribute("cbc\\:InvoicedQuantity", "unitCode") ||
            getLineAttribute("cbc\\:CreditedQuantity", "unitCode") ||
            getLineAttribute("cbc\\:DebitedQuantity", "unitCode") ||
            "NIU",
          unitPrice: getLineNumber("cac\\:Price cbc\\:PriceAmount") || getLineNumber("Price PriceAmount"),
          lineTotal: getLineNumber("cbc\\:LineExtensionAmount") || getLineNumber("LineExtensionAmount"),
          igvAmount:
            getLineNumber("cac\\:TaxTotal cbc\\:TaxAmount") || getLineNumber("TaxTotal TaxAmount") || undefined,
          taxPercentage:
            getLineNumber("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cbc\\:Percent") ||
            getLineNumber("TaxTotal TaxSubtotal TaxCategory Percent") ||
            undefined,
          taxCategoryId:
            getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cbc\\:ID") ||
            getLineText("TaxTotal TaxSubtotal TaxCategory ID") ||
            undefined,
          taxSchemeId:
            getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cac\\:TaxScheme cbc\\:ID") ||
            getLineText("TaxTotal TaxSubtotal TaxCategory TaxScheme ID") ||
            undefined,
          taxSchemeName:
            getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cac\\:TaxScheme cbc\\:Name") ||
            getLineText("TaxTotal TaxSubtotal TaxCategory TaxScheme Name") ||
            undefined,
          freeOfChargeIndicator:
            getLineText("cac\\:PricingReference cac\\:AlternativeConditionPrice cbc\\:PriceTypeCode") === "02" ||
            getLineText("PricingReference AlternativeConditionPrice PriceTypeCode") === "02" ||
            undefined,
          taxableAmount:
            getLineNumber("cac\\:TaxTotal cac\\:TaxSubtotal cbc\\:TaxableAmount") ||
            getLineNumber("TaxTotal TaxSubtotal TaxableAmount") ||
            undefined,
          allowanceIndicator: false,
          chargeIndicator: false,
          taxExemptionCode:
            getLineText("cac\\:TaxTotal cac\\:TaxSubtotal cac\\:TaxCategory cbc\\:TaxExemptionReasonCode") ||
            getLineText("TaxTotal TaxSubtotal TaxCategory TaxExemptionReasonCode") ||
            undefined,
        }
      })

      // Description from lines
      const description = lines.length > 0 ? lines.map((line) => line.description).join(", ") : "Documento electrónico"

      // Tags
      const baseWords = description
        .toLowerCase()
        .split(/\s+|,/)
        .filter((word) => word.length > 2)
      const tags = ["importado", "xml", documentType.toLowerCase(), ...baseWords.slice(0, 3)].filter(
        (tag, index, array) => tag.length > 2 && array.indexOf(tag) === index,
      )

      // Validations
      if (!documentId || !total) {
        throw new Error("Información insuficiente en el XML: falta ID del documento o monto")
      }

      // Calcular TODOS los campos que vienen del XML
      const fullNumber = `${series}-${number}`
      const netPayableAmount = total - (retentionAmount || 0) - (detractionAmount || 0)
      const conciliatedAmount = 0 // Inicialmente sin conciliar
      const pendingAmount = netPayableAmount // Todo está pendiente inicialmente

      // Generar hash del XML para detectar duplicados
      const xmlHash = `${documentId}-${supplierId}-${total}`.replace(/\s/g, "")

      const documentPayload: CreateDocumentPayload = {
        companyId,
        documentType,
        series,
        number,
        // INCLUIR todos los campos calculados del XML
        fullNumber,
        supplierId,
        issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        receptionDate: new Date().toISOString(),
        currency,
        exchangeRate,
        subtotal,
        igv,
        otherTaxes,
        total,
        hasRetention,
        retentionAmount: hasRetention ? retentionAmount : null,
        retentionPercentage: hasRetention ? retentionPercentage : null,
        hasDetraction,
        detractionAmount: hasDetraction ? detractionAmount : null,
        detractionCode: hasDetraction ? detractionCode : null,
        detractionPercentage: hasDetraction ? detractionPercentage : null,
        detractionServiceCode: hasDetraction ? detractionCode : null,
        // INCLUIR campos calculados
        netPayableAmount,
        conciliatedAmount,
        pendingAmount,
        description,
        observations: documentNotes.join("; ") || "Factura electrónica procesada automáticamente",
        tags,
        status: "PENDING",
        xmlFileName: fileName,
        xmlContent,
        xmlHash,
        xmlUblVersion,
        xmlCustomizationId,
        documentTypeDescription,
        // SUNAT fields - inicialmente null
        sunatResponseCode: null,
        cdrStatus: null,
        sunatProcessDate: null,
        pdfFile: null,
        qrCode,
        documentNotes,
        operationNotes,
        lines,
        createdById: user!.id,
        // updatedById inicialmente null
        updatedById: null,
      }

      console.log("✅ Documento parseado correctamente")
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

      // Create new supplier with exact API structure
      console.log("➕ Creando nuevo proveedor...")

      const getSupplierType = (documentType: string): "PERSONA_NATURAL" | "PERSONA_JURIDICA" | "EXTRANJERO" => {
        if (documentType === "RUC") return "PERSONA_JURIDICA"
        if (documentType === "DNI") return "PERSONA_NATURAL"
        return "EXTRANJERO"
      }

      const newSupplierPayload: CreateSupplierPayload = {
        companyId,
        businessName: supplierData.businessName,
        tradeName: supplierData.businessName,
        documentType: supplierData.documentType as "RUC" | "DNI",
        documentNumber: supplierData.documentNumber,
        supplierType: getSupplierType(supplierData.documentType),
        email: supplierData.email ?? null,
        phone: supplierData.phone ?? null,
        address: supplierData.address ?? null,
        district: supplierData.district ?? null,
        province: supplierData.province ?? null,
        department: supplierData.department ?? null,
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

      console.log(
        "📤 Payload para crear documento:",
        JSON.stringify(
          {
            ...documentData,
            xmlContent: `[XML Content - ${documentData.xmlContent?.length || 0} chars]`, // Truncate for readability
            lines: documentData.lines?.map((line) => ({ ...line })), // Remover el index que se agregaba para debugging
          },
          null,
          2,
        ),
      )

      // Update progress
      setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, progress: 90 } : f)))

      // Create document
      console.log("📄 Creando documento...")
      const createdDocument = await createDocument(documentData)

      if (createdDocument) {
        console.log("✅ Documento creado exitosamente:", {
          id: createdDocument.id,
          fullNumber: documentData.fullNumber,
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
    if (files.length === 0 || !user?.id) {
      console.warn("⚠️ No hay archivos para procesar o usuario no autenticado")
      return
    }

    console.log("\n🚀 Iniciando proceso de importación")
    console.log("📋 Archivos a procesar:", files.length)
    console.log("👤 Usuario:", user.id, user.email)
    console.log("🏢 Empresa:", companyId)

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

    // Show summary toast
    if (successCount > 0) {
      toast({
        title: "Importación completada",
        description: `${successCount} documento(s) importado(s) correctamente${
          errorCount > 0 ? `, ${errorCount} con errores` : ""
        }`,
        variant: successCount > 0 && errorCount === 0 ? "default" : "destructive",
      })

      if (onImportComplete) {
        console.log("🔄 Ejecutando callback de importación completada")
        setTimeout(() => {
          onImportComplete()

          if (errorCount === 0) {
            setTimeout(() => {
              console.log("🚪 Cerrando modal automáticamente")
              onOpenChange(false)
            }, 1000)
          }
        }, 500)
      }
    } else if (errorCount > 0) {
      toast({
        title: "Error en la importación",
        description: `No se pudo importar ningún documento. Revise los errores.`,
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    if (!processing) {
      console.log("🚪 Cerrando modal")
      onOpenChange(false)
    } else {
      console.log("⚠️ Intento de cerrar modal durante procesamiento")
      toast({
        title: "Procesamiento en progreso",
        description: "Espere a que termine el procesamiento antes de cerrar",
        variant: "default",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: FileWithStatus["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
      case "processing":
        return (
          <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
        )
      default:
        return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    }
  }

  const pendingFiles = files.filter((f) => f.status === "pending")
  const hasValidFiles = pendingFiles.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importar Documentos XML SUNAT
          </DialogTitle>
          <DialogDescription>
            Seleccione los archivos XML de facturas electrónicas para procesar e importar al sistema
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left Panel - File Management */}
          <div className="w-1/2 flex flex-col space-y-4">
            {/* File Input (Hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xml,text/xml,application/xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Upload Area */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={openFileDialog}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex flex-col items-center">
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                    isDragOver ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  }`}
                />
                {isDragOver ? (
                  <p className="text-primary font-medium">Suelta los archivos XML aquí...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      Arrastra archivos XML aquí o haz clic para seleccionar
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Formatos soportados: .xml (múltiples archivos permitidos)
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" type="button">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Seleccionar Archivos
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Overall Progress */}
            {processing && (
              <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Procesando archivos...</span>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="w-full h-2" />
              </div>
            )}

            {/* Files List */}
            {files.length > 0 && (
              <div className="space-y-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    Archivos seleccionados ({files.length})
                  </h4>
                  {!processing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFiles}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpiar todo
                    </Button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {files.map((fileWithStatus, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border shadow-sm transition-colors ${
                        fileWithStatus.preview
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(fileWithStatus.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                            {fileWithStatus.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(fileWithStatus.file.size)}
                            {fileWithStatus.documentId && (
                              <span className="ml-2 text-green-600">• Doc: {fileWithStatus.documentId}</span>
                            )}
                            {fileWithStatus.supplierId && (
                              <span className="ml-2 text-blue-600">• Sup: {fileWithStatus.supplierId}</span>
                            )}
                          </p>
                          {fileWithStatus.status === "processing" && (
                            <div className="mt-2">
                              <Progress value={fileWithStatus.progress} className="h-1" />
                            </div>
                          )}
                          {fileWithStatus.error && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{fileWithStatus.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {fileWithStatus.status === "pending" && !processing && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePreview(index)}
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Alert */}
            <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Los archivos XML serán procesados enviando TODA la información extraída del XML al backend. El backend
                guardará los datos tal como vienen, minimizando los cálculos. Use el botón de vista previa para revisar
                el contenido antes de procesar.
              </AlertDescription>
            </Alert>
          </div>

          {/* Right Panel - XML Preview */}
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 pl-4">
            {previewXml ? (
              <div className="h-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">Vista previa: {previewXml.fileName}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewXml(null)
                      setFiles((prev) => prev.map((f) => ({ ...f, preview: false })))
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <XMLVisualizer xmlContent={previewXml.content} fileName={previewXml.fileName} />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Vista previa XML</p>
                  <p className="text-sm">
                    Selecciona un archivo y haz clic en el ícono de vista previa para ver su contenido
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!hasValidFiles || processing} className="min-w-24" variant="default">
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </div>
            ) : (
              `Procesar ${pendingFiles.length} archivo${pendingFiles.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
