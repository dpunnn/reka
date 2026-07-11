"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ProductThumb } from "@/components/product-thumb";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Store, Clock, Boxes, CheckCircle2, Recycle, Split } from "lucide-react";

interface BundlingBatch {
  id: string;
  komoditas: string;
  target_volume: number;
  current_volume: number;
  status: string;
  buyer_nama: string | null;
}

interface ProdukKritis {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  foto_url: string | null;
  opsi_nilai_tambah: string[] | null;
}

interface RevenueSplitHasil {
  anggota_id: string;
  jumlah_kontribusi: number;
  grade: string | null;
  persentase_share: number;
  nominal_share: number;
}

export default function PengurusMarketplacePage() {
  const [batches, setBatches] = useState<BundlingBatch[]>([]);
  const [produkKritis, setProdukKritis] = useState<ProdukKritis[]>([]);
  const [memproses, setMemproses] = useState<string | null>(null);
  const [hasilSplit, setHasilSplit] = useState<Record<string, RevenueSplitHasil[]>>({});

  function loadBatches() {
    api.get("/intelligence/bundling-status").then((res) => setBatches(res.data)).catch(() => setBatches([]));
  }

  useEffect(() => {
    loadBatches();
    api.get("/marketplace/produk/rute-nilai-tambah").then((res) => setProdukKritis(res.data)).catch(() => setProdukKritis([]));
  }, []);

  async function tandaiTerjual(batchId: string) {
    setMemproses(batchId);
    try {
      const res = await api.post(`/marketplace/bundling/${batchId}/tandai-terjual`, {});
      setHasilSplit((prev) => ({ ...prev, [batchId]: res.data.revenue_split }));
      toast.success(`Batch terjual — Rp ${res.data.total_revenue.toLocaleString("id-ID")} dibagi ke ${res.data.jumlah_kontributor} kontributor.`);
      loadBatches();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - axios error shape
            err.response?.data?.detail
          : null;
      toast.error(message ?? "Gagal menandai batch terjual.");
    } finally {
      setMemproses(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Marketplace" title="Kelola Dynamic Bundling & Smart Expiry" icon={Boxes} tone="blue" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {batches.map((b) => (
          <GlassCard key={b.id} className="card-lift !rounded-3xl !p-6">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-2.5 text-[15px] font-extrabold capitalize text-slate-900">
                <span className="icon-chip h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Package className="h-4 w-4 text-white" />
                </span>
                {b.komoditas}
              </span>
              <Badge variant={b.status === "ready" ? "default" : "outline"}>{b.status}</Badge>
            </div>
            <Progress value={(Number(b.current_volume) / Number(b.target_volume)) * 100} />
            <p className="mt-2.5 text-sm text-slate-500">
              Terkumpul <strong className="text-slate-900">{b.current_volume}</strong> dari target {b.target_volume} kg
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <Store className="h-3.5 w-3.5" /> Buyer tujuan: {b.buyer_nama ?? "belum ditentukan"}
            </p>

            {b.status !== "shipped" && (
              <Button
                size="sm"
                disabled={memproses === b.id}
                onClick={() => tandaiTerjual(b.id)}
                className="mt-3.5 w-full !rounded-lg"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Tandai Terjual
              </Button>
            )}

            {hasilSplit[b.id] && (
              <div className="tinted-tile mt-3.5 space-y-1.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-700">
                  <Split className="h-3 w-3" /> Hasil Bagi Revenue
                </div>
                {hasilSplit[b.id].map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] text-amber-800">
                    <span>{s.jumlah_kontribusi}kg · grade {s.grade}</span>
                    <span className="font-bold">Rp {s.nominal_share.toLocaleString("id-ID")} ({s.persentase_share.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
        {batches.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState icon={Boxes} message="Belum ada batch bundling aktif." />
          </div>
        )}
      </div>

      <GlassCard className="!rounded-3xl !p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
            <Clock className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Rute Nilai Tambah</h2>
            <p className="text-xs text-slate-400">Produk kritis mendekati expired — arahkan ke pengolahan B2B, bukan cuma diskon</p>
          </div>
        </div>
        {produkKritis.length === 0 && (
          <EmptyState icon={Recycle} message="Tidak ada produk kritis yang perlu direroute saat ini." />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {produkKritis.map((p) => (
            <div key={p.id} className="inner-tile flex gap-3 rounded-xl p-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                <ProductThumb nama={p.nama} fotoUrl={p.foto_url} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-slate-900">{p.nama}</div>
                <div className="text-[11px] text-slate-400">{p.stok} {p.satuan}</div>
                {p.opsi_nilai_tambah && (
                  <div className="mt-1 text-[10.5px] font-semibold text-orange-600">→ {p.opsi_nilai_tambah[0]}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
