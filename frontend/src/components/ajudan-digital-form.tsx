"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
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
import { Sparkles, ImagePlus, UserCog, CheckCircle2 } from "lucide-react";

interface AnggotaDirektori {
  id: string;
  nama: string;
}

export function AjudanDigitalForm() {
  const [anggotaList, setAnggotaList] = useState<AnggotaDirektori[]>([]);
  const [anggotaId, setAnggotaId] = useState("");
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Sayur");
  const [harga, setHarga] = useState("");
  const [stok, setStok] = useState("");
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState("");
  const [rekomendasi, setRekomendasi] = useState<number | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sukses, setSukses] = useState<string | null>(null);

  useEffect(() => {
    api.get("/anggota/direktori").then((res) => setAnggotaList(res.data)).catch(() => {});
  }, []);

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
    if (!anggotaId) return;
    setSubmitting(true);
    setSukses(null);
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
      await api.post(`/marketplace/produk/ajudan/${anggotaId}`, {
        nama,
        kategori,
        harga: Number(harga),
        satuan: "kg",
        stok: Number(stok),
        tanggal_kadaluarsa: tanggalKadaluarsa || null,
        foto_url: fotoUrl,
      });
      const namaAnggota = anggotaList.find((a) => a.id === anggotaId)?.nama ?? "anggota";
      setSukses(`Produk "${nama}" berhasil dilisting atas nama ${namaAnggota}.`);
      setNama("");
      setHarga("");
      setStok("");
      setTanggalKadaluarsa("");
      setFoto(null);
      setRekomendasi(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="max-w-lg !rounded-3xl !p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="icon-chip h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
          <UserCog className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-900">Input Listing Atas Nama Anggota</h2>
          <p className="text-xs text-slate-400">Untuk anggota yang tidak punya/tidak bisa pakai smartphone</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Anggota</Label>
          <Select value={anggotaId} onValueChange={(v) => setAnggotaId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih anggota" />
            </SelectTrigger>
            <SelectContent>
              {anggotaList.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              Harga optimal: Rp {rekomendasi.toLocaleString("id-ID")}, berdasarkan tren pasar regional.
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
        {sukses && (
          <p className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[12.5px] font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> {sukses}
          </p>
        )}
        <Button type="submit" disabled={submitting || !anggotaId} className="w-full !rounded-xl py-6 text-[14.5px]">
          {submitting ? "Menyimpan..." : "Simpan Produk"}
        </Button>
      </form>
    </GlassCard>
  );
}
