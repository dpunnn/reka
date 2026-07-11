"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ProductThumb } from "@/components/product-thumb";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Sparkles,
  Plus,
  Store,
  Loader2,
  BadgeCheck,
  HandCoins,
  Recycle,
  Split,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  stok: number;
  status: string;
  harga_rekomendasi_ai: number | null;
  foto_url: string | null;
  grade: string | null;
  lolos_qc: boolean;
  opsi_nilai_tambah: string[] | null;
}

interface RevenueSplit {
  id: string;
  produk_id: string;
  jumlah_kontribusi: number;
  grade: string | null;
  persentase_share: number;
  nominal_share: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  mendekati_expired: "Mendekati Expired — Smart Expiry Aktif",
  habis: "Habis",
};

const GRADE_BADGE: Record<string, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-slate-200 text-slate-600",
};

export default function TokoSayaPage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [splits, setSplits] = useState<RevenueSplit[]>([]);
  const [mengajukan, setMengajukan] = useState<string | null>(null);

  function load() {
    api
      .get("/marketplace/produk/saya")
      .then((res) => setProduk(res.data))
      .catch(() => setProduk([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get("/marketplace/revenue-split/saya").then((res) => setSplits(res.data)).catch(() => setSplits([]));
  }, []);

  async function ajukanTalangan(produkId: string) {
    setMengajukan(produkId);
    try {
      const res = await api.post("/pinjaman/talangan-panen", { produk_id: produkId });
      toast.success(`Dana Talangan cair — 70% dari Rp ${res.data.nominal.toLocaleString("id-ID")} sudah masuk.`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - axios error shape
            err.response?.data?.detail
          : null;
      toast.error(message ?? "Gagal mengajukan Dana Talangan.");
    } finally {
      setMengajukan(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Toko Saya"
        description="Kelola produk yang kamu jual di marketplace desa-kota."
        icon={Store}
        tone="green"
        action={
          <Button
            render={
              <Link href="/anggota/marketplace/tambah" className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Jual Produk Baru
              </Link>
            }
            className="!rounded-xl"
          />
        }
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
        </div>
      )}
      {!loading && produk.length === 0 && <EmptyState icon={Store} message="Belum ada produk dijual." />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {produk.map((p) => (
          <div key={p.id} className="glass-card card-lift group overflow-hidden !rounded-2xl !p-0">
            <div className="relative aspect-[4/3] overflow-hidden">
              <ProductThumb nama={p.nama} fotoUrl={p.foto_url} className="transition-transform duration-500 group-hover:scale-105" />
              {p.status === "mendekati_expired" && (
                <Badge variant="destructive" className="absolute left-2.5 top-2.5 gap-1 !px-2.5 !py-1">
                  <Clock className="h-3 w-3" /> Smart Expiry
                </Badge>
              )}
            </div>
            <div className="space-y-2 p-4">
              <div className="text-[15px] font-bold text-slate-900">{p.nama}</div>
              <div className="text-lg font-black text-blue-700">
                Rp {p.harga.toLocaleString("id-ID")}
                <span className="text-xs font-semibold text-slate-400">/{p.satuan}</span>
              </div>
              <div className="text-[12.5px] text-slate-500">Stok: {p.stok} {p.satuan}</div>
              {p.harga_rekomendasi_ai && (
                <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-indigo-600">
                  <Sparkles className="h-3 w-3" /> Rekomendasi AI: Rp {p.harga_rekomendasi_ai.toLocaleString("id-ID")}
                </div>
              )}
              {p.opsi_nilai_tambah && (
                <div className="flex items-start gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-orange-700">
                  <Recycle className="mt-0.5 h-3 w-3 flex-shrink-0" /> Rute Nilai Tambah: {p.opsi_nilai_tambah[0]}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{STATUS_LABEL[p.status]}</span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold", p.grade ? GRADE_BADGE[p.grade] : "bg-slate-100 text-slate-400")}>
                  <BadgeCheck className="h-3 w-3" /> {p.grade ? `Grade ${p.grade}` : "Belum Digrading"}
                </span>
              </div>
              {p.lolos_qc && (
                <Button
                  size="sm"
                  disabled={mengajukan === p.id}
                  onClick={() => ajukanTalangan(p.id)}
                  className="w-full !rounded-lg"
                >
                  <HandCoins className="h-3.5 w-3.5" /> Ajukan Dana Talangan
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {splits.length > 0 && (
        <GlassCard className="!rounded-3xl !p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Split className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Riwayat Bagi Hasil Bundling</h2>
          </div>
          <div className="space-y-2">
            {splits.map((s) => (
              <div key={s.id} className="inner-tile flex items-center justify-between rounded-xl px-4 py-3 text-sm">
                <div>
                  <span className="font-bold text-slate-900">Rp {s.nominal_share.toLocaleString("id-ID")}</span>
                  <span className="ml-2 text-slate-400">
                    ({s.persentase_share.toFixed(1)}% · {s.jumlah_kontribusi} unit · grade {s.grade ?? "-"})
                  </span>
                </div>
                <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString("id-ID")}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
