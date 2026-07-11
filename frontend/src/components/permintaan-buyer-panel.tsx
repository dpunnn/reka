"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { EmptyState } from "@/components/empty-state";
import { Loader2, PackageSearch, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermintaanBeli {
  id: string;
  komoditas: string;
  jumlah_dibutuhkan: number;
  harga_maks: number | null;
  status: "open" | "menunggu_bundling" | "terpenuhi";
  created_at: string;
}

const STATUS_META: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  menunggu_bundling: { label: "Menunggu Bundling", icon: Layers, className: "bg-amber-100 text-amber-700" },
  open: { label: "Dicari", icon: Clock, className: "bg-slate-100 text-slate-600" },
};

export function PermintaanBuyerPanel() {
  const [list, setList] = useState<PermintaanBeli[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/marketplace/permintaan-beli/terbuka")
      .then((res) => setList(res.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
      </div>
    );
  }

  if (list.length === 0) {
    return <EmptyState icon={PackageSearch} message="Belum ada permintaan buyer yang butuh supply tambahan." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {list.map((p) => {
        const meta = STATUS_META[p.status] ?? STATUS_META.open;
        return (
          <GlassCard key={p.id} className="card-lift relative overflow-hidden !rounded-2xl !p-5 !pl-6">
            <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500" />
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2.5 text-[15px] font-extrabold capitalize text-slate-900">
                <span className="icon-chip h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <PackageSearch className="h-4 w-4 text-white" />
                </span>
                {p.komoditas}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", meta.className)}>
                <meta.icon className="h-3 w-3" /> {meta.label}
              </span>
            </div>
            <div className="inner-tile rounded-xl px-3.5 py-2.5 text-[13px] text-slate-600">
              Buyer butuh <span className="font-black text-slate-900">{p.jumlah_dibutuhkan} kg</span>
              {p.harga_maks ? ` · maks Rp ${p.harga_maks.toLocaleString("id-ID")}/kg` : ""}
            </div>
            <p className="mt-2.5 text-xs text-slate-400">{new Date(p.created_at).toLocaleString("id-ID")}</p>
          </GlassCard>
        );
      })}
    </div>
  );
}
