"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/stores/authStore"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import apiClient from "@/lib/axiosConfig"
import { Loader2, Download, FileText, Database, BarChart3 } from "lucide-react"
import { ScrollableTable } from "@/components/ui/scrollable-table"

interface ConcarQueryParams {
  companyId?: string
  startDate?: string
  endDate?: string
  bankAccountId?: string | "all"
  conciliationType?: string
  status?: string
  limit?: number
  offset?: number
}

interface ConcarResult {
  // Bank accounts
  accountNumber: string
  accountType: string
  currency: string
  alias: string | null
  description: string | null

  // Transactions
  transactionDate: Date | null
  transaction_description: string | null
  transactionType: string | null
  amount: number | null
  balance: number | null
  branch: string | null
  operationNumber: string | null
  operationTime: string | null
  operatorUser: string | null
  utc: string | null
  transaction_reference: string | null

  // Suppliers
  tradeName: string | null
  supplier_documentType: string | null
  supplier_documentNumber: string | null

  // Conciliations
  conciliation_type: string
  bankBalance: number
  bookBalance: number
  toleranceAmount: number
  conciliation_status: string
  additionalExpensesTotal: number
  totalAmount: number | null
  paymentAmount: number | null

  // Conciliation items
  conciliation_item_id: string | null
  itemType: string | null
  documentId: string | null
  documentAmount: number | null
  item_conciliated_amount: number | null
  item_difference: number | null
  distributionPercentage: number | null
  item_status: string | null
  item_notes: string | null
  systemNotes: string | null
  conciliatedBy: string | null

  // Conciliation expenses
  expense_id: string | null
  expense_description: string | null
  expense_amount: number | null
  expenseType: string | null
  accountId: string | null
  expense_notes: string | null
  isTaxDeductible: boolean | null
  supportingDocument: string | null
  expenseDate: Date | null

  // Documents
  document_id: string | null
  document_companyId: string | null
  documentType: string | null
  series: string | null
  number: string | null
  fullNumber: string | null
  supplierId: string | null
  issueDate: Date | null
  issueTime: string | null
  dueDate: Date | null
  receptionDate: Date | null
  document_currency: string | null
  exchangeRate: number | null
  subtotal: number | null
  igv: number | null
  otherTaxes: number | null
  document_total: number | null
  hasRetention: boolean | null
  retentionAmount: number | null
  retentionPercentage: number | null
  netPayableAmount: number | null
  document_conciliated_amount: number | null
  document_pending_amount: number | null
  paymentMethod: string | null
  document_description: string | null
  observations: string | null
  tags: string[] | null
  document_status: string | null
  orderReference: string | null
  contractNumber: string | null
  additionalNotes: string | null
}

export default function ConcarReportPage() {
  const [queryParams, setQueryParams] = useState<ConcarQueryParams>({
    companyId: "",
    startDate: "",
    endDate: "",
    bankAccountId: "all",
    conciliationType: "",
    status: "",
    limit: 100,
    offset: 0
  })

  const [results, setResults] = useState<ConcarResult[]>([])
  const [loading, setLoading] = useState(false)
  const [responseInfo, setResponseInfo] = useState<any>(null)

  const { toast } = useToast()
  const { company } = useAuthStore()
  const { bankAccounts, loading: bankAccountsLoading, getBankAccountsByCompany } = useBankAccountsStore()

  // Inicializar companyId y cargar cuentas bancarias cuando esté disponible
  useEffect(() => {
    if (company?.id) {
      setQueryParams(prev => ({ ...prev, companyId: company.id }))
      // Cargar cuentas bancarias de la empresa
      getBankAccountsByCompany(company.id)
    }
  }, [company?.id, getBankAccountsByCompany])

  const handleParamChange = (key: keyof ConcarQueryParams, value: string | number) => {
    // Asegurar que limit y offset sean números
    if (key === "limit" || key === "offset") {
      const numValue = typeof value === "string" ? parseInt(value) || 0 : value
      setQueryParams(prev => ({ ...prev, [key]: numValue }))
    } else {
      setQueryParams(prev => ({ ...prev, [key]: value }))
    }
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

    setLoading(true)
    setResults([])
    setResponseInfo(null)

    try {
      // Construir query string con companyId automático
      const queryString = new URLSearchParams()
      queryString.append("companyId", company.id)
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (key !== "companyId" && value !== undefined && value !== null && value !== "" && value !== "all") {
          queryString.append(key, String(value))
        }
      })

      console.log("Sending query to /concar:", { companyId: company.id, ...queryParams })
      console.log("Query string:", queryString.toString())
      console.log("Param types:", {
        limit: typeof queryParams.limit,
        offset: typeof queryParams.offset,
        startDate: typeof queryParams.startDate,
        endDate: typeof queryParams.endDate
      })
      
      const response = await apiClient.get(`/concar?${queryString.toString()}`)
      
      console.log("Concar response:", response.data)
      
      if (response.data.success) {
        const data = response.data.data || []
        console.log("Sample result data:", data[0])
        console.log("Data types:", data[0] ? Object.entries(data[0]).map(([key, value]) => 
          `${key}: ${typeof value} (${value})`
        ) : "No data")
        
        setResults(data)
        setResponseInfo({
          success: true,
          message: response.data.message,
          count: response.data.count,
          query: response.data.query
        })
        
        toast({
          title: "Éxito",
          description: `Reporte generado con ${response.data.count} resultados`,
        })
      } else {
        setResponseInfo({
          success: false,
          message: response.data.message,
          error: response.data.error,
          query: response.data.query
        })
        
        toast({
          title: "Error",
          description: response.data.message || "Error generando reporte",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error executing Concar query:", error)
      
      setResponseInfo({
        success: false,
        message: "Error de conexión",
        error: error.message,
        query: queryParams
      })
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error ejecutando consulta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadResults = () => {
    if (results.length === 0) return

    const csvContent = [
      // Headers
      Object.keys(results[0]).join(","),
      // Data rows
      ...results.map(row => 
        Object.values(row).map(value => {
          if (value === null || value === undefined) return ""
          if (typeof value === "string") return `"${value}"`
          if (typeof value === "number") return value.toString()
          if (Array.isArray(value)) return `"${value.join(", ")}"`
          return `"${String(value)}"`
        }).join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `concar-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Empresa</Label>
              <div className="p-3 bg-gray-50 border rounded-md">
                <div className="font-medium">{company?.name || "Cargando..."}</div>
                <div className="text-sm text-gray-500">{company?.id || "ID no disponible"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={queryParams.startDate}
                onChange={(e) => handleParamChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={queryParams.endDate}
                onChange={(e) => handleParamChange("endDate", e.target.value)}
              />
            </div>

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
              <Label htmlFor="status">Estado</Label>
              <Select
                value={queryParams.status}
                onValueChange={(value) => handleParamChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Límite</Label>
              <Input
                id="limit"
                type="number"
                value={queryParams.limit || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 100 : parseInt(e.target.value) || 100
                  handleParamChange("limit", value)
                }}
                placeholder="100"
                min="1"
                max="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offset">Offset</Label>
              <Input
                id="offset"
                type="number"
                value={queryParams.offset || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                  handleParamChange("offset", value)
                }}
                placeholder="0"
                min="0"
              />
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
              <Button variant="outline" onClick={downloadResults}>
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </Button>
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
              {responseInfo.count !== undefined && (
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
                  data={results.slice(0, 50)}
                  columns={[
                    {
                      key: "account",
                      header: "Cuenta",
                      cell: (result) => (
                        <div>
                          <div className="font-medium">{result.accountNumber}</div>
                          <div className="text-xs text-gray-500">{result.alias || result.description}</div>
                        </div>
                      ),
                    },
                    {
                      key: "type",
                      header: "Tipo",
                      cell: (result) => <Badge variant="outline">{result.conciliation_type}</Badge>,
                    },
                    {
                      key: "supplier",
                      header: "Proveedor",
                      cell: (result) => (
                        <div>
                          <div className="font-medium">{result.tradeName || "-"}</div>
                          <div className="text-xs text-gray-500">{result.supplier_documentNumber || "-"}</div>
                        </div>
                      ),
                    },
                    {
                      key: "document",
                      header: "Documento",
                      cell: (result) => (
                        <div>
                          <div className="font-medium">{result.fullNumber || "-"}</div>
                          <div className="text-xs text-gray-500">{result.documentType || "-"}</div>
                        </div>
                      ),
                    },
                    {
                      key: "amount",
                      header: "Monto",
                      cell: (result) => (
                        <div>
                          <div className="font-medium">
                            {formatCurrency(result.document_total)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.document_conciliated_amount ? `Conciliado: ${formatCurrency(result.document_conciliated_amount)}` : "-"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      header: "Estado",
                      cell: (result) => (
                        <Badge 
                          variant={result.conciliation_status === "COMPLETED" ? "default" : "secondary"}
                        >
                          {result.conciliation_status}
                        </Badge>
                      ),
                    },
                  ]}
                  emptyTitle="No hay resultados"
                  emptyDescription="No se encontraron registros con los parámetros especificados"
                  emptyIcon={<FileText className="h-10 w-10" />}
                />
                {results.length > 50 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Mostrando 50 de {results.length} resultados. Use los parámetros para filtrar más.
                  </div>
                )}
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