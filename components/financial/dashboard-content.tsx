"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Wallet, AlertTriangle, CheckCircle, Download, Upload, GitMerge, Building2 } from "lucide-react"
import BankAccountsSummary from "./bank-accounts-summary"
import { useState } from "react"
import XMLImportModal from "./xml-import-modal"
import { useDocumentsStore } from "@/stores/documents-store"
import { useMovementsStore } from "@/stores/movements-store"
import { useDetractionsStore } from "@/stores/detractions-store"
import { useReconciliationStore } from "@/stores/reconciliation-store"

export default function DashboardContent() {
  const [xmlImportOpen, setXmlImportOpen] = useState(false)

  // Zustand stores
  const { documents, fetchDocuments, importDocuments } = useDocumentsStore()
  const { movements, fetchMovements } = useMovementsStore()
  const { detractions, fetchDetractions } = useDetractionsStore()
  const { reconciledDocuments, fetchReconciledDocuments } = useReconciliationStore()

  useEffect(() => {
    fetchDocuments()
    fetchMovements()
    fetchDetractions()
    fetchReconciledDocuments()
  }, [fetchDocuments, fetchMovements, fetchDetractions, fetchReconciledDocuments])

  const stats = [
    {
      title: "Documentos Pendientes",
      value: documents.filter((doc) => doc.status === "pending").length.toString(),
      description: "Facturas sin conciliar",
      icon: FileText,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Movimientos Bancarios",
      value: movements.filter((mov) => !mov.reconciled).length.toString(),
      description: "Sin procesar",
      icon: Wallet,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Conciliaciones Hoy",
      value: reconciledDocuments
        .filter((doc) => doc.reconciliationDate === new Date().toLocaleDateString("es-PE"))
        .length.toString(),
      description: "Procesadas exitosamente",
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Alertas Activas",
      value: detractions.filter((det) => det.status === "overdue").length.toString(),
      description: "Requieren atención",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10 border-red-500/20",
    },
  ]

  const recentDocuments = documents.slice(0, 3).map((doc) => ({
    id: doc.id,
    supplier: doc.supplier,
    amount: `${doc.currency} ${doc.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
    date: doc.date,
    status: doc.status,
    type: doc.type,
  }))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "reconciled":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Conciliado
          </Badge>
        )
      case "partial":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Parcial
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            Desconocido
          </Badge>
        )
    }
  }

  const handleXMLImport = (importedDocuments: any[]) => {
    importDocuments(importedDocuments)
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Dashboard Financiero</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Resumen de actividades y conciliaciones</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
            onClick={() => setXmlImportOpen(true)}
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Importar XML</span>
            <span className="sm:hidden">XML</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground leading-tight">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-lg border ${stat.bgColor} flex-shrink-0`}>
                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground leading-tight">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-card-foreground text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">Documentos Recientes</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Últimos documentos importados y su estado de conciliación
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {recentDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-card-foreground text-sm sm:text-base truncate">{doc.id}</span>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs border-border flex-shrink-0"
                      >
                        {doc.type === "01" ? "Factura" : "RH"}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{doc.supplier}</p>
                    <p className="text-xs text-muted-foreground">{doc.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-card-foreground text-sm sm:text-base">{doc.amount}</p>
                    <div className="mt-1">{getStatusBadge(doc.status)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" className="w-full text-sm">
                Ver Todos los Documentos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-card-foreground text-base sm:text-lg">Acciones Rápidas</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Operaciones frecuentes del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
            <Button variant="outline" className="w-full justify-start text-sm">
              <GitMerge className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Nueva Conciliación</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Importar XML SUNAT</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              <Download className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Importar Estado Bancario</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Gestionar Proveedores</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              <Wallet className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Cuentas Bancarias</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts Summary */}
      <BankAccountsSummary />
      <XMLImportModal open={xmlImportOpen} onOpenChange={setXmlImportOpen} onImportComplete={handleXMLImport} />
    </div>
  )
}
