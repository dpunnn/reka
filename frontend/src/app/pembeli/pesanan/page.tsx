"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Clock, PackageCheck, Truck, CheckCircle2, MapPin, Loader2, ShoppingBag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  produk_id: string;
  jumlah: number;
  harga_satuan: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  alamat_kirim: string;
  kurir: string | null;
  created_at: string;
  items: OrderItem[];
}

const STATUS_META: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: "Menunggu Diproses", icon: Clock, className: "bg-slate-100 text-slate-600" },
  dikemas: { label: "Dikemas", icon: PackageCheck, className: "bg-amber-100 text-amber-700" },
  dikirim: { label: "Dikirim", icon: Truck, className: "bg-blue-100 text-blue-700" },
  diterima: { label: "Diterima", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
};

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/marketplace/orders/saya")
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Riwayat" title="Pesanan Saya" icon={ShoppingBag} tone="blue" />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
        </div>
      )}
      {!loading && orders.length === 0 && <EmptyState icon={ShoppingBag} message="Belum ada pesanan." />}

      <div className="space-y-3.5">
        {orders.map((o) => {
          const meta = STATUS_META[o.status] ?? STATUS_META.pending;
          return (
            <GlassCard key={o.id} className="card-lift !rounded-2xl !p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xl font-black text-slate-900">Rp {o.total.toLocaleString("id-ID")}</div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", meta.className)}>
                  <meta.icon className="h-3.5 w-3.5" /> {meta.label}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-[13px] text-slate-500">
                <p className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-slate-400" /> {o.items.length} item — Kurir: {o.kurir ?? "-"}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {o.alamat_kirim}
                </p>
                <p className="pl-5 text-xs text-slate-400">{new Date(o.created_at).toLocaleString("id-ID")}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
