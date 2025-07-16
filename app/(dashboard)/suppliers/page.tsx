import { Suspense } from 'react'
import { TableSkeleton } from "@/components/ui/table-skeleton"
import SuppliersContent from '@/components/suppliers/SuppliersContent'

export default function SuppliersPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} columns={8} />}>
      <SuppliersContent />
    </Suspense>
  )
}