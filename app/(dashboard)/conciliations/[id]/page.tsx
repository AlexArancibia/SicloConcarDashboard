import { use } from "react"
import ConciliationDetailPage from "@/components/financial/conciliation-detail-page"

interface ConciliationDetailProps {
  params: Promise<{ id: string }>
}

export default function ConciliationDetail({ params }: ConciliationDetailProps) {
  const resolvedParams = use(params)
  return <ConciliationDetailPage params={resolvedParams} />
}