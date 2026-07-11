import { PageHeader } from "@/components/page-header";
import { PermintaanBuyerPanel } from "@/components/permintaan-buyer-panel";
import { PackageSearch } from "lucide-react";

export default function PengurusPermintaanBuyerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demand Matching"
        title="Permintaan Buyer"
        description="Permintaan buyer yang belum sepenuhnya terpenuhi supply-nya — dorong anggota tambah listing/gabung batch bundling."
        icon={PackageSearch}
        tone="blue"
      />
      <PermintaanBuyerPanel />
    </div>
  );
}
