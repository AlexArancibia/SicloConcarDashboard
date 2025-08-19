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
  Banknote,
  PiggyBank,
  MoreHorizontal,
} from "lucide-react"
import { useBankAccountsStore } from "@/stores/bank-accounts-store"
import { useBanksStore } from "@/stores/bank-store"
import { useAccountingAccountsStore } from "@/stores/accounting-accounts-store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { FiltersBar } from "@/components/ui/filters-bar"
import type { BankAccount, BankAccountType, CreateBankAccountDto, UpdateBankAccountDto } from "@/types/bank-accounts"
import { useAuthStore } from "@/stores/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Agregar estas funciones helper después de las importaciones y antes del componente
const getBankById = (bankId: string, banks: any[]) => {
  return banks.find((bank) => bank.id === bankId)
}

const getAccountingAccountById = (accountId: string, accountingAccounts: any[]) => {
  return accountingAccounts.find((account) => account.id === accountId)
}

interface BankAccountFormData {
  bankId: string
  accountNumber: string
  accountType: BankAccountType
  currency: string
  alias: string
  description: string
  isActive: boolean
  accountingAccountId: string
  annexCode: string
}

const initialFormData: BankAccountFormData = {
  bankId: "",
  accountNumber: "",
  accountType: "CHECKING",
  currency: "PEN",
  alias: "",
  description: "",
  isActive: true,
  accountingAccountId: "none",
  annexCode: "",
}

export default function BankAccountsPage() {
  const { toast } = useToast()
  const { user, company } = useAuthStore()
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

  const { banks, loading: banksLoading, fetchBanks } = useBanksStore()
  const { accountingAccounts, loading: accountingLoading, error: accountingError, fetchAccountingAccounts } = useAccountingAccountsStore()

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

  // Cargar cuentas bancarias y bancos al montar el componente
  useEffect(() => {


          if (company?.id) {
        fetchBankAccounts(company.id, { page: currentPage, limit: 10 })
      }

    // Cargar bancos disponibles
    if (banks.length === 0 && !banksLoading) {
      fetchBanks()
    }

    // Cargar cuentas contables disponibles
    if (company?.id && accountingAccounts.length === 0 && !accountingLoading) {
      fetchAccountingAccounts(company.id, { page: 1, limit: 100 })
    }
    

  }, [company?.id, currentPage, fetchBankAccounts, fetchBanks, fetchAccountingAccounts, banks.length, banksLoading, accountingAccounts.length, accountingLoading])

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
    if (!company?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar la empresa.",
        variant: "destructive",
      })
      return
    }

    const accountData: CreateBankAccountDto = {
      companyId: company.id,
      bankId: formData.bankId,
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      currency: formData.currency,
      alias: formData.alias || null,
      description: formData.description || null,
      isActive: formData.isActive,
      accountingAccountId: formData.accountingAccountId === "none" ? null : formData.accountingAccountId || null,
      annexCode: formData.annexCode || null,
    }

    const result = await createBankAccount(accountData)
    if (result) {
      toast({
        title: "Cuenta creada",
        description: "La cuenta bancaria se ha creado exitosamente.",
      })
      setIsCreateModalOpen(false)
      setFormData(initialFormData)
      fetchBankAccounts(company.id, { page: currentPage, limit: 10 })
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

    const updateData: UpdateBankAccountDto = {
      bankId: formData.bankId,
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      currency: formData.currency,
      alias: formData.alias || null,
      description: formData.description || null,
      isActive: formData.isActive,
      accountingAccountId: formData.accountingAccountId === "none" ? null : formData.accountingAccountId || null,
      annexCode: formData.annexCode || null,
    }

    await updateBankAccount(selectedAccount.id, updateData)
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
      if (company?.id) {
        fetchBankAccounts(company.id, { page: currentPage, limit: 10 })
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
      bankId: account.bankId,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currency: account.currency,
      alias: account.alias || "",
      description: account.description || "",
      isActive: account.isActive,
      accountingAccountId: account.accountingAccountId || "none",
      annexCode: account.annexCode || "",
    })
    setIsEditModalOpen(true)
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
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
      case "CREDIT":
        return <TrendingDown className="w-4 h-4 text-amber-400" />
      case "SAVINGS":
        return <PiggyBank className="w-4 h-4 text-blue-400" />
      case "INVESTMENT":
        return <Banknote className="w-4 h-4 text-purple-400" />
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-400" />
    }
  }

  const getAccountTypeBadge = (type: BankAccountType) => {
    const colors = {
      CHECKING: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      SAVINGS: "bg-green-500/10 text-green-600 border-green-500/20",
      CREDIT: "bg-red-500/10 text-red-600 border-red-500/20",
      INVESTMENT: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    }

    const labels = {
      CHECKING: "Corriente",
      SAVINGS: "Ahorros",
      CREDIT: "Crédito",
      INVESTMENT: "Inversión",
    }

    return (
      <Badge variant="outline" className={colors[type]}>
        {labels[type]}
      </Badge>
    )
  }

  const filteredAccounts = bankAccounts.filter((account) => {
    const bank = getBankById(account.bankId, banks)
    const bankName = bank?.name || ""
    const matchesSearch =
      bankName.toLowerCase().includes(filters.search.toLowerCase()) ||
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
        { value: "CHECKING", label: "Corriente" },
        { value: "SAVINGS", label: "Ahorros" },
        { value: "CREDIT", label: "Crédito" },
        { value: "INVESTMENT", label: "Inversión" },
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
            onClick={openCreateModal}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Cuenta</span>
            <span className="sm:hidden">Nueva</span>
          </Button>

        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <TableSkeleton rows={6} columns={9} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[1100px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Banco</th>
                        <th className="text-left p-3">Número de Cuenta</th>
                        <th className="text-left p-3">Tipo</th>
                        <th className="text-left p-3">Alias</th>
                        <th className="text-left p-3">Cuenta Contable</th>
                        <th className="text-left p-3">Anexo</th>
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
                                <p className="font-medium">
                                  {getBankById(account.bankId, banks)?.name || "Banco no especificado"}
                                </p>
                                {getBankById(account.bankId, banks)?.code && (
                                  <p className="text-xs text-gray-500">
                                    Código: {getBankById(account.bankId, banks)?.code}
                                  </p>
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
                          <td className="p-3">
                            {account.accountingAccountId ? (
                              (() => {
                                const accountingAccount = getAccountingAccountById(account.accountingAccountId, accountingAccounts)
                                return accountingAccount ? (
                                  <div>
                                    <p className="text-sm font-medium">
                                      {accountingAccount.accountCode}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate max-w-32" title={accountingAccount.accountName}>
                                      {accountingAccount.accountName}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400">Cuenta no encontrada</p>
                                )
                              })()
                            ) : (
                              <p className="text-sm text-gray-400">Sin enlazar</p>
                            )}
                          </td>
                          <td className="p-3">
                            {account.annexCode ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {account.annexCode}
                              </Badge>
                            ) : (
                              <p className="text-sm text-gray-400">-</p>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-xs">
                              {account.currency}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">{getStatusBadge(account.isActive)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditModal(account)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Editar cuenta</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(account)}>
                                    {account.isActive ? (
                                      <>
                                        <PowerOff className="mr-2 h-4 w-4 text-red-500" />
                                        <span>Desactivar</span>
                                      </>
                                    ) : (
                                      <>
                                        <Power className="mr-2 h-4 w-4 text-green-500" />
                                        <span>Activar</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(account)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Eliminar</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            <div className="space-y-2">
              <Label htmlFor="bankId">Banco *</Label>
              <Select value={formData.bankId} onValueChange={(value) => setFormData({ ...formData, bankId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name} {bank.code && `(${bank.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem value="CHECKING">Corriente</SelectItem>
                    <SelectItem value="SAVINGS">Ahorros</SelectItem>
                    <SelectItem value="CREDIT">Crédito</SelectItem>
                    <SelectItem value="INVESTMENT">Inversión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountingAccountId">Cuenta Contable</Label>
                <Select
                  value={formData.accountingAccountId}
                  onValueChange={(value) => setFormData({ ...formData, accountingAccountId: value })}
                  disabled={accountingLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={accountingLoading ? "Cargando cuentas..." : "Seleccione una cuenta contable"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cuenta contable</SelectItem>
                    {accountingAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountCode} - {account.accountName}
                      </SelectItem>
                    ))}
                    {accountingAccounts.length === 0 && !accountingLoading && (
                      <SelectItem value="no-accounts" disabled>
                        No hay cuentas contables disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {accountingError && (
                  <p className="text-xs text-red-500">Error al cargar cuentas contables: {accountingError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="annexCode">Código de Anexo</Label>
                <Input
                  id="annexCode"
                  value={formData.annexCode}
                  onChange={(e) => setFormData({ ...formData, annexCode: e.target.value })}
                  placeholder="Ej: 001, 002, etc."
                />
              </div>
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
              disabled={loading || !formData.bankId || !formData.accountNumber}
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
              <strong>{selectedAccount?.accountNumber}</strong> de{" "}
              <strong>{getBankById(selectedAccount?.bankId || "", banks)?.name}</strong>.
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
