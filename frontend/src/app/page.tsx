import Link from "next/link";
import {
  Wheat,
  ShoppingCart,
  Sparkles,
  Check,
  Package,
  Clock,
  BrainCircuit,
  Carrot,
  Coffee,
  Egg,
  Sprout,
  Salad,
  ArrowRight,
  Star,
} from "lucide-react";
import { GlassCard, GlassPill } from "@/components/glass-card";
import { PageBlobBackground } from "@/components/page-blob-background";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "83.000+", label: "Sasaran Kopdes Merah Putih se-Indonesia" },
  { value: "42–52%", label: "Margin petani yang hilang ke tengkulak" },
  { value: "<2%", label: "Target NPF, mengacu model tanggung renteng" },
  { value: "H+2", label: "Estimasi pencairan modal terverifikasi" },
];

const FITUR = [
  {
    icon: BrainCircuit,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Credit Scoring Hybrid",
    desc: "Skor kelayakan pinjaman gabungan dari histori transaksi pribadi DAN jaringan tanggung renteng digital antar anggota. Anggota baru tanpa histori tetap dinilai lewat bobot graf yang membesar otomatis — bukan ditolak mentah.",
    visual: "82/100 · Peluang Tinggi",
    visualBg: "bg-green-50 text-green-600",
  },
  {
    icon: Package,
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    title: "Dynamic Bundling",
    desc: "Order-order kecil dari banyak anggota — bahkan lintas koperasi — digabung otomatis jadi satu batch pengiriman yang memenuhi kuantitas minimum buyer kota, resto, dan UMKM.",
    visual: "60kg / 100kg terkumpul · 4 anggota",
    visualBg: "bg-blue-50 text-blue-600",
  },
  {
    icon: Clock,
    bg: "bg-red-50",
    iconColor: "text-red-600",
    title: "Smart Expiry Display",
    desc: "Produk segar yang mendekati kadaluarsa otomatis naik ke posisi teratas marketplace dengan diskon bertingkat — supaya tidak ada hasil panen yang terbuang sia-sia.",
    visual: "H-7 → 10% · H-3 → 25% · H-1 → 50%",
    visualBg: "bg-red-50 text-red-600",
  },
];

const STEPS = [
  {
    no: 1,
    icon: Sparkles,
    title: "Daftar & Divouch",
    desc: "Anggota daftar dengan data diri, divouch oleh anggota lain di jaringan tanggung renteng, lalu diverifikasi pengurus.",
  },
  {
    no: 2,
    icon: Wheat,
    title: "Ajukan Modal / Jual Produk",
    desc: "Ajukan pinjaman dengan preview skor kelayakan, atau upload produk ke marketplace.",
  },
  {
    no: 3,
    icon: BrainCircuit,
    title: "Sistem Cerdas Bekerja",
    desc: "Sistem menghitung skor gabungan, menggabungkan order kecil, dan menerapkan diskon expiry otomatis.",
  },
  {
    no: 4,
    icon: ArrowRight,
    title: "Tumbuh Bersama Koperasi",
    desc: "Modal cair, produk terjual adil, pendapatan naik — data lengkap tersaji untuk pengurus & Pemkab.",
  },
];

const PRODUK_PREVIEW = [
  { name: "Cabai Merah Keriting Segar", price: "Rp 38.000/kg", icon: Salad, bg: "bg-red-50", iconColor: "text-red-600", diskon: "-25%" },
  { name: "Kopi Robusta Petik Merah", price: "Rp 65.000/kg", icon: Coffee, bg: "bg-amber-50", iconColor: "text-amber-700" },
  { name: "Telur Ayam Kampung", price: "Rp 52.000/kg", icon: Egg, bg: "bg-yellow-50", iconColor: "text-yellow-600" },
  { name: "Jagung Manis Panen Baru", price: "Rp 8.500/kg", icon: Sprout, bg: "bg-lime-50", iconColor: "text-lime-700" },
  { name: "Wortel Segar Pilihan", price: "Rp 12.000/kg", icon: Carrot, bg: "bg-orange-50", iconColor: "text-orange-600", diskon: "-10%" },
  { name: "Tomat Merah Grade A", price: "Rp 15.000/kg", icon: Salad, bg: "bg-rose-50", iconColor: "text-rose-600" },
];

const TESTIMONI = [
  {
    icon: Wheat,
    avatarBg: "bg-blue-600",
    name: "Slamet Riyadi",
    role: "Anggota, Koperasi Tani Makmur Sejahtera",
    quote:
      "Dulu cabai saya sering dijual murah ke tengkulak pas lagi banyak stok. Sekarang lewat REKA, harga jual lebih adil dan modal cair cuma dua hari.",
  },
  {
    icon: Egg,
    avatarBg: "bg-green-600",
    name: "Wati Suryani",
    role: "Peternak Telur, Koperasi Tani Makmur Sejahtera",
    quote:
      "Sistem bundling-nya bikin saya bisa kirim ke resto besar di kota, padahal stok saya sendirian nggak akan pernah cukup.",
  },
  {
    icon: BrainCircuit,
    avatarBg: "bg-indigo-600",
    name: "Joko Prasetyo",
    role: "Ketua, Koperasi Tani Makmur Sejahtera",
    quote:
      "Sebagai pengurus, saya sekarang bisa lihat skor risiko tiap anggota langsung lewat graf jaringan, nggak perlu tebak-tebak lagi.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#EAF1FF] via-[#EFF4FF] to-[#EAF6FF] text-foreground">
      <PageBlobBackground className="fixed" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex h-[68px] items-center gap-2 border-b border-white/70 bg-white/60 px-6 backdrop-blur-xl backdrop-saturate-150 md:px-8">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-blue-800 to-blue-500 shadow-[0_4px_14px_rgba(37,99,235,0.4)]">
            <Wheat className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-[23px] font-black tracking-tight text-blue-700">REKA</span>
        </Link>
        <div className="ml-3 hidden items-center gap-1 md:flex">
          <a href="#fitur" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
            Fitur Unggulan
          </a>
          <a href="#cara-kerja" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
            Cara Kerja
          </a>
          <a href="#testimoni" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
            Testimoni
          </a>
          <Link href="/pembeli" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
            Marketplace
          </Link>
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-full border-2 border-blue-600 bg-white/60 px-5 py-2.5 text-[13px] font-bold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-br from-blue-700 to-blue-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-transform hover:-translate-y-0.5"
          >
            Daftar Gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-6 pt-12 md:flex-row md:gap-14 md:px-8 md:pt-16">
        <div className="min-w-0 flex-1">
          <GlassPill className="mb-5 inline-flex items-center gap-2">
            <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-blue-600" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
            <Sparkles className="h-3.5 w-3.5 text-blue-700" strokeWidth={2.5} />
            <span className="text-[12.5px] font-bold text-blue-700">Platform Koperasi Digital untuk Desa</span>
          </GlassPill>
          <h1 className="mb-5 text-[42px] font-black leading-[1.12] tracking-tight text-slate-900 md:text-[50px]">
            Satu Koperasi,
            <br />
            <span className="brand-gradient-text">Sejuta Peluang.</span>
          </h1>
          <p className="mb-8 max-w-[490px] text-[16.5px] leading-relaxed text-slate-600">
            REKA menyatukan <strong className="text-slate-800">simpan pinjam digital</strong>,{" "}
            <strong className="text-slate-800">marketplace desa-kota</strong>, dan{" "}
            <strong className="text-slate-800">kecerdasan buatan</strong> dalam satu platform — supaya petani, peternak,
            dan pengrajin desa naik kelas tanpa tengkulak.
          </p>
          <div className="mb-7 flex flex-wrap gap-3.5">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-7 py-4 text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(37,99,235,0.4)] transition-transform hover:-translate-y-0.5"
            >
              <Wheat className="h-4 w-4" /> Daftar Sebagai Anggota
            </Link>
            <Link
              href="/pembeli"
              className="glass-pill inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-[15px] font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              <ShoppingCart className="h-4 w-4" /> Jelajahi Marketplace
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-600" /> Selaras dengan SIMKOPDES
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-600" /> Gratis untuk anggota
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-600" /> Skor kredit tanpa histori via vouching
            </span>
          </div>
        </div>

        {/* HERO VISUAL */}
        <div className="relative flex h-[380px] w-full flex-shrink-0 items-center justify-center md:h-[450px] md:w-[420px]">
          <div className="absolute h-[290px] w-[290px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.35),transparent_70%)] md:h-[330px] md:w-[330px]" />

          {/* orbiting produce icons */}
          <div className="absolute h-[320px] w-[320px] md:h-[370px] md:w-[370px]" style={{ animation: "spin 24s linear infinite" }}>
            <Salad className="absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 text-red-500" />
            <Coffee className="absolute bottom-6 left-1 h-6 w-6 text-amber-700" />
            <Egg className="absolute bottom-6 right-1 h-6 w-6 text-yellow-500" />
          </div>

          {/* mascot: harvest basket */}
          <div className="relative z-[2] h-[220px] w-[190px]" style={{ animation: "floatMascot 4.2s ease-in-out infinite" }}>
            <div className="absolute bottom-0 left-1/2 h-[18px] w-[130px] -translate-x-1/2 rounded-full bg-blue-950/20 blur-[7px]" />
            <div className="absolute left-1 top-[76px] h-14 w-5 -rotate-[30deg] rounded-[11px] bg-gradient-to-b from-blue-400 to-blue-600" />
            <div className="absolute right-1 top-[76px] h-14 w-5 rotate-[30deg] rounded-[11px] bg-gradient-to-b from-green-400 to-green-600" />
            <div
              className="absolute left-1/2 top-[56px] h-[130px] w-[156px] -translate-x-1/2 rounded-[22px] shadow-[0_22px_46px_rgba(30,58,138,0.3),inset_0_4px_10px_rgba(255,255,255,0.25)]"
              style={{ background: "repeating-linear-gradient(0deg,#D97706 0 8px,#B45309 8px 16px)" }}
            >
              <div className="absolute left-8 top-7 h-6 w-5 rounded-full bg-white">
                <div className="absolute left-[7px] top-2 h-2 w-2 rounded-full bg-slate-900" />
              </div>
              <div className="absolute right-8 top-7 h-6 w-5 rounded-full bg-white">
                <div className="absolute left-[7px] top-2 h-2 w-2 rounded-full bg-slate-900" />
              </div>
              <div className="absolute left-1/2 top-[54px] h-4 w-8 -translate-x-1/2 rounded-b-[40px] border-4 border-t-0 border-slate-900" />
            </div>
            <div className="absolute left-1/2 top-11 h-[18px] w-[168px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_6px_10px_rgba(0,0,0,0.15)]" />
            <Sprout className="absolute left-8 top-4 h-7 w-7 -rotate-[15deg] text-yellow-500" />
            <Carrot className="absolute left-[86px] top-2 h-6 w-6 text-orange-500" />
            <Salad className="absolute right-7 top-5 h-7 w-7 rotate-[12deg] text-red-500" />
          </div>

          {/* glass score card */}
          <GlassCard className="absolute right-[-8px] top-2 w-[168px] !rounded-[18px] !p-3.5" style={{ animation: "floatCard1 3.6s ease-in-out infinite" }}>
            <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Skor Kelayakan</div>
            <div className="mb-1.5 flex items-baseline gap-1.5">
              <span className="text-[27px] font-black text-green-600">82</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <div className="inline-block rounded-full bg-green-50 px-2.5 py-1 text-[10.5px] font-bold text-green-600">Peluang: Tinggi</div>
          </GlassCard>

          {/* glass bundling card */}
          <GlassCard className="absolute bottom-8 left-[-16px] w-[190px] !rounded-[18px] !p-3.5" style={{ animation: "floatCard2 4s ease-in-out infinite" }}>
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
              <Package className="h-3.5 w-3.5" /> Batch Bundling
            </div>
            <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-blue-700 to-blue-500" />
            </div>
            <div className="text-[11px] font-semibold text-slate-600">60kg / 100kg terkumpul</div>
          </GlassCard>

          {/* expiry tag */}
          <div
            className="absolute bottom-[-6px] right-2 z-[3] flex items-center gap-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 px-3.5 py-2.5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.3)]"
            style={{ animation: "floatCard1 3.2s ease-in-out .4s infinite" }}
          >
            <Clock className="h-4 w-4" />
            <span className="text-[11.5px] font-bold">H-1 → Diskon 50%</span>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="mx-auto max-w-[1200px] px-6 pt-14 md:px-8">
        <div className="rounded-[26px] border border-white/20 bg-gradient-to-br from-blue-800/90 to-blue-600/85 px-8 py-8 shadow-[0_20px_50px_rgba(30,58,138,0.28)] backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[28px] font-black text-white md:text-[32px]">{s.value}</div>
                <div className="mt-1 text-[12px] font-semibold leading-snug text-white/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FITUR UNGGULAN */}
      <section id="fitur" className="mx-auto max-w-[1280px] px-6 py-20 md:px-8">
        <div className="mb-12 text-center">
          <span className="mb-3.5 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">FITUR UNGGULAN</span>
          <h2 className="mb-3 text-[28px] font-black tracking-tight text-slate-900 md:text-[34px]">Bukan Sekadar Marketplace Biasa</h2>
          <p className="mx-auto max-w-[520px] text-[15px] leading-relaxed text-slate-500">
            Tiga sistem cerdas yang bekerja otomatis di balik layar, dirancang khusus untuk masalah nyata koperasi desa.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FITUR.map((f) => (
            <GlassCard key={f.title} className="!rounded-3xl !p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_rgba(30,58,138,0.14)]">
              <div className={cn("mb-4.5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl", f.bg)}>
                <f.icon className={cn("h-6 w-6", f.iconColor)} strokeWidth={2.2} />
              </div>
              <h3 className="mb-2.5 text-lg font-extrabold text-slate-900">{f.title}</h3>
              <p className="mb-4.5 text-[13.5px] leading-relaxed text-slate-500">{f.desc}</p>
              <div className={cn("inline-block rounded-[10px] px-3.5 py-2 text-xs font-bold", f.visualBg)}>{f.visual}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 text-center">
            <GlassPill className="mb-3.5 inline-block text-blue-700">CARA KERJA</GlassPill>
            <h2 className="text-[28px] font-black tracking-tight text-slate-900 md:text-[34px]">Empat Langkah Sederhana</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
            {STEPS.map((s) => (
              <GlassCard key={s.no} className="!rounded-[20px] !p-6 text-center">
                <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-lg font-black text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)]">
                  {s.no}
                </div>
                <s.icon className="mx-auto mb-2.5 h-6 w-6 text-blue-600" strokeWidth={2.2} />
                <div className="mb-2 text-[14.5px] font-extrabold text-slate-900">{s.title}</div>
                <div className="text-[12.5px] leading-relaxed text-slate-500">{s.desc}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 md:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="mb-3.5 inline-block rounded-full bg-green-50 px-4 py-1.5 text-xs font-bold text-green-600">MARKETPLACE DESA</span>
            <h2 className="text-[28px] font-black tracking-tight text-slate-900 md:text-[34px]">Langsung dari Petani, Segar Sampai Meja</h2>
          </div>
          <Link
            href="/pembeli"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-br from-blue-700 to-blue-600 px-5.5 py-3 text-[13.5px] font-bold text-white shadow-[0_6px_18px_rgba(37,99,235,0.3)]"
          >
            Lihat Semua Produk <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {PRODUK_PREVIEW.map((p) => (
            <Link
              key={p.name}
              href="/pembeli"
              className="glass-card block overflow-hidden !rounded-[18px] !p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(30,58,138,0.14)]"
            >
              <div className={cn("relative flex aspect-square items-center justify-center", p.bg)}>
                <p.icon className={cn("h-10 w-10", p.iconColor)} strokeWidth={1.8} />
                {p.diskon && (
                  <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">{p.diskon}</span>
                )}
              </div>
              <div className="p-2.5">
                <div className="mb-1 line-clamp-2 min-h-[32px] text-[11.5px] font-bold leading-snug text-slate-900">{p.name}</div>
                <div className="text-[13px] font-black text-blue-700">{p.price}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONI */}
      <section id="testimoni" className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-[1280px] rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 px-6 py-14 shadow-[0_24px_60px_rgba(15,23,42,0.3)] backdrop-blur-xl md:px-11">
          <div className="mb-11 text-center">
            <span className="mb-3.5 inline-block rounded-full bg-blue-500/20 px-4 py-1.5 text-xs font-bold text-blue-300">TESTIMONI</span>
            <h2 className="text-[26px] font-black tracking-tight text-white md:text-[32px]">Kata Mereka yang Sudah Merasakan</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONI.map((t) => (
              <div key={t.name} className="rounded-[22px] border border-white/10 bg-white/[0.06] p-6">
                <div className="mb-3.5 flex gap-0.5 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mb-5 text-[13.5px] leading-relaxed text-slate-300">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full", t.avatarBg)}>
                    <t.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white">{t.name}</div>
                    <div className="text-[11.5px] text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 pt-2 md:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 to-indigo-600 px-8 py-14 text-center shadow-[0_24px_60px_rgba(37,99,235,0.35)] md:px-14">
          <div className="absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-20 h-[240px] w-[240px] rounded-full bg-white/[0.07]" />
          <h2 className="relative mb-3.5 text-[26px] font-black tracking-tight text-white md:text-[34px]">Siap Bawa Koperasimu Naik Kelas?</h2>
          <p className="relative mb-7 text-[15px] text-white/90">Gratis untuk anggota koperasi. Modal cair lebih cepat, produk terjual lebih adil.</p>
          <div className="relative flex flex-wrap justify-center gap-3.5">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-[14.5px] font-bold text-blue-700">
              <Wheat className="h-4 w-4" /> Daftar Sebagai Anggota
            </Link>
            <Link
              href="/pembeli"
              className="inline-flex items-center gap-2 rounded-2xl border-[1.5px] border-white/40 bg-white/15 px-7 py-4 text-[14.5px] font-bold text-white"
            >
              <ShoppingCart className="h-4 w-4" /> Jadi Pembeli Kota
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/80 bg-white/55 px-6 pb-7 pt-14 backdrop-blur-md md:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
            <div className="col-span-2">
              <div className="mb-3.5 flex items-center gap-2.5">
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-800 to-blue-500">
                  <Wheat className="h-4 w-4 text-white" />
                </div>
                <span className="text-[19px] font-black text-blue-700">REKA</span>
              </div>
              <p className="max-w-[260px] text-[12.5px] leading-relaxed text-slate-500">
                Super-app ekosistem koperasi desa: simpan pinjam digital, marketplace desa-kota, dan intelligence engine dalam satu platform.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold uppercase text-slate-900">Produk</div>
              <div className="flex flex-col gap-2.5 text-[13px] text-slate-500">
                <a href="#fitur">Simpan Pinjam</a>
                <Link href="/pembeli">Marketplace</Link>
                <a href="#fitur">Intelligence Engine</a>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold uppercase text-slate-900">Untuk Siapa</div>
              <div className="flex flex-col gap-2.5 text-[13px] text-slate-500">
                <Link href="/register">Anggota Koperasi</Link>
                <Link href="/pembeli">Pembeli Kota</Link>
                <Link href="/login">Pengurus Koperasi</Link>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold uppercase text-slate-900">Bantuan</div>
              <div className="flex flex-col gap-2.5 text-[13px] text-slate-500">
                <span>Tentang REKA</span>
                <span>FAQ</span>
                <span>Hubungi Kami</span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-900/10 pt-5 text-center text-xs text-slate-400">
            © 2026 REKA — Rekat Ekonomi Kampung &amp; Anggota. Prototype demo untuk Hackathon Kementerian Koperasi RI.
          </div>
        </div>
      </footer>
    </div>
  );
}
