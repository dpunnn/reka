"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { ProductThumb } from "@/components/product-thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Info, AlertTriangle, ShoppingBag } from "lucide-react";

interface Produk {
  id: string;
  nama: string;
  harga: number;
  satuan: string;
  foto_url: string | null;
}

const KURIR_LIST = ["JNE", "J&T", "SiCepat"];

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const produkId = searchParams.get("produkId");
  const jumlah = Number(searchParams.get("jumlah") ?? "1");

  const [produk, setProduk] = useState<Produk | null>(null);
  const [alamat, setAlamat] = useState("");
  const [kurir, setKurir] = useState("JNE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!produkId) return;
    api.get(`/marketplace/produk/${produkId}`).then((res) => setProduk(res.data)).catch(() => setProduk(null));
  }, [produkId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!produk) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/marketplace/orders", {
        items: [{ produk_id: produk.id, jumlah }],
        alamat_kirim: alamat,
        kurir,
      });
      router.push("/pembeli/pesanan");
    } catch {
      setError("Gagal membuat pesanan — cek kembali stok produk.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!produkId) {
    return (
      <div className="glass-card flex items-center gap-3 !rounded-2xl px-5 py-4 text-sm text-slate-500">
        <Info className="h-4 w-4 flex-shrink-0 text-blue-600" />
        Pilih produk dari marketplace dulu sebelum checkout.
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader eyebrow="Checkout" title="Selesaikan Pesanan" icon={ShoppingBag} tone="blue" />

      <GlassCard className="!rounded-3xl !p-7">
        {produk && (
          <div className="inner-tile mb-5 flex items-center gap-3.5 rounded-2xl p-3.5">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
              <ProductThumb nama={produk.nama} fotoUrl={produk.foto_url} />
            </div>
            <div className="text-sm">
              <p className="font-bold text-slate-900">{produk.nama}</p>
              <p className="text-slate-500">
                {jumlah} {produk.satuan} × Rp {produk.harga.toLocaleString("id-ID")}
              </p>
              <p className="font-black text-blue-700">= Rp {(jumlah * produk.harga).toLocaleString("id-ID")}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Alamat Pengiriman</Label>
            <Input value={alamat} onChange={(e) => setAlamat(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Kurir
            </Label>
            <Select value={kurir} onValueChange={(v) => setKurir(v ?? kurir)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KURIR_LIST.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="flex items-start gap-2 tinted-tile rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-blue-700">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Pembayaran: mock virtual account (prototype) — dianggap lunas otomatis saat order dibuat.
          </p>
          {error && (
            <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
            </p>
          )}
          <Button type="submit" className="w-full !rounded-xl py-6 text-[14.5px]" disabled={submitting || !produk}>
            {submitting ? "Memproses..." : "Buat Pesanan"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">Memuat...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
