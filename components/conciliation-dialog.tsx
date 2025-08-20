"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, AlertCircle, Plus, Trash2, X, Code, Database, Info, FileText } from "lucide-react"
import { useConciliationsStore } from "@/stores/conciliation-store"
import { useAccountingAccountsStore } from "@/stores/accounting-accounts-store"
import { useCostCentersStore } from "@/stores/cost-centers-store"
import { useAuthStore } from "@/stores/authStore"
import { useDocumentsStore } from "@/stores/documents-store" // Asumiendo que este store existe
import { useAccountingEntriesStore } from "@/stores/accounting-entries-store"
import { useToast } from "@/hooks/use-toast"
import { TemplateSearchDialog } from "@/components/financial/template-search-dialog"
import type { CreateAccountingEntryDto, CreateAccountingEntryLineDto, MovementType, AccountingEntryTemplate } from "@/types/accounting"
import type {
  CreateConciliationDto,
  ExpenseType,
  ConciliationItem,
  UpdateConciliationDto,
  CreateConciliationItemDto,
} from "@/types/conciliations"
import type { Transaction } from "@/types/transactions"
import type { BankAccount } from "@/types/bank-accounts"
import type { Document, UpdateDocumentDto } from "@/types/documents" // Importar el DTO de documentos
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

const DEBUG_MODE = true

const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[CONCILIATION DIALOG DEBUG] ${message}`, data || "")
  }
}

interface ConciliationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTransaction: Transaction | null
  selectedDocuments: Document[]
  documentConciliationAmounts: Record<string, number>
  conciliationType: "DOCUMENTS" | "DETRACTIONS"
  bankAccounts: BankAccount[]
}

interface ConciliationExpense {
  id: string
  description: string
  amount: number
  expenseType: ExpenseType
  accountId?: string
  notes?: string
  isTaxDeductible: boolean
}

interface DocumentAllocation {
  documentId: string
  accountId?: string
  costCenterLinks: CostCenterLink[]
  percentage: number
  amount: number
  items: DocumentItem[]
}

interface CostCenterLink {
  id: string
  costCenterId?: string
  percentage: number
  amount: number
}

interface DocumentItem {
  id: string
  description: string
  amount: number
  accountId?: string
  costCenterLinks: CostCenterLink[]
}

export function ConciliationDialog({
  open,
  onOpenChange,
  selectedTransaction,
  selectedDocuments,
  documentConciliationAmounts,
  conciliationType,
  bankAccounts,
}: ConciliationDialogProps) {
  const { user } = useAuthStore()
  const { createConciliation, createConciliationItem, updateConciliation, loading } = useConciliationsStore()
  const { accountingAccounts, fetchAccountingAccounts } = useAccountingAccountsStore()
  const { costCenters, fetchCostCenters } = useCostCentersStore()
  const { updateDocument } = useDocumentsStore() // Obtener la función updateDocument del store de documentos
  const { createEntry } = useAccountingEntriesStore()
  const { toast } = useToast()

  // State
  const [conciliationData, setConciliationData] = useState({
    reference: "",
    notes: "",
  })
  const [documentAllocations, setDocumentAllocations] = useState<DocumentAllocation[]>([])
  const [expenses, setExpenses] = useState<ConciliationExpense[]>([])
  const [activeTab, setActiveTab] = useState("documents")
  const [applyReserves, setApplyReserves] = useState(false)
  const [allocationMode, setAllocationMode] = useState<"document" | "item">("document")
  const [error, setError] = useState<string | null>(null)
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false)
  
  // Estado local para los montos de conciliación (sincronizado con el prop)
  const [localConciliationAmounts, setLocalConciliationAmounts] = useState<Record<string, number>>(documentConciliationAmounts)
  
  // Estado para el asiento contable
  const [entryForm, setEntryForm] = useState<CreateAccountingEntryDto>({
    companyId: "",
    conciliationId: "", // Se establecerá cuando se cree la conciliación
    status: "DRAFT",
    notes: "Asiento de conciliación",
    lines: [],
  })

  // Load accounting data
  useEffect(() => {
    if (open && user?.companyId) {
      debugLog("Loading accounting data for company", user.companyId)
      fetchAccountingAccounts(user.companyId, { page: 1, limit: 1000 })
      fetchCostCenters(user.companyId, { page: 1, limit: 1000 })
    }
  }, [open, user?.companyId])

  // Sincronizar el estado local con el prop cuando cambie
  useEffect(() => {
    setLocalConciliationAmounts(documentConciliationAmounts)
  }, [documentConciliationAmounts])

  // Sincronizar metadatos del asiento con la transacción
  useEffect(() => {
    if (open && user?.companyId && selectedTransaction) {
      setEntryForm((prev) => ({
        ...prev,
        companyId: user.companyId!,
        notes:
          prev.notes && prev.notes !== "Asiento de conciliación"
            ? prev.notes
            : `Conciliación ${selectedTransaction.operationNumber || selectedTransaction.description}`,
      }))
    }
  }, [open, user?.companyId, selectedTransaction])

  // Initialize document allocations with real document lines
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      const allocations = selectedDocuments.map((doc) => {
        const docAmount = localConciliationAmounts[doc.id] || 0

        // Create items based on real document lines
        const realItems =
          doc.lines?.map((line, index) => ({
            id: `item_${doc.id}_${line.id}`,
            description: line.description,
            amount: Number.parseFloat(line.lineTotal),
            accountId: undefined,
            costCenterLinks: [
              {
                id: `cc_item_${doc.id}_${line.id}_1`,
                costCenterId: undefined,
                percentage: 100,
                amount: Number.parseFloat(line.lineTotal),
              },
            ],
          })) || []

        // Si no hay líneas reales, crear items mock como fallback
        const mockItems =
          realItems.length > 0
            ? realItems
            : [
                {
                  id: `item_${doc.id}_1`,
                  description: `${doc.documentType} - Servicio principal`,
                  amount: docAmount * 0.7,
                  accountId: undefined,
                  costCenterLinks: [
                    {
                      id: `cc_item_${doc.id}_1_1`,
                      costCenterId: undefined,
                      percentage: 100,
                      amount: docAmount * 0.7,
                    },
                  ],
                },
                {
                  id: `item_${doc.id}_2`,
                  description: `${doc.documentType} - Servicio adicional`,
                  amount: docAmount * 0.3,
                  accountId: undefined,
                  costCenterLinks: [
                    {
                      id: `cc_item_${doc.id}_2_1`,
                      costCenterId: undefined,
                      percentage: 100,
                      amount: docAmount * 0.3,
                    },
                  ],
                },
              ]

        return {
          documentId: doc.id,
          accountId: undefined,
          costCenterLinks: [
            {
              id: `cc_${doc.id}_1`,
              costCenterId: undefined,
              percentage: 100,
              amount: docAmount,
            },
          ],
          percentage: 100,
          amount: docAmount,
          items: mockItems,
        }
      })
      setDocumentAllocations(allocations)
      debugLog("Initialized document allocations with real document lines", allocations)
    }
  }, [selectedDocuments, conciliationType, localConciliationAmounts])

  // Calculate totals - CORREGIDO: Los gastos reducen la diferencia
  const totals = useMemo(() => {
    const documentsTotal = selectedDocuments.reduce((sum, doc) => {
      return sum + (localConciliationAmounts[doc.id] || 0)
    }, 0)

    const transactionAmount = selectedTransaction ? Math.abs(Number.parseFloat(selectedTransaction.amount)) : 0
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // CORREGIDO: La diferencia es |Transacción - (Documentos + Gastos)|
    // Los gastos adicionales REDUCEN la diferencia, no la aumentan
    const difference = Math.abs(transactionAmount - (documentsTotal + expensesTotal))
    const isBalanced = difference <= 5.0 // Tolerancia fija de 5.0

    const result = {
      documentsTotal,
      transactionAmount,
      expensesTotal,
      difference,
      isBalanced,
      totalConciliated: documentsTotal + expensesTotal, // CORREGIDO: Total conciliado es documentos + gastos
    }

    debugLog("Calculated totals", result)
    return result
  }, [selectedDocuments, selectedTransaction, expenses, localConciliationAmounts])

  // Totales del asiento contable
  const entryTotals = useMemo(() => {
    const debitRaw = entryForm.lines
      .filter((l) => l.movementType === "DEBIT")
      .reduce((a, l) => a + (Number(l.amount) || 0), 0)
    const creditRaw = entryForm.lines
      .filter((l) => l.movementType === "CREDIT")
      .reduce((a, l) => a + (Number(l.amount) || 0), 0)
    const debit = Number(debitRaw.toFixed(2))
    const credit = Number(creditRaw.toFixed(2))
    return { debit, credit, balanced: debit === credit }
  }, [entryForm.lines])

  // Generate payloads for developer tab - PORCENTAJES EN DECIMAL
  const generatePayloads = useMemo(() => {
    const documentUpdates = selectedDocuments.map((doc) => {
      const allocation = documentAllocations.find((alloc) => alloc.documentId === doc.id)
      if (!allocation) return { documentId: doc.id, endpoint: "", payload: {} }

      if (allocationMode === "document") {
        // Caso 1: Enlaces a nivel de documento
        const hasAccountLinks = allocation.accountId || allocation.costCenterLinks.some((link) => link.costCenterId)

        if (!hasAccountLinks) {
          // Caso 3: Eliminar todos los enlaces
          return {
            documentId: doc.id,
            endpoint: `/api/documents/${doc.id}`,
            payload: {
              updatedById: user?.id,
              accountLinks: [],
              costCenterLinks: [],
            },
          }
        }

        // Caso 1: Crear enlaces a nivel de documento
        const accountLinks = allocation.accountId
          ? [
              {
                accountId: allocation.accountId,
                percentage: 1.0,
                amount: Number.parseFloat(allocation.amount.toFixed(2)),
              },
            ]
          : []

        const costCenterLinks = allocation.costCenterLinks
          .filter((link) => link.costCenterId && link.percentage > 0)
          .map((link) => ({
            costCenterId: link.costCenterId,
            percentage: link.percentage / 100, // Convertir a decimal
            amount: Number.parseFloat(((link.percentage / 100) * allocation.amount).toFixed(2)),
          }))

        return {
          documentId: doc.id,
          endpoint: `/api/documents/${doc.id}`,
          payload: {
            updatedById: user?.id,
            accountLinks,
            costCenterLinks,
          },
        }
      } else {
        // Caso 2: Enlaces a nivel de línea (item mode)
        const hasItemLinks = allocation.items.some(
          (item) => item.accountId || item.costCenterLinks.some((link) => link.costCenterId),
        )

        if (!hasItemLinks) {
          // Caso 3: Eliminar todos los enlaces (incluyendo líneas)
          const cleanLines =
            doc.lines?.map((line) => {
              // CORREGIDO: Eliminar campos que causan errores
              const { id, documentId, lineNumber, createdAt, updatedAt, ...cleanLine } = line
              return {
                ...cleanLine,
                quantity: Number.parseFloat(line.quantity),
                unitPrice: Number.parseFloat(line.unitPrice),
                unitPriceWithTax: Number.parseFloat(line.unitPriceWithTax),
                lineTotal: Number.parseFloat(line.lineTotal),
                igvAmount: Number.parseFloat(line.igvAmount),
                allowanceAmount: Number.parseFloat(line.allowanceAmount || "0"),
                chargeAmount: Number.parseFloat(line.chargeAmount || "0"),
                taxableAmount: Number.parseFloat(line.taxableAmount || line.lineTotal),
                exemptAmount: Number.parseFloat(line.exemptAmount || "0"),
                inaffectedAmount: Number.parseFloat(line.inaffectedAmount || "0"),
                accountLinks: [],
                costCenterLinks: [],
              }
            }) || []

          return {
            documentId: doc.id,
            endpoint: `/api/documents/${doc.id}`,
            payload: {
              updatedById: user?.id,
              accountLinks: [],
              costCenterLinks: [],
              lines: cleanLines,
            },
          }
        }

        // Caso 2: Crear enlaces a nivel de línea usando las líneas reales del documento
        const updatedLines =
          doc.lines?.map((line, index) => {
            const mockItem = allocation.items[index]

            // CORREGIDO: Eliminar campos que causan errores
            const { id, documentId, lineNumber, createdAt, updatedAt, ...cleanLine } = line

            // Si no hay mock item para esta línea, mantener la línea original sin enlaces
            if (!mockItem) {
              return {
                ...cleanLine,
                quantity: Number.parseFloat(line.quantity),
                unitPrice: Number.parseFloat(line.unitPrice),
                unitPriceWithTax: Number.parseFloat(line.unitPriceWithTax),
                lineTotal: Number.parseFloat(line.lineTotal),
                igvAmount: Number.parseFloat(line.igvAmount),
                allowanceAmount: Number.parseFloat(line.allowanceAmount || "0"),
                chargeAmount: Number.parseFloat(line.chargeAmount || "0"),
                taxableAmount: Number.parseFloat(line.taxableAmount || line.lineTotal),
                exemptAmount: Number.parseFloat(line.exemptAmount || "0"),
                inaffectedAmount: Number.parseFloat(line.inaffectedAmount || "0"),
                accountLinks: [],
                costCenterLinks: [],
              }
            }

            const accountLinks = mockItem.accountId
              ? [
                  {
                    accountId: mockItem.accountId,
                    percentage: 1.0,
                    amount: Number.parseFloat(mockItem.amount.toFixed(2)),
                  },
                ]
              : []

            const costCenterLinks = mockItem.costCenterLinks
              .filter((link) => link.costCenterId && link.percentage > 0)
              .map((link) => ({
                costCenterId: link.costCenterId,
                percentage: link.percentage / 100, // Convertir a decimal
                amount: Number.parseFloat(((link.percentage / 100) * mockItem.amount).toFixed(2)),
              }))

            return {
              ...cleanLine, // Mantener todos los datos originales de la línea (sin campos problemáticos)
              quantity: Number.parseFloat(line.quantity),
              unitPrice: Number.parseFloat(line.unitPrice),
              unitPriceWithTax: Number.parseFloat(line.unitPriceWithTax),
              lineTotal: Number.parseFloat(line.lineTotal),
              igvAmount: Number.parseFloat(line.igvAmount),
              allowanceAmount: Number.parseFloat(line.allowanceAmount || "0"),
              chargeAmount: Number.parseFloat(line.chargeAmount || "0"),
              taxableAmount: Number.parseFloat(line.taxableAmount || line.lineTotal),
              exemptAmount: Number.parseFloat(line.exemptAmount || "0"),
              inaffectedAmount: Number.parseFloat(line.inaffectedAmount || "0"),
              // Solo agregar los enlaces, mantener el resto de datos originales
              accountLinks,
              costCenterLinks,
            }
          }) || []

        return {
          documentId: doc.id,
          endpoint: `/api/documents/${doc.id}`,
          payload: {
            updatedById: user?.id,
            lines: updatedLines,
          },
        }
      }
    })

    const conciliationPayload = {
      endpoint: "/api/conciliations",
      payload: {
        companyId: user?.companyId,
        bankAccountId: selectedTransaction?.bankAccountId,
        type: conciliationType,
        reference: conciliationData.reference,
        periodStart: new Date().toISOString().split("T")[0],
        periodEnd: new Date().toISOString().split("T")[0],
        totalDocuments: selectedDocuments.length,
        bankBalance: Number.parseFloat(totals.transactionAmount.toFixed(2)),
        bookBalance: Number.parseFloat(totals.documentsTotal.toFixed(2)),
        difference: Number.parseFloat(totals.difference.toFixed(2)),
        toleranceAmount: 5.0,
        additionalExpensesTotal: Number.parseFloat(totals.expensesTotal.toFixed(2)),
        totalAmount: Number.parseFloat(totals.totalConciliated.toFixed(2)),
        notes: conciliationData.notes,
        createdById: user?.id,
        expenses: expenses.map((expense) => ({
          description: expense.description,
          amount: Number.parseFloat(expense.amount.toFixed(2)),
          expenseType: expense.expenseType,
          accountId: expense.accountId,
          notes: expense.notes,
          isTaxDeductible: expense.isTaxDeductible,
          supportingDocument: "",
          expenseDate: new Date(),
        })),
      },
    }

    // Generar payloads para items de conciliación
    const conciliationItems = selectedDocuments.map((document) => {
      const conciliationAmount = localConciliationAmounts[document.id] || 0
      const documentTotal = Number.parseFloat(document.total)

      return {
        endpoint: "/api/conciliation-items",
        payload: {
          conciliationId: "{{CONCILIATION_ID}}", // Se reemplazará con el ID real
          itemType: "DOCUMENT",
          documentId: document.id,
          documentAmount: Number.parseFloat(documentTotal.toFixed(2)),
          conciliatedAmount: Number.parseFloat(conciliationAmount.toFixed(2)),
          difference: Number.parseFloat(Math.abs(documentTotal - conciliationAmount).toFixed(2)),
          distributionPercentage: Number.parseFloat((conciliationAmount / documentTotal).toFixed(2)),
          detractionAmount: conciliationType === "DETRACTIONS" ? Number.parseFloat(conciliationAmount.toFixed(2)) : 0,
          retentionAmount: 0,
          status: conciliationAmount < documentTotal ? "PARTIAL" : "MATCHED",
          notes: conciliationAmount < documentTotal ? "Conciliación parcial" : undefined,
          systemNotes: `Documento ${document.fullNumber} conciliado`,
          conciliatedBy: user?.id,
        },
      }
    })

    return { documentUpdates, conciliationPayload, conciliationItems }
  }, [
    selectedDocuments,
    documentAllocations,
    conciliationType,
    conciliationData,
    totals,
    expenses,
    user,
    selectedTransaction,
    allocationMode,
    localConciliationAmounts,
  ])

  const handleAccountChange = (documentId: string, accountId: string) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc
        return {
          ...alloc,
          accountId: accountId === "" ? undefined : accountId,
        }
      }),
    )
    debugLog("Account changed", { documentId, accountId })
  }

  const handleItemAccountChange = (documentId: string, itemId: string, accountId: string) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc

        const updatedItems = alloc.items.map((item) => {
          if (item.id !== itemId) return item
          return { ...item, accountId: accountId === "" ? undefined : accountId }
        })

        return { ...alloc, items: updatedItems }
      }),
    )
    debugLog("Item account changed", { documentId, itemId, accountId })
  }

  const handleCostCenterChange = (documentId: string, costCenterLinkId: string, field: string, value: any) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc

        const updatedLinks = alloc.costCenterLinks.map((link) => {
          if (link.id !== costCenterLinkId) return link
          return { ...link, [field]: value }
        })

        return { ...alloc, costCenterLinks: updatedLinks }
      }),
    )
    debugLog("Cost center changed", { documentId, costCenterLinkId, field, value })
  }

  const handleItemCostCenterChange = (
    documentId: string,
    itemId: string,
    costCenterLinkId: string,
    field: string,
    value: any,
  ) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc

        const updatedItems = alloc.items.map((item) => {
          if (item.id !== itemId) return item

          const updatedLinks = item.costCenterLinks.map((link) => {
            if (link.id !== costCenterLinkId) return link
            return { ...link, [field]: value }
          })

          return { ...item, costCenterLinks: updatedLinks }
        })

        return { ...alloc, items: updatedItems }
      }),
    )
    debugLog("Item cost center changed", { documentId, itemId, costCenterLinkId, field, value })
  }

  const addCostCenterLink = (documentId: string) => {
    const allocation = documentAllocations.find((alloc) => alloc.documentId === documentId)
    if (!allocation) return

    const newLink = {
      id: `cc_${documentId}_${Date.now()}`,
      costCenterId: undefined,
      percentage: 0,
      amount: 0,
    }

    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc
        return { ...alloc, costCenterLinks: [...alloc.costCenterLinks, newLink] }
      }),
    )
    debugLog("Added cost center link", { documentId, newLink })
  }

  const addItemCostCenterLink = (documentId: string, itemId: string) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc

        const updatedItems = alloc.items.map((item) => {
          if (item.id !== itemId) return item

          const newLink = {
            id: `cc_item_${itemId}_${Date.now()}`,
            costCenterId: undefined,
            percentage: 0,
            amount: 0,
          }

          return { ...item, costCenterLinks: [...item.costCenterLinks, newLink] }
        })

        return { ...alloc, items: updatedItems }
      }),
    )
    debugLog("Added item cost center link", { documentId, itemId })
  }

  const removeCostCenterLink = (documentId: string, costCenterLinkId: string) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc
        return {
          ...alloc,
          costCenterLinks: alloc.costCenterLinks.filter((link) => link.id !== costCenterLinkId),
        }
      }),
    )
    debugLog("Removed cost center link", { documentId, costCenterLinkId })
  }

  const removeItemCostCenterLink = (documentId: string, itemId: string, costCenterLinkId: string) => {
    setDocumentAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.documentId !== documentId) return alloc

        const updatedItems = alloc.items.map((item) => {
          if (item.id !== itemId) return item
          return {
            ...item,
            costCenterLinks: item.costCenterLinks.filter((link) => link.id !== costCenterLinkId),
          }
        })

        return { ...alloc, items: updatedItems }
      }),
    )
    debugLog("Removed item cost center link", { documentId, itemId, costCenterLinkId })
  }

  const addExpense = () => {
    const newExpense: ConciliationExpense = {
      id: `temp_${Date.now()}`,
      description: "",
      amount: totals.difference, // Inicializar con la diferencia actual
      expenseType: "FINANCIAL",
      isTaxDeductible: false,
    }
    setExpenses((prev) => [...prev, newExpense])
    debugLog("Added new expense", newExpense)
  }

  const updateExpense = (id: string, field: keyof ConciliationExpense, value: any) => {
    setExpenses((prev) => prev.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)))
    debugLog("Updated expense", { id, field, value })
  }

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
    debugLog("Removed expense", id)
  }

  // Gestión de líneas del asiento contable
  const addEntryLine = () => {
    setEntryForm((f) => ({
      ...f,
      lines: [
        ...f.lines,
        {
          lineNumber: f.lines.length + 1,
          accountCode: "",
          movementType: "DEBIT" as MovementType,
          amount: 0,
          description: "",
          auxiliaryCode: "",
          documentRef: "",
        },
      ],
    }))
  }

  const removeEntryLine = (idx: number) => {
    setEntryForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }))
  }

  const updateEntryLine = (idx: number, patch: Partial<CreateAccountingEntryLineDto>) => {
    setEntryForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    }))
  }

  const handleTemplateSelect = (template: AccountingEntryTemplate) => {
    if (template.lines && template.lines.length > 0) {
      // Solo calcular montos si estamos en modo documento y hay exactamente un documento
      const shouldCalculateAmounts = allocationMode === "document" && selectedDocuments.length === 1
      const documentAmount = shouldCalculateAmounts ? parseFloat(selectedDocuments[0].total) : 0

      // Convertir las líneas de la plantilla al formato del asiento contable
      const templateLines: CreateAccountingEntryLineDto[] = template.lines.map((line, index) => {
        let calculatedAmount = 0

        if (shouldCalculateAmounts && line.calculationBase && line.value) {
          const value = typeof line.value === 'string' ? parseFloat(line.value) : line.value
          
          switch (line.calculationBase) {
            case "SUBTOTAL":
              // Para subtotal, usar el monto del documento directamente
              calculatedAmount = documentAmount
              break
            case "IGV":
              // Para IGV, calcular el 18% del subtotal
              calculatedAmount = documentAmount * 0.18
              break
            case "TOTAL":
              // Para total, usar el monto del documento
              calculatedAmount = documentAmount
              break
            case "RENT":
              // Para renta, usar el valor como porcentaje del monto
              calculatedAmount = (documentAmount * value) / 100
              break
            case "TAX":
              // Para impuestos, usar el valor como porcentaje del monto
              calculatedAmount = (documentAmount * value) / 100
              break
            case "RETENTION_AMOUNT":
              // Para retención, verificar si es porcentaje o valor directo
              if (line.applicationType === "PERCENTAGE") {
                calculatedAmount = (documentAmount * value) / 100
              } else {
                calculatedAmount = typeof value === 'number' ? value : 0
              }
              break
            case "DETRACTION_AMOUNT":
              // Para detracción, verificar si es porcentaje o valor directo
              if (line.applicationType === "PERCENTAGE") {
                calculatedAmount = (documentAmount * value) / 100
              } else {
                calculatedAmount = typeof value === 'number' ? value : 0
              }
              break
            case "NET_PAYABLE":
              // Para monto neto a pagar, verificar si es porcentaje o valor directo
              if (line.applicationType === "PERCENTAGE") {
                calculatedAmount = (documentAmount * value) / 100
              } else {
                calculatedAmount = typeof value === 'number' ? value : 0
              }
              break
            case "PENDING_AMOUNT":
              // Para monto pendiente, verificar si es porcentaje o valor directo
              if (line.applicationType === "PERCENTAGE") {
                calculatedAmount = (documentAmount * value) / 100
              } else {
                calculatedAmount = typeof value === 'number' ? value : 0
              }
              break
            case "CONCILIATED_AMOUNT":
              // Para monto conciliado, verificar si es porcentaje o valor directo
              if (line.applicationType === "PERCENTAGE") {
                calculatedAmount = (documentAmount * value) / 100
              } else {
                calculatedAmount = typeof value === 'number' ? value : 0
              }
              break
            case "OTHER":
              // Para otros, usar el valor directamente si es numérico
              calculatedAmount = typeof value === 'number' ? value : 0
              break
            default:
              // Para otros casos, no calcular
              calculatedAmount = 0
          }
        }

        // Si el tipo de aplicación es TRANSACTION_AMOUNT, usar el monto de la transacción
        if (line.applicationType === "TRANSACTION_AMOUNT" && selectedTransaction) {
          calculatedAmount = Math.abs(parseFloat(selectedTransaction.amount))
        }

        return {
          lineNumber: index + 1,
          accountCode: line.accountCode,
          movementType: line.movementType,
          amount: calculatedAmount,
          description: "",
          applicationType: line.applicationType,
          calculationBase: line.calculationBase,
          value: line.value,
          auxiliaryCode: "",
          documentRef: "",
        }
      })

      setEntryForm((f) => ({
        ...f,
        lines: templateLines,
        notes: template.description || f.notes,
      }))

      const amountInfo = shouldCalculateAmounts 
        ? ` con montos calculados del documento (${formatCurrency(documentAmount)})`
        : " (montos en 0 - verificar configuración)"

      toast({
        title: "Plantilla aplicada",
        description: `Se ha precargado la plantilla "${template.name}" con ${templateLines.length} líneas${amountInfo}. Hover sobre los montos para ver los cálculos.`,
      })
    }
  }

  const handleSubmit = async () => {
    setError(null)

    if (!user?.companyId || !selectedTransaction) {
      setError("Información de usuario o transacción no disponible")
      return
    }

    // Validación: asiento contable cuadrado si se ha ingresado
    if (entryForm.lines.length > 0 && !entryTotals.balanced) {
      setError(
        `El asiento contable no está cuadrado. Debe: ${formatCurrency(entryTotals.debit)}, Haber: ${formatCurrency(entryTotals.credit)}`,
      )
      return
    }

    if (!totals.isBalanced) {
      setError(`La diferencia de ${formatCurrency(totals.difference)} excede la tolerancia permitida (S/ 5.00)`)
      return
    }

    debugLog("Starting conciliation process")

    try {
      // PASO 1: Crear la conciliación (solo con gastos)
      const conciliationPayload: CreateConciliationDto = {
        companyId: user.companyId,
        bankAccountId: selectedTransaction.bankAccountId,
        transactionId: selectedTransaction.id,
        type: conciliationType,
        reference: conciliationData.reference,
        periodStart: new Date().toISOString().split("T")[0],
        periodEnd: new Date().toISOString().split("T")[0],
        totalDocuments: selectedDocuments.length,
        conciliatedItems: 0, // Se actualizará después de crear los items
        pendingItems: selectedDocuments.length,
        bankBalance: Number.parseFloat(totals.transactionAmount.toFixed(2)),
        bookBalance: Number.parseFloat(totals.documentsTotal.toFixed(2)),
        difference: Number.parseFloat(totals.difference.toFixed(2)),
        toleranceAmount: 5.0,
        status: "IN_PROGRESS",
        additionalExpensesTotal: Number.parseFloat(totals.expensesTotal.toFixed(2)),
        totalAmount: Number.parseFloat(totals.totalConciliated.toFixed(2)),
        notes: conciliationData.notes,
        createdById: user.id,
        // Solo incluir gastos en la creación inicial
        expenses: expenses.map((expense) => ({
          description: expense.description,
          amount: Number.parseFloat(expense.amount.toFixed(2)),
          expenseType: expense.expenseType,
          accountId: expense.accountId,
          notes: expense.notes,
          isTaxDeductible: expense.isTaxDeductible,
          supportingDocument: "",
          expenseDate: new Date(),
        })),
      }

      debugLog("Creating conciliation", conciliationPayload)
      const createdConciliation = await createConciliation(conciliationPayload)

      if (!createdConciliation) {
        throw new Error("No se pudo crear la conciliación")
      }

      debugLog("Conciliation created successfully", createdConciliation)

      // PASO 2: Crear los items de conciliación para cada documento
      const createdItems: ConciliationItem[] = []

      for (const document of selectedDocuments) {
        const conciliationAmount = localConciliationAmounts[document.id] || 0
        const documentTotal = Number.parseFloat(document.total)

        const itemPayload: CreateConciliationItemDto = {
          conciliationId: createdConciliation.id,
          itemType: "DOCUMENT",
          documentId: document.id,
          documentAmount: documentTotal,
          conciliatedAmount: conciliationAmount,
          difference: Math.abs(documentTotal - conciliationAmount),
          distributionPercentage: conciliationAmount / documentTotal,
          status: conciliationAmount < documentTotal ? "PARTIAL" : "MATCHED",
          notes: conciliationAmount < documentTotal ? "Conciliación parcial" : undefined,
          systemNotes: `Documento ${document.fullNumber} conciliado`,
          conciliatedBy: user.id,
        }

        debugLog("Creating conciliation item", itemPayload)
        const createdItem = await createConciliationItem(itemPayload)

        if (createdItem) {
          createdItems.push(createdItem)
          debugLog("Item created successfully", createdItem)
        } else {
          debugLog("Failed to create item for document", document.id)
        }
      }

      // PASO 3: Actualizar documentos con cuentas contables y centros de costo
      for (const docUpdate of generatePayloads.documentUpdates) {
        debugLog("Updating document accounting info", docUpdate)
        // El payload ya contiene updatedById y las propiedades accountLinks/costCenterLinks o lines
        await updateDocument(docUpdate.documentId, docUpdate.payload as UpdateDocumentDto)
      }

      // PASO 4: Actualizar el estado de la conciliación si todos los items se crearon
      if (createdItems.length === selectedDocuments.length) {
        const updatePayload: UpdateConciliationDto = {
          conciliatedItems: createdItems.length,
          pendingItems: 0,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }

        debugLog("Updating conciliation status", updatePayload)
        await updateConciliation(createdConciliation.id, updatePayload)
      }

      debugLog("Conciliation process completed successfully")

      // PASO 5: Crear asiento contable si hay líneas
      if (entryForm.lines.length > 0) {
        const entryPayload: CreateAccountingEntryDto = {
          companyId: user.companyId,
          conciliationId: createdConciliation.id,
          status: "DRAFT",
          notes: entryForm.notes || `Asiento conciliación ${conciliationData.reference || createdConciliation.id}`,
          metadata: {
            transactionId: selectedTransaction.id,
            transactionDate: selectedTransaction.transactionDate,
            transactionAmount: selectedTransaction.amount,
            conciliationReference: conciliationData.reference,
          },
          lines: entryForm.lines.map((l, i) => ({
            lineNumber: l.lineNumber || i + 1,
            accountCode: l.accountCode,
            movementType: l.movementType,
            amount: Number(l.amount) || 0,
            description: l.description || "",
            auxiliaryCode: l.auxiliaryCode || "",
            documentRef: l.documentRef || "",
          })),
        }
        debugLog("Creating accounting entry", entryPayload)
        await createEntry(entryPayload)
      }

      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      debugLog("Error in conciliation process", error)
      setError(error?.message || "Error al crear la conciliación")
    }
  }

  const resetForm = () => {
    setConciliationData({
      reference: "",
      notes: "",
    })
    setDocumentAllocations([])
    setExpenses([])
    setActiveTab("documents")
    setApplyReserves(false)
    setAllocationMode("document")
    setError(null)
    setEntryForm({
      companyId: "",
      conciliationId: "",
      status: "DRAFT",
      notes: "Asiento de conciliación",
      lines: [],
    })
    debugLog("Form reset")
  }

  const formatCurrency = (amount: number, currencySymbol = "S/") => {
    return `${currencySymbol} ${amount.toFixed(2)}`
  }

  const generateCalculationTooltip = (line: any, documentAmount?: number) => {
    // Si no hay calculationBase, verificar si es TRANSACTION_AMOUNT
    if (!line.calculationBase) {
      if (line.applicationType === "TRANSACTION_AMOUNT" && selectedTransaction) {
        const transactionAmount = Math.abs(parseFloat(selectedTransaction.amount))
        return `💳 **Monto de Transacción Bancaria:**\n\n` +
               `Monto: ${formatCurrency(transactionAmount)}\n` +
               `Descripción: ${selectedTransaction.description}\n` +
               `Fecha: ${new Date(selectedTransaction.transactionDate).toLocaleDateString('es-ES')}\n\n` +
               `📋 Este monto proviene directamente de la transacción bancaria seleccionada.`
      }
      return "📝 Monto ingresado manualmente"
    }

    const baseAmount = documentAmount || 0
    let explanation = ""
    let calculatedAmount = line.amount

    switch (line.calculationBase) {
      case "SUBTOTAL":
        explanation = `📄 Monto del documento: ${formatCurrency(baseAmount)}`
        break
      case "IGV":
        explanation = `🧮 Cálculo del IGV (18%):\n\n` +
                     `Monto base: ${formatCurrency(baseAmount)}\n` +
                     `Porcentaje: 18%\n` +
                     `Fórmula: ${formatCurrency(baseAmount)} × 0.18\n` +
                     `Resultado: ${formatCurrency(calculatedAmount)}`
        break
      case "TOTAL":
        explanation = `📄 Monto total del documento: ${formatCurrency(baseAmount)}`
        break
      case "RENT":
        const rentValue = typeof line.value === 'string' ? parseFloat(line.value) : (line.value || 0)
        explanation = `🧮 Cálculo de Renta (${rentValue}%):\n\n` +
                     `Monto base: ${formatCurrency(baseAmount)}\n` +
                     `Porcentaje: ${rentValue}%\n` +
                     `Fórmula: ${formatCurrency(baseAmount)} × ${rentValue}%\n` +
                     `Resultado: ${formatCurrency(calculatedAmount)}`
        break
      case "TAX":
        const taxValue = typeof line.value === 'string' ? parseFloat(line.value) : (line.value || 0)
        explanation = `🧮 Cálculo de Impuesto (${taxValue}%):\n\n` +
                     `Monto base: ${formatCurrency(baseAmount)}\n` +
                     `Porcentaje: ${taxValue}%\n` +
                     `Fórmula: ${formatCurrency(baseAmount)} × ${taxValue}%\n` +
                     `Resultado: ${formatCurrency(calculatedAmount)}`
        break
      case "RETENTION_AMOUNT":
        if (typeof line.value === 'number') {
          explanation = `💰 Monto de retención: ${formatCurrency(line.value)}`
        } else {
          explanation = "💰 Monto de retención configurado en la plantilla"
        }
        break
      case "DETRACTION_AMOUNT":
        if (typeof line.value === 'number') {
          explanation = `💰 Monto de detracción: ${formatCurrency(line.value)}`
        } else {
          explanation = "💰 Monto de detracción configurado en la plantilla"
        }
        break
      case "NET_PAYABLE":
        if (typeof line.value === 'number') {
          explanation = `💰 Monto neto a pagar: ${formatCurrency(line.value)}`
        } else {
          explanation = "💰 Monto neto a pagar configurado en la plantilla"
        }
        break
      case "PENDING_AMOUNT":
        if (typeof line.value === 'number') {
          explanation = `💰 Monto pendiente de pago: ${formatCurrency(line.value)}`
        } else {
          explanation = "💰 Monto pendiente de pago configurado en la plantilla"
        }
        break
      case "CONCILIATED_AMOUNT":
        if (typeof line.value === 'number') {
          explanation = `💰 Monto ya conciliado: ${formatCurrency(line.value)}`
        } else {
          explanation = "💰 Monto ya conciliado configurado en la plantilla"
        }
        break
      case "OTHER":
        if (typeof line.value === 'number') {
          explanation = `💰 Monto fijo de la plantilla: ${formatCurrency(line.value)}`
        } else {
          explanation = "💰 Monto configurado en la plantilla"
        }
        break
      default:
        explanation = "📋 Cálculo basado en la plantilla"
    }

    // Si el tipo de aplicación es TRANSACTION_AMOUNT, agregar información especial
    if (line.applicationType === "TRANSACTION_AMOUNT" && selectedTransaction) {
      const transactionAmount = Math.abs(parseFloat(selectedTransaction.amount))
      explanation += `\n\n💳 **Monto de Transacción Bancaria:**\n` +
                   `Monto: ${formatCurrency(transactionAmount)}\n` +
                   `Descripción: ${selectedTransaction.description}\n` +
                   `Fecha: ${new Date(selectedTransaction.transactionDate).toLocaleDateString('es-ES')}`
    }

    // Agregar información del monto base si está disponible
    if (documentAmount && line.calculationBase !== "OTHER") {
      explanation += `\n\n📊 Monto base del documento: ${formatCurrency(documentAmount)}`
    }

    // Agregar información de la plantilla
    explanation += `\n\n🔧 Plantilla aplicada: ${line.calculationBase}`
    if (line.value !== undefined && line.value !== null) {
      if (line.calculationBase === "RENT" || line.calculationBase === "TAX") {
        explanation += ` (${line.value}%)`
      } else if (line.calculationBase === "OTHER") {
        explanation += ` (${formatCurrency(typeof line.value === 'number' ? line.value : parseFloat(line.value || '0'))})`
      }
    }

    return explanation
  }

  const handleTabChange = (nextTab: string) => {
    if (
      activeTab === "accounts" &&
      nextTab !== "accounts" &&
      entryForm.lines.length > 0 &&
      !(
        entryForm.lines.length === 0 || (entryForm.lines.length > 0 && Math.abs(entryTotals.debit - entryTotals.credit) < 0.005)
      )
    ) {
      setError(
        `El asiento contable no está cuadrado. Debe: ${formatCurrency(entryTotals.debit)}, Haber: ${formatCurrency(
          entryTotals.credit,
        )}`,
      )
      return
    }
    setActiveTab(nextTab)
  }

  const handleDialogOpenChange = (requestedOpen: boolean) => {
    if (!requestedOpen) {
      if (activeTab === "accounts" && entryForm.lines.length > 0 && Math.abs(entryTotals.debit - entryTotals.credit) >= 0.005) {
        setError(
          `El asiento contable no está cuadrado. Debe: ${formatCurrency(entryTotals.debit)}, Haber: ${formatCurrency(
            entryTotals.credit,
          )}`,
        )
        return
      }
    }
    onOpenChange(requestedOpen)
  }

  if (!selectedTransaction) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <span>Detalles de Conciliación</span>
              <div className="flex items-center gap-2 ml-4">
                <Label htmlFor="allocation-mode" className="text-xs">
                  Modo:
                </Label>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs ${allocationMode === "document" ? "font-medium" : "text-muted-foreground"}`}
                  >
                    Documento
                  </span>
                  <Switch
                    id="allocation-mode"
                    checked={allocationMode === "item"}
                    onCheckedChange={(checked) => setAllocationMode(checked ? "item" : "document")}
                  />
                  <span className={`text-xs ${allocationMode === "item" ? "font-medium" : "text-muted-foreground"}`}>
                    Item
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDialogOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4 h-[calc(95vh-120px)]">
          {/* Left Column - Transaction Info */}
          <div className="col-span-3 space-y-3">
            <Card className="h-fit">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Información de la Transacción</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-32">
                  <div className="space-y-2 text-xs pr-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Proveedor</Label>
                        <div className="font-medium text-xs truncate">
                          {selectedDocuments.length > 0 
                            ? selectedDocuments[0].supplier?.businessName || 'N/A'
                            : "No disponible"
                          }
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Mov. Bancario</Label>
                        <div className="font-medium text-xs">{selectedTransaction.operationNumber}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Fecha</Label>
                        <div className="font-medium text-xs">
                          {new Date(selectedTransaction.transactionDate).toLocaleDateString("es-PE")}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Docs.</Label>
                        <div className="font-medium text-xs">{selectedDocuments.length}</div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Banco</Label>
                      <div className="font-medium text-xs truncate">
                        {selectedTransaction.bankAccount?.bank?.name || "No disponible"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Descripción</Label>
                      <div className="font-medium text-xs truncate max-h-16 overflow-hidden">
                        {selectedTransaction.description}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    Resumen Financiero
                    {totals.isBalanced ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("documents")}
                    className="h-6 px-2 text-xs"
                  >
                    Editar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Transacción:
                    </span>
                    <span className="font-bold">{formatCurrency(totals.transactionAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      {conciliationType === "DOCUMENTS" ? "Documentos" : "Detracciones"}:
                    </span>
                    <span className="font-bold">{formatCurrency(totals.documentsTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Gastos adicionales:
                    </span>
                    <span className="font-bold">{formatCurrency(totals.expensesTotal)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Diferencia:</span>
                    <span className={`font-bold ${totals.isBalanced ? "text-green-600" : "text-orange-600"}`}>
                      {formatCurrency(totals.difference)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Conciliado:</span>
                    <span className="font-bold text-base">{formatCurrency(totals.totalConciliated)}</span>
                  </div>
                </div>

                {!totals.isBalanced && (
                  <Alert className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Diferencia excede tolerancia de S/ 5.00</AlertDescription>
                  </Alert>
                )}

                {totals.isBalanced && (
                  <Alert className="py-2 border-green-200 bg-green-50">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <AlertDescription className="text-xs text-green-700">
                      Conciliación dentro de tolerancia
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Form Controls */}
            <Card className="h-fit">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div>
                  <Label className="text-xs">Referencia</Label>
                  <Input
                    value={conciliationData.reference}
                    onChange={(e) => setConciliationData((prev) => ({ ...prev, reference: e.target.value }))}
                    placeholder="Referencia"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Observaciones</Label>
                  <Textarea
                    value={conciliationData.notes}
                    onChange={(e) => setConciliationData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observaciones generales"
                    className="text-xs"
                    rows={2}
                  />
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-2" />
                      Crear Conciliación
                    </>
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="col-span-9">
            <ScrollArea className="h-full">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5 h-8">
                <TabsTrigger value="documents" className="text-xs">
                  {conciliationType === "DOCUMENTS" ? "Documentos" : "Detracciones"}
                </TabsTrigger>
                <TabsTrigger value="accounts" className="text-xs">
                  Contabilidad
                </TabsTrigger>
                <TabsTrigger value="costs" className="text-xs">
                  Centro Costos
                </TabsTrigger>
                <TabsTrigger value="expenses" className="text-xs">
                  Otros
                </TabsTrigger>
                <TabsTrigger value="developer" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  Dev
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-2 border rounded-md">
                <TabsContent value="documents" className="h-full m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {selectedDocuments.map((document) => {
                        const conciliationAmount = localConciliationAmounts[document.id] || 0
                        const pendingAmount =
                          conciliationType === "DOCUMENTS"
                            ? Number.parseFloat(document.pendingAmount || "0")
                            : Number.parseFloat(document.detraction?.amount || "0")

                        return (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-3 border rounded text-xs"
                          >
                            <div>
                              <div className="font-medium">{document.fullNumber}</div>
                              <div className="text-muted-foreground truncate max-w-48">
                                {document.supplier?.businessName}
                              </div>
                              <div className="text-muted-foreground">
                                Emisión: {new Date(document.issueDate).toLocaleDateString("es-PE")}
                              </div>
                              {conciliationAmount < pendingAmount && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Conciliación parcial
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(conciliationAmount)}</div>
                              <div className="text-muted-foreground">de {formatCurrency(pendingAmount)}</div>
                              <div className="text-muted-foreground">
                                Vence: {new Date(document.dueDate || document.issueDate).toLocaleDateString("es-PE")}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="accounts" className="h-full m-0 p-0">
                  <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-muted-foreground">
                          Asigne una cuenta contable por {allocationMode === "document" ? "documento" : "ítem"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="mr-2">Debe: <span className="font-semibold">{formatCurrency(entryTotals.debit)}</span></span>
                          <span>Haber: <span className="font-semibold">{formatCurrency(entryTotals.credit)}</span></span>
                        </div>
                        {entryForm.lines.length > 0 && (
                          <Badge variant={entryTotals.balanced ? "default" : "destructive"}>
                            {entryTotals.balanced ? "Cuadrado" : "Descuadrado"}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge variant="outline" className="text-xs">
                            {entryForm.status === "DRAFT" && "Borrador"}
                            {entryForm.status === "POSTED" && "Contabilizado"}
                            {entryForm.status === "CANCELLED" && "Anulado"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)]">
                    <div className="p-4 space-y-3">
                      {/* Sección: Asiento contable manual (Debe/Haber) */}
                      <div className="p-3 border rounded space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Asiento contable</span>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                                           <TooltipContent className="max-w-sm z-[9999] bg-gradient-to-br from-green-50 to-teal-100 border-2 border-green-200 shadow-lg" side="top" sideOffset={5}>
                       <div className="p-3">
                         <div className="bg-green-600 text-white px-3 py-2 rounded-t-lg -mt-3 -mx-3 mb-3">
                           <p className="text-sm font-bold text-center">💡 Información del Sistema</p>
                         </div>
                         <div className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-green-200">
                           <p className="text-center font-medium">
                             Los montos se calculan automáticamente según la plantilla aplicada
                           </p>
                         </div>
                       </div>
                     </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setTemplateSearchOpen(true)}
                              className="text-xs"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Buscar Plantilla
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              Ingrese líneas de Debe/Haber. Debe = Haber antes de continuar.
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            placeholder="Notas del asiento (opcional)"
                            value={entryForm.notes || ""}
                            onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))}
                            className="h-8 text-xs"
                          />
                          <Select
                            value={entryForm.status}
                            onValueChange={(value) => setEntryForm((f) => ({ ...f, status: value as any }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">Borrador</SelectItem>
                              <SelectItem value="POSTED">Contabilizado</SelectItem>
                              <SelectItem value="CANCELLED">Anulado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border rounded overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10 text-xs">#</TableHead>
                                <TableHead className="w-32 text-xs">Cuenta</TableHead>
                                <TableHead className="w-20 text-xs">Tipo</TableHead>
                                <TableHead className="w-40 text-right text-xs">
                                  <div className="flex items-center justify-end gap-1">
                                    <span>Monto</span>
                                    <TooltipProvider delayDuration={300}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-3 w-3 text-blue-500 cursor-help" />
                                        </TooltipTrigger>
                                                             <TooltipContent className="max-w-sm z-[9999] bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200 shadow-lg" side="top" sideOffset={5}>
                       <div className="p-3">
                         <div className="bg-orange-600 text-white px-3 py-2 rounded-t-lg -mt-3 -mx-3 mb-3">
                           <p className="text-sm font-bold text-center">💡 Ayuda</p>
                         </div>
                         <div className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-orange-200">
                           <p className="text-center font-medium">
                             Hover sobre el campo para ver el cálculo detallado
                           </p>
                         </div>
                       </div>
                     </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableHead>
                                <TableHead className="w-20 text-xs">Auxiliar</TableHead>
                                <TableHead className="w-16"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entryForm.lines.map((line, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-xs">{line.lineNumber || idx + 1}</TableCell>
                                  <TableCell>
                                    <Select
                                      value={line.accountCode}
                                      onValueChange={(v) => updateEntryLine(idx, { accountCode: v })}
                                    >
                                      <SelectTrigger className="h-8 w-28 text-xs">
                                        <SelectValue placeholder="Cuenta" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {accountingAccounts.map((acc) => (
                                          <SelectItem key={acc.id} value={acc.accountCode} className="text-xs">
                                            {acc.accountCode} - {acc.accountName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={line.movementType}
                                      onValueChange={(v) => updateEntryLine(idx, { movementType: v as MovementType })}
                                    >
                                      <SelectTrigger className="h-8 w-16 text-xs">
                                        <SelectValue placeholder="Tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="DEBIT">D</SelectItem>
                                        <SelectItem value="CREDIT">H</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                                                      <TableCell className="text-right">
                                      <div className="flex items-center gap-2 justify-end">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={String(line.amount)}
                                          onChange={(e) => updateEntryLine(idx, { amount: Number.parseFloat(e.target.value || "0") })}
                                          className="h-8 text-xs text-right"
                                        />
                                        {/* Icono de información para TODOS los tipos de monto */}
                                        <TooltipProvider delayDuration={300}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Info className="h-4 w-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-md z-[9999] bg-white border border-gray-200 shadow-lg" side="top" sideOffset={5}>
                                              <div className="p-4">
                                                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-t-lg -mt-4 -mx-4 mb-4">
                                                  <p className="text-sm font-medium text-center">Información del Monto</p>
                                                </div>
                                                
                                                {/* Sección del cálculo */}
                                                <div className="text-xs text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                                                  {generateCalculationTooltip(line, selectedDocuments.length === 1 ? parseFloat(selectedDocuments[0].total) : undefined)}
                                                </div>
                                                
                                                {/* Sección de información de la plantilla */}
                                                {line.calculationBase && (
                                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                                                    <p className="text-xs font-medium text-gray-700 mb-2 text-center">Detalles de la Plantilla</p>
                                                    <div className="space-y-2">
                                                      <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Base:</span>
                                                        <span className="bg-gray-200 px-2 py-1 rounded text-gray-700 font-medium">
                                                          {line.calculationBase}
                                                        </span>
                                                      </div>
                                                      {line.value !== undefined && line.value !== null && (
                                                        <div className="flex justify-between items-center">
                                                          <span className="font-medium text-gray-600">Valor:</span>
                                                          <span className="bg-gray-200 px-2 py-1 rounded text-gray-700 font-medium">
                                                            {
                                                              line.calculationBase === "RENT" || line.calculationBase === "TAX" 
                                                                ? `${line.value}%` 
                                                                : line.calculationBase === "OTHER" 
                                                                  ? formatCurrency(typeof line.value === 'number' ? line.value : parseFloat(line.value || '0'))
                                                                  : line.value
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                      {line.applicationType && (
                                                        <div className="flex justify-between items-center">
                                                          <span className="font-medium text-gray-600">Tipo:</span>
                                                          <span className="bg-gray-200 px-2 py-1 rounded text-gray-700 font-medium">
                                                            {line.applicationType}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Sección del monto - siempre visible */}
                                                <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                                                  <p className="text-xs font-medium text-gray-700 text-center">
                                                    Monto: {formatCurrency(line.amount)}
                                                  </p>
                                                </div>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Auxiliar"
                                      value={line.auxiliaryCode || ""}
                                      onChange={(e) => updateEntryLine(idx, { auxiliaryCode: e.target.value })}
                                      className="h-8 text-xs"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-7" onClick={() => removeEntryLine(idx)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-7" onClick={addEntryLine}>
                              <Plus className="h-3 w-3 mr-1" /> Agregar línea
                            </Button>
                          </div>
                          <div className="text-xs">
                            Debe: <span className="font-semibold">{formatCurrency(entryTotals.debit)}</span> · Haber: {" "}
                            <span className="font-semibold">{formatCurrency(entryTotals.credit)}</span> {" "}
                            {entryForm.lines.length > 0 && (
                              <span className={entryTotals.balanced ? "text-green-600" : "text-orange-600"}>
                                ({entryTotals.balanced ? "Cuadrado" : "Descuadrado"})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="costs" className="h-full m-0 p-0">
                  <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apply-reserves"
                          checked={applyReserves}
                          onCheckedChange={(checked) => setApplyReserves(checked === true)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="apply-reserves" className="text-xs">
                          Aplicar según Reservas
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-muted-foreground">
                          Puede asignar múltiples centros de costo por{" "}
                          {allocationMode === "document" ? "documento" : "ítem"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)]">
                    <div className="p-4 space-y-3">
                      {selectedDocuments.map((document) => {
                        const allocation = documentAllocations.find((alloc) => alloc.documentId === document.id)
                        if (!allocation) return null

                        return (
                          <div key={document.id} className="p-3 border rounded space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium">{document.fullNumber}</span>
                              <Badge variant="outline">{formatCurrency(allocation.amount)}</Badge>
                            </div>

                            {allocationMode === "document" ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Centros de Costo</Label>
                                  <Button
                                    onClick={() => addCostCenterLink(document.id)}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar
                                  </Button>
                                </div>

                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[45%] text-xs">Centro de Costo</TableHead>
                                      <TableHead className="w-[20%] text-xs">Porcentaje</TableHead>
                                      <TableHead className="w-[25%] text-xs text-right">Monto</TableHead>
                                      <TableHead className="w-[10%] text-xs"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {allocation.costCenterLinks.map((link) => (
                                      <TableRow key={link.id}>
                                        <TableCell className="py-1">
                                          <Select
                                            value={link.costCenterId || ""}
                                            onValueChange={(value) =>
                                              handleCostCenterChange(document.id, link.id, "costCenterId", value)
                                            }
                                          >
                                            <SelectTrigger className="h-7 text-xs">
                                              <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {costCenters.map((center) => (
                                                <SelectItem key={center.id} value={center.id} className="text-xs">
                                                  {center.code} - {center.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </TableCell>
                                        <TableCell className="py-1">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={link.percentage}
                                            onChange={(e) =>
                                              handleCostCenterChange(
                                                document.id,
                                                link.id,
                                                "percentage",
                                                Number.parseFloat(e.target.value) || 0,
                                              )
                                            }
                                            className="h-7 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell className="text-right py-1 text-xs">
                                          {formatCurrency((link.percentage / 100) * allocation.amount)}
                                        </TableCell>
                                        <TableCell className="py-1">
                                          {allocation.costCenterLinks.length > 1 && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeCostCenterLink(document.id, link.id)}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {allocation.items.map((item) => (
                                  <div key={item.id} className="border rounded p-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-medium">{item.description}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">{formatCurrency(item.amount)}</span>
                                        <Button
                                          onClick={() => addItemCostCenterLink(document.id, item.id)}
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Agregar
                                        </Button>
                                      </div>
                                    </div>

                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[45%] text-xs">Centro de Costo</TableHead>
                                          <TableHead className="w-[20%] text-xs">Porcentaje</TableHead>
                                          <TableHead className="w-[25%] text-xs text-right">Monto</TableHead>
                                          <TableHead className="w-[10%] text-xs"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {item.costCenterLinks.map((link) => (
                                          <TableRow key={link.id}>
                                            <TableCell className="py-1">
                                              <Select
                                                value={link.costCenterId || ""}
                                                onValueChange={(value) =>
                                                  handleItemCostCenterChange(
                                                    document.id,
                                                    item.id,
                                                    link.id,
                                                    "costCenterId",
                                                    value,
                                                  )
                                                }
                                              >
                                                <SelectTrigger className="h-7 text-xs">
                                                  <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {costCenters.map((center) => (
                                                    <SelectItem key={center.id} value={center.id} className="text-xs">
                                                      {center.code} - {center.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell className="py-1">
                                              <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={link.percentage}
                                                onChange={(e) =>
                                                  handleItemCostCenterChange(
                                                    document.id,
                                                    item.id,
                                                    link.id,
                                                    "percentage",
                                                    Number.parseFloat(e.target.value) || 0,
                                                  )
                                                }
                                                className="h-7 text-xs"
                                              />
                                            </TableCell>
                                            <TableCell className="text-right py-1 text-xs">
                                              {formatCurrency((link.percentage / 100) * item.amount)}
                                            </TableCell>
                                            <TableCell className="py-1">
                                              {item.costCenterLinks.length > 1 && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    removeItemCostCenterLink(document.id, item.id, link.id)
                                                  }
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="expenses" className="h-full m-0 p-0">
                  <div className="p-3 border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">Gasto sin documento que completa la conciliación</Label>
                      <Button onClick={addExpense} size="sm" variant="outline" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)]">
                    <div className="p-4 space-y-3">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="p-3 border rounded space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <div>
                                <Label className="text-xs">Tipo</Label>
                                <Select
                                  value={expense.expenseType}
                                  onValueChange={(value) => updateExpense(expense.id, "expenseType", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="FINANCIAL">Financiero</SelectItem>
                                    <SelectItem value="OPERATIONAL">Operacional</SelectItem>
                                    <SelectItem value="ADMINISTRATIVE">Administrativo</SelectItem>
                                    <SelectItem value="TAX">Tributario</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Cuenta Contable</Label>
                                <Select
                                  value={expense.accountId || ""}
                                  onValueChange={(value) => updateExpense(expense.id, "accountId", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accountingAccounts.map((account) => (
                                      <SelectItem key={account.id} value={account.id} className="text-xs">
                                        {account.accountCode} - {account.accountName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Monto</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={expense.amount}
                                  onChange={(e) =>
                                    updateExpense(expense.id, "amount", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="flex items-center space-x-2 pt-6">
                                <Checkbox
                                  id={`tax-deductible-${expense.id}`}
                                  checked={expense.isTaxDeductible}
                                  onCheckedChange={(checked) =>
                                    updateExpense(expense.id, "isTaxDeductible", checked === true)
                                  }
                                  className="h-4 w-4"
                                />
                                <Label htmlFor={`tax-deductible-${expense.id}`} className="text-xs">
                                  Deducible
                                </Label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpense(expense.id)}
                              className="h-8 w-8 p-0 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">Descripción</Label>
                            <Input
                              value={expense.description}
                              onChange={(e) => updateExpense(expense.id, "description", e.target.value)}
                              placeholder="Descripción del gasto"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Observaciones</Label>
                            <Textarea
                              value={expense.notes || ""}
                              onChange={(e) => updateExpense(expense.id, "notes", e.target.value)}
                              placeholder="Observaciones adicionales"
                              className="text-xs"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No hay gastos adicionales</p>
                          <p className="text-xs">Agregue gastos para completar la conciliación</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>

              <TabsContent value="developer" className="h-full m-0 p-0">
                <div className="p-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Payloads de API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedDocuments.length} docs
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {expenses.length} gastos
                      </Badge>
                      <Badge variant={totals.isBalanced ? "default" : "destructive"} className="text-xs">
                        {totals.isBalanced ? "Balanceado" : "Desbalanceado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100%-60px)]">
                  <div className="p-4 space-y-4">
                    {/* 1. Creación de Conciliación */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            POST
                          </Badge>
                          Crear Conciliación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="text-xs space-y-1 mb-2">
                          <div>
                            <span className="text-muted-foreground">Endpoint:</span>
                            <span className="ml-1 font-mono">{generatePayloads.conciliationPayload.endpoint}</span>
                          </div>
                        </div>
                        <details className="cursor-pointer">
                          <summary className="text-xs text-muted-foreground hover:text-primary">
                            Ver payload completo
                          </summary>
                          <ScrollArea className="h-32 mt-2 border rounded bg-muted/20">
                            <pre className="p-2 text-xs whitespace-pre-wrap">
                              {JSON.stringify(generatePayloads.conciliationPayload.payload, null, 2)}
                            </pre>
                          </ScrollArea>
                        </details>
                      </CardContent>
                    </Card>

                    {/* 2. Creación de Items de Conciliación */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            POST
                          </Badge>
                          Crear Items de Conciliación ({generatePayloads.conciliationItems.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {generatePayloads.conciliationItems.map((item, index) => {
                            const doc = selectedDocuments[index]
                            return (
                              <div key={index} className="border rounded p-2 bg-background">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium">{doc?.fullNumber}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {item.payload.status}
                                  </Badge>
                                </div>
                                <div className="text-xs space-y-1 mb-2">
                                  <div>
                                    <span className="text-muted-foreground">Endpoint:</span>
                                    <span className="ml-1 font-mono">{item.endpoint}</span>
                                  </div>
                                </div>
                                <details className="cursor-pointer">
                                  <summary className="text-xs text-muted-foreground hover:text-primary">
                                    Ver payload
                                  </summary>
                                  <ScrollArea className="h-24 mt-1 border rounded bg-muted/20">
                                    <pre className="p-2 text-xs whitespace-pre-wrap">
                                      {JSON.stringify(item.payload, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </details>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 3. Actualizaciones de Documentos */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            PUT
                          </Badge>
                          Actualizar Documentos ({generatePayloads.documentUpdates.length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Modo: {allocationMode === "document" ? "Documento" : "Ítem"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {generatePayloads.documentUpdates.map((update, index) => {
                            const doc = selectedDocuments.find((d) => d.id === update.documentId)
                            const hasLinks =
                              allocationMode === "document"
                                ? (update.payload.accountLinks?.length || 0) > 0 ||
                                  (update.payload.costCenterLinks?.length || 0) > 0
                                : update.payload.lines?.some(
                                    (line: any) =>
                                      (line.accountLinks?.length || 0) > 0 || (line.costCenterLinks?.length || 0) > 0,
                                  )

                            return (
                              <div key={index} className="border rounded p-2 bg-background">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium">{doc?.fullNumber}</span>
                                  <Badge variant={hasLinks ? "default" : "secondary"} className="text-xs">
                                    {hasLinks ? "Con Enlaces" : "Sin Enlaces"}
                                  </Badge>
                                </div>
                                <div className="text-xs space-y-1 mb-2">
                                  <div>
                                    <span className="text-muted-foreground">Endpoint:</span>
                                    <span className="ml-1 font-mono">{update.endpoint}</span>
                                  </div>
                                </div>
                                <details className="cursor-pointer">
                                  <summary className="text-xs text-muted-foreground hover:text-primary">
                                    Ver payload
                                  </summary>
                                  <ScrollArea className="h-24 mt-1 border rounded bg-muted/20">
                                    <pre className="p-2 text-xs whitespace-pre-wrap">
                                      {JSON.stringify(update.payload, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </details>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo de búsqueda de plantillas */}
    <TemplateSearchDialog
      open={templateSearchOpen}
      onOpenChange={setTemplateSearchOpen}
      onTemplateSelect={handleTemplateSelect}
    />
  </>
  )
}
