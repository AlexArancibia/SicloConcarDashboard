import DocumentDetailPage from "@/components/financial/document-detail-page"

interface DocumentDetailProps {
  params: {
    id: string
  }
}

export default function DocumentDetail({ params }: DocumentDetailProps) {
  return <DocumentDetailPage documentId={params.id} />
}
