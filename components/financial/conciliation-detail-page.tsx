"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Download,
  Eye,
  ReceiptText,
  Banknote,
  Percent,
  Link2,
  ArrowRight,
} from "lucide-react"
import type { Conciliation } from "@/types/conciliations"
import { useConciliationsStore } from "@/stores/conciliation-store"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { DocumentStatus, DocumentType } from "@/types/documents"
import { useAccountingEntriesStore } from "@/stores/accounting-entries-store"
import type { AccountingEntry } from "@/types/accounting"

interface ConciliationDetailPageProps {
  params: { id: string }
}

const statusConfig = {
  PENDING: {
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-700/20 dark:text-amber-300 dark:border-amber-600",
    icon: Clock,
    label: "Pendiente",
    dotColor: "bg-amber-500",
  },
  IN_PROGRESS: {
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-700/20 dark:text-blue-300 dark:border-blue-600",
    icon: AlertCircle,
    label: "En Progreso",
    dotColor: "bg-blue-500",
  },
  COMPLETED: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-700/20 dark:text-emerald-300 dark:border-emerald-600",
    icon: CheckCircle,
    label: "Completado",
    dotColor: "bg-emerald-500",
  },
  CANCELLED: {
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-700/20 dark:text-red-300 dark:border-red-600",
    icon: AlertCircle,
    label: "Cancelado",
    dotColor: "bg-red-500",
  },
}

export default function ConciliationDetailPage({ params }: ConciliationDetailPageProps) {
  const [conciliation, setConciliation] = useState<Conciliation | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const { getConciliationById, completeConciliation, performAutomaticConciliation, loading: storeLoading } = useConciliationsStore()
  const { toast } = useToast()
  const { entries, fetchEntries } = useAccountingEntriesStore()
  const [relatedEntries, setRelatedEntries] = useState<AccountingEntry[]>([])

  useEffect(() => {
    const fetchConciliation = async () => {
      try {
        setLoadingData(true)
        const data = await getConciliationById(params.id)
        setConciliation(data)
      } catch (error: any) {
        console.error("Error fetching conciliation:", error)
        toast({
          title: "Error",
          description: error.message || "Error al cargar la conciliación.",
          variant: "destructive",
        })
      } finally {
        setLoadingData(false)
      }
    }

    if (params.id) {
      fetchConciliation()
    }
  }, [params.id, getConciliationById, toast])

  // Cargar asientos asociados cuando haya conciliación
  useEffect(() => {
    const loadEntries = async () => {
      if (!conciliation?.companyId) return
      try {
        await fetchEntries(conciliation.companyId, { page: 1, limit: 1000 })
      } catch (e) {
        // noop visual
      }
    }
    loadEntries()
  }, [conciliation?.companyId, fetchEntries])

  // Filtrar por conciliación actual
  useEffect(() => {
    if (!conciliation) return
    const filtered = entries.filter(
      (e) => e.conciliationId === conciliation.id || (e.conciliation && e.conciliation.id === conciliation.id),
    )
    setRelatedEntries(filtered)
  }, [entries, conciliation])

  const handleComplete = async () => {
    if (!conciliation) return
    try {
      const updated = await completeConciliation(conciliation.id)
      if (updated) {
        setConciliation(updated)
        toast({
          title: "Éxito",
          description: "Conciliación completada correctamente.",
        })
      }
    } catch (error: any) {
      console.error("Error completing conciliation:", error)
      toast({
        title: "Error",
        description: error.message || "Error al completar la conciliación.",
        variant: "destructive",
      })
    }
  }

  const handleAutomaticConciliation = async () => {
    if (!conciliation) return
    try {
      await performAutomaticConciliation(conciliation.id)
      const updated = await getConciliationById(conciliation.id) 
      setConciliation(updated)
      toast({
        title: "Éxito",
        description: "Conciliación automática realizada.",
      })
    } catch (error: any) {
      console.error("Error performing automatic conciliation:", error)
      toast({
        title: "Error",
        description: error.message || "Error al realizar la conciliación automática.",
        variant: "destructive",
      })
    }
  }

  // Funciones de formato
  const formatCurrency = (amount: string | number | null | undefined, currency = "PEN") => {
    if (amount === null || amount === undefined || amount === "") return "-"
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
    }).format(num)
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-"
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  const formatShortDate = (date: string | Date | null | undefined) => {
    if (!date) return "-"
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }
  
  const getDifferenceIndicator = (difference: string | number | null | undefined) => {
    if (difference === null || difference === undefined)
      return { icon: Minus, color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-800" }
    const diff = typeof difference === "string" ? Number.parseFloat(difference) : difference
    if (diff > 0) return { icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-800/30" }
    if (diff < 0) return { icon: TrendingDown, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-800/30" }
    return { icon: Minus, color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-800" }
  }

  const getDocumentTypeBadge = (type?: DocumentType) => {
    if (!type) return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">N/A</Badge>;
    const typeConfig = {
      INVOICE: { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Factura" },
      CREDIT_NOTE: { class: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", label: "N. Crédito" },
      DEBIT_NOTE: { class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", label: "N. Débito" },
      RECEIPT: { class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Recibo" },
      PURCHASE_ORDER: { class: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20", label: "O. Compra" },
      CONTRACT: { class: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", label: "Contrato" },
    }
    const config = typeConfig[type] || { class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Otro" }
    return <Badge variant="outline" className={config.class}>{config.label}</Badge>
  }

  const getDocumentStatusBadge = (status?: DocumentStatus) => {
     if (!status) return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">N/A</Badge>;
    const statusConfig = {
      DRAFT: { class: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", label: "Borrador" },
      PENDING: { class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Pendiente" },
      APPROVED: { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Aprobado" },
      REJECTED: { class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", label: "Rechazado" },
      PAID: { class: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", label: "Pagado" },
      CANCELLED: { class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Cancelado" },
    }
    const config = statusConfig[status] || { class: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Desconocido" }
    return <Badge variant="secondary" className={config.class}>{config.label}</Badge>
  }

  // Componentes internos
  const BankAccountInfo = () => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border dark:border-slate-700">
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{conciliation?.bankAccount?.alias}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {conciliation?.bankAccount?.bank.name} ({conciliation?.bankAccount?.bank.code})
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {conciliation?.bankAccount?.accountNumber}
        </p>
      </div>
    </div>
  )

  const TransactionInfo = () => (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700 space-y-3">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Descripción</p>
        <p className="font-medium text-slate-900 dark:text-slate-100">
          {conciliation?.transaction?.description}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monto</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {formatCurrency(conciliation?.transaction?.amount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fecha Trans.</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {formatShortDate(conciliation?.transaction?.transactionDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Nº Operación</p>
          <p className="font-mono text-sm text-slate-800 dark:text-slate-200">
            {conciliation?.transaction?.operationNumber || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Referencia</p>
          <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
            {conciliation?.transaction?.reference || "-"}
          </p>
        </div>
      </div>
      {/* <div className="pt-2">
        <Link href={`/transactions?search=${conciliation?.transaction?.operationNumber}`}>
          <Button variant="link" size="sm" className="p-0 h-auto text-blue-600 dark:text-blue-400">
            Ver Transacción Completa <ArrowRight className="h-3 w-3 ml-1"/>
          </Button>
        </Link>
      </div> */}
    </div>
  )

  const DocumentsTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700">
            <TableHead className="text-slate-700 dark:text-slate-300">Tipo</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Número</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Proveedor</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Monto Doc.</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Monto Conc.</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Diferencia</TableHead>
            <TableHead className="text-center text-slate-700 dark:text-slate-300">Estado</TableHead>
            <TableHead className="text-center text-slate-700 dark:text-slate-300">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conciliation?.items?.map((item) => (
            <TableRow key={item.id} className="border-slate-200 dark:border-slate-700">
              <TableCell>{getDocumentTypeBadge(item.document?.documentType as DocumentType)}</TableCell>
              <TableCell className="font-mono text-slate-800 dark:text-slate-200">
                {item.document?.fullNumber}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">
                {item.document?.supplier?.businessName || "N/A"}
              </TableCell>
              <TableCell className="text-right text-slate-700 dark:text-slate-300">
                {formatCurrency(item.documentAmount, item.document?.currency)}
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(item.conciliatedAmount, item.document?.currency)}
              </TableCell>
              <TableCell className="text-right text-slate-700 dark:text-slate-300">
                {formatCurrency(item.difference, item.document?.currency)}
              </TableCell>
              <TableCell className="text-center">
                {getDocumentStatusBadge(item.status as DocumentStatus)}
              </TableCell>
              <TableCell className="text-center">
                <Link href={`/documents/${item.document?.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" title="Ver Documento">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const DetractionsTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700">
            <TableHead className="text-slate-700 dark:text-slate-300">Documento</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Proveedor</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Monto Detracción</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Monto Documento</TableHead>
            <TableHead className="text-center text-slate-700 dark:text-slate-300">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conciliation?.documentDetractions?.map((detraction) => (
            <TableRow key={detraction.id} className="border-slate-200 dark:border-slate-700">
              <TableCell className="font-mono text-slate-800 dark:text-slate-200">
                {detraction.document.fullNumber}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">
                {detraction.document.supplier.businessName}
              </TableCell>
              <TableCell className="text-right text-slate-700 dark:text-slate-300">
                {formatCurrency(detraction.amount)}
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(detraction.document.total)}
              </TableCell>
              <TableCell className="text-center">
                <Link href={`/documents/${detraction.document.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" title="Ver Documento">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const ExpensesTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700">
            <TableHead className="text-slate-700 dark:text-slate-300">Descripción</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Monto</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Tipo</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Cuenta Contable</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conciliation?.expenses?.map((expense) => (
            <TableRow key={expense.id} className="border-slate-200 dark:border-slate-700">
              <TableCell className="text-slate-700 dark:text-slate-300">
                {expense.description || "N/A"}
              </TableCell>
              <TableCell className="text-right text-slate-700 dark:text-slate-300">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">
                {expense.expenseType}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">
                {expense.account?.accountName || "N/A"}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">
                {formatShortDate(expense.expenseDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const AccountingEntriesTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700">
            <TableHead className="text-slate-700 dark:text-slate-300">Fecha</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Nº Asiento</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Descripción</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Debe</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-slate-300">Haber</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relatedEntries.map((e) => {
            const totals = (e.lines || []).reduce(
              (acc, line) => {
                const amount = typeof line.amount === "string" ? Number.parseFloat(line.amount) : (line.amount || 0)
                if (line.movementType === "DEBIT") acc.debit += amount
                if (line.movementType === "CREDIT") acc.credit += amount
                return acc
              },
              { debit: 0, credit: 0 },
            )
            return (
              <TableRow key={e.id} className="border-slate-200 dark:border-slate-700">
                <TableCell className="text-slate-700 dark:text-slate-300">{formatShortDate(e.createdAt)}</TableCell>
                <TableCell className="font-mono text-slate-800 dark:text-slate-200" title={e.id}>{e.id}</TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300 max-w-xl truncate" title={e.notes || ""}>
                  {e.notes || "-"}
                </TableCell>
                <TableCell className="text-right text-slate-700 dark:text-slate-300">{formatCurrency(totals.debit)}</TableCell>
                <TableCell className="text-right text-slate-700 dark:text-slate-300">{formatCurrency(totals.credit)}</TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{e.status}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {relatedEntries.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">No hay asientos asociados.</div>
      )}
    </div>
  )

  const AccountingSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Distribución por Cuentas</h3>
        {conciliation?.summary?.accountingSummary?.accountDistribution && Object.keys(conciliation.summary.accountingSummary.accountDistribution).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(conciliation.summary.accountingSummary.accountDistribution).map(
              ([accountName, amount]) => (
                <li key={accountName} className="flex justify-between items-center text-sm text-slate-700 dark:text-slate-300">
                  <span>{accountName}</span>
                  <span className="font-medium">{formatCurrency(amount as number)}</span>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay distribución por cuentas.</p>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Distribución por Centros de Costo</h3>
        {conciliation?.summary?.accountingSummary?.costCenterDistribution && Object.keys(conciliation.summary.accountingSummary.costCenterDistribution).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(conciliation.summary.accountingSummary.costCenterDistribution).map(
              ([costCenterName, amount]) => (
                <li key={costCenterName} className="flex justify-between items-center text-sm text-slate-700 dark:text-slate-300">
                  <span>{costCenterName}</span>
                  <span className="font-medium">{formatCurrency(amount as number)}</span>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay distribución por centros de costo.</p>
        )}
      </div>
    </div>
  )

  const FinancialOverview = () => {
    const DifferenceIcon = getDifferenceIndicator(conciliation?.difference).icon

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">Monto de Transacción</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(conciliation?.bankBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-1">{
                  conciliation?.type === "DETRACTIONS" ? "Monto Detracciones" : "Monto Documentos"
  
    }</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(conciliation?.bookBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-700 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${getDifferenceIndicator(conciliation?.difference).bgColor} border-slate-200 dark:border-slate-700`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Diferencia</p>
                <p className={`text-2xl font-bold ${getDifferenceIndicator(conciliation?.difference).color}`}>
                  {formatCurrency(conciliation?.difference)}
                </p>
              </div>
              <div className={`w-12 h-12 ${getDifferenceIndicator(conciliation?.difference).bgColor.replace('bg-gradient-to-br ', '')} rounded-full flex items-center justify-center`}>
                <DifferenceIcon className={`h-6 w-6 ${getDifferenceIndicator(conciliation?.difference).color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const AuditInfo = () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Creado por</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
              {conciliation?.createdBy?.firstName} {conciliation?.createdBy?.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{conciliation?.createdBy?.email}</p>
          </div>
        </div>
      </div>

      {conciliation?.approvedBy && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Aprobado por</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                {conciliation.approvedBy.firstName} {conciliation.approvedBy.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{conciliation.approvedBy.email}</p>
            </div>
          </div>
        </div>
      )}

      {conciliation?.completedAt && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Completado el</p>
          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
            {formatDate(conciliation.completedAt)}
          </p>
        </div>
      )}
    </div>
  )

  const ProgressSummary = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Items Conciliados</span>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-700/20 dark:text-emerald-300 dark:border-emerald-600">
          {conciliation?.conciliatedItems}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Items Pendientes</span>
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-700/20 dark:text-amber-300 dark:border-amber-600">
          {conciliation?.pendingItems}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Total Items</span>
        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
          {conciliation?._count?.items || 0}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Gastos</span>
        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
          {conciliation?._count?.expenses || 0}
        </Badge>
      </div>
    </div>
  )

  const FinancialDetails = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Tolerancia</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {formatCurrency(conciliation?.toleranceAmount)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Gastos Adicionales</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {formatCurrency(conciliation?.additionalExpensesTotal)}
        </span>
      </div>
      <Separator className="dark:bg-slate-700"/>
      <div className="flex justify-between items-center">
        <span className="font-medium text-slate-900 dark:text-slate-100">Total Conciliado</span>
        <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
          {formatCurrency(conciliation?.totalAmount || 0)}
        </span>
      </div>
    </div>
  )

  const GeneralInfo = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Referencia</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {conciliation?.reference || "Sin referencia"}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Tipo</span>
        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
          {conciliation?.type === "DOCUMENTS" ? "Documentos" : "Detracciones"}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Período</span>
        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
          {formatShortDate(conciliation?.periodStart)} - {formatShortDate(conciliation?.periodEnd)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Documentos</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {conciliation?.totalDocuments}
        </span>
      </div>
      {conciliation?.notes && (
        <>
          <Separator className="dark:bg-slate-700"/>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Notas</p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md border dark:border-slate-700">
              <p className="text-xs text-slate-700 dark:text-slate-300">{conciliation.notes}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando conciliación...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!conciliation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Conciliación no encontrada</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">La conciliación que buscas no existe o no tienes permisos para verla.</p>
            <Link href="/conciliations">
              <Button variant="outline" className="bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al listado
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentStatusConfig = statusConfig[conciliation.status] || statusConfig.PENDING
  const DifferenceIcon = getDifferenceIndicator(conciliation.difference).icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/conciliations">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Conciliación #{conciliation.id.split("-")[0].toUpperCase()}
                  </h1>
                  <Badge className={`${currentStatusConfig.color} border`}>
                    <div className={`w-2 h-2 rounded-full ${currentStatusConfig.dotColor} mr-2`} />
                    {currentStatusConfig.label}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Creada el {formatDate(conciliation.createdAt)} por {conciliation.createdBy?.firstName}{" "}
                  {conciliation.createdBy?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {conciliation.status !== "COMPLETED" && conciliation.status !== "CANCELLED" && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleAutomaticConciliation}
                    disabled={storeLoading}
                    className="bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Conciliación Automática
                  </Button>
                  <Button onClick={handleComplete} disabled={storeLoading} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            <FinancialOverview />
            
            {/* Transaction Information */}
            {conciliation.transaction && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                    <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Transacción Bancaria Asociada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionInfo />
                </CardContent>
              </Card>
            )}

            {/* Conciliation Items (Documents or Detractions) */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                  <ReceiptText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  {conciliation.type === "DOCUMENTS" 
                    ? `Documentos Conciliados (${conciliation.items?.length || 0})` 
                    : `Detracciones Conciliadas (${conciliation.documentDetractions?.length || 0})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conciliation.type === "DOCUMENTS" ? (
                  conciliation.items && conciliation.items.length > 0 ? (
                    <DocumentsTable />
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No hay documentos conciliados.
                    </div>
                  )
                ) : (
                  conciliation.documentDetractions && conciliation.documentDetractions.length > 0 ? (
                    <DetractionsTable />
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No hay detracciones conciliadas.
                    </div>
                  )
                )}
              </CardContent>
            </Card>
            
            {/* Conciliation Expenses */}
            {conciliation.expenses && conciliation.expenses.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                    <Banknote className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Gastos Adicionales ({conciliation.expenses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpensesTable />
                </CardContent>
              </Card>
            )}

            {/* Accounting Entries related to this conciliation */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                  <Hash className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Asientos contables asociados ({relatedEntries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AccountingEntriesTable />
              </CardContent>
            </Card>

            {/* Accounting Summary */}
            {conciliation.summary?.accountingSummary && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                    <Percent className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Resumen Contable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountingSummary />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-1 space-y-6">
            {/* General Information */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GeneralInfo />
              </CardContent>
            </Card>
            
            {/* Bank Account Information */}
            {conciliation.bankAccount && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                    <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Cuenta Bancaria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BankAccountInfo />
                </CardContent>
              </Card>
            )}

            {/* Progress Summary */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressSummary />
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Detalles Financieros</CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialDetails />
              </CardContent>
            </Card>

            {/* Audit Information */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Auditoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AuditInfo />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}