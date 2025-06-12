"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useConciliationStore } from "@/stores/conciliation-store"
import { useAuthStore } from "@/stores/authStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Wallet, Calendar, Building2, User, Clock, Trash2, AlertTriangle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
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
import type { Conciliation, ConciliationItem } from "@/types/conciliation"

export default function ConciliationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { getConciliationById, deleteConciliation } = useConciliationStore()
  const [conciliation, setConciliation] = useState<Conciliation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const id = params?.id as string

  useEffect(() => {
    const loadConciliation = async () => {
      if (!id) {
        setError("ID de conciliación no proporcionado")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getConciliationById(id)

        if (!data) {
          setError("No se encontró la conciliación")
          return
        }

        console.log("Conciliación cargada:", data)
        setConciliation(data)
      } catch (err: any) {
        console.error("Error al cargar la conciliación:", err)
        setError(err.message || "Error al cargar la conciliación")
      } finally {
        setLoading(false)
      }
    }

    loadConciliation()
  }, [id, getConciliationById])

  const handleDelete = async () => {
    if (!id) return

    try {
      setIsDeleting(true)
      await deleteConciliation(id)

      toast({
        title: "Conciliación eliminada",
        description: "La conciliación ha sido eliminada exitosamente",
      })

      router.push("/conciliations")
    } catch (err: any) {
      console.error("Error al eliminar la conciliación:", err)

      toast({
        title: "Error",
        description: `Error al eliminar la conciliación: ${err.message || "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            En Progreso
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Completado
          </Badge>
        )
      case "REVIEWED":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          >
            Revisado
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            Aprobado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            {status}
          </Badge>
        )
    }
  }

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case "MATCHED":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Coincidencia
          </Badge>
        )
      case "PARTIAL_MATCH":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Coincidencia Parcial
          </Badge>
        )
      case "UNMATCHED":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Sin Coincidencia
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Pendiente
          </Badge>
        )
      case "DISPUTED":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          >
            Disputado
          </Badge>
        )
      case "EXCLUDED":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
            Excluido
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando conciliación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/conciliations")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Conciliaciones
          </Button>
        </div>
      </div>
    )
  }

  if (!conciliation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Conciliación no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            La conciliación solicitada no existe o no tienes permisos para verla.
          </p>
          <Button onClick={() => router.push("/conciliations")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Conciliaciones
          </Button>
        </div>
      </div>
    )
  }

  const isWithinTolerance = Math.abs(Number(conciliation.difference)) <= Number(conciliation.toleranceAmount)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/conciliations")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalle de Conciliación</h1>
            <p className="text-muted-foreground">ID: {conciliation.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(conciliation.status)}
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Período
              </div>
              <div className="text-sm">
                <p>
                  <strong>Inicio:</strong> {format(new Date(conciliation.periodStart), "dd/MM/yyyy", { locale: es })}
                </p>
                <p>
                  <strong>Fin:</strong> {format(new Date(conciliation.periodEnd), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                Cuenta Bancaria
              </div>
              <div className="text-sm">
                <p>
                  <strong>Banco:</strong> {conciliation.bankAccount?.bankName}
                </p>
                <p>
                  <strong>Cuenta:</strong> {conciliation.bankAccount?.accountNumber}
                </p>
                <p>
                  <strong>Alias:</strong> {conciliation.bankAccount?.alias}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Creado por
              </div>
              <div className="text-sm">
                <p>
                  <strong>Usuario:</strong> {conciliation.createdBy?.firstName} {conciliation.createdBy?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {conciliation.createdBy?.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Fechas
              </div>
              <div className="text-sm">
                <p>
                  <strong>Creado:</strong>{" "}
                  {format(new Date(conciliation.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
                <p>
                  <strong>Actualizado:</strong>{" "}
                  {format(new Date(conciliation.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
                {conciliation.completedAt && (
                  <p>
                    <strong>Completado:</strong>{" "}
                    {format(new Date(conciliation.completedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transacción Bancaria */}
      {conciliation.transaction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Transacción Bancaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">
                  {format(new Date(conciliation.transaction.transactionDate), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">{conciliation.transaction.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto</p>
                <p className="font-medium font-mono text-red-600">
                  S/{" "}
                  {Math.abs(Number(conciliation.transaction.amount)).toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operación</p>
                <p className="font-medium font-mono">{conciliation.transaction.operationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canal</p>
                <p className="font-medium">{conciliation.transaction.channel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="font-medium font-mono">
                  S/ {Number(conciliation.transaction.balance).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de Conciliación */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Conciliación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Saldo Bancario</p>
              <p className="text-xl font-bold text-blue-600">
                S/ {Number(conciliation.bankBalance).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground">Saldo Contable</p>
              <p className="text-xl font-bold text-green-600">
                S/ {Number(conciliation.bookBalance).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div
              className={`text-center p-4 rounded-lg border ${
                isWithinTolerance ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <p className="text-sm text-muted-foreground">Diferencia</p>
              <p className={`text-xl font-bold ${isWithinTolerance ? "text-emerald-600" : "text-red-600"}`}>
                S/ {Math.abs(Number(conciliation.difference)).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-sm text-muted-foreground">Tolerancia</p>
              <p className="text-xl font-bold text-amber-600">
                S/ {Number(conciliation.toleranceAmount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Documentos</p>
              <p className="text-2xl font-bold">{conciliation.totalDocuments}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Items Conciliados</p>
              <p className="text-2xl font-bold text-emerald-600">{conciliation.conciliatedItems}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Items Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">{conciliation.pendingItems}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items de Conciliación */}
      <Card>
        <CardHeader>
          <CardTitle>Items de Conciliación ({conciliation.items?.length || 0})</CardTitle>
          <CardDescription>Documentos incluidos en esta conciliación</CardDescription>
        </CardHeader>
        <CardContent>
          {conciliation.items && conciliation.items.length > 0 ? (
            <div className="space-y-4">
              {conciliation.items.map((item: ConciliationItem) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.document?.fullNumber}</h4>
                          {getItemStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.document?.supplier?.businessName}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Monto Documento:</span>
                            <p className="font-mono">
                              S/ {Number(item.documentAmount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monto Conciliado:</span>
                            <p className="font-mono text-emerald-600">
                              S/ {Number(item.conciliatedAmount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Diferencia:</span>
                            <p
                              className={`font-mono ${
                                Math.abs(Number(item.difference)) < 0.01 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              S/{" "}
                              {Math.abs(Number(item.difference)).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        {item.notes && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                            <strong>Notas:</strong> {item.notes}
                          </div>
                        )}
                        {item.systemNotes && (
                          <div className="mt-2 p-2 bg-blue-500/10 rounded text-sm">
                            <strong>Notas del Sistema:</strong> {item.systemNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay items de conciliación</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta conciliación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la conciliación y todos sus items asociados. Los documentos
              y transacciones volverán a su estado anterior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
