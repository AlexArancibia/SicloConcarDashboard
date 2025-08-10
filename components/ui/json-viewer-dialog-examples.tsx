"use client"

import { JsonViewerDialog } from "./json-viewer-dialog"
import { Button } from "./button"
import { Badge } from "./badge"
import { Code, FileText, Database, Settings } from "lucide-react"

// Ejemplos de uso del componente JsonViewerDialog mejorado
export function JsonViewerDialogExamples() {
  // Datos de ejemplo más complejos para mostrar el formateo
  const sampleDocument = {
    id: "doc-123",
    series: "F001",
    number: "00012345",
    fullNumber: "F001-00012345",
    supplier: {
      id: "supp-456",
      businessName: "Empresa Ejemplo S.A.C.",
      documentNumber: "20123456789",
      address: "Av. Principal 123, Lima, Perú",
      contact: {
        email: "contacto@empresa.com",
        phone: "+51 1 234 5678"
      }
    },
    amounts: {
      subtotal: 847.46,
      igv: 152.54,
      total: 1000.00,
      currency: "PEN"
    },
    status: "APPROVED",
    dates: {
      issueDate: "2024-01-15T10:30:00Z",
      dueDate: "2024-02-15T10:30:00Z",
      createdAt: "2024-01-15T08:00:00Z"
    },
    metadata: {
      tags: ["factura", "servicios", "enero-2024"],
      notes: "Factura por servicios de consultoría",
      hasRetention: false,
      hasDetraction: false
    }
  }

  const sampleTransaction = {
    id: "txn-456",
    type: "EXPENSE",
    amount: 500.00,
    description: "Pago de servicios de mantenimiento de servidores",
    category: "IT Services",
    account: {
      code: "6.2.1",
      name: "Servicios de Mantenimiento"
    },
    costCenter: {
      code: "IT-001",
      name: "Departamento de Tecnología"
    },
    date: "2024-01-15",
    status: "APPROVED",
    attachments: [
      "invoice-001.pdf",
      "receipt-001.pdf"
    ]
  }

  const sampleSettings = {
    theme: "dark",
    language: "es",
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    preferences: {
      autoSave: false,
      autoBackup: true,
      compactMode: false
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 3600,
      passwordExpiry: 90
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Ejemplos del JsonViewerDialog Mejorado</h2>
      <p className="text-muted-foreground">
        Componente con formateo de colores, saltos de línea automáticos y scroll horizontal
      </p>
      
      {/* Ejemplo 1: Documento complejo */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Documento Complejo</h3>
        <p className="text-sm text-muted-foreground">
          Muestra un documento con estructura anidada y múltiples tipos de datos
        </p>
        <JsonViewerDialog
          title="Documento Completo"
          description="Documento con proveedor, montos, fechas y metadatos"
          data={sampleDocument}
          size="xl"
        />
      </div>

      {/* Ejemplo 2: Transacción financiera */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">2. Transacción Financiera</h3>
        <p className="text-sm text-muted-foreground">
          Transacción con cuentas, centros de costo y archivos adjuntos
        </p>
        <JsonViewerDialog
          title="Transacción Financiera"
          description="Datos completos de la transacción"
          data={sampleTransaction}
          trigger={
            <Button variant="secondary" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Ver Transacción
            </Button>
          }
        />
      </div>

      {/* Ejemplo 3: Configuración del sistema */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">3. Configuración del Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Configuración con preferencias anidadas y opciones de seguridad
        </p>
        <JsonViewerDialog
          title="Configuración del Sistema"
          description="Preferencias, notificaciones y configuración de seguridad"
          data={sampleSettings}
          size="lg"
        />
      </div>

      {/* Ejemplo 4: Diferentes tamaños */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">4. Comparación de Tamaños</h3>
        <p className="text-sm text-muted-foreground">
          Prueba diferentes tamaños del dialog para ver la adaptabilidad
        </p>
        <div className="flex flex-wrap gap-2">
          <JsonViewerDialog
            title="Pequeño"
            description="Tamaño compacto"
            data={sampleSettings}
            size="sm"
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Pequeño
              </Button>
            }
          />
          <JsonViewerDialog
            title="Mediano"
            description="Tamaño estándar"
            data={sampleSettings}
            size="default"
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Mediano
              </Button>
            }
          />
          <JsonViewerDialog
            title="Grande"
            description="Tamaño amplio"
            data={sampleSettings}
            size="lg"
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Grande
              </Button>
            }
          />
          <JsonViewerDialog
            title="Extra Grande"
            description="Máximo espacio disponible"
            data={sampleSettings}
            size="xl"
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Extra Grande
              </Button>
            }
          />
        </div>
      </div>

      {/* Ejemplo 5: Con badge personalizado */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">5. Trigger Personalizado</h3>
        <p className="text-sm text-muted-foreground">
          Diferentes formas de activar el dialog
        </p>
        <div className="flex flex-wrap gap-2">
          <JsonViewerDialog
            title="Con Badge"
            description="Usando un badge como trigger"
            data={sampleDocument}
            trigger={
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                <Code className="h-3 w-3 mr-1" />
                Ver JSON
              </Badge>
            }
          />
          <JsonViewerDialog
            title="Con Icono"
            description="Solo icono como trigger"
            data={sampleTransaction}
            trigger={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FileText className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
} 