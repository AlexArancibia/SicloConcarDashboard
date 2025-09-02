"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, FileSpreadsheet, Eye, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedYear, setSelectedYear] = useState("2024")

  // Mock data based on real expense file structure
  const expenses = [
    {
      no: 5233,
      fecha: "02/01/2024",
      tipoDocumento: "I - Banco",
      estatusNet: "",
      folioFiscal: "S/C",
      proveedor: "BCP",
      concepto: "Impuesto ITF",
      monto: 0,
      total: 0.2,
      subtotal: 0.2,
      igv: 0,
      isr: 0,
      disciplina: "Corporativo",
      location: "Corporativo",
      general: "Corporativo",
      tipo: "CORP",
      cuenta: "ITF",
      subcuenta: "ITF",
      mesContable: "",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5234,
      fecha: "03/01/2024",
      tipoDocumento: "I - Banco",
      estatusNet: "",
      folioFiscal: "S/C",
      proveedor: "BCP",
      concepto: "Impuesto ITF",
      monto: 0,
      total: 38.95,
      subtotal: 38.95,
      igv: 0,
      isr: 0,
      disciplina: "Corporativo",
      location: "Corporativo",
      general: "Corporativo",
      tipo: "CORP",
      cuenta: "ITF",
      subcuenta: "ITF",
      mesContable: "",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5235,
      fecha: "03/01/2024",
      tipoDocumento: "IR",
      estatusNet: "",
      folioFiscal: "1982132639",
      proveedor: "Fontana Piskulich Lierka Marcela",
      concepto: "Renta Corporativo",
      monto: 7000.0,
      total: 7000.0,
      subtotal: 7000.0,
      igv: 0,
      isr: 0,
      disciplina: "Corporativo",
      location: "Corporativo",
      general: "Corporativo",
      tipo: "CORP",
      cuenta: "Renta y Mantenimiento",
      subcuenta: "Renta",
      mesContable: "",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5236,
      fecha: "03/01/2024",
      tipoDocumento: "R- Servicio",
      estatusNet: "",
      folioFiscal: "S002-50110254",
      proveedor: "Luz del Sur 1803083",
      concepto: "Recibo De Luz - La Estancia 4",
      monto: 2250.5,
      total: 2223.89,
      subtotal: 1884.65,
      igv: 339.24,
      isr: 0,
      disciplina: "Cycling",
      location: "La Estancia",
      general: "Operativo",
      tipo: "SG&A",
      cuenta: "Utilities",
      subcuenta: "Electricidad",
      mesContable: "Diciembre",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5237,
      fecha: "03/01/2024",
      tipoDocumento: "",
      estatusNet: "",
      folioFiscal: "",
      proveedor: "Luz del Sur 1803083",
      concepto: "Otros Gastos Adicionales",
      monto: 0,
      total: 26.61,
      subtotal: 26.61,
      igv: 0,
      isr: 0,
      disciplina: "Cycling",
      location: "La Estancia",
      general: "Operativo",
      tipo: "SG&A",
      cuenta: "Utilities",
      subcuenta: "Electricidad",
      mesContable: "Diciembre",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: true, // Marca como subitem del documento anterior
    },
    {
      no: 5238,
      fecha: "03/01/2024",
      tipoDocumento: "LBS",
      estatusNet: "",
      folioFiscal: "S/C",
      proveedor: "Mosquera Rodriguez Cesar Andres",
      concepto: "Liquidacion",
      monto: 1394.81,
      total: 1394.81,
      subtotal: 1394.81,
      igv: 0,
      isr: 0,
      disciplina: "",
      location: "San Isidro",
      general: "Operativos",
      tipo: "SG&A",
      cuenta: "Staff",
      subcuenta: "FD",
      mesContable: "Diciembre",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5239,
      fecha: "03/01/2024",
      tipoDocumento: "R- Servicio",
      estatusNet: "",
      folioFiscal: "S002-50110253",
      proveedor: "Luz del Sur 1803082",
      concepto: "Recibo De Luz - La Estancia 3",
      monto: 910.1,
      total: 899.9,
      subtotal: 762.62,
      igv: 137.28,
      isr: 0,
      disciplina: "Cycling",
      location: "La Estancia",
      general: "Operativo",
      tipo: "SG&A",
      cuenta: "Utilities",
      subcuenta: "Electricidad",
      mesContable: "Diciembre",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5240,
      fecha: "03/01/2024",
      tipoDocumento: "",
      estatusNet: "",
      folioFiscal: "",
      proveedor: "Luz del Sur 1803082",
      concepto: "Otros Gastos Adicionales",
      monto: 0,
      total: 10.2,
      subtotal: 10.2,
      igv: 0,
      isr: 0,
      disciplina: "Cycling",
      location: "La Estancia",
      general: "Operativo",
      tipo: "SG&A",
      cuenta: "Utilities",
      subcuenta: "Electricidad",
      mesContable: "Diciembre",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: true, // Marca como subitem del documento anterior
    },
    {
      no: 5241,
      fecha: "03/01/2024",
      tipoDocumento: "LBS",
      estatusNet: "",
      folioFiscal: "",
      proveedor: "Pinto Kajatt Yousef",
      concepto: "Liquidacion",
      monto: 878.83,
      total: 874.53,
      subtotal: 874.53,
      igv: 0,
      isr: 0,
      disciplina: "Cycling",
      location: "Primavera",
      general: "Operativos",
      tipo: "SG&A",
      cuenta: "Staff",
      subcuenta: "FD",
      mesContable: "Diciembre",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
    {
      no: 5242,
      fecha: "03/01/2024",
      tipoDocumento: "C - Banco",
      estatusNet: "",
      folioFiscal: "S/C",
      proveedor: "BCP",
      concepto: "Comision Bancaria",
      monto: 0,
      total: 4.3,
      subtotal: 4.3,
      igv: 0,
      isr: 0,
      disciplina: "Corporativo",
      location: "Corporativo",
      general: "Corporativo",
      tipo: "CORP",
      cuenta: "Otros Corporativo",
      subcuenta: "Comisiones corp",
      mesContable: "",
      cuentaContable: "",
      comentarios: "",
      ruc: "",
      fechaComprobante: "",
      emisionComprobante: "",
      fechaVencimiento: "",
      masivo: "",
      isSubItem: false,
    },
  ]

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "I - Banco":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            ITF
          </Badge>
        )
      case "R- Servicio":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Servicio
          </Badge>
        )
      case "IR":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          >
            Renta
          </Badge>
        )
      case "FT":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          >
            Factura
          </Badge>
        )
      case "RH":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            RH
          </Badge>
        )
      case "LBS":
        return (
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
            Liquidación
          </Badge>
        )
      case "C - Banco":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Comisión
          </Badge>
        )
      case "PM":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
          >
            Pago Móvil
          </Badge>
        )
      case "Planilla":
        return (
          <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
            Planilla
          </Badge>
        )
      default:
        return null
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.folioFiscal.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = expense.fecha.includes(selectedYear)

    return matchesSearch && matchesYear
  })

  const getExpensesByAccount = (account: string) => {
    switch (account) {
      case "193-2519100-0-54":
        return filteredExpenses // Esta es la cuenta 9100 del ejemplo
      case "011-0-123456789":
        return [] // Cuenta BBVA USD - sin datos en el ejemplo
      case "898-3001234567":
        return [] // Cuenta Interbank Soles - sin datos en el ejemplo
      case "002-3001234568":
        return [] // Cuenta Interbank USD - sin datos en el ejemplo
      case "00-000-714151":
        return [] // Cuenta Detracciones - sin datos en el ejemplo
      case "cuentas-soles":
        return filteredExpenses // Todas las cuentas en soles
      case "cuentas-dolares":
        return [] // Sin datos de cuentas en dólares en el ejemplo
      default:
        return filteredExpenses
    }
  }

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.total, 0)

  const renderExpenseTable = (expenses: typeof filteredExpenses) => (
    <div className="overflow-x-auto">
      <div className="min-w-[2000px]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-card-foreground">No</th>
              <th className="text-left p-2 text-card-foreground">Fecha</th>
              <th className="text-left p-2 text-card-foreground">Tipo Doc</th>
              <th className="text-left p-2 text-card-foreground">Folio Fiscal</th>
              <th className="text-left p-2 text-card-foreground">Proveedor</th>
              <th className="text-left p-2 text-card-foreground">Concepto</th>
              <th className="text-right p-2 text-card-foreground">Monto</th>
              <th className="text-right p-2 text-card-foreground">Total</th>
              <th className="text-right p-2 text-card-foreground">Subtotal</th>
              <th className="text-right p-2 text-card-foreground">IGV</th>
              <th className="text-right p-2 text-card-foreground">ISR</th>
              <th className="text-left p-2 text-card-foreground">Disciplina</th>
              <th className="text-left p-2 text-card-foreground">Location</th>
              <th className="text-left p-2 text-card-foreground">General</th>
              <th className="text-left p-2 text-card-foreground">Tipo</th>
              <th className="text-left p-2 text-card-foreground">Cuenta</th>
              <th className="text-left p-2 text-card-foreground">Subcuenta</th>
              <th className="text-left p-2 text-card-foreground">Mes Contable</th>
              <th className="text-center p-2 text-card-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => (
              <tr
                key={expense.no}
                className={`border-b border-border hover:bg-muted/30 ${expense.isSubItem ? "bg-muted/20" : ""}`}
              >
                <td className="p-2 font-mono text-card-foreground">
                  {expense.isSubItem ? <span className="ml-4 text-muted-foreground">{expense.no}</span> : expense.no}
                </td>
                <td className="p-2 text-card-foreground">{expense.fecha}</td>
                <td className="p-2">
                  {expense.isSubItem ? (
                    <div className="ml-4 w-2 h-2 rounded-full bg-muted-foreground"></div>
                  ) : (
                    getTypeBadge(expense.tipoDocumento)
                  )}
                </td>
                <td className="p-2 font-mono text-card-foreground">{expense.folioFiscal}</td>
                <td className="p-2 max-w-32 truncate text-card-foreground" title={expense.proveedor}>
                  {expense.isSubItem ? (
                    <span className="ml-4 text-muted-foreground">{expense.proveedor}</span>
                  ) : (
                    expense.proveedor
                  )}
                </td>
                <td className="p-2 max-w-40 truncate text-card-foreground" title={expense.concepto}>
                  {expense.isSubItem ? (
                    <span className="ml-4 text-muted-foreground">{expense.concepto}</span>
                  ) : (
                    expense.concepto
                  )}
                </td>
                <td className="p-2 text-right font-mono text-card-foreground">
                  {expense.monto > 0 ? expense.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "-"}
                </td>
                <td className="p-2 text-right font-mono font-semibold text-card-foreground">
                  {expense.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2 text-right font-mono text-card-foreground">
                  {expense.subtotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2 text-right font-mono text-card-foreground">
                  {expense.igv > 0 ? expense.igv.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "-"}
                </td>
                <td className="p-2 text-right font-mono text-card-foreground">
                  {expense.isr > 0 ? expense.isr.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "-"}
                </td>
                <td className="p-2 text-card-foreground">
                  {expense.disciplina && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs"
                    >
                      {expense.disciplina}
                    </Badge>
                  )}
                </td>
                <td className="p-2 text-card-foreground">{expense.location}</td>
                <td className="p-2 text-card-foreground">{expense.general}</td>
                <td className="p-2 text-card-foreground">{expense.tipo}</td>
                <td className="p-2 text-card-foreground">{expense.cuenta}</td>
                <td className="p-2 text-card-foreground">{expense.subcuenta}</td>
                <td className="p-2 text-card-foreground">{expense.mesContable}</td>
                <td className="p-2">
                  <div className="flex items-center justify-center">
                    <Button variant="ghost" size="sm" title="Ver detalles">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <>
      {/* Header Section - Título, descripción y botones por fuera */}
      <div className="space-y-4 sm:space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center py-4 sm:py-8 pl-2 sm:pb-2 pb-2">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Reportes</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Archivo de gastos y reportes contables
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="default" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button size="default" className="w-full sm:w-auto">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Generar Reporte</span>
              <span className="sm:hidden">Reporte</span>
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-card-foreground">Filtros:</span>
              </div>
              <div className="flex-1 min-w-48 max-w-md">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                  <Input
                    placeholder="Proveedor, Concepto, Folio..."
                    className="pl-7 h-8 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="min-w-32">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Tabs */}
        <Tabs defaultValue="193-2519100-0-54" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="193-2519100-0-54">CTA-9100 (S/)</TabsTrigger>
            <TabsTrigger value="011-0-123456789">CTA-6789 (USD)</TabsTrigger>
            <TabsTrigger value="898-3001234567">CTA-4567 (S/)</TabsTrigger>
            <TabsTrigger value="002-3001234568">CTA-4568 (USD)</TabsTrigger>
            <TabsTrigger value="00-000-714151">CTA-4151 (S/)</TabsTrigger>
            <TabsTrigger value="cuentas-soles">Cuentas Soles</TabsTrigger>
            <TabsTrigger value="cuentas-dolares">Cuentas Dólares</TabsTrigger>
          </TabsList>

          <TabsContent value="193-2519100-0-54" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - CTA-9100 (Soles) ({getExpensesByAccount("193-2519100-0-54").length}
                  )
                  <div className="ml-auto text-sm font-normal text-muted-foreground">
                    Total: S/{" "}
                    {getExpensesByAccount("193-2519100-0-54")
                      .reduce((sum, exp) => sum + exp.total, 0)
                      .toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("193-2519100-0-54"))}
                {getExpensesByAccount("193-2519100-0-54").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="011-0-123456789" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - CTA-6789 (Dólares) (
                  {getExpensesByAccount("011-0-123456789").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("011-0-123456789"))}
                {getExpensesByAccount("011-0-123456789").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="898-3001234567" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - CTA-4567 (Soles) ({getExpensesByAccount("898-3001234567").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("898-3001234567"))}
                {getExpensesByAccount("898-3001234567").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="002-3001234568" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - CTA-4568 (Dólares) ({getExpensesByAccount("002-3001234568").length}
                  )
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("002-3001234568"))}
                {getExpensesByAccount("002-3001234568").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="00-000-714151" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - CTA-4151 (Soles) ({getExpensesByAccount("00-000-714151").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("00-000-714151"))}
                {getExpensesByAccount("00-000-714151").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cuentas-soles" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - Todas las Cuentas en Soles (
                  {getExpensesByAccount("cuentas-soles").length})
                  <div className="ml-auto text-sm font-normal text-muted-foreground">
                    Total: S/{" "}
                    {getExpensesByAccount("cuentas-soles")
                      .reduce((sum, exp) => sum + exp.total, 0)
                      .toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("cuentas-soles"))}
                {getExpensesByAccount("cuentas-soles").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cuentas-dolares" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Archivo de Gastos {selectedYear} - Todas las Cuentas en Dólares (
                  {getExpensesByAccount("cuentas-dolares").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderExpenseTable(getExpensesByAccount("cuentas-dolares"))}
                {getExpensesByAccount("cuentas-dolares").length === 0 && (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Statistics Cards */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              Resumen de Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl sm:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-2">
                  {filteredExpenses.length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-300">Total Registros</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl sm:text-3xl font-medium text-green-600 dark:text-green-400 mb-2">
                  S/ {totalAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs sm:text-sm font-normal text-green-700 dark:text-green-300">Total Monto</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-2xl sm:text-3xl font-medium text-amber-600 dark:text-amber-400 mb-2">
                  {filteredExpenses.filter((e) => e.igv > 0).length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-amber-700 dark:text-amber-300">Con IGV</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-2xl sm:text-3xl font-medium text-purple-600 dark:text-purple-400 mb-2">
                  {filteredExpenses.filter((e) => e.isr > 0).length}
                </div>
                <p className="text-xs sm:text-sm font-normal text-purple-700 dark:text-purple-300">Con ISR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
