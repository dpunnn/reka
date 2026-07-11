"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { ProductThumb } from "@/components/product-thumb";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Loader2, PackageSearch } from "lucide-react";

interface ProdukBelumDigrading {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  stok: number;
  foto_url: string | null;
}

const GRADE_STYLE: Record<string, string> = {
  A: "bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700",
  B: "bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
  C: "bg-gradient-to-br from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600",
};

export function QCGradingPanel() {
  const [antrean, setAntrean] = useState<ProdukBelumDigrading[]>([]);
  const [loading, setLoading] = useState(true);
  const [memproses, setMemproses] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get("/marketplace/produk/belum-digrading")
      .then((res) => setAntrean(res.data))
      .catch(() => setAntrean([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function beriGrade(produkId: string, grade: "A" | "B" | "C") {
    setMemproses(produkId);
    try {
      await api.post(`/marketplace/produk/${produkId}/grade`, { grade });
      load();
    } finally {
      setMemproses(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat antrean QC...
      </div>
    );
  }

  if (antrean.length === 0) {
    return <EmptyState icon={PackageSearch} message="Tidak ada produk yang menunggu grading — semua sudah diverifikasi." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {antrean.map((p) => (
        <GlassCard key={p.id} className="card-lift group !rounded-2xl !p-0 overflow-hidden">
          <div className="relative aspect-[4/3] overflow-hidden">
            <ProductThumb nama={p.nama} fotoUrl={p.foto_url} className="transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10.5px] font-bold text-white shadow-lg backdrop-blur">
              <ClipboardCheck className="h-3 w-3" /> Menunggu QC
            </span>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <div className="text-[15px] font-bold text-slate-900">{p.nama}</div>
              <div className="text-[12.5px] text-slate-400">
                {p.stok} {p.satuan} — Rp {p.harga.toLocaleString("id-ID")}/{p.satuan}
              </div>
            </div>
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map((grade) => (
                <Button
                  key={grade}
                  size="sm"
                  disabled={memproses === p.id}
                  onClick={() => beriGrade(p.id, grade)}
                  className={`flex-1 !rounded-lg font-bold text-white shadow-md ${GRADE_STYLE[grade]}`}
                >
                  {grade}
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
