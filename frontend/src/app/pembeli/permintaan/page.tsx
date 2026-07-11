"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Loader2,
  PackageSearch,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PermintaanBeli {
  id: string;
  komoditas: string;
  jumlah_dibutuhkan: number;
  harga_maks: number | null;
  status: "open" | "menunggu_bundling" | "terpenuhi";
  created_at: string;
}

interface KandidatMatch {
  produk_id: string;
  nama: string;
  koperasi_id: string;
  stok: number;
  harga: number;
  grade: string | null;
  skor_match: number;
}

interface HasilMatch {
  permintaan_id?: string;
  status: string;
  total_tersedia: number;
  kekurangan: number;
  kandidat: KandidatMatch[];
}

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  terpenuhi: { label: "Terpenuhi", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  menunggu_bundling: { label: "Menunggu Bundling", icon: Layers, className: "bg-amber-100 text-amber-700" },
  open: { label: "Dicari", icon: Clock, className: "bg-slate-100 text-slate-600" },
};

export default function PermintaanBeliPage() {
  const [list, setList] = useState<PermintaanBeli[]>([]);
  const [loading, setLoading] = useState(true);
  const [komoditas, setKomoditas] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [hargaMaks, setHargaMaks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasilBaru, setHasilBaru] = useState<HasilMatch | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [matchPerId, setMatchPerId] = useState<Record<string, HasilMatch>>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);

  function load() {
    api
      .get("/marketplace/permintaan-beli/saya")
      .then((res) => setList(res.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setHasilBaru(null);
    try {
      const res = await api.post("/marketplace/permintaan-beli", {
        komoditas,
        jumlah_dibutuhkan: Number(jumlah),
        harga_maks: hargaMaks ? Number(hargaMaks) : null,
      });
      setHasilBaru(res.data);
      if (res.data.status === "terpenuhi") {
        toast.success(`Permintaan langsung cocok — ${res.data.kandidat.length} produk tersedia.`);
      } else {
        toast.info("Supply belum cukup — sistem otomatis dorong batch bundling & notifikasi koperasi terkait.");
      }
      setKomoditas("");
      setJumlah("");
      setHargaMaks("");
      load();
    } catch {
      toast.error("Gagal mengajukan permintaan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cekUlang(id: string) {
    setCheckingId(id);
    try {
      const res = await api.get(`/marketplace/permintaan-beli/${id}/match`);
      setMatchPerId((prev) => ({ ...prev, [id]: res.data }));
      setExpandedId(id);
      load();
    } catch {
      toast.error("Gagal cek ulang kecocokan.");
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demand Matching"
        title="Ajukan Permintaan Beli"
        description="Ajukan komoditas yang kamu butuhkan — sistem cocokkan otomatis ke stok koperasi yang sudah lolos QC."
        icon={PackageSearch}
        tone="blue"
      />

      <GlassCard className="!rounded-3xl !p-7">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label>Komoditas</Label>
            <Input
              value={komoditas}
              onChange={(e) => setKomoditas(e.target.value)}
              placeholder="mis. Cabai Merah"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label>Jumlah Dibutuhkan (kg)</Label>
            <Input
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              type="number"
              min="1"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label>Harga Maks per kg (opsional)</Label>
            <Input value={hargaMaks} onChange={(e) => setHargaMaks(e.target.value)} type="number" min="0" />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={submitting} className="w-full !rounded-xl py-6 text-[14.5px] sm:w-auto sm:px-10">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mencocokkan...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Cari & Cocokkan
                </>
              )}
            </Button>
          </div>
        </form>

        {hasilBaru && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <HasilMatchPanel hasil={hasilBaru} />
          </div>
        )}
      </GlassCard>

      <div className="space-y-3.5">
        <h2 className="text-[15px] font-extrabold text-slate-900">Riwayat Permintaan</h2>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </div>
        )}
        {!loading && list.length === 0 && (
          <EmptyState icon={PackageSearch} message="Belum ada permintaan diajukan." />
        )}

        {list.map((p) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.open;
          const isExpanded = expandedId === p.id;
          const match = matchPerId[p.id];
          return (
            <GlassCard key={p.id} className="card-lift !rounded-2xl !p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-bold capitalize text-slate-900">{p.komoditas}</p>
                  <p className="text-[12.5px] text-slate-500">
                    {p.jumlah_dibutuhkan} kg
                    {p.harga_maks ? ` · maks Rp ${p.harga_maks.toLocaleString("id-ID")}/kg` : ""}
                  </p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", meta.className)}>
                  <meta.icon className="h-3.5 w-3.5" /> {meta.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString("id-ID")}</p>
                {p.status !== "terpenuhi" && (
                  <button
                    onClick={() => (isExpanded ? setExpandedId(null) : cekUlang(p.id))}
                    disabled={checkingId === p.id}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    {checkingId === p.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    Cek Ulang Kecocokan
                  </button>
                )}
              </div>

              {isExpanded && match && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <HasilMatchPanel hasil={match} />
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function HasilMatchPanel({ hasil }: { hasil: HasilMatch }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-bold text-slate-900">Total tersedia: {hasil.total_tersedia} kg</span>
        {hasil.kekurangan > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            Kurang {hasil.kekurangan} kg — batch bundling didorong otomatis
          </span>
        )}
      </div>

      {hasil.kandidat.length === 0 && (
        <p className="text-[12.5px] text-slate-400">Belum ada produk lolos QC yang cocok saat ini.</p>
      )}

      <div className="space-y-2">
        {hasil.kandidat.map((k) => (
          <div key={k.produk_id} className="inner-tile flex items-center justify-between rounded-xl px-4 py-3 text-sm">
            <div>
              <span className="font-bold text-slate-900">{k.nama}</span>
              <span className="ml-2 text-slate-400">
                {k.stok} kg · Rp {k.harga.toLocaleString("id-ID")}/kg · grade {k.grade ?? "-"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3 w-3" /> {k.skor_match}/100
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
