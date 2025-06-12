import SupplierDetailPage from "@/components/financial/supplier-detail";

export default function SupplierDetail({ params }: { params: { id: string } }) {
  return <SupplierDetailPage id={params.id} />
}
