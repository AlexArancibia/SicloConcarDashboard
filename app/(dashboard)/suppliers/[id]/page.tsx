import SupplierDetailPage from "@/components/financial/supplier-detail";
import { use } from "react";

export default function SupplierDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return <SupplierDetailPage id={resolvedParams.id} />
}
