'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'
import { useConcarStore } from '@/stores/concar-store'

export default function ConcarTestPage() {
  const companyId = 'cmp_a454f59f-2f19' // ID de la compañía de ejemplo
  const [currency, setCurrency] = useState<string>('PEN')
  const [bankAccountId, setBankAccountId] = useState<string>('')

  // Obtener el store
  const {
    data,
    loading,
    error,
    pagination,
    summary,
    summaryLoading,
    summaryError,
    bankAccounts,
    bankAccountsLoading,
    bankAccountsError,
    currencies,
    currenciesLoading,
    currenciesError,
    exportLoading,
    exportProgress,
    currentFilters,
    fetchConcarData,
    fetchConcarSummary,
    fetchBankAccountsByCurrency,
    fetchCurrenciesWithBankAccounts,
    fetchConcarDataByCurrency,
    exportConcarData,
    clearErrors,
    resetExportState,
    setCurrentFilters,
    clearData,
  } = useConcarStore()

  // Estado para los filtros
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    bankAccountId: '',
    conciliationType: undefined,
    conciliationStatus: undefined,
    transactionType: '',
    documentType: undefined,
    supplierId: '',
    page: 1,
    limit: 10,
  })

  // Cargar datos iniciales
  useEffect(() => {
    fetchCurrenciesWithBankAccounts(companyId)
  }, [])

  // Cuando cambia la moneda, cargar cuentas bancarias
  useEffect(() => {
    if (currency) {
      fetchBankAccountsByCurrency(companyId, currency)
    }
  }, [currency])

  // Handler para cambios en los filtros
  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    setCurrentFilters(newFilters)
  }

  // Handler para buscar datos
  const handleSearch = () => {
    fetchConcarData(companyId, filters)
    fetchConcarSummary(companyId, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      bankAccountId: filters.bankAccountId,
      conciliationType: filters.conciliationType,
      conciliationStatus: filters.conciliationStatus,
    })
  }

  // Handler para buscar por moneda
  const handleSearchByCurrency = () => {
    fetchConcarDataByCurrency(companyId, currency, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      conciliationType: filters.conciliationType,
      conciliationStatus: filters.conciliationStatus,
      transactionType: filters.transactionType,
      documentType: filters.documentType,
      supplierId: filters.supplierId,
      page: filters.page,
      limit: filters.limit
    })
  }

  // Handler para exportar datos
  const handleExport = (format: 'csv' | 'excel') => {
    exportConcarData(companyId, filters, format)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Prueba de Endpoints CONCAR</h1>
        <p className="text-sm text-muted-foreground">
          Company ID: <span className="font-mono">{companyId}</span>
        </p>
      </div>

      <Separator />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Fecha inicio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? (
                      format(new Date(filters.startDate), 'PPP', { locale: es })
                    ) : (
                      <span>Seleccione una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(filters.startDate)}
                    onSelect={(date) =>
                      handleFilterChange('startDate', format(date || new Date(), 'yyyy-MM-dd'))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? (
                      format(new Date(filters.endDate), 'PPP', { locale: es })
                    ) : (
                      <span>Seleccione una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(filters.endDate)}
                    onSelect={(date) =>
                      handleFilterChange('endDate', format(date || new Date(), 'yyyy-MM-dd'))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Moneda */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Moneda</label>
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(value)}
                disabled={currenciesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {`${curr.name} (${curr.symbol})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cuenta bancaria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cuenta bancaria</label>
              <Select
                value={filters.bankAccountId}
                onValueChange={(value) => handleFilterChange('bankAccountId', value)}
                disabled={bankAccountsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {`${account.accountNumber} - ${account.alias || account.description || 'Sin alias'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tipo conciliación */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo conciliación</label>
              <Select
                value={filters.conciliationType}
                onValueChange={(value) => handleFilterChange('conciliationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCUMENTS">Documentos</SelectItem>
                  <SelectItem value="DETRACTIONS">Detracciones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado conciliación */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado conciliación</label>
              <Select
                value={filters.conciliationStatus}
                onValueChange={(value) => handleFilterChange('conciliationStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ID Proveedor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Proveedor</label>
              <Input
                placeholder="Ingrese ID proveedor"
                value={filters.supplierId}
                onChange={(e) => handleFilterChange('supplierId', e.target.value)}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleSearchByCurrency}
                disabled={loading}
              >
                Buscar por Moneda
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar errores */}
      {(error || summaryError || bankAccountsError || currenciesError) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {summaryError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error en resumen</AlertTitle>
                <AlertDescription>{summaryError}</AlertDescription>
              </Alert>
            )}
            {bankAccountsError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error en cuentas</AlertTitle>
                <AlertDescription>{bankAccountsError}</AlertDescription>
              </Alert>
            )}
            {currenciesError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error en monedas</AlertTitle>
                <AlertDescription>{currenciesError}</AlertDescription>
              </Alert>
            )}
            <Button variant="outline" onClick={clearErrors}>
              Limpiar errores
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumen CONCAR */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen CONCAR</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Conciliaciones Totales
                </h3>
                <p className="text-2xl font-bold">{summary.total_conciliations}</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Documentos
                </h3>
                <p className="text-2xl font-bold">{summary.total_documents}</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Monto Conciliado
                </h3>
                <p className="text-2xl font-bold">
                  {summary.total_conciliation_amount.toFixed(2)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Saldo Banco
                </h3>
                <p className="text-2xl font-bold">
                  {summary.total_bank_balance.toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No hay datos de resumen disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* Datos CONCAR */}
      <Card>
        <CardHeader>
          <CardTitle>Datos CONCAR</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Fecha Transacción</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado Conciliación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.conciliation_id}>
                      <TableCell>{item.accountNumber}</TableCell>
                      <TableCell>{item.currency}</TableCell>
                      <TableCell>
                        {format(new Date(item.transactionDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{item.transaction_description}</TableCell>
                      <TableCell>{item.amount.toFixed(2)}</TableCell>
                      <TableCell>{item.balance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.conciliation_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages} - Total:{' '}
                  {pagination.total} registros
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => {
                      handleFilterChange('page', pagination.page - 1)
                      handleSearch()
                    }}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => {
                      handleFilterChange('page', pagination.page + 1)
                      handleSearch()
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => handleExport('excel')} disabled={exportLoading}>
                  {exportLoading ? 'Exportando...' : 'Exportar a Excel'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  disabled={exportLoading}
                >
                  Exportar a CSV
                </Button>
              </div>

              {exportLoading && (
                <div className="mt-4 space-y-2">
                  <Progress value={exportProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Progreso: {exportProgress}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No hay datos disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* Información de monedas y cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monedas disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {currenciesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : currencies.length > 0 ? (
              <div className="space-y-2">
                {currencies.map((curr) => (
                  <div
                    key={curr.code}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{curr.name}</p>
                      <p className="text-sm text-muted-foreground">{curr.code}</p>
                    </div>
                    <Badge variant="outline">{curr.symbol}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay monedas disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuentas bancarias ({currency})</CardTitle>
          </CardHeader>
          <CardContent>
            {bankAccountsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : bankAccounts.length > 0 ? (
              <div className="space-y-2">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-3 border rounded-lg space-y-1"
                  >
                    <p className="font-medium">{account.accountNumber}</p>
                    <p className="text-sm">
                      {account.alias || account.description || 'Sin alias'}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{account.accountType}</Badge>
                      <Badge variant="outline">{account.currency}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No hay cuentas disponibles para esta moneda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="destructive" onClick={clearData}>
            Limpiar todos los datos
          </Button>
          <Button variant="outline" onClick={resetExportState}>
            Reiniciar estado de exportación
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}