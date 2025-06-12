// Exportar todos los tipos
export * from "./auth"
export * from "./suppliers"
export * from "./documents"
export * from "./bank-accounts"
export * from "./transactions"
export * from "./conciliation"
export * from "./expenses"
export * from "./reports"
export * from "./common"

// Tipos legacy para compatibilidad (mantenemos algunos tipos antiguos)
export type DocumentTypeOld = "01" | "03" | "07" | "08" | "RH" | "NC" | "ND"
export type DocumentStatusOld = "pending" | "reconciled" | "partial" | "cancelled" | "draft"

// Mapeo de tipos antiguos a nuevos
export const DocumentTypeMapping: Record<DocumentTypeOld, import("./documents").DocumentType> = {
  "01": "FACTURA",
  "03": "BOLETA",
  "07": "NOTA_CREDITO",
  "08": "NOTA_DEBITO",
  RH: "RECIBO_HONORARIOS",
  NC: "NOTA_CREDITO",
  ND: "NOTA_DEBITO",
}

export const DocumentStatusMapping: Record<DocumentStatusOld, import("./documents").DocumentStatus> = {
  pending: "PENDING",
  reconciled: "CONCILIATED",
  partial: "PARTIALLY_CONCILIATED",
  cancelled: "CANCELLED",
  draft: "PENDING",
}
