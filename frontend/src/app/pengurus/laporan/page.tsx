"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileBarChart, Download, Info } from "lucide-react";

export default function LaporanPage() {
  const [dariTanggal, setDariTanggal] = useState("");
  const [sampaiTanggal, setSampaiTanggal] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dariTanggal) params.dari_tanggal = dariTanggal;
      if (sampaiTanggal) params.sampai_tanggal = sampaiTanggal;

      const res = await api.get("/laporan/export", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-reka-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader eyebrow="Laporan" title="Laporan Keuangan" icon={FileBarChart} tone="blue" />
      <GlassCard className="!rounded-3xl !p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <FileBarChart className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-[15px] font-extrabold text-slate-900">Export ke Excel</h2>
        </div>
        <p className="mb-5 flex items-start gap-2 tinted-tile rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Export laporan Simpanan, Pinjaman, dan Transaksi Marketplace ke Excel (.xlsx), bisa difilter berdasarkan
          periode.
        </p>
        <div className="mb-5 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dari Tanggal (opsional)</Label>
            <Input type="date" value={dariTanggal} onChange={(e) => setDariTanggal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sampai Tanggal (opsional)</Label>
            <Input type="date" value={sampaiTanggal} onChange={(e) => setSampaiTanggal(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleExport} disabled={loading} className="w-full !rounded-xl py-6 text-[14.5px]">
          <Download className="h-4 w-4" /> {loading ? "Menyiapkan..." : "Export Excel"}
        </Button>
      </GlassCard>
    </div>
  );
}
