"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Wallet,
  Eye,
  Edit,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Trash2,
  Power,
  PowerOff,
  DollarSign,
  CreditCard,
  Banknote,
  PiggyBank,
} from "lucide-react"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import type { BankAccount, BankAccountType } from "@/types"
import { useAuthStore } from "@/stores/authStore"

interface BankAccountFormData {
  bankName: string
  bankCode: string
  accountNumber: string
  accountType: BankAccountType
  currency: string
  alias: string
  description: string
  initialBalance: number
  isActive: boolean
}

const initialFormData: BankAccountFormData = {
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountType: "CORRIENTE",
  currency: "PEN",
  alias: "",
  description: "",
  initialBalance: 0,
  isActive: true,
}

export default function BankAccountsPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const {
    bankAccounts,
    loading,
    error,
    pagination,
    fetchBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    clearError,
  } = useBankAccountsStore()

  const [filters, setFilters] = useState({
    search: "",
    accountType: "",
    currency: "",
    isActive: "",
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [formData, setFormData] = useState<BankAccountFormData>(initialFormData)
  const [currentPage, setCurrentPage] = useState(1)

  // Cargar cuentas bancarias al montar el componente
  useEffect(() => {
    if (user?.companyId) {
      fetchBankAccounts(user.companyId, currentPage, 10)
    }
  }, [user?.companyId, currentPage, fetchBankAccounts])

  // Limpiar errores cuando se cierre el modal
  useEffect(() => {
    if (!isCreateModalOpen && !isEditModalOpen) {
      clearError()
    }
  }, [isCreateModalOpen, isEditModalOpen, clearError])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreateAccount = async () => {
    if (!user?.companyId) return

    const accountData = {
      ...formData,
      companyId: user.companyId,
      currentBalance: formData.initialBalance,
    }

    const result = await createBankAccount(accountData)
    if (result) {
      toast({
        title: "Cuenta creada",
        description: "La cuenta bancaria se ha creado exitosamente.",
      })
      setIsCreateModalOpen(false)
      setFormData(initialFormData)
      fetchBankAccounts(user.companyId, currentPage, 10)
    } else {
      toast({
        title: "Error",
        description: error || "No se pudo crear la cuenta bancaria.",
        variant: "destructive",
      })
    }
  }

  const handleEditAccount = async () => {
    if (!selectedAccount) return

    await updateBankAccount(selectedAccount.id, formData)
    if (!error) {
      toast({
        title: "Cuenta actualizada",
        description: "La cuenta bancaria se ha actualizado exitosamente.",
      })
      setIsEditModalOpen(false)
      setSelectedAccount(null)
      setFormData(initialFormData)
    } else {
      toast({
        title: "Error",
        description: error || "No se pudo actualizar la cuenta bancaria.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return

    await deleteBankAccount(selectedAccount.id)
    if (!error) {
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta bancaria se ha eliminado exitosamente.",
      })
      setIsDeleteDialogOpen(false)
      setSelectedAccount(null)
      if (user?.companyId) {
        fetchBankAccounts(user.companyId, currentPage, 10)
      }
    } else {
      toast({
        title: "Error",
        description: error || "No se pudo eliminar la cuenta bancaria.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (account: BankAccount) => {
    await updateBankAccount(account.id, { isActive: !account.isActive })
    if (!error) {
      toast({
        title: account.isActive ? "Cuenta desactivada" : "Cuenta activada",
        description: `La cuenta ha sido ${account.isActive ? "desactivada" : "activada"} exitosamente.`,
      })
    }
  }

  const openEditModal = (account: BankAccount) => {
    setSelectedAccount(account)
    setFormData({
      bankName: account.bankName,
      bankCode: account.bankCode || "",
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currency: account.currency,
      alias: account.alias || "",
      description: account.description || "",
      initialBalance: account.initialBalance,
      isActive: account.isActive,
    })
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsDeleteDialogOpen(true)
  }

  if (error && !bankAccounts.length) {
    return (
 
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
 
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge
        variant="secondary"
        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      >
        Activa
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
        Inactiva
      </Badge>
    )
  }

  const getAccountTypeIcon = (type: BankAccountType) => {
    switch (type) {
      case "DETRACCIONES":
        return <TrendingDown className="w-4 h-4 text-amber-400" />
      case "AHORROS":
        return <PiggyBank className="w-4 h-4 text-blue-400" />
      case "PLAZO_FIJO":
        return <Banknote className="w-4 h-4 text-purple-400" />
      case "CTS":
        return <CreditCard className="w-4 h-4 text-orange-400" />
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-400" />
    }
  }

  const getAccountTypeBadge = (type: BankAccountType) => {
    const colors = {
      CORRIENTE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      AHORROS: "bg-green-500/10 text-green-600 border-green-500/20",
      PLAZO_FIJO: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      CTS: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      DETRACCIONES: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      OTROS: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    }

    return (
      <Badge variant="outline" className={colors[type]}>
        {type.replace("_", " ")}
      </Badge>
    )
  }

  const filteredAccounts = bankAccounts.filter((account) => {
    const matchesSearch =
      account.bankName.toLowerCase().includes(filters.search.toLowerCase()) ||
      account.accountNumber.includes(filters.search) ||
      (account.alias && account.alias.toLowerCase().includes(filters.search.toLowerCase()))
    const matchesType =
      !filters.accountType || filters.accountType === "all" || account.accountType === filters.accountType
    const matchesCurrency = !filters.currency || filters.currency === "all" || account.currency === filters.currency
    const matchesStatus =
      !filters.isActive ||
      filters.isActive === "all" ||
      (filters.isActive === "active" ? account.isActive : !account.isActive)

    return matchesSearch && matchesType && matchesCurrency && matchesStatus
  })

  // Calcular estadísticas
  const stats = {
    total: bankAccounts.length,
    active: bankAccounts.filter((acc) => acc.isActive).length,
    totalBalance: bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
    penBalance: bankAccounts.filter((acc) => acc.currency === "PEN").reduce((sum, acc) => sum + acc.currentBalance, 0),
    usdBalance: bankAccounts.filter((acc) => acc.currency === "USD").reduce((sum, acc) => sum + acc.currentBalance, 0),
  }

  const filterConfigs = [
    {
      key: "search",
      type: "search" as const,
      placeholder: "Banco, Número, Alias...",
    },
    {
      key: "accountType",
      type: "select" as const,
      placeholder: "Tipo de cuenta",
      options: [
        { value: "all", label: "Todos los tipos" },
        { value: "CORRIENTE", label: "Corriente" },
        { value: "AHORROS", label: "Ahorros" },
        { value: "PLAZO_FIJO", label: "Plazo Fijo" },
        { value: "CTS", label: "CTS" },
        { value: "DETRACCIONES", label: "Detracciones" },
        { value: "OTROS", label: "Otros" },
      ],
      className: "min-w-40",
    },
    {
      key: "currency",
      type: "select" as const,
      placeholder: "Moneda",
      options: [
        { value: "all", label: "Todas las monedas" },
        { value: "PEN", label: "Soles (PEN)" },
        { value: "USD", label: "Dólares (USD)" },
        { value: "EUR", label: "Euros (EUR)" },
      ],
      className: "min-w-32",
    },
    {
      key: "isActive",
      type: "select" as const,
      placeholder: "Estado",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "active", label: "Activas" },
        { value: "inactive", label: "Inactivas" },
      ],
      className: "min-w-32",
    },
  ]

  return (
 
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              Gestión de Cuentas Bancarias
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Administre las cuentas bancarias de la empresa
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 text-xs sm:text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Cuenta</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Cuentas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Activas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Power className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Total</p>
                  <p className="text-lg font-bold">
                    S/ {stats.penBalance.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Saldo USD</p>
                  <p className="text-lg font-bold">
                    $ {stats.usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactivas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.total - stats.active}</p>
                </div>
                <PowerOff className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <FiltersBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />
        </Card>

        {/* Bank Accounts Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base sm:text-lg">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                Cuentas Bancarias ({loading ? "..." : filteredAccounts.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loading ? (
              <TableSkeleton rows={6} columns={8} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Banco</th>
                          <th className="text-left p-3">Número de Cuenta</th>
                          <th className="text-left p-3">Tipo</th>
                          <th className="text-left p-3">Alias</th>
                          <th className="text-right p-3">Saldo Actual</th>
                          <th className="text-center p-3">Moneda</th>
                          <th className="text-center p-3">Estado</th>
                          <th className="text-center p-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((account) => (
                          <tr key={account.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {getAccountTypeIcon(account.accountType)}
                                <div>
                                  <p className="font-medium">{account.bankName}</p>
                                  {account.bankCode && (
                                    <p className="text-xs text-gray-500">Código: {account.bankCode}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="font-mono text-sm">{account.accountNumber}</p>
                            </td>
                            <td className="p-3">{getAccountTypeBadge(account.accountType)}</td>
                            <td className="p-3">
                              <p className="text-sm">{account.alias || "-"}</p>
                              {account.description && (
                                <p className="text-xs text-gray-500 truncate max-w-32" title={account.description}>
                                  {account.description}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <p
                                className={`font-medium ${account.currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {account.currency === "PEN" ? "S/" : account.currency === "USD" ? "$" : "€"}{" "}
                                {Math.abs(account.currentBalance).toLocaleString(
                                  account.currency === "PEN" ? "es-PE" : "en-US",
                                  { minimumFractionDigits: 2 },
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Inicial: {account.currency === "PEN" ? "S/" : account.currency === "USD" ? "$" : "€"}{" "}
                                {account.initialBalance.toLocaleString(account.currency === "PEN" ? "es-PE" : "en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {account.currency}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">{getStatusBadge(account.isActive)}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" title="Ver movimientos">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Editar cuenta"
                                  onClick={() => openEditModal(account)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={account.isActive ? "Desactivar" : "Activar"}
                                  onClick={() => handleToggleStatus(account)}
                                >
                                  {account.isActive ? (
                                    <PowerOff className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <Power className="w-4 h-4 text-green-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar cuenta"
                                  onClick={() => openDeleteDialog(account)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredAccounts.length === 0 && (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron cuentas bancarias con los filtros aplicados</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm">
              Página {currentPage} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog
          open={isCreateModalOpen || isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false)
              setIsEditModalOpen(false)
              setSelectedAccount(null)
              setFormData(initialFormData)
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isCreateModalOpen ? "Crear Nueva Cuenta Bancaria" : "Editar Cuenta Bancaria"}</DialogTitle>
              <DialogDescription>
                {isCreateModalOpen
                  ? "Complete la información para crear una nueva cuenta bancaria."
                  : "Modifique la información de la cuenta bancaria."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nombre del Banco *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Ej: Banco de Crédito del Perú"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Código del Banco</Label>
                  <Input
                    id="bankCode"
                    value={formData.bankCode}
                    onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                    placeholder="Ej: 002"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Número de Cuenta *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Ej: 123-456789-0-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de Cuenta *</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: BankAccountType) => setFormData({ ...formData, accountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORRIENTE">Corriente</SelectItem>
                      <SelectItem value="AHORROS">Ahorros</SelectItem>
                      <SelectItem value="PLAZO_FIJO">Plazo Fijo</SelectItem>
                      <SelectItem value="CTS">CTS</SelectItem>
                      <SelectItem value="DETRACCIONES">Detracciones</SelectItem>
                      <SelectItem value="OTROS">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">Soles (PEN)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                      <SelectItem value="EUR">Euros (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Saldo Inicial</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    step="0.01"
                    value={formData.initialBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, initialBalance: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Ej: Cuenta Principal, Cuenta Detracciones"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción adicional de la cuenta..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Cuenta activa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  setSelectedAccount(null)
                  setFormData(initialFormData)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={isCreateModalOpen ? handleCreateAccount : handleEditAccount}
                disabled={loading || !formData.bankName || !formData.accountNumber}
              >
                {loading ? "Guardando..." : isCreateModalOpen ? "Crear Cuenta" : "Actualizar Cuenta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cuenta bancaria?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta bancaria{" "}
                <strong>{selectedAccount?.accountNumber}</strong> de <strong>{selectedAccount?.bankName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
 
  )
}
