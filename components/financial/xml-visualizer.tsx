"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, FileCode, Table, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface XMLVisualizerProps {
  xmlContent: string
  fileName: string
}

interface ParsedXMLData {
  documentType: string
  documentId: string
  series: string
  number: string
  issueDate: string
  currency: string
  supplier: {
    name: string
    documentNumber: string
    documentType: string
  }
  customer?: {
    name: string
    documentNumber: string
  }
  amounts: {
    subtotal: number
    igv: number
    total: number
  }
  hasDetraction: boolean
  hasRetention: boolean
  lines: Array<{
    lineNumber: number
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  notes: string[]
}

export default function XMLVisualizer({ xmlContent, fileName }: XMLVisualizerProps) {
  const [parsedData, setParsedData] = useState<ParsedXMLData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawXml, setRawXml] = useState<string>("")

  useEffect(() => {
    if (!xmlContent) {
      setError("No hay contenido XML para visualizar")
      return
    }

    try {
      // Format raw XML for display
      const formattedXml = formatXML(xmlContent)
      setRawXml(formattedXml)

      // Parse XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        setError("XML mal formado: " + parseError.textContent)
        return
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
          }
        }
        return ""
      }

      const getNumericValue = (...selectors: string[]): number => {
        const text = getElementText(...selectors)
        return text ? Number.parseFloat(text) || 0 : 0
      }

      // Extract basic document info
      const documentId = getElementText("cbc\\:ID", "ID")
      const issueDate = getElementText("cbc\\:IssueDate", "IssueDate")
      const currency = getElementText("cbc\\:DocumentCurrencyCode", "DocumentCurrencyCode") || "PEN"

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

      // Determine document type
      const invoiceTypeCode = getElementText(
        "cbc\\:InvoiceTypeCode",
        "InvoiceTypeCode",
        "cbc\\:CreditNoteTypeCode",
        "CreditNoteTypeCode",
        "cbc\\:DebitNoteTypeCode",
        "DebitNoteTypeCode",
      )

      let documentType = "FACTURA"
      if (invoiceTypeCode === "01") {
        documentType = "FACTURA"
      } else if (invoiceTypeCode === "03") {
        documentType = "BOLETA"
      } else if (invoiceTypeCode === "07") {
        documentType = "NOTA_CREDITO"
      } else if (invoiceTypeCode === "08") {
        documentType = "NOTA_DEBITO"
      } else if (fileName.toUpperCase().includes("RH") || fileName.toUpperCase().includes("RHE")) {
        documentType = "RECIBO_HONORARIOS"
      }

      // Extract supplier info
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

      const supplierDocType = supplierRuc.length === 11 ? "RUC" : "DNI"

      // Extract customer info
      const customerName = getElementText(
        "cac\\:AccountingCustomerParty cac\\:Party cac\\:PartyLegalEntity cbc\\:RegistrationName",
        "AccountingCustomerParty Party PartyLegalEntity RegistrationName",
        "cac\\:AccountingCustomerParty cac\\:Party cac\\:PartyName cbc\\:Name",
        "AccountingCustomerParty Party PartyName Name",
      )

      const customerRuc = getElementText(
        "cac\\:AccountingCustomerParty cac\\:Party cac\\:PartyIdentification cbc\\:ID",
        "AccountingCustomerParty Party PartyIdentification ID",
        "cac\\:AccountingCustomerParty cbc\\:CustomerAssignedAccountID",
        "AccountingCustomerParty CustomerAssignedAccountID",
      )

      // Extract amounts
      const subtotal = getNumericValue(
        "cac\\:LegalMonetaryTotal cbc\\:LineExtensionAmount",
        "LegalMonetaryTotal LineExtensionAmount",
      )
      const igv = getNumericValue("cac\\:TaxTotal cbc\\:TaxAmount", "TaxTotal TaxAmount")
      const total = getNumericValue("cac\\:LegalMonetaryTotal cbc\\:PayableAmount", "LegalMonetaryTotal PayableAmount")

      // Check for retentions and detractions
      const retentionElements = xmlDoc.querySelectorAll("cac\\:PaymentTerms, PaymentTerms")
      let hasRetention = false
      let hasDetraction = false

      Array.from(retentionElements).forEach((element) => {
        const paymentTermsId = element.querySelector("cbc\\:ID, ID")?.textContent?.trim()?.toLowerCase() || ""
        if (paymentTermsId.includes("retencion")) {
          hasRetention = true
        }
        if (paymentTermsId.includes("detraccion")) {
          hasDetraction = true
        }
      })

      // Check for RET 4TA in invoice lines (for recibos por honorarios)
      const lineElements = xmlDoc.querySelectorAll(
        "cac\\:InvoiceLine, InvoiceLine, cac\\:CreditNoteLine, CreditNoteLine, cac\\:DebitNoteLine, DebitNoteLine",
      )

      Array.from(lineElements).forEach((line) => {
        const taxCategoryId = line.querySelector("cac\\:TaxCategory cbc\\:ID, TaxCategory ID")?.textContent
        if (taxCategoryId === "RET 4TA") {
          hasRetention = true
          documentType = "RECIBO_HONORARIOS"
        }
      })

      // Extract notes
      const noteElements = xmlDoc.querySelectorAll("cbc\\:Note, Note")
      const notes: string[] = []
      Array.from(noteElements).forEach((note) => {
        const noteText = note.textContent?.trim()
        if (noteText && !noteText.includes("|")) {
          notes.push(noteText)
        }
      })

      // Extract lines
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

        return {
          lineNumber: index + 1,
          description:
            getLineText("cac\\:Item cbc\\:Description") || getLineText("Item Description") || "Producto/Servicio",
          quantity: getLineNumber("cbc\\:InvoicedQuantity") || getLineNumber("InvoicedQuantity") || 1,
          unitPrice: getLineNumber("cac\\:Price cbc\\:PriceAmount") || getLineNumber("Price PriceAmount") || 0,
          total: getLineNumber("cbc\\:LineExtensionAmount") || getLineNumber("LineExtensionAmount") || 0,
        }
      })

      // Create parsed data object
      const data: ParsedXMLData = {
        documentType,
        documentId,
        series,
        number,
        issueDate,
        currency,
        supplier: {
          name: supplierName,
          documentNumber: supplierRuc,
          documentType: supplierDocType,
        },
        customer: customerName
          ? {
              name: customerName,
              documentNumber: customerRuc,
            }
          : undefined,
        amounts: {
          subtotal,
          igv,
          total,
        },
        hasDetraction,
        hasRetention,
        lines,
        notes,
      }

      setParsedData(data)
      setError(null)
    } catch (err) {
      console.error("Error parsing XML:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al analizar el XML")
    }
  }, [xmlContent, fileName])

  // Helper function to format XML
  function formatXML(xml: string): string {
    try {
      let formatted = ""
      let indent = ""
      const tab = "  " // 2 spaces

      xml.split(/>\s*</).forEach((node) => {
        if (node.match(/^\/\w/)) {
          // Closing tag
          indent = indent.substring(tab.length)
        }

        formatted += indent + "<" + node + ">\r\n"

        if (node.match(/^<?\w[^>]*[^/]$/) && !node.startsWith("?")) {
          // Opening tag
          indent += tab
        }
      })

      return formatted.substring(1, formatted.length - 3)
    } catch (e) {
      return xml
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!parsedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
        <p>Analizando XML...</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="summary" className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Resumen
        </TabsTrigger>
        <TabsTrigger value="details" className="flex items-center gap-1">
          <Table className="h-4 w-4" />
          Detalle
        </TabsTrigger>
        <TabsTrigger value="raw" className="flex items-center gap-1">
          <FileCode className="h-4 w-4" />
          XML
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Información del Documento</span>
              <Badge variant={parsedData.documentType === "RECIBO_HONORARIOS" ? "secondary" : "default"}>
                {parsedData.documentType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Número</p>
                <p className="font-medium">
                  {parsedData.series}-{parsedData.number}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Emisión</p>
                <p className="font-medium">{parsedData.issueDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Moneda</p>
                <p className="font-medium">{parsedData.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="font-medium">
                  {parsedData.currency} {parsedData.amounts.total.toFixed(2)}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Emisor</h3>
              <p className="font-medium">{parsedData.supplier.name}</p>
              <p className="text-sm">
                {parsedData.supplier.documentType}: {parsedData.supplier.documentNumber}
              </p>
            </div>

            {parsedData.customer && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Receptor</h3>
                  <p className="font-medium">{parsedData.customer.name}</p>
                  <p className="text-sm">Doc: {parsedData.customer.documentNumber}</p>
                </div>
              </>
            )}

            {(parsedData.hasDetraction || parsedData.hasRetention) && (
              <>
                <Separator />
                <div className="flex gap-2">
                  {parsedData.hasDetraction && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Detracción
                    </Badge>
                  )}
                  {parsedData.hasRetention && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Retención {parsedData.documentType === "RECIBO_HONORARIOS" ? "4ta Categoría" : ""}
                    </Badge>
                  )}
                </div>
              </>
            )}

            {parsedData.notes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notas</h3>
                  {parsedData.notes.map((note, index) => (
                    <p key={index} className="text-sm bg-gray-50 p-2 rounded mb-1">
                      {note}
                    </p>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Montos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>
                  {parsedData.currency} {parsedData.amounts.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IGV:</span>
                <span>
                  {parsedData.currency} {parsedData.amounts.igv.toFixed(2)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>
                  {parsedData.currency} {parsedData.amounts.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detalle de Líneas ({parsedData.lines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium">#</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Descripción</th>
                    <th className="text-right py-2 px-2 text-sm font-medium">Cant.</th>
                    <th className="text-right py-2 px-2 text-sm font-medium">Precio Unit.</th>
                    <th className="text-right py-2 px-2 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.lines.map((line) => (
                    <tr key={line.lineNumber} className="border-b">
                      <td className="py-2 px-2 text-sm">{line.lineNumber}</td>
                      <td className="py-2 px-2 text-sm">{line.description}</td>
                      <td className="py-2 px-2 text-sm text-right">{line.quantity}</td>
                      <td className="py-2 px-2 text-sm text-right">
                        {parsedData.currency} {line.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-sm text-right">
                        {parsedData.currency} {line.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="raw">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">XML Crudo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{rawXml}</pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
