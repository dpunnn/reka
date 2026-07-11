"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Briefcase, ShieldCheck, Loader2, User } from "lucide-react";

interface Profil {
  nik: string;
  jenis_usaha: string | null;
  status_verifikasi: string;
}

export default function ProfilPage() {
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    api.get("/anggota/me").then((res) => setProfil(res.data)).catch(() => setProfil(null));
  }, []);

  return (
    <div className="max-w-md space-y-6">
      <PageHeader eyebrow="Akun" title="Profil Saya" icon={User} tone="blue" />
      <GlassCard className="!rounded-3xl !p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="icon-chip h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <User className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-[15px] font-extrabold text-slate-900">Data Anggota</h2>
        </div>
        {profil ? (
          <div className="space-y-2.5">
            <div className="inner-tile flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm">
              <CreditCard className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="text-slate-500">NIK</span>
              <span className="ml-auto font-bold text-slate-900">{profil.nik}</span>
            </div>
            <div className="inner-tile flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm">
              <Briefcase className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="text-slate-500">Jenis Usaha</span>
              <span className="ml-auto font-bold text-slate-900">{profil.jenis_usaha ?? "-"}</span>
            </div>
            <div className="inner-tile flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="text-slate-500">Status Verifikasi</span>
              <Badge className="ml-auto">{profil.status_verifikasi}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </div>
        )}
      </GlassCard>
    </div>
  );
}
