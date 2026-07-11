"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Wallet,
  BrainCircuit,
  Users,
  Info,
  HandCoins,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  Sprout,
} from "lucide-react";

interface SkorPreview {
  skor_individual: number;
  skor_graph: number;
  skor_gabungan: number;
  risk_level: string;
  jumlah_vouch: number;
  kemungkinan_disetujui: string;
  bobot_individual: number;
  bobot_graph: number;
}

interface Pinjaman {
  id: string;
  nominal: number;
  tujuan: string;
  tenor_bulan: number;
  status: string;
  skor_gabungan: number | null;
  risk_level: string | null;
  jenis_pinjaman: "modal_usaha" | "modal_pra_tanam" | "talangan_panen";
  persen_cair: number;
}

interface Simpanan {
  id: string;
  jenis: "setor" | "tarik";
  nominal: number;
  created_at: string;
}

const RISK_COLOR: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MED: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

const RISK_RING: Record<string, string> = {
  LOW: "text-green-600",
  MED: "text-amber-600",
  HIGH: "text-red-600",
};

const JENIS_PINJAMAN_LABEL: Record<string, string> = {
  modal_usaha: "Modal Usaha",
  modal_pra_tanam: "Modal Pra-Tanam",
  talangan_panen: "Dana Talangan Panen",
};

export default function SimpanPinjamPage() {
  const [skor, setSkor] = useState<SkorPreview | null>(null);
  const [pinjamanList, setPinjamanList] = useState<Pinjaman[]>([]);
  const [simpananList, setSimpananList] = useState<Simpanan[]>([]);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [nominal, setNominal] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [tenor, setTenor] = useState("6");
  const [submitting, setSubmitting] = useState(false);

  const [praNominal, setPraNominal] = useState("");
  const [luasLahan, setLuasLahan] = useState("");
  const [komoditasRencana, setKomoditasRencana] = useState("");
  const [estimasiHasil, setEstimasiHasil] = useState("");
  const [praTenor, setPraTenor] = useState("6");
  const [submittingPra, setSubmittingPra] = useState(false);

  function loadData() {
    api.get("/pinjaman/skor-preview").then((res) => setSkor(res.data)).catch(() => setSkor(null));
    api.get("/pinjaman/saya").then((res) => setPinjamanList(res.data)).catch(() => setPinjamanList([]));
    api.get("/simpanan/saya").then((res) => setSimpananList(res.data)).catch(() => setSimpananList([]));
    api.get("/simpanan/saldo/saya").then((res) => setSaldo(res.data.saldo)).catch(() => setSaldo(null));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/pinjaman", {
        nominal: Number(nominal),
        tujuan,
        tenor_bulan: Number(tenor),
      });
      setNominal("");
      setTujuan("");
      loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitPraTanam(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPra(true);
    try {
      await api.post("/pinjaman/modal-pra-tanam", {
        nominal: Number(praNominal),
        luas_lahan_hektar: Number(luasLahan),
        komoditas_rencana: komoditasRencana,
        estimasi_hasil_panen_kg: Number(estimasiHasil),
        tenor_bulan: Number(praTenor),
      });
      setPraNominal("");
      setLuasLahan("");
      setKomoditasRencana("");
      setEstimasiHasil("");
      loadData();
    } finally {
      setSubmittingPra(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Simpan Pinjam" title="Simpan Pinjam" description="Kelola simpanan dan ajukan modal dengan skor kelayakan otomatis." icon={Wallet} tone="green" />

      <GlassCard className="!rounded-3xl !p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <Wallet className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Simpanan</h2>
          </div>
          {saldo !== null && (
            <span className="tinted-tile rounded-full bg-gradient-to-br from-emerald-50 to-green-100 px-4 py-1.5 text-sm font-black text-green-700">
              Saldo: Rp {saldo.toLocaleString("id-ID")}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {simpananList.length === 0 && <EmptyState icon={History} message="Belum ada riwayat simpanan." />}
          {simpananList.map((s) => (
            <div key={s.id} className="inner-tile flex items-center justify-between rounded-xl px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-semibold capitalize text-slate-900">
                {s.jenis === "setor" ? (
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 text-red-500" />
                )}
                {s.jenis}
              </span>
              <span className="font-bold text-slate-900">Rp {s.nominal.toLocaleString("id-ID")}</span>
              <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString("id-ID")}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {skor && (
        <GlassCard className="!rounded-3xl !p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <BrainCircuit className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Preview Skor Kelayakan (Credit Scoring Hybrid)</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="inner-tile rounded-2xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Skor Individual · bobot {Math.round(skor.bobot_individual * 100)}%
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900">{skor.skor_individual}</div>
            </div>
            <div className="inner-tile rounded-2xl p-4">
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <Users className="h-3 w-3" /> Skor Jaringan · bobot {Math.round(skor.bobot_graph * 100)}%
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900">{skor.skor_graph}</div>
              <div className="text-xs text-slate-400">divouch {skor.jumlah_vouch} anggota aktif</div>
            </div>
            <div className={cn("tinted-tile rounded-2xl p-4", skor.risk_level === "LOW" ? "bg-gradient-to-br from-emerald-50 to-green-100/70" : skor.risk_level === "MED" ? "bg-gradient-to-br from-amber-50 to-orange-100/70" : "bg-gradient-to-br from-rose-50 to-red-100/70")}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Skor Gabungan</div>
              <div className={cn("mt-1 text-2xl font-black", RISK_RING[skor.risk_level])}>{skor.skor_gabungan}/100</div>
            </div>
          </div>

          {skor.bobot_graph >= 0.6 && (
            <p className="mt-4 flex items-start gap-2 tinted-tile rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-blue-700">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Karena histori transaksi Anda masih sedikit/belum ada, sistem memberi bobot lebih besar ke skor
              jaringan tanggung renteng — cold-start scoring.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge className={RISK_COLOR[skor.risk_level]}>{skor.risk_level}</Badge>
            <span className="text-sm text-slate-500">
              Kemungkinan disetujui: <strong className="text-slate-900">{skor.kemungkinan_disetujui}</strong>
            </span>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="!rounded-3xl !p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <HandCoins className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-extrabold text-slate-900">Ajukan Modal Usaha</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input value={nominal} onChange={(e) => setNominal(e.target.value)} type="number" required />
            </div>
            <div className="space-y-2">
              <Label>Tujuan</Label>
              <Input value={tujuan} onChange={(e) => setTujuan(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tenor (bulan)</Label>
              <Input value={tenor} onChange={(e) => setTenor(e.target.value)} type="number" required />
            </div>
            <Button type="submit" disabled={submitting} className="w-full !rounded-xl">
              {submitting ? "Mengirim..." : "Ajukan"}
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="!rounded-3xl !p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600">
              <Sprout className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-900">Ajukan Modal Pra-Tanam</h2>
              <p className="text-xs text-slate-400">Modal sebelum masa tanam — jawab jebakan ijon tengkulak</p>
            </div>
          </div>
          <form onSubmit={handleSubmitPraTanam} className="space-y-4">
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input value={praNominal} onChange={(e) => setPraNominal(e.target.value)} type="number" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Luas Lahan (ha)</Label>
                <Input value={luasLahan} onChange={(e) => setLuasLahan(e.target.value)} type="number" step="0.1" required />
              </div>
              <div className="space-y-2">
                <Label>Estimasi Hasil (kg)</Label>
                <Input value={estimasiHasil} onChange={(e) => setEstimasiHasil(e.target.value)} type="number" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Komoditas Rencana</Label>
              <Input value={komoditasRencana} onChange={(e) => setKomoditasRencana(e.target.value)} placeholder="mis. Cabai Merah" required />
            </div>
            <div className="space-y-2">
              <Label>Tenor (bulan)</Label>
              <Input value={praTenor} onChange={(e) => setPraTenor(e.target.value)} type="number" required />
            </div>
            <Button type="submit" disabled={submittingPra} className="w-full !rounded-xl">
              {submittingPra ? "Mengirim..." : "Ajukan Modal Pra-Tanam"}
            </Button>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="!rounded-3xl !p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="icon-chip h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600">
            <History className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-[15px] font-extrabold text-slate-900">Riwayat Pengajuan</h2>
        </div>
        <div className="space-y-2.5">
          {pinjamanList.length === 0 && <EmptyState icon={HandCoins} message="Belum ada pengajuan pinjaman." />}
          {pinjamanList.map((p) => (
            <div key={p.id} className="inner-tile flex items-center justify-between rounded-xl px-4 py-3.5 text-sm">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10.5px] font-bold text-slate-500 shadow-sm">
                    {JENIS_PINJAMAN_LABEL[p.jenis_pinjaman]}
                  </span>
                  {p.jenis_pinjaman === "talangan_panen" && (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-blue-600">
                      {p.persen_cair}% cair
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-900">
                  Rp {p.nominal.toLocaleString("id-ID")} — {p.tujuan}
                </p>
                <p className="text-slate-500">Tenor {p.tenor_bulan} bulan</p>
              </div>
              <Badge variant={p.status === "approved" ? "default" : "outline"}>{p.status}</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
