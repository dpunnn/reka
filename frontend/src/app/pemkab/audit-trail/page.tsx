import { PageHeader } from "@/components/page-header";
import { AuditTrailTable } from "@/components/audit-trail-table";
import { ShieldCheck } from "lucide-react";

export default function PemkabAuditTrailPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Audit Trail"
        description="Log immutable tiap aksi finansial koperasi di wilayah — read-only, untuk pengawasan good governance yang bisa diverifikasi pihak luar."
        icon={ShieldCheck}
        tone="indigo"
      />
      <AuditTrailTable />
    </div>
  );
}
