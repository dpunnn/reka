"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
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
import { HandCoins, Wallet, Info, LayoutDashboard } from "lucide-react";

interface AnggotaDirektori {
  id: string;
  nama: string;
}

export default function KasirDashboard() {
  const [angsuranId, setAngsuranId] = useState("");
  const [statusAngsuran, setStatusAngsuran] = useState<string | null>(null);

  const [anggotaList, setAnggotaList] = useState<AnggotaDirektori[]>([]);
  const [anggotaId, setAnggotaId] = useState("");
  const [jenis, setJenis] = useState<"setor" | "tarik">("setor");
  const [nominal, setNominal] = useState("");
  const [saldo, setSaldo] = useState<number | null>(null);
  const [statusSimpanan, setStatusSimpanan] = useState<string | null>(null);

  useEffect(() => {
    api.get("/anggota/direktori").then((res) => setAnggotaList(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!anggotaId) {
      setSaldo(null);
      return;
    }
    api
      .get(`/simpanan/saldo/${anggotaId}`)
      .then((res) => setSaldo(res.data.saldo))
      .catch(() => setSaldo(null));
  }, [anggotaId]);

  async function bayarAngsuran(e: React.FormEvent) {
    e.preventDefault();
    setStatusAngsuran(null);
    try {
      await api.post(`/pinjaman/angsuran/${angsuranId}/bayar`);
      setStatusAngsuran("Pembayaran angsuran berhasil dicatat.");
      setAngsuranId("");
    } catch {
      setStatusAngsuran("Gagal — cek ID angsuran.");
    }
  }

  async function catatSimpanan(e: React.FormEvent) {
    e.preventDefault();
    setStatusSimpanan(null);
    try {
      await api.post("/simpanan", { anggota_id: anggotaId, jenis, nominal: Number(nominal) });
      setStatusSimpanan(`Berhasil dicatat: ${jenis} Rp ${Number(nominal).toLocaleString("id-ID")}`);
      setNominal("");
      const res = await api.get(`/simpanan/saldo/${anggotaId}`);
      setSaldo(res.data.saldo);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - axios error shape
            err.response?.data?.detail
          : null;
      setStatusSimpanan(message ?? "Gagal mencatat simpanan.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kasir" title="Dashboard Kasir" description="Catat pembayaran angsuran dan transaksi simpanan anggota." icon={LayoutDashboard} tone="blue" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="!rounded-3xl !p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <HandCoins className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Catat Pembayaran Angsuran</h2>
          </div>
          <form onSubmit={bayarAngsuran} className="space-y-4">
            <div className="space-y-2">
              <Label>ID Angsuran</Label>
              <Input value={angsuranId} onChange={(e) => setAngsuranId(e.target.value)} required />
            </div>
            <Button type="submit" className="!rounded-xl">
              Catat Lunas
            </Button>
            {statusAngsuran && (
              <p className="flex items-start gap-1.5 text-sm text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" /> {statusAngsuran}
              </p>
            )}
          </form>
        </GlassCard>

        <GlassCard className="!rounded-3xl !p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <Wallet className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Input Setor/Tarik Simpanan</h2>
          </div>
          <form onSubmit={catatSimpanan} className="space-y-4">
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
              {saldo !== null && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  Saldo saat ini: Rp {saldo.toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Jenis</Label>
              <Select value={jenis} onValueChange={(v) => setJenis((v as "setor" | "tarik") ?? jenis)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="setor">Setor</SelectItem>
                  <SelectItem value="tarik">Tarik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} required />
            </div>
            <Button type="submit" disabled={!anggotaId} className="!rounded-xl">
              Catat Transaksi
            </Button>
            {statusSimpanan && (
              <p className="flex items-start gap-1.5 text-sm text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" /> {statusSimpanan}
              </p>
            )}
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
