"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { HandCoins, FileText, Store, Wallet, LayoutDashboard, Sprout, ArrowRight } from "lucide-react";

interface Pinjaman {
  id: string;
  nominal: number;
  status: string;
  risk_level: string | null;
}

export default function AnggotaDashboard() {
  const [pinjaman, setPinjaman] = useState<Pinjaman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/pinjaman/saya")
      .then((res) => setPinjaman(res.data))
      .catch(() => setPinjaman([]))
      .finally(() => setLoading(false));
  }, []);

  const aktif = pinjaman.filter((p) => p.status === "approved");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Anggota"
        title="Dashboard Anggota"
        description="Ringkasan simpan pinjam dan toko kamu."
        icon={LayoutDashboard}
        tone="blue"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Wallet} tone="green" label="Pinjaman Aktif" value={loading ? "..." : aktif.length} />
        <StatCard icon={FileText} tone="blue" label="Total Pengajuan" value={loading ? "..." : pinjaman.length} />
        <StatCard icon={Store} tone="indigo" label="Performa Toko" value="—" hint="Lihat detail di menu Toko Saya" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/anggota/simpan-pinjam" className="group">
          <GlassCard className="card-lift relative flex items-center gap-4 overflow-hidden !rounded-2xl !p-5">
            <div className="glow-corner -right-6 -top-6 bg-indigo-400/40" />
            <div className="icon-chip h-12 w-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <HandCoins className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="text-[15px] font-extrabold text-slate-900">Ajukan Pinjaman</div>
              <div className="text-[12.5px] text-slate-500">Modal usaha, pra-tanam, atau dana talangan panen</div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
          </GlassCard>
        </Link>
        <Link href="/anggota/marketplace/tambah" className="group">
          <GlassCard className="card-lift relative flex items-center gap-4 overflow-hidden !rounded-2xl !p-5">
            <div className="glow-corner -right-6 -top-6 bg-emerald-400/40" />
            <div className="icon-chip h-12 w-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600">
              <Sprout className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="text-[15px] font-extrabold text-slate-900">Jual Produk Baru</div>
              <div className="text-[12.5px] text-slate-500">Listing hasil panen ke marketplace desa-kota</div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
