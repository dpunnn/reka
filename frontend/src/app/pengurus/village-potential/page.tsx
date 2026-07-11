import { PageHeader } from "@/components/page-header";
import { VillagePotentialTable } from "@/components/village-potential-table";
import { MapPinned } from "lucide-react";

export default function PengurusVillagePotentialPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Village Potential Mapping"
        description="Gap antara demand pasar (proyeksi 30 hari) dan supply aktif koperasi per komoditas — temukan potensi yang belum digarap optimal."
        icon={MapPinned}
        tone="green"
      />
      <VillagePotentialTable />
    </div>
  );
}
