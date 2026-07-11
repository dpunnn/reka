"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface Notifikasi {
  id: string;
  tipe: string;
  judul: string;
  pesan: string;
  dibaca: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notifikasi[]>([]);
  const [jumlahBelumDibaca, setJumlahBelumDibaca] = useState(0);

  function loadJumlah() {
    api
      .get("/notifikasi/saya/jumlah-belum-dibaca")
      .then((res) => setJumlahBelumDibaca(res.data.jumlah))
      .catch(() => {});
  }

  useEffect(() => {
    loadJumlah();
    const interval = setInterval(loadJumlah, 30000);
    return () => clearInterval(interval);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      api.get("/notifikasi/saya").then((res) => setList(res.data)).catch(() => setList([]));
    }
  }

  async function tandaiDibaca(id: string) {
    await api.post(`/notifikasi/${id}/baca`);
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)));
    loadJumlah();
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative rounded-full p-2.5 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {jumlahBelumDibaca > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {jumlahBelumDibaca > 9 ? "9+" : jumlahBelumDibaca}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-card absolute right-0 z-50 mt-2 w-80 overflow-hidden !rounded-2xl !p-0">
          <div className="border-b border-white/60 p-3.5">
            <p className="text-sm font-bold text-slate-900">Notifikasi</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {list.length === 0 && (
              <p className="p-4 text-sm text-slate-400">Belum ada notifikasi.</p>
            )}
            {list.map((n) => (
              <button
                key={n.id}
                onClick={() => tandaiDibaca(n.id)}
                className={`block w-full border-b border-white/60 p-3.5 text-left text-sm transition-colors hover:bg-white/60 ${
                  n.dibaca ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{n.judul}</p>
                  {!n.dibaca && <Badge className="h-2 w-2 rounded-full p-0" />}
                </div>
                <p className="text-slate-500">{n.pesan}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(n.created_at).toLocaleString("id-ID")}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
