"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductThumb } from "@/components/product-thumb";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Clock, ShoppingBasket, Loader2, Store } from "lucide-react";

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  status: string;
  foto_url: string | null;
}

export default function BrowseMarketplacePage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/marketplace/produk")
      .then((res) => setProduk(res.data))
      .catch(() => setProduk([]))
      .finally(() => setLoading(false));
  }, []);

  const smartExpiryDeals = produk.filter((p) => p.status === "mendekati_expired");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace Desa"
        title="Marketplace Desa-Kota"
        description="Langsung dari petani, tanpa tengkulak — didukung Dynamic Bundling & Smart Expiry."
        icon={Store}
        tone="green"
      />

      {smartExpiryDeals.length > 0 && (
        <div className="tinted-tile flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-100/70 px-5 py-4">
          <div className="icon-chip h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Clock className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <p className="text-sm font-bold text-amber-900">
            Smart Expiry Deals — Diskon Kadaluarsa Hari Ini ({smartExpiryDeals.length} produk)
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat produk...
        </div>
      )}

      {!loading && produk.length === 0 && (
        <EmptyState icon={ShoppingBasket} message="Belum ada produk tersedia di marketplace." />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {produk.map((p) => (
          <Link
            key={p.id}
            href={`/pembeli/produk/${p.id}`}
            className="glass-card card-lift group block overflow-hidden !rounded-2xl !p-0"
          >
            <div className="relative aspect-square overflow-hidden">
              <ProductThumb nama={p.nama} fotoUrl={p.foto_url} className="transition-transform duration-300 group-hover:scale-105" />
              {p.status === "mendekati_expired" && (
                <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[10px] font-extrabold text-white shadow">
                  <Clock className="h-2.5 w-2.5" /> Diskon
                </span>
              )}
            </div>
            <div className="p-3.5">
              <div className="mb-1 line-clamp-2 min-h-[34px] text-[13px] font-bold leading-snug text-slate-900">{p.nama}</div>
              <div className="text-[15px] font-black text-blue-700">
                Rp {p.harga.toLocaleString("id-ID")}
                <span className="text-xs font-semibold text-slate-400">/{p.satuan}</span>
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-400">{p.kategori}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
