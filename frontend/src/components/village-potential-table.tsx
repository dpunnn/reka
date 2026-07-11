"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { EmptyState } from "@/components/empty-state";
import { Loader2, TrendingUp, MapPinned, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface VillagePotential {
  komoditas: string;
  demand_proyeksi_30_hari: number | null;
  supply_aktif: number;
  gap: number | null;
  status_potensi: "peluang_belum_digarap" | "supply_mencukupi" | "data_belum_cukup";
  segmen_buyer_disarankan: string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  peluang_belum_digarap: { label: "Peluang Belum Digarap", className: "bg-green-100 text-green-700" },
  supply_mencukupi: { label: "Supply Mencukupi", className: "bg-blue-100 text-blue-700" },
  data_belum_cukup: { label: "Data Belum Cukup", className: "bg-slate-100 text-slate-500" },
};

export function VillagePotentialTable() {
  const [data, setData] = useState<VillagePotential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/intelligence/village-potential-mapping")
      .then((res) => setData(res.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Menganalisis gap supply-demand...
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState icon={MapPinned} message="Belum ada data komoditas untuk dianalisis." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.map((d) => {
        const status = STATUS_LABEL[d.status_potensi];
        const adaGap = Boolean(d.gap && d.gap > 0);
        return (
          <GlassCard key={d.komoditas} className="card-lift !rounded-2xl !p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-[15px] font-extrabold capitalize text-slate-900">
                <span className="icon-chip h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <MapPinned className="h-4 w-4 text-white" />
                </span>
                {d.komoditas}
              </span>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", status.className)}>{status.label}</span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="inner-tile rounded-xl px-2 py-3">
                <div className="text-[10px] font-semibold uppercase text-slate-400">Demand 30 Hari</div>
                <div className="mt-0.5 text-base font-black text-slate-900">
                  {d.demand_proyeksi_30_hari !== null ? Math.round(d.demand_proyeksi_30_hari) : "-"}
                </div>
              </div>
              <div className="inner-tile rounded-xl px-2 py-3">
                <div className="text-[10px] font-semibold uppercase text-slate-400">Supply Aktif</div>
                <div className="mt-0.5 text-base font-black text-slate-900">{Math.round(d.supply_aktif)}</div>
              </div>
              <div
                className={cn(
                  "tinted-tile rounded-xl px-2 py-3",
                  adaGap ? "bg-gradient-to-br from-emerald-50 to-green-100/60" : "bg-gradient-to-br from-slate-50 to-slate-100/60"
                )}
              >
                <div className="text-[10px] font-semibold uppercase text-slate-400">Gap</div>
                <div className={cn("mt-0.5 flex items-center justify-center gap-0.5 text-base font-black", adaGap ? "text-emerald-700" : "text-slate-900")}>
                  {adaGap && <TrendingUp className="h-3.5 w-3.5" />}
                  {d.gap !== null ? Math.round(d.gap) : "-"}
                </div>
              </div>
            </div>
            <div className="tinted-tile flex items-start gap-2 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 px-3.5 py-3 text-[12px] font-medium leading-relaxed text-indigo-700">
              <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {d.segmen_buyer_disarankan}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
