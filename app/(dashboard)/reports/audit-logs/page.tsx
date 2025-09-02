"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  User,
  Database,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Clock,
  Hash,
  UserCheck,
  FileText,
  CreditCard,
  Building2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useAuditLogsStore } from "@/stores/audit-logs-store"
import { useAuthStore } from "@/stores/authStore"
import { formatDate } from "@/lib/utils"

const getActionBadge = (action: string) => {
  const actionConfig: Record<string, { class: string; label: string; icon: any }> = {
    CREATE: { class: "bg-green-100 text-green-800 dark:bg-green-900/30", label: "Crear", icon: FileText },
    UPDATE: { class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30", label: "Actualizar", icon: RefreshCw },
    DELETE: { class: "bg-red-100 text-red-800 dark:bg-red-900/30", label: "Eliminar", icon: Hash },
    LOGIN: { class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30", label: "Inicio Sesión", icon: UserCheck },
    LOGOUT: { class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30", label: "Cerrar Sesión", icon: User },
    EXPORT: { class: "bg-purple-100 text-purple-800 dark:bg-purple-900/30", label: "Exportar", icon: Database },
    IMPORT: { class: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30", label: "Importar", icon: Database },
  }
  
  const config = actionConfig[action] || { class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30", label: action, icon: Activity }
  const Icon = config.icon
  return <Badge className={`${config.class} flex items-center gap-1`}><Icon className="h-3 w-3" />{config.label}</Badge>
}

const getEntityIcon = (entity: string) => {
  const entityConfig: Record<string, { icon: any; label: string }> = {
    User: { icon: User, label: "Usuario" },
    Transaction: { icon: CreditCard, label: "Transacción" },
    Document: { icon: FileText, label: "Documento" },
    Conciliation: { icon: RefreshCw, label: "Conciliación" },
    Company: { icon: Building2, label: "Empresa" },
    BankAccount: { icon: Building2, label: "Cuenta Bancaria" },
    Supplier: { icon: User, label: "Proveedor" },
    Expense: { icon: FileText, label: "Gasto" },
    AccountingEntry: { icon: FileText, label: "Asiento Contable" },
  }
  
  const config = entityConfig[entity] || { icon: Database, label: entity }
  const Icon = config.icon
  return <div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span>{config.label}</span></div>
}

export default function AuditLogsPage() {
  const { user } = useAuthStore()
  const {
    auditLogs,
    loading,
    error,
    total,
    page,
    limit,
    totalPages,
    fetchAuditLogs,
    getAuditLogsByUser,
    getAuditLogsByEntity,
    clearError,
  } = useAuditLogsStore()

  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    entity: "all",
    dateFrom: "",
    dateTo: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  useEffect(() => {
    if (user?.companyId) {
      loadAuditLogs()
    }
  }, [user?.companyId, currentPage, activeTab])

  const loadAuditLogs = async () => {
    if (!user?.companyId) return

    if (activeTab === "all") {
      await fetchAuditLogs(user.companyId, { page: currentPage, limit: itemsPerPage })
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadAuditLogs()
  }

  const handleClearFilters = () => {
    setFilters({
      search: "",
      action: "all",
      entity: "all",
      dateFrom: "",
      dateTo: "",
    })
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error cargando audit logs: {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={clearError}>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Registro de todas las actividades y cambios en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadAuditLogs()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar en descripción..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Acción</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="CREATE">Crear</SelectItem>
                  <SelectItem value="UPDATE">Actualizar</SelectItem>
                  <SelectItem value="DELETE">Eliminar</SelectItem>
                  <SelectItem value="LOGIN">Inicio Sesión</SelectItem>
                  <SelectItem value="LOGOUT">Cerrar Sesión</SelectItem>
                  <SelectItem value="EXPORT">Exportar</SelectItem>
                  <SelectItem value="IMPORT">Importar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity">Entidad</Label>
              <Select value={filters.entity} onValueChange={(value) => handleFilterChange("entity", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  <SelectItem value="User">Usuario</SelectItem>
                  <SelectItem value="Transaction">Transacción</SelectItem>
                  <SelectItem value="Document">Documento</SelectItem>
                  <SelectItem value="Conciliation">Conciliación</SelectItem>
                  <SelectItem value="Company">Empresa</SelectItem>
                  <SelectItem value="BankAccount">Cuenta Bancaria</SelectItem>
                  <SelectItem value="Supplier">Proveedor</SelectItem>
                  <SelectItem value="Expense">Gasto</SelectItem>
                  <SelectItem value="AccountingEntry">Asiento Contable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateTo">Fecha Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos los Logs</TabsTrigger>
          <TabsTrigger value="users">Actividad de Usuarios</TabsTrigger>
          <TabsTrigger value="entities">Cambios por Entidad</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Tabla de Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Registro de Actividades ({total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={10} columns={7} />
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Entidad</TableHead>
                          <TableHead>Descripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No se encontraron audit logs con los filtros aplicados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          auditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{formatDate(new Date(log.createdAt))}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(log.createdAt).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">
                                      {log.user.firstName && log.user.lastName
                                        ? `${log.user.firstName} ${log.user.lastName}`
                                        : log.user.email}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{log.user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getActionBadge(log.action)}</TableCell>
                              <TableCell>{getEntityIcon(log.entity)}</TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={log.description}>
                                  {log.description || "Sin descripción"}
                                </div>
                                {log.entityId && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    ID: {log.entityId}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 py-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {(page - 1) * limit + 1} a{" "}
                        {Math.min(page * limit, total)} de {total} logs
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(1)}
                          disabled={page <= 1 || loading}
                          className="h-8 w-8"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page <= 1 || loading}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm px-2">
                          Página {page} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages || loading}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={page >= totalPages || loading}
                          className="h-8 w-8"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Actividad de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección mostrará un resumen de la actividad de cada usuario en el sistema.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cambios por Entidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección mostrará un resumen de los cambios realizados en cada tipo de entidad.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
