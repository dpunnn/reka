"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { ProductThumb } from "@/components/product-thumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Package, Layers, Users, Loader2, Scale, TrendingDown, TrendingUp, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  stok: number;
  status: string;
  foto_url: string | null;
  opsi_nilai_tambah: string[] | null;
}

interface RekomendasiHarga {
  komoditas: string;
  harga_rekomendasi: number;
  sumber: string;
}

export default function DetailProdukPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [produk, setProduk] = useState<Produk | null>(null);
  const [hargaPasar, setHargaPasar] = useState<RekomendasiHarga | null>(null);
  const [jumlah, setJumlah] = useState(1);

  useEffect(() => {
    api.get(`/marketplace/produk/${params.id}`).then((res) => setProduk(res.data)).catch(() => setProduk(null));
  }, [params.id]);

  useEffect(() => {
    if (!produk) return;
    api
      .get(`/marketplace/rekomendasi-harga/${encodeURIComponent(produk.nama)}`)
      .then((res) => setHargaPasar(res.data))
      .catch(() => setHargaPasar(null));
  }, [produk]);

  if (!produk) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
      </div>
    );
  }

  function lanjutCheckout() {
    router.push(`/pembeli/checkout?produkId=${produk!.id}&jumlah=${jumlah}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <GlassCard className="!rounded-3xl !p-0 overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden">
          <ProductThumb nama={produk.nama} fotoUrl={produk.foto_url} iconClassName="h-16 w-16" />
          {produk.status === "mendekati_expired" && (
            <Badge variant="destructive" className="absolute left-4 top-4 gap-1 !px-3 !py-1.5">
              <Clock className="h-3 w-3" /> Smart Expiry Deal
            </Badge>
          )}
        </div>
        <div className="space-y-5 p-7">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{produk.nama}</h1>
            <p className="mt-1 text-[13px] font-semibold text-slate-400">{produk.kategori}</p>
          </div>

          <div className="text-3xl font-black text-blue-700">
            Rp {produk.harga.toLocaleString("id-ID")}
            <span className="text-sm font-semibold text-slate-400"> / {produk.satuan}</span>
          </div>

          {hargaPasar && (
            <HargaPasarBanding harga={produk.harga} hargaPasar={hargaPasar} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="tinted-tile flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3">
              <span className="icon-chip h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Layers className="h-4 w-4 text-white" />
              </span>
              <div>
                <div className="text-[11px] font-semibold text-slate-500">Stok Tersedia</div>
                <div className="text-sm font-bold text-slate-900">{produk.stok} {produk.satuan}</div>
              </div>
            </div>
            <div className="tinted-tile flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3">
              <span className="icon-chip h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Users className="h-4 w-4 text-white" />
              </span>
              <div>
                <div className="text-[11px] font-semibold text-slate-500">Sumber</div>
                <div className="text-sm font-bold text-slate-900">Dynamic Bundling</div>
              </div>
            </div>
          </div>

          <div className="inner-tile flex items-start gap-2.5 rounded-xl px-4 py-3.5 text-[13px] leading-relaxed text-slate-500">
            <Package className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            Produk ini merupakan hasil gabungan dari beberapa petani mitra koperasi (Dynamic Bundling) — memastikan
            volume cukup untuk kebutuhan Anda.
          </div>

          {produk.opsi_nilai_tambah && (
            <div className="tinted-tile flex items-start gap-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 px-4 py-3.5 text-[13px] leading-relaxed text-orange-700">
              <Recycle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Produk ini sudah sangat mendekati kadaluarsa — koperasi sedang mengarahkannya ke jalur nilai tambah
              ({produk.opsi_nilai_tambah[0]}) alih-alih dijual segar. Pertimbangkan matang sebelum membeli.
            </div>
          )}

          <div className="space-y-2">
            <Label>Jumlah ({produk.satuan})</Label>
            <Input
              type="number"
              min={1}
              max={produk.stok}
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className="max-w-[160px]"
            />
          </div>

          <Button
            onClick={lanjutCheckout}
            disabled={produk.stok <= 0}
            className="w-full !rounded-xl py-6 text-[14.5px] md:w-auto md:px-10"
          >
            {produk.stok <= 0 ? "Stok Habis" : "Lanjut Checkout"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

function HargaPasarBanding({ harga, hargaPasar }: { harga: number; hargaPasar: RekomendasiHarga }) {
  const selisihPersen = ((harga - hargaPasar.harga_rekomendasi) / hargaPasar.harga_rekomendasi) * 100;
  const lebihMurah = selisihPersen <= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3",
        lebihMurah ? "bg-green-50" : "bg-amber-50"
      )}
    >
      <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full", lebihMurah ? "bg-green-100" : "bg-amber-100")}>
        {lebihMurah ? (
          <TrendingDown className="h-4 w-4 text-green-700" />
        ) : (
          <TrendingUp className="h-4 w-4 text-amber-700" />
        )}
      </div>
      <div className="text-[13px]">
        <p className={cn("font-bold", lebihMurah ? "text-green-700" : "text-amber-700")}>
          {Math.abs(Math.round(selisihPersen))}% {lebihMurah ? "lebih murah" : "di atas"} harga pasar rata-rata
        </p>
        <p className="flex items-center gap-1 text-slate-400">
          <Scale className="h-3 w-3" /> Patokan pasar: Rp {hargaPasar.harga_rekomendasi.toLocaleString("id-ID")} —{" "}
          {hargaPasar.sumber === "bapanas_api" ? "data Bapanas" : "estimasi tren regional"}
        </p>
      </div>
    </div>
  );
}
