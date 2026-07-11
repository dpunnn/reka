"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraphNetwork } from "@/components/graph-network";
import { Check, X, Users, Loader2, Inbox, HandCoins } from "lucide-react";

interface Pinjaman {
  id: string;
  anggota_id: string;
  nominal: number;
  tujuan: string;
  tenor_bulan: number;
  skor_individual: number | null;
  skor_graph: number | null;
  skor_gabungan: number | null;
  risk_level: string | null;
}

interface GraphNetwork {
  anggota: { id: string; nama: string } | null;
  vouchers: { id: string; nama: string }[];
  vouchees: { id: string; nama: string }[];
}

const RISK_COLOR: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MED: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

export default function PengurusPinjamanPage() {
  const [list, setList] = useState<Pinjaman[]>([]);
  const [networks, setNetworks] = useState<Record<string, GraphNetwork>>({});

  function load() {
    api.get("/pinjaman/pending").then((res) => {
      setList(res.data);
      res.data.forEach((p: Pinjaman) => {
        api
          .get(`/intelligence/graph-network/${p.anggota_id}`)
          .then((netRes) => setNetworks((prev) => ({ ...prev, [p.anggota_id]: netRes.data })))
          .catch(() => {});
      });
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string, disetujui: boolean) {
    await api.post(`/pinjaman/${id}/approval`, { disetujui });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Pinjaman" title="Pengajuan Pinjaman Pending" icon={HandCoins} tone="indigo" />

      {list.length === 0 && <EmptyState icon={Inbox} message="Tidak ada pengajuan pinjaman pending." />}

      <div className="space-y-4">
        {list.map((p) => {
          const network = networks[p.anggota_id];
          return (
            <GlassCard key={p.id} className="card-lift !rounded-3xl !p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-lg font-black text-slate-900">
                  Rp {p.nominal.toLocaleString("id-ID")} <span className="text-sm font-semibold text-slate-400">— {p.tujuan}</span>
                </div>
                {p.risk_level && <Badge className={RISK_COLOR[p.risk_level]}>{p.risk_level}</Badge>}
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="inner-tile rounded-xl px-3.5 py-2.5">
                  <div className="text-[10.5px] font-bold uppercase text-slate-400">Tenor</div>
                  <div className="text-sm font-bold text-slate-900">{p.tenor_bulan} bulan</div>
                </div>
                <div className="inner-tile rounded-xl px-3.5 py-2.5">
                  <div className="text-[10.5px] font-bold uppercase text-slate-400">Skor Individual</div>
                  <div className="text-sm font-bold text-slate-900">{p.skor_individual}</div>
                </div>
                <div className="inner-tile rounded-xl px-3.5 py-2.5">
                  <div className="text-[10.5px] font-bold uppercase text-slate-400">Skor Graph</div>
                  <div className="text-sm font-bold text-slate-900">{p.skor_graph}</div>
                </div>
                <div className="tinted-tile rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100/70 px-3.5 py-2.5">
                  <div className="text-[10.5px] font-bold uppercase text-blue-400">Skor Gabungan</div>
                  <div className="text-sm font-black text-blue-700">{p.skor_gabungan}</div>
                </div>
              </div>

              <div className="mb-4 inner-tile rounded-2xl p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
                  <Users className="h-3.5 w-3.5 text-blue-600" /> Jaringan Tanggung Renteng
                </p>
                {network ? (
                  <GraphNetwork anggota={network.anggota} vouchers={network.vouchers} vouchees={network.vouchees} />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat graph...
                  </div>
                )}
              </div>

              <div className="flex gap-2.5">
                <Button size="sm" onClick={() => approve(p.id, true)} className="!rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md hover:from-emerald-600 hover:to-green-700">
                  <Check className="h-3.5 w-3.5" /> Setujui
                </Button>
                <Button size="sm" variant="outline" onClick={() => approve(p.id, false)} className="!rounded-lg">
                  <X className="h-3.5 w-3.5" /> Tolak
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
