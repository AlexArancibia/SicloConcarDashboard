"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Eye,
  DollarSign,
  CreditCard,
  Banknote,
  Plus,
  ChevronRight,
  Code,
} from "lucide-react"
import { useSuppliersStore } from "@/stores/suppliers-store"
import { useDocumentsStore } from "@/stores/documents-store"
import { useBanksStore } from "@/stores/bank-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import type { Supplier, SupplierType, SupplierStatus, CreateSupplierBankAccountDto } from "@/types/suppliers"
import type { DocumentStatus } from "@/types/documents"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BankAccountType } from "@/types/bank-accounts"
import { useAuthStore } from "@/stores/authStore"

interface SupplierDetailPageProps {
  id: string
}

const SupplierTypeLabels: Record<SupplierType, string> = {
  INDIVIDUAL: "Persona Natural",
  COMPANY: "Persona Jurídica",
  GOVERNMENT: "Entidad Gubernamental",
  FOREIGN: "Extranjero",
}

const SupplierStatusLabels: Record<SupplierStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
  PENDING_APPROVAL: "Pendiente",
}

const DocumentStatusLabels: Record<DocumentStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
}

const BankAccountTypeLabels: Record<BankAccountType, string> = {
  CHECKING: "Cuenta Corriente",
  SAVINGS: "Cuenta de Ahorros",
  CREDIT: "Cuenta de Crédito",
  INVESTMENT: "Cuenta de Inversión",
}

export default function SupplierDetailPage({ id }: SupplierDetailPageProps) {
  const router = useRouter()
  const { company } = useAuthStore()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<CreateSupplierBankAccountDto | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [payloadPreview, setPayloadPreview] = useState<string>("")

  const { loading, error, getSupplierById, deleteSupplier, updateSupplier } = useSuppliersStore()
  const { documents, getDocumentsBySupplier, clearDocuments } = useDocumentsStore()
  const { banks, fetchBanks } = useBanksStore()

  // Fetch supplier data
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const data = await getSupplierById(id)
        if (data) setSupplier(data)
      }
    }
    fetchData()
  }, [id, getSupplierById])

  // Fetch documents
  useEffect(() => {
    const fetchDocs = async () => {
      if (supplier?.id && company?.id) {
        setDocumentsLoading(true)
        try {
          await getDocumentsBySupplier(company.id, supplier.id, { page: 1, limit: 50 })
        } catch (error) {
          console.error("Error fetching documents:", error)
        } finally {
          setDocumentsLoading(false)
        }
      }
    }

    fetchDocs()
    return () => clearDocuments()
  }, [supplier?.id, company?.id, getDocumentsBySupplier, clearDocuments])

  // Fetch banks
  useEffect(() => {
    fetchBanks()
  }, [fetchBanks])

  // Update payload preview when currentAccount changes
  useEffect(() => {
    if (!supplier || !currentAccount) return

    const updatedAccounts = isEditingAccount
      ? supplier.supplierBankAccounts?.map(acc => 
          acc.accountNumber === currentAccount.accountNumber && acc.bankId === currentAccount.bankId
            ? currentAccount
            : {
                bankId: acc.bankId,
                accountNumber: acc.accountNumber,
                accountType: acc.accountType,
                currency: acc.currency,
                isDefault: acc.isDefault,
              }
        ) || []
      : [
          ...(supplier.supplierBankAccounts?.map(acc => ({
            bankId: acc.bankId,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            currency: acc.currency,
            isDefault: acc.isDefault,
          })) || []),
          currentAccount
        ]

    // Handle default account
    const finalAccounts = currentAccount.isDefault
      ? updatedAccounts.map(acc => ({
          ...acc,
          isDefault: acc.accountNumber === currentAccount.accountNumber && 
                   acc.bankId === currentAccount.bankId
        }))
      : updatedAccounts

    setPayloadPreview(JSON.stringify(
      { supplierBankAccounts: finalAccounts },
      null, 
      2
    ))
  }, [currentAccount, supplier, isEditingAccount])

  const handleDeleteSupplier = async () => {
    if (supplier && window.confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      try {
        await deleteSupplier(supplier.id)
        router.push("/suppliers")
      } catch (error) {
        console.error("Error deleting supplier:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el proveedor",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddAccount = () => {
    setCurrentAccount({
      bankId: "",
      accountNumber: "",
      accountType: "CHECKING",
      currency: "PEN",
      isDefault: false,
    })
    setIsEditingAccount(false)
    setIsDialogOpen(true)
  }

  const handleEditAccount = (account: any) => {
    setCurrentAccount({
      bankId: account.bankId,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currency: account.currency,
      isDefault: account.isDefault,
    })
    setIsEditingAccount(true)
    setIsDialogOpen(true)
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!supplier) return
    
    if (window.confirm("¿Está seguro de que desea eliminar esta cuenta bancaria?")) {
      try {
        const updatedAccounts = supplier.supplierBankAccounts
          ?.filter(acc => acc.id !== accountId)
          .map(acc => ({
            bankId: acc.bankId,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            currency: acc.currency,
            isDefault: acc.isDefault,
          })) || []

        await updateSupplier(supplier.id, {
          supplierBankAccounts: updatedAccounts
        })

        const updatedSupplier = await getSupplierById(id)
        if (updatedSupplier) {
          setSupplier(updatedSupplier)
          toast({
            title: "Éxito",
            description: "La cuenta bancaria ha sido eliminada correctamente.",
          })
        }
      } catch (error) {
        console.error("Error deleting bank account:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la cuenta bancaria.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveAccount = async () => {
    if (!supplier || !currentAccount) return

    try {
      const payload = JSON.parse(payloadPreview)
      await updateSupplier(supplier.id, payload)

      const updatedSupplier = await getSupplierById(id)
      if (updatedSupplier) {
        setSupplier(updatedSupplier)
        toast({
          title: "Éxito",
          description: isEditingAccount 
            ? "Cuenta bancaria actualizada correctamente." 
            : "Cuenta bancaria agregada correctamente.",
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving bank account:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la cuenta bancaria.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: SupplierStatus) => {
    const statusConfig = {
      ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      INACTIVE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      BLOCKED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      PENDING_APPROVAL: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    }

    return (
      <Badge
        variant="secondary"
        className={statusConfig[status] || "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"}
      >
        {SupplierStatusLabels[status] || "Desconocido"}
      </Badge>
    )
  }

  const getBankName = (bankId: string) => {
    return banks.find(b => b.id === bankId)?.name || "Banco no encontrado"
  }

  const formatCurrency = (amount: string | number, currency = "PEN") => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    const symbol = currency === "USD" ? "$" : "S/"
    return `${symbol} ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <Button onClick={() => router.push("/suppliers")}>Volver a Proveedores</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">ID de proveedor no válido</div>
            <Button onClick={() => router.push("/suppliers")}>Volver a Proveedores</Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate document statistics
  const documentStats = {
    total: documents.length,
    totalAmount: documents.reduce((sum, doc) => sum + Number.parseFloat(doc.total), 0),
    currency: documents[0]?.currency || "PEN",
    lastDocument:
      documents.length > 0
        ? documents.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0]
        : null,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/suppliers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detalle de Proveedor</h1>
        </div>
        {supplier && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteSupplier}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {loading || !supplier ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={1} columns={3} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={5} columns={2} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Supplier Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full md:w-32 h-32">
                  <Building2 className="w-16 h-16 text-gray-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">{supplier.businessName}</h2>
                    {getStatusBadge(supplier.status)}
                  </div>

                  {supplier.tradeName && <p className="text-gray-600 dark:text-gray-400">{supplier.tradeName}</p>}

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {supplier.documentType}: {supplier.documentNumber}
                    </Badge>

                    <Badge variant="outline" className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {SupplierTypeLabels[supplier.supplierType]}
                    </Badge>

                    {supplier.isRetentionAgent && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                        Agente de Retención
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{supplier.phone || "No registrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{supplier.email || "No registrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {supplier.address
                          ? `${supplier.address}${supplier.district ? `, ${supplier.district}` : ""}`
                          : "No registrado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold">{documentStats.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(documentStats.totalAmount, documentStats.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Último Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Calendar className="w-8 h-8 text-amber-500" />
                  <span className="text-lg font-medium">
                    {documentStats.lastDocument ? formatDate(documentStats.lastDocument.issueDate) : "Sin documentos"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Bank Accounts Section - Improved Design */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Cuentas Bancarias ({supplier.supplierBankAccounts?.length || 0})
                </CardTitle>
                <Button size="sm" onClick={handleAddAccount}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cuenta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {supplier.supplierBankAccounts && supplier.supplierBankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {supplier.supplierBankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-secondary">
                          <Banknote className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getBankName(account.bankId)}
                            {account.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Principal
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {account.accountNumber} • {BankAccountTypeLabels[account.accountType]} • {account.currency}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <CreditCard className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay cuentas bancarias registradas</p>
                  <Button onClick={handleAddAccount}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Cuenta Bancaria
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Account Dialog with Payload Preview */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>
                  {isEditingAccount ? "Editar Cuenta Bancaria" : "Agregar Cuenta Bancaria"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bankId" className="text-right">
                    Banco
                  </Label>
                  <Select
                    value={currentAccount?.bankId || ""}
                    onValueChange={(value) => setCurrentAccount(prev => prev ? {...prev, bankId: value} : null)}
                    
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="accountNumber" className="text-right">
                    Número
                  </Label>
                  <Input
                    id="accountNumber"
                    value={currentAccount?.accountNumber || ""}
                    onChange={(e) => setCurrentAccount(prev => prev ? {...prev, accountNumber: e.target.value} : null)}
                    
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="accountType" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={currentAccount?.accountType || "CHECKING"}
                    onValueChange={(value) => setCurrentAccount(prev => prev ? {...prev, accountType: value as BankAccountType} : null)}
                    
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BankAccountTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    Moneda
                  </Label>
                  <Select
                    value={currentAccount?.currency || "PEN"}
                    onValueChange={(value) => setCurrentAccount(prev => prev ? {...prev, currency: value} : null)}
                    
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">Soles (PEN)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={currentAccount?.isDefault || false}
                      onChange={(e) => setCurrentAccount(prev => prev ? {...prev, isDefault: e.target.checked} : null)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="isDefault">Establecer como cuenta principal</Label>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">
                    Payload
                  </Label>
                  <div className="col-span-3">
                    <Card className="bg-muted/50">
                      <ScrollArea className="h-32">
                       
                          {payloadPreview || '{}'}
                        
                      </ScrollArea>
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este es el payload que se enviará al servidor
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAccount}>
                  {isEditingAccount ? "Guardar Cambios" : "Agregar Cuenta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos ({documents.length})</CardTitle>
              <CardDescription>Documentos emitidos por este proveedor</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Tipo</th>
                        <th className="text-left p-3">Número</th>
                        <th className="text-left p-3">Fecha Emisión</th>
                        <th className="text-left p-3">Fecha Vencimiento</th>
                        <th className="text-right p-3">Subtotal</th>
                        <th className="text-right p-3">IGV</th>
                        <th className="text-right p-3">Total</th>
                        <th className="text-center p-3">Estado</th>
                        <th className="text-center p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr key={document.id} className="border-b hover:bg-accent transition-colors">
                          <td className="p-3">
                            <Badge variant="outline">{document.documentType}</Badge>
                          </td>
                          <td className="p-3 font-mono">{document.fullNumber}</td>
                          <td className="p-3">{formatDate(document.issueDate)}</td>
                          <td className="p-3">{document.dueDate ? formatDate(document.dueDate) : "-"}</td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(document.subtotal, document.currency)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(document.igv, document.currency)}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {formatCurrency(document.total, document.currency)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">
                              {DocumentStatusLabels[document.status] || document.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/documents/${document.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay documentos registrados para este proveedor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}