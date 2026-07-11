"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, ShieldCheck, ShieldX, Boxes, MapPin, Info, LayoutDashboard } from "lucide-react";

interface RiskOverview {
  LOW: number;
  MED: number;
  HIGH: number;
}

interface Koperasi {
  id: string;
  nama: string;
  kabupaten: string;
  sektor_usaha: string | null;
}

interface BundlingLintasKoperasi {
  batch_id: string;
  komoditas: string;
  current_volume: number;
  target_volume: number;
  status: string;
  jumlah_koperasi: number;
  koperasi: { id: string; nama: string }[];
  lintas_koperasi: boolean;
}

export default function PemkabDashboard() {
  const [risk, setRisk] = useState<RiskOverview | null>(null);
  const [koperasiList, setKoperasiList] = useState<Koperasi[]>([]);
  const [bundlingList, setBundlingList] = useState<BundlingLintasKoperasi[]>([]);

  useEffect(() => {
    api.get("/intelligence/credit-risk-overview").then((res) => setRisk(res.data)).catch(() => setRisk(null));
    api.get("/koperasi").then((res) => setKoperasiList(res.data)).catch(() => setKoperasiList([]));
    api
      .get("/intelligence/bundling-lintas-koperasi")
      .then((res) => setBundlingList(res.data))
      .catch(() => setBundlingList([]));
  }, []);

  const lintasKoperasi = bundlingList.filter((b) => b.lintas_koperasi);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Pemkab" title="Dashboard Monitoring Wilayah" description="Pantau koperasi, risiko kredit, dan bundling lintas koperasi." icon={LayoutDashboard} tone="blue" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Building2} tone="blue" label="Koperasi Terdaftar" value={koperasiList.length} />
        <StatCard icon={ShieldCheck} tone="green" label="Risiko Kredit Rendah (LOW)" value={risk?.LOW ?? "..."} />
        <StatCard icon={ShieldX} tone="red" label="Risiko Kredit Tinggi (HIGH)" value={risk?.HIGH ?? "..."} />
      </div>

      <GlassCard className="!rounded-3xl !p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <MapPin className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <h2 className="text-[15px] font-extrabold text-slate-900">Daftar Koperasi di Wilayah</h2>
        </div>
        <div className="space-y-2">
          {koperasiList.map((k) => (
            <div key={k.id} className="inner-tile flex items-center justify-between rounded-xl px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">{k.nama}</span>
              <span className="text-slate-500">{k.sektor_usaha ?? "-"}</span>
            </div>
          ))}
          {koperasiList.length === 0 && <EmptyState icon={Building2} message="Belum ada koperasi terdaftar." />}
        </div>
      </GlassCard>

      <GlassCard className="!rounded-3xl !p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2.5 text-[15px] font-extrabold text-slate-900">
            <span className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Boxes className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            Dynamic Bundling Lintas Koperasi
          </span>
          <span className="text-sm font-semibold text-slate-400">
            {lintasKoperasi.length} dari {bundlingList.length} batch lintas koperasi
          </span>
        </div>
        <p className="mb-4 flex items-start gap-2 tinted-tile rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Batch yang produknya berasal dari lebih dari satu koperasi sekaligus — visibilitas ini cuma dimiliki
          Pemkab, karena mengawasi banyak koperasi dalam satu wilayah.
        </p>
        <div className="space-y-3">
          {lintasKoperasi.length === 0 && <EmptyState icon={Boxes} message="Belum ada batch lintas koperasi." />}
          {lintasKoperasi.map((b) => (
            <div key={b.batch_id} className="inner-tile space-y-2.5 rounded-xl p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold capitalize text-slate-900">{b.komoditas}</span>
                <Badge variant={b.status === "ready" ? "default" : "outline"}>{b.status}</Badge>
              </div>
              <Progress value={(b.current_volume / b.target_volume) * 100} />
              <p className="text-slate-500">
                {b.current_volume}/{b.target_volume} kg — dari {b.jumlah_koperasi} koperasi:{" "}
                {b.koperasi.map((k) => k.nama).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
