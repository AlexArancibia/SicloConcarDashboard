// transactionClassifier.ts
import type { TransactionType } from "@/types/transactions";

type ClassificationRule = {
  patterns: RegExp[];
  type: TransactionType;
  priority?: number; // Para resolver conflictos cuando múltiples reglas coinciden
};

// Reglas para INGRESOS (montos positivos)
const incomeRules: ClassificationRule[] = [
  {
    patterns: [/^DE IZIPAY S\.A\.C/i, /^DE [A-Z]/i, /^TRANSF\.BCO\./i, /^ENTR\.EFEC\./i],
    type: "INCOME_TRANSFER",
    priority: 1
  },
  {
    patterns: [/^DEVOL\./i, /^REEMBOL/i],
    type: "INCOME_REFUND",
    priority: 2
  },
  {
    patterns: [/^HABER TLC/i],
    type: "INCOME_SALARY",
    priority: 3
  },
  {
    patterns: [/^REGULARIZACION ITF/i],
    type: "INCOME_ADJUSTMENT",
    priority: 4
  }
];

// Reglas para EGRESOS (montos negativos)
const expenseRules: ClassificationRule[] = [
  // Nómina
  {
    patterns: [/^HABER TLC/i, /^PAGOS AFP/i],
    type: "PAYROLL_SALARY",
    priority: 1
  },
  {
    patterns: [/^CTS TLC/i],
    type: "PAYROLL_CTS",
    priority: 2
  },
  {
    patterns: [/^PAGOS AFP (INTEGRA|PRIMA|HABITAT|PROFUTUR)/i],
    type: "PAYROLL_AFP",
    priority: 3
  },
  
  // Impuestos
  {
    patterns: [/^PAGO IMPUES/i, /^IMPUESTO SUNAT/i],
    type: "TAX_PAYMENT",
    priority: 1
  },
  {
    patterns: [/^IMPUESTO ITF/i],
    type: "TAX_ITF",
    priority: 2
  },
  {
    patterns: [/^DETR\./i, /^PAGO DETRAC/i],
    type: "TAX_DETRACTION",
    priority: 3
  },
  
  // Servicios
  {
    patterns: [/^LUZ/i, /^CLAR/i, /^ENTE/i],
    type: "EXPENSE_UTILITIES",
    priority: 1
  },
  {
    patterns: [/^MAPF/i],
    type: "EXPENSE_INSURANCE",
    priority: 2
  },
  {
    patterns: [/^COMIS/i, /^MANT/i, /^PORTES/i],
    type: "EXPENSE_COMMISSIONS",
    priority: 3
  },
  
  // Transferencias
  {
    patterns: [/^A \d{2,3} \d+/i], // Patrón: "A 193 123456 0"
    type: "TRANSFER_INBANK",
    priority: 1
  },
  {
    patterns: [/^TRANFERENCIA CCE/i, /^TRANSF\.BCO\./i],
    type: "TRANSFER_EXTERNAL",
    priority: 2
  },
  {
    patterns: [/^EFEC/i, /^RETIRO/i],
    type: "WITHDRAWAL_CASH",
    priority: 3
  },
  
  // Compras
  {
    patterns: [/^VENU\$/, /^PAGO PROV/i],
    type: "EXPENSE_PURCHASE",
    priority: 1
  },
  
  // Otros
  {
    patterns: [/^AJUSTE/i, /^REGULARIZACION/i],
    type: "ADJUSTMENT",
    priority: 1
  }
];

export function classifyTransaction(description: string, amount: number): TransactionType {
  const isIncome = amount >= 0;
  const rules = isIncome ? incomeRules : expenseRules;
  const defaultType = isIncome ? "INCOME_OTHER" : "EXPENSE_OTHER";
  
  // Buscar todas las reglas que coincidan
  const matchingRules = rules.filter(rule => 
    rule.patterns.some(pattern => pattern.test(description))
  );
  
  if (matchingRules.length === 0) {
    return defaultType;
  }
  
  // Seleccionar la regla con mayor prioridad
  const highestPriority = Math.max(...matchingRules.map(r => r.priority || 0));
  const selectedRule = matchingRules.find(r => (r.priority || 0) === highestPriority);
  
  return selectedRule?.type || defaultType;
}