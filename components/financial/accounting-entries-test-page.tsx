"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/stores/authStore"
import { useAccountingEntriesStore } from "@/stores/accounting-entries-store"
import { useTransactionsStore } from "@/stores/transactions-store"
import { useDocumentsStore } from "@/stores/documents-store"
import type { CreateAccountingEntryDto, MovementType } from "@/types/accounting"
import { useConciliationsStore } from "@/stores/conciliation-store"

export default function AccountingEntriesTestPage() {
  const { company } = useAuthStore()
  const { entries, loading, error, pagination, fetchEntries, createEntry, updateEntry } = useAccountingEntriesStore()
  const { transactions, fetchTransactions } = useTransactionsStore()
  const { documents, fetchDocuments } = useDocumentsStore()
  const { conciliations, fetchConciliations } = useConciliationsStore()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [form, setForm] = useState<CreateAccountingEntryDto>({
    companyId: "",
    entryNumber: "",
    entryDate: new Date().toISOString().slice(0, 10),
    description: "",
    lines: [],
  })

  useEffect(() => {
    if (!company?.id) return
    fetchEntries(company.id, { page, limit })
    setForm((f) => ({ ...f, companyId: company.id }))
    // traer algunas referencias reales para enlazar
    fetchTransactions(company.id, { page: 1, limit: 10 })
    fetchDocuments(company.id, { page: 1, limit: 10 })
    fetchConciliations(company.id, { page: 1, limit: 10 })
  }, [company?.id, page, limit, fetchEntries, fetchTransactions, fetchDocuments, fetchConciliations])

  const addLine = () => {
    setForm((f) => ({
      ...f,
      lines: [
        ...f.lines,
        {
          accountCode: "",
          movementType: "DEBIT" as MovementType,
          amount: 0,
        },
      ],
    }))
  }

  const removeLine = (idx: number) => {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }))
  }

  const submitCreate = async () => {
    if (!form.companyId || !form.entryNumber || !form.entryDate || form.lines.length === 0) return
    await createEntry(form)
    await fetchEntries(form.companyId, { page, limit })
  }

  const currencyFormat = (v: string | number) => {
    const num = typeof v === "string" ? Number.parseFloat(v) : v
    return num.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const totals = useMemo(() => {
    const debit = form.lines.filter(l => l.movementType === "DEBIT").reduce((a, l) => a + (Number(l.amount) || 0), 0)
    const credit = form.lines.filter(l => l.movementType === "CREDIT").reduce((a, l) => a + (Number(l.amount) || 0), 0)
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 }
  }, [form.lines])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pruebas - Accounting Entries</h1>
        <p className="text-muted-foreground">Crea y consulta asientos contables, enlazando con transacciones, documentos y conciliaciones.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear asiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Número de asiento" value={form.entryNumber} onChange={e => setForm(f => ({ ...f, entryNumber: e.target.value }))} />
            <Input type="date" value={form.entryDate as string} onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))} />
            <Input placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select onValueChange={(v) => setForm(f => ({ ...f, documentId: v || undefined }))}>
              <SelectTrigger><SelectValue placeholder="Documento (opcional)" /></SelectTrigger>
              <SelectContent>
                {documents.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.fullNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setForm(f => ({ ...f, transactionId: v || undefined }))}>
              <SelectTrigger><SelectValue placeholder="Transacción (opcional)" /></SelectTrigger>
              <SelectContent>
                {transactions.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setForm(f => ({ ...f, conciliationId: v || undefined }))}>
              <SelectTrigger><SelectValue placeholder="Conciliación (opcional)" /></SelectTrigger>
              <SelectContent>
                {conciliations.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.reference || c.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Notas (opcional)" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Líneas</div>
              <div className="text-sm">Debe: {currencyFormat(totals.debit)} | Haber: {currencyFormat(totals.credit)} {totals.balanced ? "(Cuadrado)" : ""}</div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Input placeholder="Código cuenta" value={line.accountCode} onChange={e => {
                          const val = e.target.value
                          setForm(f => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, accountCode: val } : l) }))
                        }} />
                      </TableCell>
                      <TableCell>
                        <Select value={line.movementType} onValueChange={(v) => setForm(f => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, movementType: v as MovementType } : l) }))}>
                          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEBIT">Debe</SelectItem>
                            <SelectItem value="CREDIT">Haber</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" step="0.01" value={String(line.amount)} onChange={e => {
                          const num = Number.parseFloat(e.target.value || "0")
                          setForm(f => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, amount: num } : l) }))
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input placeholder="Descripción (opcional)" value={line.description || ""} onChange={e => {
                          const val = e.target.value
                          setForm(f => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, description: val } : l) }))
                        }} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" onClick={() => removeLine(idx)}>Quitar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={addLine}>Agregar línea</Button>
              <Button onClick={submitCreate} disabled={form.lines.length === 0 || !form.entryNumber || !form.description}>Crear asiento</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asientos ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Límite" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm ml-auto">Página {page} / {Math.max(1, Math.ceil(pagination.total / limit))}</div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead>Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.entryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{e.entryNumber}</TableCell>
                    <TableCell className="max-w-md truncate" title={e.description}>{e.description}</TableCell>
                    <TableCell className="text-right">{currencyFormat(e.totalDebit)}</TableCell>
                    <TableCell className="text-right">{currencyFormat(e.totalCredit)}</TableCell>
                    <TableCell>
                      {e.documentId ? "Documento" : e.transactionId ? "Transacción" : e.conciliationId ? "Conciliación" : "Manual"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <Button variant="outline" disabled={page >= Math.ceil(pagination.total / limit)} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

