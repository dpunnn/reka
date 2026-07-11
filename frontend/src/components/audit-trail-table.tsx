"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { EmptyState } from "@/components/empty-state";
import { Loader2, ShieldCheck, ArrowRight, type LucideIcon } from "lucide-react";
import { ClipboardCheck, HandCoins, Wallet, Split } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  aktor_user_id: string;
  aksi: string;
  entitas_tipe: string;
  entitas_id: string;
  nilai_sebelum: string | null;
  nilai_sesudah: string | null;
  created_at: string;
}

const AKSI_META: Record<string, { label: string; icon: LucideIcon; chip: string; accent: string }> = {
  verifikasi_grade: { label: "Verifikasi Grade", icon: ClipboardCheck, chip: "from-blue-500 to-indigo-600", accent: "bg-blue-500" },
  approval_pinjaman: { label: "Approval Pinjaman", icon: Wallet, chip: "from-indigo-500 to-violet-600", accent: "bg-indigo-500" },
  pencairan_dana_talangan: { label: "Pencairan Dana Talangan", icon: HandCoins, chip: "from-emerald-500 to-green-600", accent: "bg-emerald-500" },
  distribusi_revenue_split: { label: "Distribusi Hasil Bundling", icon: Split, chip: "from-amber-500 to-orange-600", accent: "bg-amber-500" },
};

export function AuditTrailTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/audit/trail")
      .then((res) => setLogs(res.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat audit trail...
      </div>
    );
  }

  if (logs.length === 0) {
    return <EmptyState icon={ShieldCheck} message="Belum ada aksi finansial yang tercatat." />;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const meta =
          AKSI_META[log.aksi] ?? { label: log.aksi, icon: ShieldCheck, chip: "from-slate-400 to-slate-500", accent: "bg-slate-400" };
        return (
          <GlassCard key={log.id} className="card-lift relative overflow-hidden !rounded-2xl !p-4 !pl-5">
            <span className={cn("absolute inset-y-0 left-0 w-1.5", meta.accent)} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[13px] font-extrabold text-slate-900">
                <span className={cn("icon-chip h-7 w-7 rounded-lg bg-gradient-to-br", meta.chip)}>
                  <meta.icon className="h-3.5 w-3.5 text-white" />
                </span>
                {meta.label}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{new Date(log.created_at).toLocaleString("id-ID")}</span>
            </div>
            <div className="mt-2.5 text-[11.5px] text-slate-400">
              Entitas: <span className="font-mono font-semibold text-slate-500">{log.entitas_tipe}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px] font-medium text-slate-600">
              {log.nilai_sebelum && <span className="inner-tile rounded-lg px-2.5 py-1">{log.nilai_sebelum}</span>}
              {log.nilai_sebelum && log.nilai_sesudah && <ArrowRight className="h-3.5 w-3.5 text-blue-400" />}
              {log.nilai_sesudah && (
                <span className="tinted-tile rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 px-2.5 py-1 text-emerald-700">
                  {log.nilai_sesudah}
                </span>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
