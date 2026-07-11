"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ShieldCheck, ShieldAlert, ShieldX, Package, TrendingUp, Info, Loader2, LayoutDashboard } from "lucide-react";

interface RiskOverview {
  LOW: number;
  MED: number;
  HIGH: number;
}

interface ForecastPoint {
  tanggal: string;
  prediksi: number;
}

interface ForecastResult {
  komoditas: string;
  cukup_data: boolean;
  forecast: ForecastPoint[];
}

const KOMODITAS_LIST = ["cabai merah", "telur ayam kampung", "gula aren", "beras"];

export default function PengurusDashboard() {
  const [risk, setRisk] = useState<RiskOverview | null>(null);
  const [bundlingCount, setBundlingCount] = useState<number | null>(null);
  const [komoditas, setKomoditas] = useState("cabai merah");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);

  useEffect(() => {
    api.get("/intelligence/credit-risk-overview").then((res) => setRisk(res.data)).catch(() => setRisk(null));
    api
      .get("/intelligence/bundling-status")
      .then((res) => setBundlingCount(res.data.length))
      .catch(() => setBundlingCount(null));
  }, []);

  useEffect(() => {
    api
      .get(`/intelligence/demand-forecast/${encodeURIComponent(komoditas)}`)
      .then((res) => setForecast(res.data))
      .catch(() => setForecast(null));
  }, [komoditas]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Pengurus" title="Dashboard Pengurus" description="Peta risiko kredit dan aktivitas bundling koperasi." icon={LayoutDashboard} tone="indigo" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={ShieldCheck} tone="green" label="Risiko Rendah" value={risk?.LOW ?? "..."} />
        <StatCard icon={ShieldAlert} tone="amber" label="Risiko Sedang" value={risk?.MED ?? "..."} />
        <StatCard icon={ShieldX} tone="red" label="Risiko Tinggi" value={risk?.HIGH ?? "..."} />
        <StatCard icon={Package} tone="blue" label="Batch Bundling Aktif" value={bundlingCount ?? "..."} />
      </div>

      <GlassCard className="!rounded-3xl !p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2.5 text-[15px] font-extrabold text-slate-900">
            <span className="icon-chip h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </span>
            Demand Forecast 30 Hari
          </span>
          <Select value={komoditas} onValueChange={(v) => setKomoditas(v ?? komoditas)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KOMODITAS_LIST.map((k) => (
                <SelectItem key={k} value={k} className="capitalize">
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {forecast?.cukup_data ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="prediksi" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat forecast...
          </div>
        )}
        <p className="mt-3 flex items-start gap-2 tinted-tile rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Catatan: histori transaksi saat ini masih data simulasi (REKA belum live) — forecast akan otomatis pakai
          data riil begitu ada order sungguhan.
        </p>
      </GlassCard>
    </div>
  );
}
