"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Building2, Target, AlertCircle } from "lucide-react"
import { useAccountingAccountsStore } from "@/stores/accounting-accounts-store"
import { useCostCentersStore } from "@/stores/cost-centers-store"
import { useAuthStore } from "@/stores/authStore"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type {
  AccountingAccount,
  CostCenter,
  CreateAccountingAccountDto,
  CreateCostCenterDto,
  UpdateAccountingAccountDto,
  UpdateCostCenterDto,
} from "@/types/accounting"

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState("accounts")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [costCenterDialogOpen, setCostCenterDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null)
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null)

  // Form states
  const [accountForm, setAccountForm] = useState<Partial<CreateAccountingAccountDto>>({
    accountCode: "",
    accountName: "",
    accountType: "",
    description: "",
    parentAccountId: null,
    isActive: true,
    allowsTransactions: true,
    normalBalance: "DEBIT",
    taxRelevant: false,
    reconciliationRequired: false,
  })

  const [costCenterForm, setCostCenterForm] = useState<Partial<CreateCostCenterDto>>({
    code: "",
    name: "",
    description: "",
    parentCostCenterId: null,
    isActive: true,
  })

  const { toast } = useToast()
  const { user } = useAuthStore()

  // Accounting Accounts Store
  const {
    accountingAccounts,
    accountingAccountHierarchy,
    loading: accountsLoading,
    error: accountsError,
    pagination: accountsPagination,
    fetchAccountingAccounts,
    createAccountingAccount,
    updateAccountingAccount,
    deleteAccountingAccount,
    getAccountingAccountHierarchy,
    searchAccountingAccounts,
    clearError: clearAccountsError,
  } = useAccountingAccountsStore()

  // Cost Centers Store
  const {
    costCenters,
    costCenterHierarchy,
    loading: costCentersLoading,
    error: costCentersError,
    pagination: costCentersPagination,
    fetchCostCenters,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
    getCostCenterHierarchy,
    searchCostCenters,
    clearError: clearCostCentersError,
  } = useCostCentersStore()

  // Load initial data
  useEffect(() => {
    if (user?.companyId) {
      loadAccountingData()
    }
  }, [user?.companyId, activeTab, currentPage])

  // Search effect
  useEffect(() => {
    if (user?.companyId) {
      setCurrentPage(1)
      handleSearch()
    }
  }, [searchTerm])

  // Error handling
  useEffect(() => {
    if (accountsError) {
      toast({
        title: "Error",
        description: accountsError,
        variant: "destructive",
      })
      clearAccountsError()
    }
  }, [accountsError, toast, clearAccountsError])

  useEffect(() => {
    if (costCentersError) {
      toast({
        title: "Error",
        description: costCentersError,
        variant: "destructive",
      })
      clearCostCentersError()
    }
  }, [costCentersError, toast, clearCostCentersError])

  const loadAccountingData = async () => {
    if (!user?.companyId) return

    try {
      if (activeTab === "accounts") {
        await Promise.all([
          fetchAccountingAccounts(user.companyId, { page: currentPage, limit: 10 }),
          getAccountingAccountHierarchy(user.companyId),
        ])
      } else {
        await Promise.all([
          fetchCostCenters(user.companyId, { page: currentPage, limit: 10 }),
          getCostCenterHierarchy(user.companyId),
        ])
      }
    } catch (error) {
      console.error("Error loading accounting data:", error)
    }
  }

  const handleSearch = async () => {
    if (!user?.companyId) return

    try {
      if (searchTerm.trim()) {
        if (activeTab === "accounts") {
          await searchAccountingAccounts(user.companyId, searchTerm, { page: currentPage, limit: 10 })
        } else {
          await searchCostCenters(user.companyId, searchTerm, { page: currentPage, limit: 10 })
        }
      } else {
        loadAccountingData()
      }
    } catch (error) {
      console.error("Error searching:", error)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleCreateAccount = async () => {
    if (!user?.companyId) return

    try {
      const accountData: CreateAccountingAccountDto = {
        companyId: user.companyId,
        accountCode: accountForm.accountCode || "",
        accountName: accountForm.accountName || "",
        accountType: accountForm.accountType || "",
        description: accountForm.description || undefined,
        parentAccountId:
          accountForm.parentAccountId && accountForm.parentAccountId !== "none"
            ? accountForm.parentAccountId
            : undefined,
        isActive: accountForm.isActive ?? true,
      }

      const result = await createAccountingAccount(accountData)
      if (result) {
        toast({
          title: "Éxito",
          description: "Cuenta contable creada correctamente",
        })
        setAccountDialogOpen(false)
        resetAccountForm()
        loadAccountingData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la cuenta contable",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount) return

    try {
      const updateData: UpdateAccountingAccountDto = {
        accountCode: accountForm.accountCode || undefined,
        accountName: accountForm.accountName || undefined,
        accountType: accountForm.accountType || undefined,
        description: accountForm.description || undefined,
        parentAccountId:
          accountForm.parentAccountId && accountForm.parentAccountId !== "none"
            ? accountForm.parentAccountId
            : undefined,
        isActive: accountForm.isActive,
      }

      await updateAccountingAccount(editingAccount.id, updateData)
      toast({
        title: "Éxito",
        description: "Cuenta contable actualizada correctamente",
      })
      setAccountDialogOpen(false)
      setEditingAccount(null)
      resetAccountForm()
      loadAccountingData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la cuenta contable",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (confirm("¿Está seguro de que desea eliminar esta cuenta contable?")) {
      try {
        await deleteAccountingAccount(accountId)
        toast({
          title: "Éxito",
          description: "Cuenta contable eliminada correctamente",
        })
        loadAccountingData()
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar la cuenta contable",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateCostCenter = async () => {
    if (!user?.companyId) return

    try {
      const costCenterData: CreateCostCenterDto = {
        companyId: user.companyId,
        code: costCenterForm.code || "",
        name: costCenterForm.name || "",
        description: costCenterForm.description || undefined,
        parentCostCenterId:
          costCenterForm.parentCostCenterId && costCenterForm.parentCostCenterId !== "none"
            ? costCenterForm.parentCostCenterId
            : undefined,
        isActive: costCenterForm.isActive ?? true,
      }

      const result = await createCostCenter(costCenterData)
      if (result) {
        toast({
          title: "Éxito",
          description: "Centro de costo creado correctamente",
        })
        setCostCenterDialogOpen(false)
        resetCostCenterForm()
        loadAccountingData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el centro de costo",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCostCenter = async () => {
    if (!editingCostCenter) return

    try {
      const updateData: UpdateCostCenterDto = {
        code: costCenterForm.code || undefined,
        name: costCenterForm.name || undefined,
        description: costCenterForm.description || undefined,
        parentCostCenterId:
          costCenterForm.parentCostCenterId && costCenterForm.parentCostCenterId !== "none"
            ? costCenterForm.parentCostCenterId
            : undefined,
        isActive: costCenterForm.isActive,
      }

      await updateCostCenter(editingCostCenter.id, updateData)
      toast({
        title: "Éxito",
        description: "Centro de costo actualizado correctamente",
      })
      setCostCenterDialogOpen(false)
      setEditingCostCenter(null)
      resetCostCenterForm()
      loadAccountingData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el centro de costo",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCostCenter = async (costCenterId: string) => {
    if (confirm("¿Está seguro de que desea eliminar este centro de costo?")) {
      try {
        await deleteCostCenter(costCenterId)
        toast({
          title: "Éxito",
          description: "Centro de costo eliminado correctamente",
        })
        loadAccountingData()
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar el centro de costo",
          variant: "destructive",
        })
      }
    }
  }

  const openEditAccountDialog = (account: AccountingAccount) => {
    setEditingAccount(account)
    setAccountForm({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      description: account.description,
      parentAccountId: account.parentAccountId,
      isActive: account.isActive,
      allowsTransactions: account.allowsTransactions,
      normalBalance: account.normalBalance,
      taxRelevant: account.taxRelevant,
      reconciliationRequired: account.reconciliationRequired,
    })
    setAccountDialogOpen(true)
  }

  const openEditCostCenterDialog = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter)
    setCostCenterForm({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description,
      parentCostCenterId: costCenter.parentCostCenterId,
      isActive: costCenter.isActive,
      budgetAmount: costCenter.budgetAmount ? Number(costCenter.budgetAmount) : null,
      actualAmount: costCenter.actualAmount ? Number(costCenter.actualAmount) : null,
      manager: costCenter.manager,
      department: costCenter.department,
    })
    setCostCenterDialogOpen(true)
  }

  const resetAccountForm = () => {
    setAccountForm({
      accountCode: "",
      accountName: "",
      accountType: "",
      description: "",
      parentAccountId: null,
      isActive: true,
      allowsTransactions: true,
      normalBalance: "DEBIT",
      taxRelevant: false,
      reconciliationRequired: false,
    })
  }

  const resetCostCenterForm = () => {
    setCostCenterForm({
      code: "",
      name: "",
      description: "",
      parentCostCenterId: null,
      isActive: true,
      budgetAmount: null,
      actualAmount: null,
      manager: "",
      department: "",
    })
  }

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "S/ 0.00"
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return `S/ ${numAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-100 text-green-800" : ""}>
        {isActive ? "Activo" : "Inactivo"}
      </Badge>
    )
  }

  const currentPagination = activeTab === "accounts" ? accountsPagination : costCentersPagination
  const currentLoading = activeTab === "accounts" ? accountsLoading : costCentersLoading

  if (accountsError || costCentersError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error: {accountsError || costCentersError}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => {
                clearAccountsError()
                clearCostCentersError()
                loadAccountingData()
              }}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión Contable</h1>
          <p className="text-gray-600 dark:text-gray-400">Administre cuentas contables y centros de costo</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Buscar ${activeTab === "accounts" ? "cuentas contables" : "centros de costo"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="accounts">Cuentas Contables</TabsTrigger>
            <TabsTrigger value="cost-centers">Centros de Costo</TabsTrigger>
          </TabsList>

          <Dialog
            open={activeTab === "accounts" ? accountDialogOpen : costCenterDialogOpen}
            onOpenChange={activeTab === "accounts" ? setAccountDialogOpen : setCostCenterDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  if (activeTab === "accounts") {
                    setEditingAccount(null)
                    resetAccountForm()
                  } else {
                    setEditingCostCenter(null)
                    resetCostCenterForm()
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear {activeTab === "accounts" ? "Cuenta" : "Centro de Costo"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {activeTab === "accounts"
                    ? editingAccount
                      ? "Editar Cuenta Contable"
                      : "Crear Cuenta Contable"
                    : editingCostCenter
                      ? "Editar Centro de Costo"
                      : "Crear Centro de Costo"}
                </DialogTitle>
              </DialogHeader>

              {activeTab === "accounts" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountCode">Código de Cuenta *</Label>
                      <Input
                        id="accountCode"
                        value={accountForm.accountCode}
                        onChange={(e) => setAccountForm({ ...accountForm, accountCode: e.target.value })}
                        placeholder="Ej: 10101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountType">Tipo de Cuenta *</Label>
                      <Select
                        value={accountForm.accountType}
                        onValueChange={(value) => setAccountForm({ ...accountForm, accountType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASSET">Activo</SelectItem>
                          <SelectItem value="LIABILITY">Pasivo</SelectItem>
                          <SelectItem value="EQUITY">Patrimonio</SelectItem>
                          <SelectItem value="INCOME">Ingresos</SelectItem>
                          <SelectItem value="EXPENSE">Gastos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accountName">Nombre de Cuenta *</Label>
                    <Input
                      id="accountName"
                      value={accountForm.accountName}
                      onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                      placeholder="Ej: Caja y Bancos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={accountForm.description || ""}
                      onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                      placeholder="Descripción opcional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentAccount">Cuenta Padre</Label>
                    <Select
                      value={accountForm.parentAccountId || ""}
                      onValueChange={(value) =>
                        setAccountForm({ ...accountForm, parentAccountId: !value || value === "none" ? null : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta padre (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin cuenta padre</SelectItem>
                        {accountingAccountHierarchy.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="normalBalance">Saldo Normal *</Label>
                    <Select
                      value={accountForm.normalBalance}
                      onValueChange={(value) => setAccountForm({ ...accountForm, normalBalance: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEBIT">Débito</SelectItem>
                        <SelectItem value="CREDIT">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={accountForm.isActive}
                        onCheckedChange={(checked) => setAccountForm({ ...accountForm, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Activo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowsTransactions"
                        checked={accountForm.allowsTransactions}
                        onCheckedChange={(checked) => setAccountForm({ ...accountForm, allowsTransactions: checked })}
                      />
                      <Label htmlFor="allowsTransactions">Permite Transacciones</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="taxRelevant"
                        checked={accountForm.taxRelevant}
                        onCheckedChange={(checked) => setAccountForm({ ...accountForm, taxRelevant: checked })}
                      />
                      <Label htmlFor="taxRelevant">Relevante para Impuestos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="reconciliationRequired"
                        checked={accountForm.reconciliationRequired}
                        onCheckedChange={(checked) =>
                          setAccountForm({ ...accountForm, reconciliationRequired: checked })
                        }
                      />
                      <Label htmlFor="reconciliationRequired">Requiere Conciliación</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAccountDialogOpen(false)
                        setEditingAccount(null)
                        resetAccountForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}>
                      {editingAccount ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Código *</Label>
                      <Input
                        id="code"
                        value={costCenterForm.code}
                        onChange={(e) => setCostCenterForm({ ...costCenterForm, code: e.target.value })}
                        placeholder="Ej: CC001"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={costCenterForm.name}
                      onChange={(e) => setCostCenterForm({ ...costCenterForm, name: e.target.value })}
                      placeholder="Ej: Centro de Ventas Lima"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={costCenterForm.description || ""}
                      onChange={(e) => setCostCenterForm({ ...costCenterForm, description: e.target.value })}
                      placeholder="Descripción opcional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentCostCenter">Centro de Costo Padre</Label>
                    <Select
                      value={costCenterForm.parentCostCenterId || ""}
                      onValueChange={(value) =>
                        setCostCenterForm({
                          ...costCenterForm,
                          parentCostCenterId: !value || value === "none" ? null : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar centro padre (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin centro padre</SelectItem>
                        {costCenterHierarchy.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.code} - {center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campos fuera del schema backend eliminados: manager, department, budgetAmount, actualAmount */}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={costCenterForm.isActive}
                      onCheckedChange={(checked) => setCostCenterForm({ ...costCenterForm, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Activo</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCostCenterDialogOpen(false)
                        setEditingCostCenter(null)
                        resetCostCenterForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={editingCostCenter ? handleUpdateCostCenter : handleCreateCostCenter}>
                      {editingCostCenter ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Cuentas Contables ({currentLoading ? "..." : accountsPagination.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Código</th>
                          <th className="text-left p-3">Nombre</th>
                          <th className="text-left p-3">Tipo</th>
                          <th className="text-left p-3">Saldo Normal</th>
                          <th className="text-left p-3">Cuenta Padre</th>
                          <th className="text-center p-3">Nivel</th>
                          <th className="text-center p-3">Estado</th>
                          <th className="text-center p-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountingAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8">
                              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">No se encontraron cuentas contables</p>
                            </td>
                          </tr>
                        ) : (
                          accountingAccounts.map((account) => (
                            <tr key={account.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-3 font-mono font-semibold">{account.accountCode}</td>
                              <td className="p-3">
                                <div className="font-medium">{account.accountName}</div>
                                {account.description && (
                                  <div className="text-xs text-gray-500 truncate max-w-48" title={account.description}>
                                    {account.description}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{account.accountType}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant={account.normalBalance === "DEBIT" ? "default" : "secondary"}>
                                  {account.normalBalance === "DEBIT" ? "Débito" : "Crédito"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {account.parentAccount ? (
                                  <div className="text-sm">
                                    <div className="font-mono">{account.parentAccount.accountCode}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-32">
                                      {account.parentAccount.accountName}
                                    </div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline">{account.level}</Badge>
                              </td>
                              <td className="p-3 text-center">{getStatusBadge(account.isActive)}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditAccountDialog(account)}
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAccount(account.id)}
                                    title="Eliminar"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {currentPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Mostrando {(currentPagination.page - 1) * currentPagination.limit + 1} a{" "}
                        {Math.min(currentPagination.page * currentPagination.limit, currentPagination.total)} de{" "}
                        {currentPagination.total} cuentas
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPagination.page - 1)}
                          disabled={currentPagination.page <= 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        <span className="text-sm">
                          Página {currentPagination.page} de {currentPagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPagination.page + 1)}
                          disabled={currentPagination.page >= currentPagination.totalPages}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-centers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Centros de Costo ({currentLoading ? "..." : costCentersPagination.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <TableSkeleton rows={8} columns={8} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Código</th>
                          <th className="text-left p-3">Nombre</th>
                          <th className="text-left p-3">Centro Padre</th>
                          <th className="text-center p-3">Nivel</th>
                          <th className="text-center p-3">Estado</th>
                          <th className="text-center p-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costCenters.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8">
                              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">No se encontraron centros de costo</p>
                            </td>
                          </tr>
                        ) : (
                          costCenters.map((costCenter) => (
                            <tr key={costCenter.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-3 font-mono font-semibold">{costCenter.code}</td>
                              <td className="p-3">
                                <div className="font-medium">{costCenter.name}</div>
                                {costCenter.description && (
                                  <div
                                    className="text-xs text-gray-500 truncate max-w-48"
                                    title={costCenter.description}
                                  >
                                    {costCenter.description}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {costCenter.parentCostCenter ? (
                                  <div className="text-sm">
                                    <div className="font-mono">{costCenter.parentCostCenter.code}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-32">
                                      {costCenter.parentCostCenter.name}
                                    </div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline">{costCenter.level}</Badge>
                              </td>
                              <td className="p-3 text-center">{getStatusBadge(costCenter.isActive)}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditCostCenterDialog(costCenter)}
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCostCenter(costCenter.id)}
                                    title="Eliminar"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {currentPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Mostrando {(currentPagination.page - 1) * currentPagination.limit + 1} a{" "}
                        {Math.min(currentPagination.page * currentPagination.limit, currentPagination.total)} de{" "}
                        {currentPagination.total} centros de costo
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPagination.page - 1)}
                          disabled={currentPagination.page <= 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        <span className="text-sm">
                          Página {currentPagination.page} de {currentPagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPagination.page + 1)}
                          disabled={currentPagination.page >= currentPagination.totalPages}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cuentas</p>
              <p className="text-2xl font-bold">{accountsLoading ? "..." : accountsPagination.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Activas</p>
              <p className="text-2xl font-bold text-green-600">
                {accountsLoading ? "..." : accountingAccounts.filter((a) => a.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Centros</p>
              <p className="text-2xl font-bold">{costCentersLoading ? "..." : costCentersPagination.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Centros Activos</p>
              <p className="text-2xl font-bold text-blue-600">
                {costCentersLoading ? "..." : costCenters.filter((c) => c.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
