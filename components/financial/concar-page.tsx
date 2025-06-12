"use client"

import type React from "react"

import { useState } from "react"
import Layout from "../financial/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  FileSpreadsheet,
  Download,
  Info,
  FileText,
  X,
  Database,
  FolderOpen,
  Eye,
  RefreshCw,
  FileDown,
  CheckCircle2,
  Upload,
  FileUp,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipos para los datos del archivo
interface ExpenseRecord {
  id: string
  fecha: string
  ruc: string
  razonSocial: string
  tipoDocumento: string
  serie: string
  numero: string
  moneda: string
  subtotal: number
  igv: number
  total: number
  cuenta: string
  centroCosto: string
  glosa: string
  estado: "valido" | "error" | "advertencia"
  errores: string[]
  disciplina: string
  location: string
  general: string
  tipo: string
  subcuenta: string
  mesContable: string
  cuentaContable: string
  comentarios: string
  isSubItem?: boolean
}

interface FilePreview {
  fileName: string
  totalRecords: number
  validRecords: number
  errorRecords: number
  warningRecords: number
  totalAmount: number
  currency: string
  dateRange: { from: string; to: string }
  records: ExpenseRecord[]
}

// Definición de los tipos de archivos CONCAR
interface ConcarFile {
  id: string
  name: string
  description: string
  format: string
  records: number
  status: "pending" | "generated" | "error"
  downloadUrl?: string
  icon: React.ReactNode
}

// Estructura común para todas las plantillas CONCAR
interface ConcarTemplate {
  id: string
  name: string
  data: string[][]
}

// Plantilla F01: COMPRAS - Formato exacto con 3 filas y 35 columnas
const F01_TEMPLATE: ConcarTemplate = {
  id: "F01",
  name: "Formato F01",
  data: [
    // Primera fila - Encabezados
    [
      "COMPRAS",
      "SubDiario",
      "Comprobante",
      "Fecha de comprobante",
      "Fecha de documento",
      "Fecha de vencimiento o fecha de pago",
      "Tipo de Documento",
      "Número de Documento",
      "Tipo de documento de identidad",
      "Número de documento de identidad",
      "Apellidos y Nombres, denominación o razón social del proveedor",
      "Moneda",
      "Base imponible",
      "IGV",
      "ICBPER",
      "Valor de las adquisiciones no gravadas",
      "ISC",
      "Impuesto de Retención",
      "Otros tributos y cargos",
      "Importe total",
      "Número de constancia de depósito de detracción",
      "Fecha de emisión de constancia de depósito de detracción",
      "Importe detracción",
      "Código detracción",
      "Tipo de Conversión",
      "Tipo de cambio",
      "Referencia del comprobante de pago que se modifica Fecha",
      "Referencia del comprobante de pago que se modifica Tipo",
      "Referencia del comprobante de pago que se modifica Serie",
      "Referencia del comprobante de pago que se modifica Numero",
      "Número de cuenta contable por pagar",
      "Número de cuenta contable de costo o gasto",
      "Centro de costo",
      "Anexo de referencia",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo (MM0001)",
      "Solo Fecha",
      "Solo Fecha",
      "Solo Fecha",
      "Ver T.G.06 y T.G.53",
      "Serie-Número",
      "Sólo 0, 1, 4, 6, 7 y A",
      "Ingresar solo anexos.",
      "Glosa",
      "Sólo 'MN' Y 'US'",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "-",
      "Solo Fecha",
      "Sólo números",
      "-",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta",
      "Sólo números. Llenar solo si el tipo de cambio es 'C'",
      "Fecha documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Tipo de documento. Llenar solo cuando el tipo de documento. is nota de crédito o débito.",
      "Serie de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Número de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "T.G. 53 Mantenimiento en parámetros de compras.",
      "Ingresar una cuenta de gasto o costo del plan de cuentas y que no sea título.",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "Ingresar solo anexos.",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato
    [
      "Tamaño/Formato",
      "2 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "2 Caracteres",
      "20 Caracteres",
      "1 Caracter",
      "20 Caracteres",
      "40 Caracteres",
      "2 Caracteres",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "12 caracteres",
      "dd/mm/aaaa",
      "2 decimales",
      "5 Caracteres",
      "1 Caracter",
      "3 decimales",
      "dd/mm/aaaa",
      "2 caracteres",
      "10 caracteres",
      "20 caracteres",
      "8 caracteres",
      "8 caracteres",
      "6 caracteres",
      "20 caracteres",
      "Numérico",
    ],
  ],
}

// Plantilla F02: DIARIO
const F02_TEMPLATE: ConcarTemplate = {
  id: "F02",
  name: "Formato F02",
  data: [
    // Primera fila - Encabezados
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F03: Similar a F02 pero con diferentes restricciones
const F03_TEMPLATE: ConcarTemplate = {
  id: "F03",
  name: "Formato F03",
  data: [
    // Primera fila - Encabezados (mismos que F02)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F03)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F04: Similar a F02 y F03 pero con diferentes restricciones
const F04_TEMPLATE: ConcarTemplate = {
  id: "F04",
  name: "Formato F04",
  data: [
    // Primera fila - Encabezados (mismos que F02 y F03)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F04)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02 y F03)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F05: Similar a F01 pero con diferentes restricciones
const F05_TEMPLATE: ConcarTemplate = {
  id: "F05",
  name: "Formato F05",
  data: [
    // Primera fila - Encabezados (mismos que F01)
    [
      "COMPRAS",
      "SubDiario",
      "Comprobante",
      "Fecha de comprobante",
      "Fecha de documento",
      "Fecha de vencimiento o fecha de pago",
      "Tipo de Documento",
      "Número de Documento",
      "Tipo de documento de identidad",
      "Número de documento de identidad",
      "Apellidos y Nombres, denominación o razón social del proveedor",
      "Moneda",
      "Base imponible",
      "IGV",
      "ICBPER",
      "Valor de las adquisiciones no gravadas",
      "ISC",
      "Impuesto de Retención",
      "Otros tributos y cargos",
      "Importe total",
      "Número de constancia de depósito de detracción",
      "Fecha de emisión de constancia de depósito de detracción",
      "Importe detracción",
      "Código detracción",
      "Tipo de Conversión",
      "Tipo de cambio",
      "Referencia del comprobante de pago que se modifica Fecha",
      "Referencia del comprobante de pago que se modifica Tipo",
      "Referencia del comprobante de pago que se modifica Serie",
      "Referencia del comprobante de pago que se modifica Numero",
      "Número de cuenta contable por pagar",
      "Número de cuenta contable de costo o gasto",
      "Centro de costo",
      "Anexo de referencia",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F05)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo (MM0001)",
      "Solo Fecha",
      "Solo Fecha",
      "Solo Fecha",
      "Ver T.G.06 y T.G.53",
      "Serie-Número",
      "Sólo 0, 1, 4, 6, 7 y A",
      "Ingresar solo anexos.",
      "Glosa",
      "Sólo 'MN' Y 'US'",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "-",
      "Solo Fecha",
      "Sólo números",
      "-",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta",
      "Sólo números. Llenar solo si el tipo de cambio es 'C'",
      "Fecha documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Tipo de documento. Llenar solo cuando el tipo de documento is nota de crédito o débito.",
      "Serie de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Número de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "T.G. 53 Mantenimiento en parámetros de compras.",
      "Ingresar una cuenta de gasto o costo del plan de cuentas y que no sea título.",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "Ingresar solo anexos.",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F01)
    [
      "Tamaño/Formato",
      "2 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "2 Caracteres",
      "20 Caracteres",
      "1 Caracter",
      "20 Caracteres",
      "40 Caracteres",
      "2 Caracteres",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "12 caracteres",
      "dd/mm/aaaa",
      "2 decimales",
      "5 Caracteres",
      "1 Caracter",
      "3 decimales",
      "dd/mm/aaaa",
      "2 caracteres",
      "10 caracteres",
      "20 caracteres",
      "8 caracteres",
      "8 caracteres",
      "6 caracteres",
      "20 caracteres",
      "Numérico",
    ],
  ],
}

// Plantilla F06: Similar a F02, F03 y F04
const F06_TEMPLATE: ConcarTemplate = {
  id: "F06",
  name: "Formato F06",
  data: [
    // Primera fila - Encabezados (mismos que F02, F03 y F04)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F06)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02, F03 y F04)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F07: Similar a F02, F03, F04 y F06
const F07_TEMPLATE: ConcarTemplate = {
  id: "F07",
  name: "Formato F07",
  data: [
    // Primera fila - Encabezados (mismos que F02, F03, F04 y F06)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F07)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02, F03, F04 y F06)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F08: Similar a F02, F03, F04, F06 y F07
const F08_TEMPLATE: ConcarTemplate = {
  id: "F08",
  name: "Formato F08",
  data: [
    // Primera fila - Encabezados (mismos que F02, F03, F04, F06 y F07)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F08)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Espec. solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02, F03, F04, F06 y F07)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F09: Similar a F01 y F05
const F09_TEMPLATE: ConcarTemplate = {
  id: "F09",
  name: "Formato F09",
  data: [
    // Primera fila - Encabezados (mismos que F01 y F05)
    [
      "COMPRAS",
      "SubDiario",
      "Comprobante",
      "Fecha de comprobante",
      "Fecha de documento",
      "Fecha de vencimiento o fecha de pago",
      "Tipo de Documento",
      "Número de Documento",
      "Tipo de documento de identidad",
      "Número de documento de identidad",
      "Apellidos y Nombres, denominación o razón social del proveedor",
      "Moneda",
      "Base imponible",
      "IGV",
      "ICBPER",
      "Valor de las adquisiciones no gravadas",
      "ISC",
      "Impuesto de Retención",
      "Otros tributos y cargos",
      "Importe total",
      "Número de constancia de depósito de detracción",
      "Fecha de emisión de constancia de depósito de detracción",
      "Importe detracción",
      "Código detracción",
      "Tipo de Conversión",
      "Tipo de cambio",
      "Referencia del comprobante de pago que se modifica Fecha",
      "Referencia del comprobante de pago que se modifica Tipo",
      "Referencia del comprobante de pago que se modifica Serie",
      "Referencia del comprobante de pago que se modifica Numero",
      "Número de cuenta contable por pagar",
      "Número de cuenta contable de costo o gasto",
      "Centro de costo",
      "Anexo de referencia",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F09)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo (MM0001)",
      "Solo Fecha",
      "Solo Fecha",
      "Solo Fecha",
      "Ver T.G.06 y T.G.53",
      "Serie-Número",
      "Sólo 0, 1, 4, 6, 7 y A",
      "Ingresar solo anexos.",
      "Glosa",
      "Sólo 'MN' Y 'US'",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "-",
      "Solo Fecha",
      "Sólo números",
      "-",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta",
      "Sólo números. Llenar solo si el tipo de cambio es 'C'",
      "Fecha documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Tipo de documento. Llenar solo cuando el tipo de documento is nota de crédito o débito.",
      "Serie de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Número de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "T.G. 53 Mantenimiento en parámetros de compras.",
      "Ingresar una cuenta de gasto o costo del plan de cuentas y que no sea título.",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "Ingresar solo anexos.",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F01 y F05)
    [
      "Tamaño/Formato",
      "2 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "2 Caracteres",
      "20 Caracteres",
      "1 Caracter",
      "20 Caracteres",
      "40 Caracteres",
      "2 Caracteres",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "12 caracteres",
      "dd/mm/aaaa",
      "2 decimales",
      "5 Caracteres",
      "1 Caracter",
      "3 decimales",
      "dd/mm/aaaa",
      "2 caracteres",
      "10 caracteres",
      "20 caracteres",
      "8 caracteres",
      "8 caracteres",
      "6 caracteres",
      "20 caracteres",
      "Numérico",
    ],
  ],
}

// Plantilla F10: Similar a F02, F03, F04, F06, F07 y F08
const F10_TEMPLATE: ConcarTemplate = {
  id: "F10",
  name: "Formato F10",
  data: [
    // Primera fila - Encabezados (mismos que F02, F03, F04, F06, F07 y F08)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F10)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02, F03, F04, F06, F07 y F08)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Plantilla F11: Similar a F01, F05 y F09
const F11_TEMPLATE: ConcarTemplate = {
  id: "F11",
  name: "Formato F11",
  data: [
    // Primera fila - Encabezados (mismos que F01, F05 y F09)
    [
      "COMPRAS",
      "SubDiario",
      "Comprobante",
      "Fecha de comprobante",
      "Fecha de documento",
      "Fecha de vencimiento o fecha de pago",
      "Tipo de Documento",
      "Número de Documento",
      "Tipo de documento de identidad",
      "Número de documento de identidad",
      "Apellidos y Nombres, denominación o razón social del proveedor",
      "Moneda",
      "Base imponible",
      "IGV",
      "ICBPER",
      "Valor de las adquisiciones no gravadas",
      "ISC",
      "Impuesto de Retención",
      "Otros tributos y cargos",
      "Importe total",
      "Número de constancia de depósito de detracción",
      "Fecha de emisión de constancia de depósito de detracción",
      "Importe detracción",
      "Código detracción",
      "Tipo de Conversión",
      "Tipo de cambio",
      "Referencia del comprobante de pago que se modifica Fecha",
      "Referencia del comprobante de pago que se modifica Tipo",
      "Referencia del comprobante de pago que se modifica Serie",
      "Referencia del comprobante de pago que se modifica Numero",
      "Número de cuenta contable por pagar",
      "Número de cuenta contable de costo o gasto",
      "Centro de costo",
      "Anexo de referencia",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F11)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo (MM0001)",
      "Solo Fecha",
      "Solo Fecha",
      "Solo Fecha",
      "Ver T.G.06 y T.G.53",
      "Serie-Número",
      "Sólo 0, 1, 4, 6, 7 y A",
      "Ingresar solo anexos.",
      "Glosa",
      "Sólo 'MN' Y 'US'",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "Sólo números",
      "-",
      "Solo Fecha",
      "Sólo números",
      "-",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta",
      "Sólo números. Llenar solo si el tipo de cambio es 'C'",
      "Fecha documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Tipo de documento. Llenar solo cuando el tipo de documento is nota de crédito o débito.",
      "Serie de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "Número de documento. Llenar solo cuando el tipo de documento es nota de crédito o débito.",
      "T.G. 53 Mantenimiento en parámetros de compras.",
      "Ingresar una cuenta de gasto o costo del plan de cuentas y que no sea título.",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "Ingresar solo anexos.",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F01, F05 y F09)
    [
      "Tamaño/Formato",
      "2 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "2 Caracteres",
      "20 Caracteres",
      "1 Caracter",
      "20 Caracteres",
      "40 Caracteres",
      "2 Caracteres",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "2 decimales",
      "12 caracteres",
      "dd/mm/aaaa",
      "2 decimales",
      "5 Caracteres",
      "1 Caracter",
      "3 decimales",
      "dd/mm/aaaa",
      "2 caracteres",
      "10 caracteres",
      "20 caracteres",
      "8 caracteres",
      "8 caracteres",
      "6 caracteres",
      "20 caracteres",
      "Numérico",
    ],
  ],
}

// Plantilla F12: Similar a F02, F03, F04, F06, F07, F08 y F10
const F12_TEMPLATE: ConcarTemplate = {
  id: "F12",
  name: "Formato F12",
  data: [
    // Primera fila - Encabezados (mismos que F02, F03, F04, F06, F07, F08 y F10)
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones (específicas para F12)
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato (mismos que F02, F03, F04, F06, F07, F08 y F10)
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Agregar la plantilla F13 después de la plantilla F12
const F13_TEMPLATE: ConcarTemplate = {
  id: "F13",
  name: "Formato F13",
  data: [
    // Primera fila - Encabezados
    [
      "Campo",
      "Sub Diario",
      "Número de Comprobante",
      "Fecha de Comprobante",
      "Código de Moneda",
      "Glosa Principal",
      "Tipo de Cambio",
      "Tipo de Conversión",
      "Flag de Conversión de Moneda",
      "Fecha Tipo de Cambio",
      "Cuenta Contable",
      "Código de Anexo",
      "Código de Centro de Costo",
      "Debe / Haber",
      "Importe Original",
      "Importe en Dólares",
      "Importe en Soles",
      "Tipo de Documento",
      "Número de Documento",
      "Fecha de Documento",
      "Fecha de Vencimiento",
      "Código de Area",
      "Glosa Detalle",
      "Código de Anexo Auxiliar",
      "Medio de Pago",
      "Tipo de Documento de Referencia",
      "Número de Documento Referencia",
      "Fecha Documento Referencia",
      "Nro Máq. Registradora Tipo Doc. Ref.",
      "Base Imponible Documento Referencia",
      "IGV Documento Provisión",
      "Tipo Referencia en estado MQ",
      "Número Serie Caja Registradora",
      "Fecha de Operación",
      "Tipo de Tasa",
      "Tasa Detracción/Percepción",
      "Importe Base Detracción/Percepción Dólares",
      "Importe Base Detracción/Percepción Soles",
      "Tipo Cambio para 'F'",
      "Importe de IGV sin derecho crédito fiscal",
      "Tasa IGV",
    ],
    // Segunda fila - Restricciones
    [
      "Restricciones",
      "Ver T.G. 02",
      "Los dos primeros dígitos son el mes y los otros 4 siguientes un correlativo",
      "-",
      "Ver T.G. 03",
      "-",
      "Llenar solo si Tipo de Conversión es 'C'. Debe estar entre >=0 y <=9999.999999",
      "Solo: 'C'= Especial, 'M'=Compra, 'V'=Venta , 'F' De acuerdo a fecha",
      "Solo: 'S' = Si se convierte, 'N'= No se convierte",
      "Si Tipo de Conversión 'F'",
      "Debe existir en el Plan de Cuentas",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo, debe existir en la tabla de Anexos",
      "Si Cuenta Contable tiene habilitado C. Costo, Ver T.G. 05",
      "'D' ó 'H'",
      "Importe original de la cuenta contable. Obligatorio, debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Dólares. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estar entre >=0 y <=99999999999.99",
      "Importe de la Cuenta Contable en Soles. Obligatorio si Flag de Conversión de Moneda esta en 'N', debe estra entre >=0 y <=99999999999.99",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Ver T.G. 06",
      "Si Cuenta Contable tiene habilitado el Documento Referencia Incluye Serie y Número",
      "Si Cuenta Contable tiene habilitado el Documento Referencia",
      "Si Cuenta Contable tiene habilitada la Fecha de Vencimiento",
      "Si Cuenta Contable tiene habilitada el Area. Ver T.G. 26",
      "-",
      "Si Cuenta Contable tiene seleccionado Tipo de Anexo Referencia",
      "Si Cuenta Contable tiene habilitado Tipo Medio Pago. Ver T.G. 'S1'",
      "Si Tipo de Documento es 'NA' ó 'ND' Ver T.G. 06",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND', incluye Serie y Número",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'. Solo cuando el Tipo Documento de Referencia 'TK'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si Tipo de Documento es 'NC', 'NA' ó 'ND'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable teien Habilitado Documento Referencia 2 y Tipo de Documento es 'TK'",
      "Si la Cuenta Contable tiene Habilitado Documento Referencia 2. Cuando Tipo de Documento es 'TK', consignar la fecha de emision del ticket",
      "Si la Cuenta Contable tiene configurada la Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29",
      "Si la Cuenta Contable tiene conf. en Tasa: Si es '1' ver T.G. 28 y '2' ver T.G. 29. Debe estar entre >=0 y <=999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Si la Cuenta Contable tiene configurada la Tasa. Debe ser el importe total del documento y estar entre >=0 y <=99999999999.99",
      "Especificar solo si Tipo Conversión es 'F'. Se permite 'M' Compra y 'V' Venta.",
      "Especificar solo para comprobantes de compras con IGV sin derecho de crédito Fiscal. Se detalle solo en la cuenta 42xxxx",
      "Obligatorio para comprobantes de compras, valores validos 0,10,18.",
    ],
    // Tercera fila - Tamaño/Formato
    [
      "Tamaño/Formato",
      "4 Caracteres",
      "6 Caracteres",
      "dd/mm/aaaa",
      "2 Caracteres",
      "40 Caracteres",
      "Numérico 11, 6",
      "1 Caracteres",
      "1 Caracteres",
      "dd/mm/aaaa",
      "12 Caracteres",
      "18 Caracteres",
      "6 Caracteres",
      "1 Carácter",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "dd/mm/aaaa",
      "3 Caracteres",
      "30 Caracteres",
      "18 Caracteres",
      "8 Caracteres",
      "2 Caracteres",
      "20 Caracteres",
      "dd/mm/aaaa",
      "20 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "'MQ'",
      "15 caracteres",
      "dd/mm/aaaa",
      "5 Caracteres",
      "Numérico 14,2",
      "Numérico 14,2",
      "Numérico 14,2",
      "1 Caracter",
      "Numérico 14,2",
      "Numérico 14,2",
    ],
  ],
}

// Actualizar el array de plantillas CONCAR para incluir F13
const CONCAR_TEMPLATES = [
  F01_TEMPLATE,
  F02_TEMPLATE,
  F03_TEMPLATE,
  F04_TEMPLATE,
  F05_TEMPLATE,
  F06_TEMPLATE,
  F07_TEMPLATE,
  F08_TEMPLATE,
  F09_TEMPLATE,
  F10_TEMPLATE,
  F11_TEMPLATE,
  F12_TEMPLATE,
  F13_TEMPLATE,
]

// Agregar F13 a la lista de archivos CONCAR
const CONCAR_FILES: ConcarFile[] = [
  {
    id: "f01",
    name: "F01 - Compras",
    description: "Formato para registro de compras",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f02",
    name: "F02 - Diario",
    description: "Formato para registro diario",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f03",
    name: "F03 - Ventas",
    description: "Formato para registro de ventas",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f04",
    name: "F04 - Caja y Bancos",
    description: "Formato para registro de caja y bancos",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f05",
    name: "F05 - Honorarios",
    description: "Formato para registro de honorarios",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f06",
    name: "F06 - Activos Fijos",
    description: "Formato para registro de activos fijos",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f07",
    name: "F07 - Planillas",
    description: "Formato para registro de planillas",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f08",
    name: "F08 - Provisiones",
    description: "Formato para registro de provisiones",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f09",
    name: "F09 - Importaciones",
    description: "Formato para registro de importaciones",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f10",
    name: "F10 - Ajustes",
    description: "Formato para registro de ajustes",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f11",
    name: "F11 - Gastos de Viaje",
    description: "Formato para registro de gastos de viaje",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f12",
    name: "F12 - Cierre",
    description: "Formato para registro de cierre",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    id: "f13",
    name: "F13 - Consolidado",
    description: "Formato para registro consolidado",
    format: "CSV",
    records: 0,
    status: "pending",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
]

// Componente principal de la página CONCAR
export default function ConcarPage() {
  const [selectedTab, setSelectedTab] = useState("generate") // Cambiar a "generate" como primera pestaña
  const [selectedTemplate, setSelectedTemplate] = useState<ConcarTemplate | null>(null)
  const [selectedFile, setSelectedFile] = useState<ConcarFile | null>(null)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showTemplateInfo, setShowTemplateInfo] = useState(false)
  const [selectedYear, setSelectedYear] = useState("2024")
  const [selectedFormat, setSelectedFormat] = useState("csv")
  const [selectedEncoding, setSelectedEncoding] = useState("utf8")
  const [selectedDelimiter, setSelectedDelimiter] = useState(",")
  const [selectedDateFormat, setSelectedDateFormat] = useState("dd/mm/yyyy")
  const [selectedDecimalSeparator, setSelectedDecimalSeparator] = useState(".")
  const [selectedThousandSeparator, setSelectedThousandSeparator] = useState(",")
  const [selectedFileType, setSelectedFileType] = useState<string>("f01")
  const [generatedFiles, setGeneratedFiles] = useState<ConcarFile[]>([])
  const [dataSource, setDataSource] = useState<"payments" | "existing">("payments") // Nuevo estado para fuente de datos
  const [fileUploaded, setFileUploaded] = useState(false)
  const [currentGeneratingFormat, setCurrentGeneratingFormat] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [selectedCurrency, setSelectedCurrency] = useState("PEN")

  // Función para manejar la carga de archivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        setFileUploaded(true)
        setUploadedFileName(file.name)
        // Aquí puedes procesar el archivo
        console.log("Archivo cargado:", file.name)
      } else {
        alert("Por favor selecciona un archivo .xlsx válido")
      }
    }
  }

  // Función para simular la generación de archivos
  const generateFile = () => {
    if (!selectedFile) return

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulación de progreso
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsGenerating(false)

          // Actualizar el estado del archivo generado
          const updatedFile = {
            ...selectedFile,
            status: "generated" as const,
            records: Math.floor(Math.random() * 100) + 50,
            downloadUrl: "#",
          }

          setGeneratedFiles((prev) => [...prev.filter((f) => f.id !== updatedFile.id), updatedFile])

          // Simular una vista previa del archivo
          setFilePreview({
            fileName: updatedFile.name,
            totalRecords: updatedFile.records,
            validRecords: Math.floor(updatedFile.records * 0.95),
            errorRecords: Math.floor(updatedFile.records * 0.03),
            warningRecords: Math.floor(updatedFile.records * 0.02),
            totalAmount: Math.floor(Math.random() * 100000) + 10000,
            currency: "PEN",
            dateRange: {
              from: `01/01/${selectedYear}`,
              to: `31/12/${selectedYear}`,
            },
            records: Array(10)
              .fill(null)
              .map((_, i) => ({
                id: `rec-${i}`,
                fecha: `${Math.min(28, Math.max(1, Math.floor(Math.random() * 28)))}/01/${selectedYear}`,
                ruc: "20123456789",
                razonSocial: `Proveedor Ejemplo ${i + 1}`,
                tipoDocumento: ["FA", "BV", "NC", "ND"][Math.floor(Math.random() * 4)],
                serie: `F00${Math.floor(Math.random() * 9) + 1}`,
                numero: `${Math.floor(Math.random() * 10000) + 1000}`,
                moneda: Math.random() > 0.3 ? "PEN" : "USD",
                subtotal: Number.parseFloat((Math.random() * 1000 + 100).toFixed(2)),
                igv: Number.parseFloat((Math.random() * 180).toFixed(2)),
                total: Number.parseFloat((Math.random() * 1180 + 100).toFixed(2)),
                cuenta: `42${Math.floor(Math.random() * 1000)}`,
                centroCosto: `CC${Math.floor(Math.random() * 100)}`,
                glosa: `Compra de productos ${i + 1}`,
                estado: Math.random() > 0.9 ? "error" : Math.random() > 0.8 ? "advertencia" : "valido",
                errores: [],
                disciplina: "Compras",
                location: "Lima",
                general: "Gastos Generales",
                tipo: "Operativo",
                subcuenta: "Proveedores",
                mesContable: "01",
                cuentaContable: `42${Math.floor(Math.random() * 1000)}`,
                comentarios: "",
              })),
          })

          return 100
        }
        return newProgress
      })
    }, 200)
  }

  // Función para manejar la selección de un archivo
  const handleFileSelect = (file: ConcarFile) => {
    setSelectedFile(file)
    setSelectedTemplate(CONCAR_TEMPLATES.find((t) => t.id === file.id.toUpperCase()) || null)
    setFilePreview(null)
  }

  // Función para manejar la selección de una plantilla
  const handleTemplateSelect = (template: ConcarTemplate) => {
    setSelectedTemplate(template)
    setSelectedFile(CONCAR_FILES.find((f) => f.id === template.id.toLowerCase()) || null)
    setFilePreview(null)
  }

  // Función para generar todos los formatos CONCAR
  const generateAllFormats = async () => {
    if (dataSource === "payments" && !fileUploaded) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setGeneratedFiles([])

    // Simular la generación de todos los formatos
    for (let i = 0; i < CONCAR_FILES.length; i++) {
      const file = CONCAR_FILES[i]
      setCurrentGeneratingFormat(file.name)

      // Simular progreso
      const baseProgress = (i / CONCAR_FILES.length) * 100
      for (let j = 0; j <= 100; j += 10) {
        setGenerationProgress(baseProgress + j / CONCAR_FILES.length)
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Simular resultado (90% exitoso, 10% error)
      const isSuccess = Math.random() > 0.1
      const generatedFile = {
        ...file,
        status: isSuccess ? ("generated" as const) : ("error" as const),
        records: isSuccess ? Math.floor(Math.random() * 100) + 20 : 0,
        downloadUrl: isSuccess ? "#" : undefined,
      }

      setGeneratedFiles((prev) => [...prev, generatedFile])
    }

    setCurrentGeneratingFormat(null)
    setIsGenerating(false)
    setGenerationProgress(100)
  }

  // Función para previsualizar un archivo
  const previewFile = (file: ConcarFile) => {
    // Simular vista previa
    setFilePreview({
      fileName: file.name,
      totalRecords: file.records,
      validRecords: Math.floor(file.records * 0.95),
      errorRecords: Math.floor(file.records * 0.03),
      warningRecords: Math.floor(file.records * 0.02),
      totalAmount: Math.floor(Math.random() * 100000) + 10000,
      currency: selectedCurrency,
      dateRange: {
        from: `01/01/${selectedYear}`,
        to: `31/12/${selectedYear}`,
      },
      records: Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `rec-${i}`,
          fecha: `${Math.min(28, Math.max(1, Math.floor(Math.random() * 28)))}/01/${selectedYear}`,
          ruc: "20123456789",
          razonSocial: `Proveedor Ejemplo ${i + 1}`,
          tipoDocumento: ["FA", "BV", "NC", "ND"][Math.floor(Math.random() * 4)],
          serie: `F00${Math.floor(Math.random() * 9) + 1}`,
          numero: `${Math.floor(Math.random() * 10000) + 1000}`,
          moneda: Math.random() > 0.3 ? "PEN" : "USD",
          subtotal: Number.parseFloat((Math.random() * 1000 + 100).toFixed(2)),
          igv: Number.parseFloat((Math.random() * 180).toFixed(2)),
          total: Number.parseFloat((Math.random() * 1180 + 100).toFixed(2)),
          cuenta: `42${Math.floor(Math.random() * 1000)}`,
          centroCosto: `CC${Math.floor(Math.random() * 100)}`,
          glosa: `Compra de productos ${i + 1}`,
          estado: Math.random() > 0.9 ? "error" : Math.random() > 0.8 ? "advertencia" : "valido",
          errores: [],
          disciplina: "Compras",
          location: "Lima",
          general: "Gastos Generales",
          tipo: "Operativo",
          subcuenta: "Proveedores",
          mesContable: "01",
          cuentaContable: `42${Math.floor(Math.random() * 1000)}`,
          comentarios: "",
        })),
    })
  }

  // Corregir la función de descarga de archivos para generar Excel válidos
  const downloadFile = (file: ConcarFile) => {
    // Import the library at the top of the file
    import("xlsx").then((xlsx) => {
      // Sample data - replace with your actual data
      const data = [
        ["Header 1", "Header 2", "Header 3"],
        ["Data 1", "Data 2", "Data 3"],
        ["Data 4", "Data 5", "Data 6"],
      ]

      // Create a new workbook
      const wb = xlsx.utils.book_new()

      // Create a new worksheet
      const ws = xlsx.utils.aoa_to_sheet(data)

      // Add the worksheet to the workbook
      xlsx.utils.book_append_sheet(wb, ws, "Sheet1")

      // Generate the Excel file as a blob
      const wbout = xlsx.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([new Uint8Array(wbout)], { type: "application/octet-stream" })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${file.name.replace(/\s+/g, "_")}_${selectedYear}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  // Función para descargar todos los archivos
  const downloadAllFiles = () => {
    const successfulFiles = generatedFiles.filter((f) => f.status === "generated")
    successfulFiles.forEach((file) => {
      setTimeout(() => downloadFile(file), 100)
    })
  }

  // Función para limpiar archivos generados
  const clearGeneratedFiles = () => {
    setGeneratedFiles([])
    setFilePreview(null)
  }

  return (
    <Layout>
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exportación CONCAR</h1>
            <p className="text-muted-foreground">
              Genera archivos en formato CONCAR para importación en el sistema contable
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm">
              <FolderOpen className="mr-2 h-4 w-4" />
              Abrir carpeta
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generar archivos</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          {/* Pestaña de Generación */}
          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Cargar archivo de gastos</CardTitle>
                  <CardDescription>Sube tu archivo de gastos para generar todos los formatos CONCAR</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Área de carga de archivo - solo visible si dataSource es "payments" */}
                  {dataSource === "payments" && (
                    <div className="space-y-2">
                      <Label>Archivo de gastos</Label>
                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById("file-input")?.click()}
                      >
                        <input
                          id="file-input"
                          type="file"
                          accept=".xlsx"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        {fileUploaded ? (
                          <div className="space-y-2">
                            <CheckCircle2 className="h-8 w-8 mx-auto text-green-600" />
                            <p className="text-sm font-medium text-green-600">Archivo cargado: {uploadedFileName}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFileUploaded(false)
                                setUploadedFileName("")
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cambiar archivo
                            </Button>
                          </div>
                        ) : (
                          <>
                            <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
                            </p>
                            <Button variant="outline" size="sm" type="button">
                              <Upload className="mr-2 h-4 w-4" />
                              Seleccionar archivo
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">Solo archivos .xlsx</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mensaje informativo si la fuente es base de datos */}
                  {dataSource === "existing" && (
                    <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-600 dark:text-blue-400">Usando datos existentes</AlertTitle>
                      <AlertDescription className="text-blue-600/80 dark:text-blue-400/80">
                        Se utilizarán los registros almacenados en la base de datos para el período seleccionado.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Configuración de exportación */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Fuente de datos</Label>
                      <RadioGroup
                        value={dataSource}
                        onValueChange={setDataSource as any}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="payments" id="payments" />
                          <Label htmlFor="payments">Archivo de gastos (carga manual)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="existing" id="existing" />
                          <Label htmlFor="existing">Base de datos (registros existentes)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Año de procesamiento</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          {["2022", "2023", "2024", "2025"].map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Tipo de moneda</Label>
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">Soles (PEN)</SelectItem>
                          <SelectItem value="USD">Dólares (USD)</SelectItem>
                          <SelectItem value="EUR">Euros (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      // Generar todos los formatos CONCAR
                      generateAllFormats()
                    }}
                    disabled={isGenerating || (dataSource === "payments" && !fileUploaded)}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generando formatos...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Generar todos los formatos CONCAR
                      </>
                    )}
                  </Button>

                  {dataSource === "payments" && !fileUploaded && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Archivo requerido</AlertTitle>
                      <AlertDescription>
                        Debe cargar un archivo de gastos antes de generar los formatos CONCAR.
                      </AlertDescription>
                    </Alert>
                  )}

                  {dataSource === "existing" && (
                    <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-600 dark:text-green-400">Listo para generar</AlertTitle>
                      <AlertDescription className="text-green-600/80 dark:text-green-400/80">
                        Se utilizarán los datos de {selectedYear} en moneda{" "}
                        {selectedCurrency === "PEN" ? "Soles" : selectedCurrency === "USD" ? "Dólares" : "Euros"}.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procesando archivo...</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                      <p className="text-xs text-center text-muted-foreground">
                        Generando {currentGeneratingFormat || "formatos CONCAR"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Formatos CONCAR generados</CardTitle>
                  <CardDescription>
                    {generatedFiles.length > 0
                      ? `Se han generado ${generatedFiles.length} formato(s) CONCAR`
                      : "Los formatos generados aparecerán aquí"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedFiles.length > 0 ? (
                    <div className="space-y-4">
                      {/* Resumen de generación */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Total formatos</p>
                          <p className="text-lg font-bold">{generatedFiles.length}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Exitosos</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {generatedFiles.filter((f) => f.status === "generated").length}
                          </p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Pendientes</p>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {generatedFiles.filter((f) => f.status === "pending").length}
                          </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Con errores</p>
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            {generatedFiles.filter((f) => f.status === "error").length}
                          </p>
                        </div>
                      </div>

                      {/* Lista de archivos generados */}
                      <div className="border rounded-lg">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="px-4 py-2 text-left font-medium">Formato</th>
                                <th className="px-4 py-2 text-left font-medium">Descripción</th>
                                <th className="px-4 py-2 text-center font-medium">Registros</th>
                                <th className="px-4 py-2 text-center font-medium">Estado</th>
                                <th className="px-4 py-2 text-center font-medium">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedFiles.map((file) => (
                                <tr key={file.id} className="border-t hover:bg-muted/50">
                                  <td className="px-4 py-2">
                                    <div className="flex items-center">
                                      {file.icon}
                                      <span className="ml-2 font-medium">{file.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-muted-foreground">{file.description}</td>
                                  <td className="px-4 py-2 text-center">{file.records}</td>
                                  <td className="px-4 py-2 text-center">
                                    {file.status === "generated" && (
                                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Generado
                                      </Badge>
                                    )}
                                    {file.status === "error" && (
                                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                        <X className="h-3 w-3 mr-1" />
                                        Error
                                      </Badge>
                                    )}
                                    {file.status === "pending" && (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-50 text-yellow-600 border-yellow-200"
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Procesando...
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={file.status !== "generated"}
                                        onClick={() => previewFile(file)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={file.status !== "generated"}
                                        onClick={() => downloadFile(file)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Acciones globales */}
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => clearGeneratedFiles()}>
                          <X className="mr-2 h-4 w-4" />
                          Limpiar lista
                        </Button>
                        <Button
                          onClick={() => downloadAllFiles()}
                          disabled={generatedFiles.filter((f) => f.status === "generated").length === 0}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar todos
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No hay formatos generados</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Carga un archivo de gastos y haz clic en "Generar todos los formatos CONCAR" para comenzar.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de Plantillas */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Plantillas CONCAR</CardTitle>
                  <CardDescription>Seleccione una plantilla para ver su estructura</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {CONCAR_FILES.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedFile?.id === file.id ? "bg-muted/50 border border-primary/20" : ""
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      {file.icon}
                      <div className="ml-3">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate?.name || "Seleccione una plantilla"}</CardTitle>
                    <CardDescription>
                      {selectedTemplate
                        ? "Estructura y restricciones de la plantilla seleccionada"
                        : "Haga clic en una plantilla para ver su estructura"}
                    </CardDescription>
                  </div>
                  {selectedTemplate && (
                    <Button variant="outline" size="sm" onClick={() => setShowTemplateInfo(!showTemplateInfo)}>
                      <Info className="mr-2 h-4 w-4" />
                      {showTemplateInfo ? "Ocultar información" : "Ver información"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedTemplate ? (
                    <div className="space-y-4">
                      {showTemplateInfo && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Información de la plantilla {selectedTemplate.name}</AlertTitle>
                          <AlertDescription>
                            <p className="mb-2">
                              Esta plantilla define la estructura para archivos de importación en CONCAR. Asegúrese de
                              seguir las restricciones y formatos especificados.
                            </p>
                            <p>
                              Para más información, consulte la documentación oficial de CONCAR o contacte con soporte
                              técnico.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="px-4 py-2 text-left font-medium">Campo</th>
                                <th className="px-4 py-2 text-left font-medium">Restricciones</th>
                                <th className="px-4 py-2 text-left font-medium">Tamaño/Formato</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedTemplate.data[0].map((field, index) => (
                                <tr key={index} className="border-t hover:bg-muted/50">
                                  <td className="px-4 py-2 font-medium">{field}</td>
                                  <td className="px-4 py-2">
                                    {selectedTemplate.data[1][index] || "Sin restricciones"}
                                  </td>
                                  <td className="px-4 py-2">
                                    {selectedTemplate.data[2][index] || "Sin formato específico"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewFile(selectedFile!)}
                        disabled={!selectedFile}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Previsualizar plantilla
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium mb-1">Ninguna plantilla seleccionada</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Seleccione una plantilla de la lista para ver su estructura, restricciones y formato.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de Historial */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de archivos generados</CardTitle>
                <CardDescription>Lista de archivos CONCAR generados recientemente</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedFiles.length > 0 ? (
                  <div className="border rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-2 text-left font-medium">Nombre</th>
                            <th className="px-4 py-2 text-left font-medium">Tipo</th>
                            <th className="px-4 py-2 text-left font-medium">Formato</th>
                            <th className="px-4 py-2 text-center font-medium">Registros</th>
                            <th className="px-4 py-2 text-center font-medium">Estado</th>
                            <th className="px-4 py-2 text-center font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedFiles.map((file) => (
                            <tr key={file.id} className="border-t hover:bg-muted/50">
                              <td className="px-4 py-2 font-medium">{file.name}</td>
                              <td className="px-4 py-2">{file.id.toUpperCase()}</td>
                              <td className="px-4 py-2">{file.format}</td>
                              <td className="px-4 py-2 text-center">{file.records}</td>
                              <td className="px-4 py-2 text-center">
                                {file.status === "generated" && (
                                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Generado
                                  </Badge>
                                )}
                                {file.status === "error" && (
                                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                    <X className="h-3 w-3 mr-1" />
                                    Error
                                  </Badge>
                                )}
                                {file.status === "pending" && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Pendiente
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex justify-center space-x-2">
                                  <Button variant="ghost" size="icon" disabled={file.status !== "generated"}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" disabled={file.status !== "generated"}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileDown className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No hay archivos generados</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Cuando genere archivos CONCAR, aparecerán en esta lista para su descarga y referencia.
                    </p>
                    <Button className="mt-4" onClick={() => setSelectedTab("generate")}>
                      Generar un archivo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
