import { DocumentLine, DocumentType } from "@/types/documents"

export interface ParsedXMLDocument {
  companyId: string
  documentType: DocumentType
  series: string
  number: string
  fullNumber: string
  supplierId: string
  issueDate: string
  dueDate: string | null
  receptionDate: string | null
  currency: string
  exchangeRate: number | null
  subtotal: number
  igv: number
  otherTaxes: number | null
  total: number
  hasRetention: boolean
  retentionAmount: number | null
  retentionPercentage: number | null
  hasDetraction: boolean
  detractionAmount: number | null
  detractionCode: string | null
  detractionPercentage: number | null
  detractionServiceCode: string | null
  netPayableAmount: number
  conciliatedAmount: number
  pendingAmount: number
  description: string | null
  observations: string | null
  tags: string[]
  status: "PENDING"
  xmlFileName: string | null
  xmlContent: string | null
  xmlHash: string | null
  xmlUblVersion: string | null
  xmlCustomizationId: string | null
  documentTypeDescription: string | null
  qrCode: string | null
  documentNotes: string[]
  operationNotes: string[]
  sunatResponseCode: string | null
  cdrStatus: string | null
  sunatProcessDate: string | null
  pdfFile: string | null
  lines: Omit<DocumentLine, "id" | "documentId" | "document" | "createdAt" | "updatedAt">[]
  createdById: string
  updatedById: string | null
  supplier: {
    businessName: string
    documentNumber: string
    documentType: string
    email?: string | null
    phone?: string | null
    address?: string | null
    district?: string | null
    province?: string | null
    department?: string | null
  }
}

// Función auxiliar para extraer texto de cualquier valor, incluso objetos complejos
function extractTextValue(value: any): string {
  if (!value) return ""
  if (typeof value === "object") {
    return value._ || value._text || ""
  }
  return String(value)
}

// Función auxiliar para extraer valores monetarios
function extractMonetaryValue(value: any): number {
  if (!value) return 0
  if (typeof value === "object") {
    const textValue = value._ || value._text || "0"
    return Number.parseFloat(textValue) || 0
  }
  return Number.parseFloat(String(value)) || 0
}

// Función auxiliar para obtener valores anidados de manera segura
function getNestedValue(obj: any, path: string): any {
  const keys = path.split(".")
  let current = obj

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined
    }
    current = current[key]
  }

  return current
}

/**
 * Simula xml2js parsing usando DOMParser con la misma lógica
 */
function simulateXml2jsStructure(xmlContent: string): any {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

    // Verificar errores de parsing
    const parseError = xmlDoc.querySelector("parsererror")
    if (parseError) {
      throw new Error("XML mal formado")
    }

    const invoiceElement = xmlDoc.documentElement
    if (!invoiceElement || invoiceElement.tagName !== "Invoice") {
      throw new Error("No es un documento Invoice válido")
    }

    // Convertir DOM a estructura similar a xml2js
    function domToObject(element: Element): any {
      const obj: any = {}

      // Agregar atributos
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        let attrName = attr.name
        if (attrName.startsWith("xmlns:")) {
          attrName = attrName.replace("xmlns:", "xmlns_")
        }
        obj[attrName] = attr.value
      }

      // Procesar elementos hijos
      const children = element.children
      if (children.length === 0) {
        // Es un elemento de texto
        const textContent = element.textContent?.trim()
        if (textContent) {
          if (Object.keys(obj).length > 0) {
            obj._ = textContent
          } else {
            return textContent
          }
        }
        return Object.keys(obj).length > 0 ? obj : textContent || ""
      }

      // Procesar elementos hijos
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        let tagName = child.tagName

        // Remover prefijos de namespace como hace xml2js
        if (tagName.startsWith("cbc:")) {
          tagName = tagName.replace("cbc:", "")
        } else if (tagName.startsWith("cac:")) {
          tagName = tagName.replace("cac:", "")
        }

        const childObj = domToObject(child)

        if (obj[tagName]) {
          // Si ya existe, convertir a array
          if (!Array.isArray(obj[tagName])) {
            obj[tagName] = [obj[tagName]]
          }
          obj[tagName].push(childObj)
        } else {
          obj[tagName] = childObj
        }
      }

      return obj
    }

    const invoiceObj = domToObject(invoiceElement)
    return { Invoice: invoiceObj }
  } catch (error) {
    console.error("Error simulando xml2js:", error)
    throw error
  }
}

/**
 * Versión mejorada del parser XML que integra la lógica de xml2js
 */
export function parseXMLToCreateDocumentBodyImproved(
  xmlContent: string,
  fileName: string,
  companyId: string,
  supplierId: string,
  userId: string,
): ParsedXMLDocument | null {
  try {
    // Simular la estructura de xml2js usando DOMParser
    const parsedData = simulateXml2jsStructure(xmlContent)

    if (!parsedData.Invoice) {
      throw new Error("Formato de documento no reconocido - no es una factura UBL")
    }

    const invoice = parsedData.Invoice

    // ========== INFORMACIÓN BÁSICA DEL DOCUMENTO ==========
    const documentId = extractTextValue(invoice.ID)
    const issueDate = extractTextValue(invoice.IssueDate)
    const dueDate = extractTextValue(invoice.DueDate)
    const currency = extractTextValue(invoice.DocumentCurrencyCode) || "PEN"
    const exchangeRate = extractMonetaryValue(invoice.SourceCurrencyBaseRate)

    // ========== DETECCIÓN DEL TIPO DE DOCUMENTO (LÓGICA DE TU CÓDIGO) ==========
    const invoiceTypeCode = extractTextValue(invoice.InvoiceTypeCode)
    let documentType: DocumentType = "INVOICE"
    let documentTypeDescription = "Factura Electrónica"
    let hasRetencion = false

    // Extraer información del emisor para determinar tipo de entidad
    const emisorNumeroDocumento = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.CustomerAssignedAccountID") || "",
    )
    const emisorTipoEntidad = emisorNumeroDocumento.length === 8 ? "NATURAL" : "JURIDICA"

    // Extraer información del receptor
    const receptorNumeroDocumento = extractTextValue(
      getNestedValue(invoice, "AccountingCustomerParty.CustomerAssignedAccountID") || "",
    )
    const receptorTipoEntidad = receptorNumeroDocumento.length === 8 ? "NATURAL" : "JURIDICA"

    // Verificar si tiene retención de 4ta categoría (indicativo de recibo por honorarios)
    if (invoice.InvoiceLine) {
      const lines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]
      for (const line of lines) {
        if (line.TaxTotal && line.TaxTotal.TaxSubtotal) {
          const taxSubtotal = Array.isArray(line.TaxTotal.TaxSubtotal)
            ? line.TaxTotal.TaxSubtotal[0]
            : line.TaxTotal.TaxSubtotal
          if (taxSubtotal && taxSubtotal.TaxCategory) {
            const taxCategoryId = extractTextValue(taxSubtotal.TaxCategory.ID)
            if (taxCategoryId === "RET 4TA") {
              hasRetencion = true
              documentType = "RECEIPT"
              documentTypeDescription = "Recibo por Honorarios Electrónico"
              break
            }
          }
        }
      }
    }

    // Si es persona natural emitiendo, probablemente sea recibo por honorarios
    if (emisorTipoEntidad === "NATURAL" && receptorTipoEntidad === "JURIDICA") {
      documentType = "RECEIPT"
      documentTypeDescription = "Recibo por Honorarios Electrónico"
    }

    // Determinar por código de tipo de documento
    if (invoiceTypeCode === "01") {
      documentType = "INVOICE"
      documentTypeDescription = "Factura Electrónica"
    } else if (invoiceTypeCode === "03") {
      documentType = "PURCHASE_ORDER"
      documentTypeDescription = "Boleta de Venta Electrónica"
    } else if (invoiceTypeCode === "07") {
      documentType = "CREDIT_NOTE"
      documentTypeDescription = "Nota de Crédito Electrónica"
    } else if (invoiceTypeCode === "08") {
      documentType = "DEBIT_NOTE"
      documentTypeDescription = "Nota de Débito Electrónica"
    }

    // Versiones UBL
    const xmlUblVersion = extractTextValue(invoice.UBLVersionID) || "2.1"
    const xmlCustomizationId = extractTextValue(invoice.CustomizationID) || "2.0"

    // ========== EXTRAER SERIE Y NÚMERO ==========
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

    const fullNumber = `${series}-${number}`

    // ========== INFORMACIÓN DEL PROVEEDOR ==========
    const supplierRuc = emisorNumeroDocumento
    const supplierName = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.Party.PartyLegalEntity.RegistrationName") ||
        getNestedValue(invoice, "AccountingSupplierParty.Party.PartyName.Name"),
    )

    const supplierDocumentType = supplierRuc && supplierRuc.length === 11 ? "6" : "1"

    const supplierAddress = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.Party.PostalAddress.StreetName"),
    )

    const supplierDistrict = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.Party.PostalAddress.CitySubdivisionName") ||
        getNestedValue(invoice, "AccountingSupplierParty.Party.PostalAddress.District"),
    )

    const supplierProvince = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.Party.PostalAddress.CountrySubentity") ||
        getNestedValue(invoice, "AccountingSupplierParty.Party.PostalAddress.CityName"),
    )

    const supplierDepartment = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.Party.PostalAddress.CountrySubentity"),
    )

    const supplierEmail = extractTextValue(
      getNestedValue(invoice, "AccountingSupplierParty.Party.Contact.ElectronicMail"),
    )

    const supplierPhone = extractTextValue(getNestedValue(invoice, "AccountingSupplierParty.Party.Contact.Telephone"))

    // ========== MONTOS Y TOTALES ==========
    const lineExtensionAmount = extractMonetaryValue(getNestedValue(invoice, "LegalMonetaryTotal.LineExtensionAmount"))
    const taxAmount = extractMonetaryValue(getNestedValue(invoice, "TaxTotal.TaxAmount"))
    const payableAmount = extractMonetaryValue(getNestedValue(invoice, "LegalMonetaryTotal.PayableAmount"))
    const allowanceTotalAmount = extractMonetaryValue(
      getNestedValue(invoice, "LegalMonetaryTotal.AllowanceTotalAmount"),
    )

    // ========== RETENCIONES Y DETRACCIONES (LÓGICA DE TU CÓDIGO) ==========
    let retentionAmount = 0
    let hasRetention = false
    let retentionPercentage = 0
    let detractionAmount = 0
    let detractionCode = ""
    let detractionPercentage = 0
    let hasDetraction = false

    // Extraer información de detracción (solo para facturas)
    if (documentType === "INVOICE" && invoice.PaymentTerms) {
      const detractionTerms = Array.isArray(invoice.PaymentTerms)
        ? invoice.PaymentTerms.find((pt: any) => {
            const ptID = typeof pt.ID === "object" ? pt.ID._ || pt.ID._text : pt.ID
            return ptID === "Detraccion"
          })
        : typeof invoice.PaymentTerms.ID === "object"
          ? (invoice.PaymentTerms.ID._ || invoice.PaymentTerms.ID._text) === "Detraccion"
            ? invoice.PaymentTerms
            : null
          : invoice.PaymentTerms.ID === "Detraccion"
            ? invoice.PaymentTerms
            : null

      if (detractionTerms) {
        detractionAmount = extractMonetaryValue(detractionTerms.Amount)
        detractionCode = extractTextValue(detractionTerms.PaymentMeansID)
        detractionPercentage = extractMonetaryValue(detractionTerms.PaymentPercent)
        hasDetraction = detractionAmount > 0
      }
    }

    // Extraer información de retención (para recibos por honorarios)
    if (documentType === "RECEIPT" && invoice.InvoiceLine) {
      const lines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]
      for (const line of lines) {
        if (line.TaxTotal && line.TaxTotal.TaxSubtotal) {
          const taxSubtotal = Array.isArray(line.TaxTotal.TaxSubtotal)
            ? line.TaxTotal.TaxSubtotal[0]
            : line.TaxTotal.TaxSubtotal
          if (taxSubtotal && taxSubtotal.TaxCategory) {
            const taxCategoryId = extractTextValue(taxSubtotal.TaxCategory.ID)
            if (taxCategoryId === "RET 4TA") {
              retentionAmount = extractMonetaryValue(taxSubtotal.TaxAmount)
              retentionPercentage = extractMonetaryValue(taxSubtotal.Percent) || 8
              hasRetention = retentionAmount > 0
              break
            }
          }
        }
      }
    }

    // ========== CÓDIGO QR Y NOTAS (LÓGICA DE TU CÓDIGO) ==========
    let qrCode = ""
    const documentNotes: string[] = []
    const operationNotes: string[] = []

    if (invoice.Note) {
      const notes = Array.isArray(invoice.Note) ? invoice.Note : [invoice.Note]

      for (const note of notes) {
        const noteText = extractTextValue(note)
        const noteLocaleID = typeof note === "object" ? note.languageLocaleID : undefined

        if (noteText) {
          // QR codes suelen contener "|" o ser muy largos
          if (noteText.includes("|") || noteText.length > 100) {
            qrCode = noteText
          } else {
            // Clasificar notas por contenido y locale (tu lógica)
            if (noteLocaleID === "1000") {
              documentNotes.push(noteText)
            } else if (noteLocaleID === "2006") {
              operationNotes.push(noteText)
            } else if (!noteLocaleID && documentNotes.length === 0) {
              documentNotes.push(noteText)
            } else {
              const lowerText = noteText.toLowerCase()
              if (
                lowerText.includes("detracción") ||
                lowerText.includes("retencion") ||
                lowerText.includes("operación") ||
                lowerText.includes("sujeta")
              ) {
                operationNotes.push(noteText)
              } else {
                documentNotes.push(noteText)
              }
            }
          }
        }
      }
    }

    // ========== LÍNEAS DEL DOCUMENTO ==========
    const lines: any[] = []

    if (invoice.InvoiceLine) {
      const invoiceLines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]

      for (let index = 0; index < invoiceLines.length; index++) {
        const line = invoiceLines[index]

        const lineData = {
          lineNumber: index + 1,
          productCode:
            extractTextValue(getNestedValue(line, "Item.SellersItemIdentification.ID")) ||
            `PROD${String(index + 1).padStart(3, "0")}`,
          description: extractTextValue(getNestedValue(line, "Item.Description")) || "Producto/Servicio",
          quantity: extractMonetaryValue(line.InvoicedQuantity) || 1,
          unitCode: (typeof line.InvoicedQuantity === "object" ? line.InvoicedQuantity.unitCode : null) || "NIU",
          unitPrice: extractMonetaryValue(getNestedValue(line, "Price.PriceAmount")),
          lineTotal: extractMonetaryValue(line.LineExtensionAmount),
          igvAmount: extractMonetaryValue(getNestedValue(line, "TaxTotal.TaxAmount")) || undefined,
          taxPercentage:
            extractMonetaryValue(getNestedValue(line, "TaxTotal.TaxSubtotal.TaxCategory.Percent")) || undefined,
          taxCategoryId: extractTextValue(getNestedValue(line, "TaxTotal.TaxSubtotal.TaxCategory.ID")) || undefined,
          taxSchemeId:
            extractTextValue(getNestedValue(line, "TaxTotal.TaxSubtotal.TaxCategory.TaxScheme.ID")) || undefined,
          taxSchemeName:
            extractTextValue(getNestedValue(line, "TaxTotal.TaxSubtotal.TaxCategory.TaxScheme.Name")) || undefined,
          freeOfChargeIndicator:
            extractTextValue(getNestedValue(line, "PricingReference.AlternativeConditionPrice.PriceTypeCode")) ===
              "02" || undefined,
          taxableAmount: extractMonetaryValue(getNestedValue(line, "TaxTotal.TaxSubtotal.TaxableAmount")) || undefined,
          allowanceIndicator: false,
          chargeIndicator: false,
          taxExemptionCode:
            extractTextValue(getNestedValue(line, "TaxTotal.TaxSubtotal.TaxCategory.TaxExemptionReasonCode")) ||
            undefined,
        }

        lines.push(lineData)
      }
    }

    // ========== DESCRIPCIÓN Y CÁLCULOS FINALES ==========
    const description = lines.length > 0 ? lines.map((line) => line.description).join(", ") : "Documento electrónico"

    const netPayableAmount = Math.max(0, payableAmount - retentionAmount - detractionAmount)
    const conciliatedAmount = 0
    const pendingAmount = netPayableAmount

    // ========== TAGS ==========
    const baseWords = description
      .toLowerCase()
      .split(/\s+|,/)
      .filter((word) => word.length > 2)
    const tags = ["importado", "xml", documentType.toLowerCase(), ...baseWords.slice(0, 3)].filter(
      (tag, index, array) => tag.length > 2 && array.indexOf(tag) === index,
    )

    // ========== VALIDACIONES ==========
    if (!documentId || documentId.trim() === "") {
      throw new Error("No se encontró el ID del documento en el XML")
    }

    if (!supplierName || supplierName.trim() === "") {
      throw new Error("No se encontró el nombre del proveedor en el XML")
    }

    if (!supplierRuc || supplierRuc.trim() === "") {
      throw new Error("No se encontró el RUC del proveedor en el XML")
    }

    // ========== PARSEO DE FECHAS ==========
    const parseDate = (dateString: string): string => {
      if (!dateString) return new Date().toISOString()

      try {
        const parsedDate = new Date(dateString)
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Fecha inválida: ${dateString}, usando fecha actual`)
          return new Date().toISOString()
        }
        return parsedDate.toISOString()
      } catch (error) {
        console.warn(`Error parseando fecha: ${dateString}, usando fecha actual`)
        return new Date().toISOString()
      }
    }

    // ========== HASH DEL XML ==========
    const xmlHash = `${documentId}-${supplierRuc}-${payableAmount}`.replace(/\s/g, "")

    // ========== RETORNO DEL OBJETO COMPLETO ==========
    return {
      companyId,
      documentType,
      series,
      number,
      fullNumber,
      supplierId,
      issueDate: parseDate(issueDate),
      dueDate: dueDate ? parseDate(dueDate) : null,
      receptionDate: new Date().toISOString(),
      currency,
      exchangeRate: exchangeRate || null,
      subtotal: lineExtensionAmount,
      igv: taxAmount,
      otherTaxes: allowanceTotalAmount || null,
      total: payableAmount,
      hasRetention,
      retentionAmount: hasRetention ? retentionAmount : null,
      retentionPercentage: hasRetention ? retentionPercentage : null,
      hasDetraction,
      detractionAmount: hasDetraction ? detractionAmount : null,
      detractionCode: hasDetraction ? detractionCode : null,
      detractionPercentage: hasDetraction ? detractionPercentage : null,
      detractionServiceCode: hasDetraction ? detractionCode : null,
      netPayableAmount,
      conciliatedAmount,
      pendingAmount,
      description,
      observations: documentNotes.join("; ") || "Factura electrónica procesada automáticamente",
      tags,
      status: "PENDING",
      xmlFileName: fileName,
      xmlContent: xmlContent,
      xmlHash,
      xmlUblVersion,
      xmlCustomizationId,
      documentTypeDescription,
      qrCode: qrCode || null,
      documentNotes,
      operationNotes,
      sunatResponseCode: null,
      cdrStatus: null,
      sunatProcessDate: null,
      pdfFile: null,
      lines,
      createdById: userId,
      updatedById: null,
      supplier: {
        businessName: supplierName,
        documentNumber: supplierRuc,
        documentType: supplierDocumentType,
        email: supplierEmail || null,
        phone: supplierPhone || null,
        address: supplierAddress || null,
        district: supplierDistrict || null,
        province: supplierProvince || null,
        department: supplierDepartment || null,
      },
    }
  } catch (error) {
    console.error("Error parsing XML:", error)
    return null
  }
}

// Función de fallback usando DOMParser (código anterior)
function parseWithDOMParser(
  xmlContent: string,
  fileName: string,
  companyId: string,
  supplierId: string,
  userId: string,
): ParsedXMLDocument | null {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

    const invoiceNode = xmlDoc.getElementsByTagName("Invoice")[0]

    if (!invoiceNode) {
      console.error("Formato de documento no reconocido - no es una factura UBL")
      return null
    }

    // ========== INFORMACIÓN BÁSICA DEL DOCUMENTO ==========
    const documentId = invoiceNode.getElementsByTagName("ID")[0]?.textContent || ""
    const issueDate = invoiceNode.getElementsByTagName("IssueDate")[0]?.textContent || ""
    const dueDate = invoiceNode.getElementsByTagName("DueDate")[0]?.textContent || null
    const currency = invoiceNode.getElementsByTagName("DocumentCurrencyCode")[0]?.textContent || "PEN"
    const exchangeRateText = invoiceNode.getElementsByTagName("SourceCurrencyBaseRate")[0]?.textContent
    const exchangeRate = exchangeRateText ? Number.parseFloat(exchangeRateText) : null

    // ========== DETECCIÓN DEL TIPO DE DOCUMENTO ==========
    const invoiceTypeCode = invoiceNode.getElementsByTagName("InvoiceTypeCode")[0]?.textContent || ""
    let documentType: DocumentType = "INVOICE"
    let documentTypeDescription = "Factura Electrónica"

    // Determinar tipo de documento
    if (fileName.toUpperCase().includes("RH") || fileName.toUpperCase().includes("RHE")) {
      documentType = "RECEIPT"
      documentTypeDescription = "Recibo por Honorarios Electrónico"
    } else if (invoiceTypeCode === "01") {
      documentType = "INVOICE"
      documentTypeDescription = "Factura Electrónica"
    } else if (invoiceTypeCode === "03") {
      documentType = "PURCHASE_ORDER"
      documentTypeDescription = "Boleta de Venta Electrónica"
    } else if (invoiceTypeCode === "07") {
      documentType = "CREDIT_NOTE"
      documentTypeDescription = "Nota de Crédito Electrónica"
    } else if (invoiceTypeCode === "08") {
      documentType = "DEBIT_NOTE"
      documentTypeDescription = "Nota de Débito Electrónica"
    }

    // Versiones UBL
    const xmlUblVersion = invoiceNode.getElementsByTagName("UBLVersionID")[0]?.textContent || "2.1"
    const xmlCustomizationId = invoiceNode.getElementsByTagName("CustomizationID")[0]?.textContent || "2.0"

    // ========== EXTRAER SERIE Y NÚMERO ==========
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

    const fullNumber = `${series}-${number}`

    // ========== INFORMACIÓN DEL PROVEEDOR ==========
    const accountingSupplierPartyNode = invoiceNode.getElementsByTagName("AccountingSupplierParty")[0]
    const partyNode = accountingSupplierPartyNode?.getElementsByTagName("Party")[0]
    const partyLegalEntityNode = partyNode?.getElementsByTagName("PartyLegalEntity")[0]
    const registrationName = partyLegalEntityNode?.getElementsByTagName("RegistrationName")[0]?.textContent
    const partyNameNode = accountingSupplierPartyNode?.getElementsByTagName("PartyName")[0]
    const nameNode = partyNameNode?.getElementsByTagName("Name")[0]?.textContent

    const supplierRuc =
      accountingSupplierPartyNode?.getElementsByTagName("CustomerAssignedAccountID")[0]?.textContent ||
      partyNode?.getElementsByTagName("PartyIdentification")[0]?.getElementsByTagName("ID")[0]?.textContent ||
      ""

    const supplierName = registrationName || nameNode || ""

    const supplierDocumentType = supplierRuc && supplierRuc.length === 11 ? "6" : "1"

    const postalAddressNode = partyNode?.getElementsByTagName("PostalAddress")[0]
    const supplierAddress = postalAddressNode?.getElementsByTagName("StreetName")[0]?.textContent || ""
    const supplierDistrict = postalAddressNode?.getElementsByTagName("CitySubdivisionName")[0]?.textContent || ""
    const supplierProvince = postalAddressNode?.getElementsByTagName("CountrySubentity")[0]?.textContent || ""
    const supplierDepartment = postalAddressNode?.getElementsByTagName("CountrySubentity")[0]?.textContent || ""

    const contactNode = partyNode?.getElementsByTagName("Contact")[0]
    const supplierEmail = contactNode?.getElementsByTagName("ElectronicMail")[0]?.textContent || ""
    const supplierPhone = contactNode?.getElementsByTagName("Telephone")[0]?.textContent || ""

    // ========== MONTOS Y TOTALES ==========
    const legalMonetaryTotalNode = invoiceNode.getElementsByTagName("LegalMonetaryTotal")[0]
    const lineExtensionAmountText = legalMonetaryTotalNode?.getElementsByTagName("LineExtensionAmount")[0]?.textContent
    const lineExtensionAmount = lineExtensionAmountText ? Number.parseFloat(lineExtensionAmountText) : 0

    const taxTotalNode = invoiceNode.getElementsByTagName("TaxTotal")[0]
    const taxAmountText = taxTotalNode?.getElementsByTagName("TaxAmount")[0]?.textContent
    const taxAmount = taxAmountText ? Number.parseFloat(taxAmountText) : 0

    const payableAmountText = legalMonetaryTotalNode?.getElementsByTagName("PayableAmount")[0]?.textContent
    const payableAmount = payableAmountText ? Number.parseFloat(payableAmountText) : 0

    const allowanceTotalAmountText =
      legalMonetaryTotalNode?.getElementsByTagName("AllowanceTotalAmount")[0]?.textContent
    const allowanceTotalAmount = allowanceTotalAmountText ? Number.parseFloat(allowanceTotalAmountText) : null

    // ========== RETENCIONES Y DETRACCIONES ==========
    let retentionAmount = 0
    let hasRetention = false
    let retentionPercentage = 0
    let detractionAmount = 0
    let detractionCode = ""
    let detractionPercentage = 0
    let hasDetraction = false

    // Buscar detracciones en PaymentTerms
    const paymentTermsNodes = invoiceNode.getElementsByTagName("PaymentTerms")
    for (let i = 0; i < paymentTermsNodes.length; i++) {
      const paymentTermNode = paymentTermsNodes[i]
      const paymentTermId = paymentTermNode.getElementsByTagName("ID")[0]?.textContent?.toLowerCase()

      if (paymentTermId === "detraccion") {
        const amountText = paymentTermNode.getElementsByTagName("Amount")[0]?.textContent
        detractionAmount = amountText ? Number.parseFloat(amountText) : 0
        detractionCode = paymentTermNode.getElementsByTagName("PaymentMeansID")[0]?.textContent || ""
        const percentText = paymentTermNode.getElementsByTagName("PaymentPercent")[0]?.textContent
        detractionPercentage = percentText ? Number.parseFloat(percentText) : 0
        hasDetraction = detractionAmount > 0
      }

      if (paymentTermId === "retencion") {
        const amountText = paymentTermNode.getElementsByTagName("Amount")[0]?.textContent
        retentionAmount = amountText ? Number.parseFloat(amountText) : 0
        const percentText = paymentTermNode.getElementsByTagName("PaymentPercent")[0]?.textContent
        retentionPercentage = percentText ? Number.parseFloat(percentText) : 0
        hasRetention = retentionAmount > 0
      }
    }

    // ========== CÓDIGO QR Y NOTAS ==========
    let qrCode = ""
    const documentNotes: string[] = []
    const operationNotes: string[] = []

    const noteNodes = invoiceNode.getElementsByTagName("Note")
    for (let i = 0; i < noteNodes.length; i++) {
      const noteNode = noteNodes[i]
      const noteText = noteNode.textContent || ""
      const noteLocaleID = noteNode.getAttribute("languageLocaleID")

      if (noteText) {
        // QR codes suelen contener "|" o ser muy largos
        if (noteText.includes("|") || noteText.length > 100) {
          qrCode = noteText
        } else {
          // Clasificar notas por contenido y locale
          const lowerText = noteText.toLowerCase()
          if (
            noteLocaleID === "2006" ||
            lowerText.includes("detracción") ||
            lowerText.includes("retencion") ||
            lowerText.includes("operación") ||
            lowerText.includes("sujeta")
          ) {
            operationNotes.push(noteText)
          } else {
            documentNotes.push(noteText)
          }
        }
      }
    }

    // ========== LÍNEAS DEL DOCUMENTO ==========
    const lines: any[] = []
    const invoiceLineNodes = invoiceNode.getElementsByTagName("InvoiceLine")

    for (let index = 0; index < invoiceLineNodes.length; index++) {
      const lineNode = invoiceLineNodes[index]

      const itemNode = lineNode.getElementsByTagName("Item")[0]
      const sellersItemIdentificationNode = itemNode?.getElementsByTagName("SellersItemIdentification")[0]
      const descriptionNode = itemNode?.getElementsByTagName("Description")[0]
      const invoicedQuantityNode = lineNode.getElementsByTagName("InvoicedQuantity")[0]
      const priceNode = lineNode.getElementsByTagName("Price")[0]
      const priceAmountNode = priceNode?.getElementsByTagName("PriceAmount")[0]
      const lineExtensionAmountNode = lineNode.getElementsByTagName("LineExtensionAmount")[0]
      const taxTotalNodeLine = lineNode.getElementsByTagName("TaxTotal")[0]
      const taxAmountNodeLine = taxTotalNodeLine?.getElementsByTagName("TaxAmount")[0]
      const taxSubtotalNodeLine = taxTotalNodeLine?.getElementsByTagName("TaxSubtotal")[0]
      const taxCategoryNodeLine = taxSubtotalNodeLine?.getElementsByTagName("TaxCategory")[0]
      const taxSchemeNodeLine = taxCategoryNodeLine?.getElementsByTagName("TaxScheme")[0]

      const lineData = {
        lineNumber: index + 1,
        productCode:
          sellersItemIdentificationNode?.getElementsByTagName("ID")[0]?.textContent ||
          `PROD${String(index + 1).padStart(3, "0")}`,
        description: descriptionNode?.textContent || "Producto/Servicio",
        quantity: Number.parseFloat(invoicedQuantityNode?.textContent || "1") || 1,
        unitCode: invoicedQuantityNode?.getAttribute("unitCode") || "NIU",
        unitPrice: Number.parseFloat(priceAmountNode?.textContent || "0") || 0,
        lineTotal: Number.parseFloat(lineExtensionAmountNode?.textContent || "0") || 0,
        igvAmount: Number.parseFloat(taxAmountNodeLine?.textContent || "0") || undefined,
        taxPercentage:
          Number.parseFloat(taxCategoryNodeLine?.getElementsByTagName("Percent")[0]?.textContent || "0") || undefined,
        taxCategoryId: taxCategoryNodeLine?.getElementsByTagName("ID")[0]?.textContent || undefined,
        taxSchemeId: taxSchemeNodeLine?.getElementsByTagName("ID")[0]?.textContent || undefined,
        taxSchemeName: taxSchemeNodeLine?.getElementsByTagName("Name")[0]?.textContent || undefined,
        freeOfChargeIndicator:
          lineNode
            .getElementsByTagName("PricingReference")[0]
            ?.getElementsByTagName("AlternativeConditionPrice")[0]
            ?.getElementsByTagName("PriceTypeCode")[0]?.textContent === "02" || undefined,
        taxableAmount:
          Number.parseFloat(taxSubtotalNodeLine?.getElementsByTagName("TaxableAmount")[0]?.textContent || "0") ||
          undefined,
        allowanceIndicator: false,
        chargeIndicator: false,
        taxExemptionCode:
          taxCategoryNodeLine?.getElementsByTagName("TaxExemptionReasonCode")[0]?.textContent || undefined,
      }

      lines.push(lineData)
    }

    // ========== DESCRIPCIÓN Y CÁLCULOS FINALES ==========
    const description = lines.length > 0 ? lines.map((line) => line.description).join(", ") : "Documento electrónico"

    const netPayableAmount = Math.max(0, payableAmount - retentionAmount - detractionAmount)
    const conciliatedAmount = 0
    const pendingAmount = netPayableAmount

    // ========== TAGS ==========
    const baseWords = description
      .toLowerCase()
      .split(/\s+|,/)
      .filter((word) => word.length > 2)
    const tags = ["importado", "xml", documentType.toLowerCase(), ...baseWords.slice(0, 3)].filter(
      (tag, index, array) => tag.length > 2 && array.indexOf(tag) === index,
    )

    // ========== VALIDACIONES ==========
    if (!documentId || documentId.trim() === "") {
      console.error("No se encontró el ID del documento en el XML")
      return null
    }

    if (!supplierName || supplierName.trim() === "") {
      console.error("No se encontró el nombre del proveedor en el XML")
      return null
    }

    if (!supplierRuc || supplierRuc.trim() === "") {
      console.error("No se encontró el RUC del proveedor en el XML")
      return null
    }

    // ========== PARSEO DE FECHAS ==========
    const parseDate = (dateString: string): string => {
      if (!dateString) return new Date().toISOString()

      try {
        const parsedDate = new Date(dateString)
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Fecha inválida: ${dateString}, usando fecha actual`)
          return new Date().toISOString()
        }
        return parsedDate.toISOString()
      } catch (error) {
        console.warn(`Error parseando fecha: ${dateString}, usando fecha actual`)
        return new Date().toISOString()
      }
    }

    // ========== HASH DEL XML ==========
    const xmlHash = `${documentId}-${supplierRuc}-${payableAmount}`.replace(/\s/g, "")

    // ========== RETORNO DEL OBJETO COMPLETO ==========
    return {
      companyId,
      documentType,
      series,
      number,
      fullNumber,
      supplierId,
      issueDate: parseDate(issueDate),
      dueDate: dueDate ? parseDate(dueDate) : null,
      receptionDate: new Date().toISOString(),
      currency,
      exchangeRate: exchangeRate || null,
      subtotal: lineExtensionAmount,
      igv: taxAmount,
      otherTaxes: allowanceTotalAmount || null,
      total: payableAmount,
      hasRetention,
      retentionAmount: hasRetention ? retentionAmount : null,
      retentionPercentage: hasRetention ? retentionPercentage : null,
      hasDetraction,
      detractionAmount: hasDetraction ? detractionAmount : null,
      detractionCode: hasDetraction ? detractionCode : null,
      detractionPercentage: hasDetraction ? detractionPercentage : null,
      detractionServiceCode: hasDetraction ? detractionCode : null,
      netPayableAmount,
      conciliatedAmount,
      pendingAmount,
      description,
      observations: "Factura electrónica procesada automáticamente",
      tags,
      status: "PENDING",
      xmlFileName: fileName,
      xmlContent: xmlContent,
      xmlHash,
      xmlUblVersion,
      xmlCustomizationId,
      documentTypeDescription,
      qrCode: qrCode || null,
      documentNotes,
      operationNotes,
      sunatResponseCode: null,
      cdrStatus: null,
      sunatProcessDate: null,
      pdfFile: null,
      lines,
      createdById: userId,
      updatedById: null,
      supplier: {
        businessName: supplierName,
        documentNumber: supplierRuc,
        documentType: supplierDocumentType,
        email: supplierEmail || null,
        phone: supplierPhone || null,
        address: supplierAddress || null,
        district: supplierDistrict || null,
        province: supplierProvince || null,
        department: supplierDepartment || null,
      },
    }
  } catch (error) {
    console.error("Error parsing XML with DOMParser:", error)
    return null
  }
}
