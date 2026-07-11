"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Check, X, CreditCard, Briefcase, UserCheck, Loader2 } from "lucide-react";

interface AnggotaPending {
  id: string;
  nik: string;
  jenis_usaha: string | null;
}

export default function VerifikasiAnggotaPage() {
  const [list, setList] = useState<AnggotaPending[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get("/anggota/pending-verifikasi")
      .then((res) => setList(res.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function verifikasi(id: string, disetujui: boolean) {
    await api.post(`/anggota/${id}/verifikasi`, null, { params: { disetujui } });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Anggota" title="Verifikasi Anggota Baru" icon={UserCheck} tone="blue" />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
        </div>
      )}
      {!loading && list.length === 0 && (
        <EmptyState icon={UserCheck} message="Tidak ada pendaftar baru yang menunggu verifikasi." />
      )}

      <div className="space-y-3">
        {list.map((a) => (
          <GlassCard key={a.id} className="card-lift !rounded-2xl !p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="icon-chip h-11 w-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <UserCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-900">NIK: {a.nik}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {a.jenis_usaha ?? "-"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => verifikasi(a.id, true)} className="!rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md hover:from-emerald-600 hover:to-green-700">
                  <Check className="h-3.5 w-3.5" /> Setujui
                </Button>
                <Button size="sm" variant="outline" onClick={() => verifikasi(a.id, false)} className="!rounded-lg">
                  <X className="h-3.5 w-3.5" /> Tolak
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
