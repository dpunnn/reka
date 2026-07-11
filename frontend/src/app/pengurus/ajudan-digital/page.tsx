import { PageHeader } from "@/components/page-header";
import { AjudanDigitalForm } from "@/components/ajudan-digital-form";
import { UserCog } from "lucide-react";

export default function PengurusAjudanDigitalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ajudan Digital"
        title="Bantu Listing Anggota"
        description="Untuk anggota yang tidak punya atau tidak bisa pakai smartphone — Kasir/Pengurus input listing produk atas nama mereka."
        icon={UserCog}
        tone="indigo"
      />
      <AjudanDigitalForm />
    </div>
  );
}
