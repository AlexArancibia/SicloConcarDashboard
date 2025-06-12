export type ReconciliationStatus = "pending" | "partial" | "reconciled" | "cancelled"

export interface ReconciliationDocument extends Document {
  amountToReconcile: number
  reconciledAmount: number
  pendingAmount: number
}

export interface ReconciledDocument extends ReconciliationDocument {
  reconciliationDate: string
  bankMovementId: string
  reconciliationId: string
}

export interface Reconciliation {
  id: string
  date: string
  accountId: string
  bankMovementId: string
  totalAmount: number
  status: ReconciliationStatus
  documents: ReconciliationDocument[]
  observations?: string
  createdAt: string
  createdBy: string
  approvedAt?: string
  approvedBy?: string
  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string
}

export interface ReconciliationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  conditions: ReconciliationCondition[]
  actions: ReconciliationAction[]
  createdAt: string
  createdBy: string
}

export interface ReconciliationCondition {
  id: string
  ruleId: string
  field: string
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "greater_than" | "less_than"
  value: string
  logicalOperator?: "AND" | "OR"
}

export interface ReconciliationAction {
  id: string
  ruleId: string
  actionType: "auto_reconcile" | "suggest_match" | "flag_review" | "categorize"
  parameters: Record<string, any>
}
