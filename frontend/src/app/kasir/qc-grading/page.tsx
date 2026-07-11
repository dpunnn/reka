import { PageHeader } from "@/components/page-header";
import { QCGradingPanel } from "@/components/qc-grading-panel";
import { ClipboardCheck } from "lucide-react";

export default function KasirQCGradingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kontrol Kualitas"
        title="QC / Grading Produk"
        description="Verifikasi kualitas produk sebelum masuk pool Dynamic Bundling — cegah satu kontributor jelek bikin buyer retur seluruh batch."
        icon={ClipboardCheck}
        tone="blue"
      />
      <QCGradingPanel />
    </div>
  );
}
