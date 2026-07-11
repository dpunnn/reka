"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ImagePlus } from "lucide-react";

export default function TambahProdukPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Sayur");
  const [harga, setHarga] = useState("");
  const [stok, setStok] = useState("");
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState("");
  const [rekomendasi, setRekomendasi] = useState<number | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function checkRekomendasi(namaProduk: string) {
    if (!namaProduk) return;
    try {
      const res = await api.get(`/marketplace/rekomendasi-harga/${encodeURIComponent(namaProduk)}`);
      setRekomendasi(res.data.harga_rekomendasi);
    } catch {
      setRekomendasi(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let fotoUrl: string | null = null;
      if (foto) {
        const formData = new FormData();
        formData.append("file", foto);
        const uploadRes = await api.post("/uploads/produk-foto", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fotoUrl = uploadRes.data.url;
      }
      await api.post("/marketplace/produk", {
        nama,
        kategori,
        harga: Number(harga),
        satuan: "kg",
        stok: Number(stok),
        tanggal_kadaluarsa: tanggalKadaluarsa || null,
        foto_url: fotoUrl,
      });
      router.push("/anggota/marketplace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader eyebrow="Toko Saya" title="Jual Produk Baru" icon={Sparkles} tone="green" />
      <GlassCard className="!rounded-3xl !p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Produk</Label>
            <Input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              onBlur={(e) => checkRekomendasi(e.target.value)}
              placeholder="mis. Cabai Merah"
              required
            />
            {rekomendasi && (
              <p className="flex items-start gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs leading-relaxed text-indigo-600">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                Harga optimal untuk {nama} di wilayah Anda: Rp {rekomendasi.toLocaleString("id-ID")}, berdasarkan tren
                pasar regional.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input value={kategori} onChange={(e) => setKategori(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Harga (Rp/kg)</Label>
            <Input value={harga} onChange={(e) => setHarga(e.target.value)} type="number" required />
          </div>
          <div className="space-y-2">
            <Label>Stok (kg)</Label>
            <Input value={stok} onChange={(e) => setStok(e.target.value)} type="number" required />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Kadaluarsa (opsional)</Label>
            <Input value={tanggalKadaluarsa} onChange={(e) => setTanggalKadaluarsa(e.target.value)} type="date" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="h-3.5 w-3.5" /> Foto Produk (opsional, maks 5MB)
            </Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full !rounded-xl py-6 text-[14.5px]">
            {submitting ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
