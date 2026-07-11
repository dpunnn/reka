"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
import { GlassCard, GlassPill } from "@/components/glass-card";
import { PageBlobBackground } from "@/components/page-blob-background";
import { Wheat, Users, AlertTriangle, Clock, Check, Hourglass } from "lucide-react";

interface Koperasi {
  id: string;
  nama: string;
}

interface AnggotaDirektori {
  id: string;
  nama: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [koperasiList, setKoperasiList] = useState<Koperasi[]>([]);
  const [voucherList, setVoucherList] = useState<AnggotaDirektori[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nik, setNik] = useState("");
  const [koperasiId, setKoperasiId] = useState("");
  const [jenisUsaha, setJenisUsaha] = useState("");
  const [voucherId, setVoucherId] = useState("");

  useEffect(() => {
    api.get("/koperasi").then((res) => setKoperasiList(res.data)).catch(() => {});
    api.get("/anggota/direktori").then((res) => setVoucherList(res.data)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!koperasiId) {
      setError("Pilih koperasi terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register/anggota", {
        full_name: fullName,
        email,
        password,
        nik,
        koperasi_id: koperasiId,
        jenis_usaha: jenisUsaha || null,
        direferensikan_oleh_id: voucherId || null,
      });
      setSubmitted(true);
    } catch {
      setError("Pendaftaran gagal — cek kembali data yang diisi (email/NIK mungkin sudah terdaftar).");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#EAF1FF] via-[#EFF4FF] to-[#EAF6FF] px-6">
        <PageBlobBackground className="fixed" />
        <div className="w-full max-w-md rounded-[28px] bg-white p-9 text-center shadow-[0_20px_60px_rgba(0,0,0,0.09)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Hourglass className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="mb-2.5 text-xl font-extrabold text-slate-900">Menunggu Verifikasi Pengurus</h2>
          <p className="mb-6 text-[13.5px] leading-relaxed text-slate-500">
            Pendaftaran kamu sudah masuk. Pengurus koperasi akan memverifikasi data dan referensi/vouching kamu
            sebelum akun aktif.
          </p>
          <div className="mb-6 space-y-2 rounded-2xl bg-blue-50 p-4 text-left">
            <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
              <Check className="h-3.5 w-3.5 text-green-600" /> Data diri terkirim
            </div>
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-blue-700">
              <Clock className="h-3.5 w-3.5" /> Menunggu verifikasi pengurus koperasi
            </div>
          </div>
          <Button onClick={() => router.push("/login")} className="w-full !rounded-xl bg-slate-900 py-6 font-bold">
            Kembali ke Halaman Masuk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-[#EAF1FF] via-[#EFF4FF] to-[#EAF6FF]">
      <PageBlobBackground className="fixed" />

      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/70 bg-white/60 px-4 backdrop-blur-xl sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-blue-800 to-blue-500">
            <Wheat className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-extrabold text-blue-700">REKA</span>
        </Link>
      </nav>

      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center justify-center gap-12 px-6 py-12 lg:flex-row">
        {/* LEFT */}
        <div className="flex w-full max-w-[420px] flex-col justify-center">
          <GlassPill className="mb-5 w-fit text-blue-700">
            <span className="inline-flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-blue-600" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
              Koperasi Digital untuk Desa
            </span>
          </GlassPill>
          <h1 className="mb-3.5 text-[32px] font-extrabold leading-tight text-slate-900">Tumbuh bersama koperasimu</h1>
          <p className="mb-7 max-w-[380px] text-[15px] leading-relaxed text-slate-500">
            Gratis untuk anggota koperasi. Ajukan modal dengan skor kelayakan otomatis dan jual hasil panen langsung
            ke pembeli kota.
          </p>
          <GlassCard className="max-w-[380px] !rounded-[18px] !p-5">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
              <Users className="h-3.5 w-3.5 text-blue-600" /> Kenapa vouching penting?
            </div>
            <p className="text-[12.5px] leading-relaxed text-slate-500">
              Anggota baru tanpa histori transaksi tetap bisa dinilai kelayakan pinjamannya lewat jaringan tanggung
              renteng — divouch anggota aktif mempercepat cold-start scoring kamu.
            </p>
          </GlassCard>
        </div>

        {/* RIGHT CARD */}
        <div className="max-h-[82vh] w-full max-w-[440px] flex-shrink-0 overflow-y-auto rounded-[28px] bg-white p-9 shadow-[0_20px_60px_rgba(0,0,0,0.09)]">
          <h2 className="mb-1.5 text-[22px] font-extrabold text-slate-900">Buat akun baru</h2>
          <p className="mb-6 text-[13.5px] text-slate-400">Gratis, daftar sekarang dan mulai tumbuh bersama REKA</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>NIK</Label>
              <Input value={nik} onChange={(e) => setNik(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Koperasi</Label>
              <Select value={koperasiId} onValueChange={(v) => setKoperasiId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih koperasi" />
                </SelectTrigger>
                <SelectContent>
                  {koperasiList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Usaha</Label>
              <Input
                value={jenisUsaha}
                onChange={(e) => setJenisUsaha(e.target.value)}
                placeholder="mis. Cabai Merah"
              />
            </div>
            <div className="space-y-2">
              <Label>Direferensikan/Divouch oleh (anggota aktif)</Label>
              <Select value={voucherId} onValueChange={(v) => setVoucherId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Opsional, tapi mempercepat cold-start scoring" />
                </SelectTrigger>
                <SelectContent>
                  {voucherList.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-600">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full !rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 py-6 text-[14.5px] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
            >
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </Button>
            <Button
              type="button"
              variant="outline"
              render={<Link href="/login">Sudah Punya Akun? Masuk</Link>}
              className="w-full !rounded-xl py-6 text-[14.5px] font-bold"
            />
          </form>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-[11.5px] text-slate-400">
        © 2026 REKA · Prototype demo
      </footer>
    </div>
  );
}
