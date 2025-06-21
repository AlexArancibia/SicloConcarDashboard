"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Upload,
  Search,
  FileText,
  Receipt,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react"
import { useSunatStore } from "@/stores/sunat-store"
import { useAuthStore } from "@/stores/authStore"
import { SunatImportModal } from "@/components/sunat-import-modal"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function SunatPage() {
  const [activeTab, setActiveTab] = useState("rhe")
  const [searchTerm, setSearchTerm] = useState("")
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importType, setImportType] = useState<"rhe" | "invoices">("rhe")

  // Pagination states
  const [rhePage, setRhePage] = useState(1)
  const [invoicePage, setInvoicePage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Selection states
  const [selectedRheIds, setSelectedRheIds] = useState<string[]>([])
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const { user } = useAuthStore()

  const {
    rheRecords,
    rheLoading,
    rheError,
    invoices,
    invoicesLoading,
    invoicesError,
    stats,
    statsLoading,
    fetchSunatRhe,
    fetchSunatInvoices,
    searchSunatRhe,
    searchSunatInvoices,
    getSunatStats,
    deleteSunatRhe,
    deleteSunatInvoice,
    clearErrors,
  } = useSunatStore()

  useEffect(() => {
    if (user?.companyId) {
      fetchSunatRhe(user.companyId)
      fetchSunatInvoices(user.companyId)
      getSunatStats(user.companyId)
    }
  }, [user?.companyId, fetchSunatRhe, fetchSunatInvoices, getSunatStats])

  const handleSearch = (term: string, type: "rhe" | "invoices") => {
    if (!user?.companyId) return

    if (term.trim()) {
      if (type === "rhe") {
        searchSunatRhe(user.companyId, term)
      } else {
        searchSunatInvoices(user.companyId, term)
      }
    } else {
      if (type === "rhe") {
        fetchSunatRhe(user.companyId)
      } else {
        fetchSunatInvoices(user.companyId)
      }
    }
  }

  const openImportModal = (type: "rhe" | "invoices") => {
    setImportType(type)
    setImportModalOpen(true)
    clearErrors()
  }

  // Pagination logic
  const getCurrentPageData = (data: any[], page: number) => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / pageSize)
  }

  const currentRheData = getCurrentPageData(rheRecords, rhePage)
  const currentInvoiceData = getCurrentPageData(invoices, invoicePage)
  const rheTotalPages = getTotalPages(rheRecords.length)
  const invoiceTotalPages = getTotalPages(invoices.length)

  // Selection logic
  const handleSelectRhe = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRheIds([...selectedRheIds, id])
    } else {
      setSelectedRheIds(selectedRheIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleSelectAllRhe = (checked: boolean) => {
    if (checked) {
      setSelectedRheIds(currentRheData.map((record) => record.id))
    } else {
      setSelectedRheIds([])
    }
  }

  const handleSelectInvoice = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds([...selectedInvoiceIds, id])
    } else {
      setSelectedInvoiceIds(selectedInvoiceIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleSelectAllInvoices = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(currentInvoiceData.map((invoice) => invoice.id))
    } else {
      setSelectedInvoiceIds([])
    }
  }

  // Delete logic
  const handleDeleteSelected = async () => {
    if (!user?.companyId) return

    setIsDeleting(true)
    try {
      if (activeTab === "rhe") {
        for (const id of selectedRheIds) {
          await deleteSunatRhe(id)
        }
        setSelectedRheIds([])
        await fetchSunatRhe(user.companyId)
      } else {
        for (const id of selectedInvoiceIds) {
          await deleteSunatInvoice(id)
        }
        setSelectedInvoiceIds([])
        await fetchSunatInvoices(user.companyId)
      }
      await getSunatStats(user.companyId)
    } catch (error) {
      console.error("Error deleting records:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: number, currency = "PEN") => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency === "PEN" ? "PEN" : "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "NO ANULADO": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      VÁLIDO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      "1": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      ANULADO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      "0": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      REVERTIDO: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    }

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"

    return (
      <Badge variant="secondary" className={config}>
        {status}
      </Badge>
    )
  }

  // Pagination component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemName,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems: number
    itemName: string
  }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems}{" "}
          {itemName}
        </span>
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          <span className="text-sm">Página</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = Number(e.target.value)
              if (page >= 1 && page <= totalPages) {
                onPageChange(page)
              }
            }}
            className="w-16 h-8 text-center"
          />
          <span className="text-sm">de {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  if (rheError || invoicesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 mb-4">Error: {rheError || invoicesError}</div>
            <Button
              onClick={() => {
                if (user?.companyId) {
                  clearErrors()
                  fetchSunatRhe(user.companyId)
                  fetchSunatInvoices(user.companyId)
                  getSunatStats(user.companyId)
                }
              }}
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión SUNAT</h1>
          <p className="text-gray-600 dark:text-gray-400">Administre registros RHE y facturas importadas desde SUNAT</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total RHE</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalRheRecords || 0}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{stats?.currentMonthRhe || 0} este mes</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Facturas</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalInvoices || 0}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{stats?.currentMonthInvoices || 0} este mes</p>
              </div>
              <Receipt className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monto RHE</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.totalRheAmount || 0)}</p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monto Facturas</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalInvoiceAmount || 0)}</p>
                )}
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="rhe">Registros RHE</TabsTrigger>
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Delete Selected Button */}
            {((activeTab === "rhe" && selectedRheIds.length > 0) ||
              (activeTab === "invoices" && selectedInvoiceIds.length > 0)) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar ({activeTab === "rhe" ? selectedRheIds.length : selectedInvoiceIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente{" "}
                      {activeTab === "rhe" ? selectedRheIds.length : selectedInvoiceIds.length}{" "}
                      {activeTab === "rhe" ? "registros RHE" : "facturas"} seleccionados. Esta acción no se puede
                      deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button onClick={() => openImportModal(activeTab as "rhe" | "invoices")}>
              <Upload className="h-4 w-4 mr-2" />
              Importar {activeTab === "rhe" ? "RHE" : "Facturas"}
            </Button>
          </div>
        </div>

        {/* Search Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Buscar ${activeTab === "rhe" ? "por emisor, descripción o número de documento" : "por proveedor, RUC o número de documento"}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  handleSearch(e.target.value, activeTab as "rhe" | "invoices")
                }}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        <TabsContent value="rhe" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Registros de Honorarios Electrónicos ({rheLoading ? "..." : rheRecords.length})
                  </CardTitle>
                  <CardDescription>Gestiona los registros RHE importados desde SUNAT</CardDescription>
                </div>
                {selectedRheIds.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedRheIds.length} seleccionados
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rheError && (
                <div className="p-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{rheError}</AlertDescription>
                  </Alert>
                </div>
              )}

              {rheLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={8} columns={10} />
                </div>
              ) : (
                <div className="border-t">
                  <div className="overflow-hidden">
                    <ScrollArea className="h-96 w-full">
                      <div className="min-w-max">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-12 sticky left-0 bg-muted/50 z-20 border-r">
                                <Checkbox
                                  checked={currentRheData.length > 0 && selectedRheIds.length === currentRheData.length}
                                  onCheckedChange={handleSelectAllRhe}
                                />
                              </TableHead>
                              <TableHead className="sticky left-12 bg-muted/50 z-20 border-r shadow-sm">
                                Fecha Emisión
                              </TableHead>
                              <TableHead className="whitespace-nowrap">Documento</TableHead>
                              <TableHead className="whitespace-nowrap">Emisor</TableHead>
                              <TableHead className="whitespace-nowrap">Descripción</TableHead>
                              <TableHead className="whitespace-nowrap">Moneda</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Renta Bruta</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Impuesto</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Renta Neta</TableHead>
                              <TableHead className="text-center whitespace-nowrap">Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentRheData.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={10} className="text-center py-8">
                                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500">No se encontraron registros RHE</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentRheData.map((record) => (
                                <TableRow key={record.id} className="hover:bg-muted/30">
                                  <TableCell className="sticky left-0 bg-background z-10 border-r">
                                    <Checkbox
                                      checked={selectedRheIds.includes(record.id)}
                                      onCheckedChange={(checked) => handleSelectRhe(record.id, checked as boolean)}
                                    />
                                  </TableCell>
                                  <TableCell className="sticky left-12 bg-background z-10 border-r shadow-sm">
                                    {formatDate(record.issueDate)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {record.documentType} {record.documentNumber}
                                    </Badge>
                                  </TableCell>
                                  <TableCell style={{ maxWidth: "200px" }}>
                                    <div className="truncate" title={record.issuerName}>
                                      {record.issuerName}
                                    </div>
                                  </TableCell>
                                  <TableCell style={{ maxWidth: "250px" }}>
                                    <div className="truncate" title={record.description}>
                                      {record.description}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {record.currency}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-mono whitespace-nowrap">
                                    {formatCurrency(record.grossIncome, record.currency)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono whitespace-nowrap">
                                    {formatCurrency(record.incomeTax, record.currency)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono whitespace-nowrap">
                                    {formatCurrency(record.netIncome, record.currency)}
                                  </TableCell>
                                  <TableCell className="text-center">{getStatusBadge(record.status)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>

                  {rheRecords.length > 0 && (
                    <PaginationControls
                      currentPage={rhePage}
                      totalPages={rheTotalPages}
                      onPageChange={setRhePage}
                      totalItems={rheRecords.length}
                      itemName="registros RHE"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Facturas y Comprobantes ({invoicesLoading ? "..." : invoices.length})
                  </CardTitle>
                  <CardDescription>Gestiona las facturas importadas desde SUNAT</CardDescription>
                </div>
                {selectedInvoiceIds.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedInvoiceIds.length} seleccionados
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {invoicesError && (
                <div className="p-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{invoicesError}</AlertDescription>
                  </Alert>
                </div>
              )}

              {invoicesLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={8} columns={10} />
                </div>
              ) : (
                <div className="border-t">
                  <div className="overflow-hidden">
                    <ScrollArea className="h-96 w-full">
                      <div className="min-w-max">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-12 sticky left-0 bg-muted/50 z-20 border-r">
                                <Checkbox
                                  checked={
                                    currentInvoiceData.length > 0 &&
                                    selectedInvoiceIds.length === currentInvoiceData.length
                                  }
                                  onCheckedChange={handleSelectAllInvoices}
                                />
                              </TableHead>
                              <TableHead className="sticky left-12 bg-muted/50 z-20 border-r shadow-sm">
                                Fecha Emisión
                              </TableHead>
                              <TableHead className="whitespace-nowrap">Documento</TableHead>
                              <TableHead className="whitespace-nowrap">Proveedor</TableHead>
                              <TableHead className="whitespace-nowrap">RUC</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Base Imponible</TableHead>
                              <TableHead className="text-right whitespace-nowrap">IGV</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                              <TableHead className="whitespace-nowrap">Moneda</TableHead>
                              <TableHead className="text-center whitespace-nowrap">Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentInvoiceData.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={10} className="text-center py-8">
                                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500">No se encontraron facturas</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentInvoiceData.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-muted/30">
                                  <TableCell className="sticky left-0 bg-background z-10 border-r">
                                    <Checkbox
                                      checked={selectedInvoiceIds.includes(invoice.id)}
                                      onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                                    />
                                  </TableCell>
                                  <TableCell className="sticky left-12 bg-background z-10 border-r shadow-sm">
                                    {formatDate(invoice.issueDate)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {invoice.documentType} {invoice.series}-{invoice.documentNumber}
                                    </Badge>
                                  </TableCell>
                                  <TableCell style={{ maxWidth: "200px" }}>
                                    <div className="truncate" title={invoice.customerName || "N/A"}>
                                      {invoice.customerName || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono">{invoice.identityDocumentNumber || "N/A"}</TableCell>
                                  <TableCell className="text-right font-mono whitespace-nowrap">
                                    {formatCurrency(invoice.taxableBase, invoice.currency)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono whitespace-nowrap">
                                    {formatCurrency(invoice.igv, invoice.currency)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono whitespace-nowrap">
                                    {formatCurrency(invoice.total, invoice.currency)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {invoice.currency}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {getStatusBadge(invoice.invoiceStatus || "N/A")}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>

                  {invoices.length > 0 && (
                    <PaginationControls
                      currentPage={invoicePage}
                      totalPages={invoiceTotalPages}
                      onPageChange={setInvoicePage}
                      totalItems={invoices.length}
                      itemName="facturas"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SunatImportModal open={importModalOpen} onOpenChange={setImportModalOpen} type={importType} />
    </div>
  )
}
