import { PageHeader } from "@/components/page-header";
import { AuditTrailTable } from "@/components/audit-trail-table";
import { ShieldCheck } from "lucide-react";

export default function PengurusAuditTrailPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Audit Trail"
        description="Log immutable tiap aksi finansial — verifikasi grade, approval pinjaman, pencairan dana talangan, distribusi hasil bundling. Transparan & bisa diaudit."
        icon={ShieldCheck}
        tone="indigo"
      />
      <AuditTrailTable />
    </div>
  );
}
