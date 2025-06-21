import { use } from "react"
import DocumentDetailPage from "@/components/financial/document-detail-page"

interface DocumentDetailProps {
  params: Promise<{ id: string }>
}

export default function DocumentDetail({ params }: DocumentDetailProps) {
  const resolvedParams = use(params)
  return <DocumentDetailPage params={resolvedParams} />
}
