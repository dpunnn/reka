"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore, Role } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassPill } from "@/components/glass-card";
import { PageBlobBackground } from "@/components/page-blob-background";
import { Wheat, ShoppingCart, Building2, Wallet, Landmark, KeyRound, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_HOME: Record<Role, string> = {
  anggota: "/anggota/dashboard",
  pengurus: "/pengurus/dashboard",
  kasir: "/kasir/dashboard",
  pembeli: "/pembeli",
  pemkab: "/pemkab/dashboard",
};

const DEMO_ACCOUNTS = [
  { icon: Wheat, label: "Pak Slamet (Anggota)", phone: "081300000001" },
  { icon: ShoppingCart, label: "Rina (Pembeli Kota)", phone: "081200000003" },
  { icon: Building2, label: "Budi Santoso (Pengurus)", phone: "081200000001" },
  { icon: Wallet, label: "Siti Aminah (Kasir)", phone: "081200000002" },
  { icon: Landmark, label: "Dinas Koperasi (Pemkab)", phone: "081200000004" },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { phone, password });
      const { access_token, refresh_token, role } = res.data;
      setSession(access_token, refresh_token, role as Role);
      router.push(ROLE_HOME[role as Role] ?? "/");
    } catch {
      setError("Nomor HP atau password salah");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoPhone: string) {
    setPhone(demoPhone);
    setPassword("password123");
    setError(null);
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
        <div className="flex w-full max-w-[440px] flex-col justify-center">
          <GlassPill className="mb-5 w-fit text-blue-700">
            <span className="inline-flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-blue-600" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
              Koperasi Digital untuk Desa
            </span>
          </GlassPill>
          <h1 className="mb-3.5 text-[34px] font-extrabold leading-tight text-slate-900 md:text-[36px]">
            Selamat datang
            <br />
            di REKA
          </h1>
          <p className="mb-7 max-w-[380px] text-[15px] leading-relaxed text-slate-500">
            Satu platform untuk simpan pinjam, jualan hasil panen, dan tumbuh bersama koperasi desamu.
          </p>

          <GlassCard className="max-w-[400px] !rounded-[18px] !p-5">
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
              <KeyRound className="h-3.5 w-3.5" /> Akun Demo (klik untuk isi otomatis)
            </div>
            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  onClick={() => fillDemo(acc.phone)}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-slate-900">
                    <acc.icon className="h-3.5 w-3.5 text-blue-600" /> {acc.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{acc.phone}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT CARD */}
        <div className="w-full max-w-[440px] flex-shrink-0 rounded-[28px] bg-white p-9 shadow-[0_20px_60px_rgba(0,0,0,0.09)]">
          <h2 className="mb-1.5 text-[22px] font-extrabold text-slate-900">Masuk ke akun</h2>
          <p className="mb-6 text-[13.5px] text-slate-400">Gunakan nomor HP dan password kamu</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-600">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className={cn("w-full !rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 py-6 text-[14.5px] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.3)]")}
            >
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </Button>
            <Button
              type="button"
              variant="outline"
              render={<Link href="/register">Belum Punya Akun? Daftar Gratis</Link>}
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
