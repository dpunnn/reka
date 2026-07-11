import { type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";

type ReactNodeValue = string | number;

/**
 * Kartu statistik liquid-glass — versi kaya: chip ikon gradient dengan sheen,
 * glow dekoratif di sudut, angka besar dengan gradient brand, dan hover-lift.
 * `tone` mengatur warna glow + chip supaya dashboard terasa "ramai" & berwarna.
 */

const TONE: Record<
  string,
  { chip: string; glow: string; value: string }
> = {
  blue: { chip: "from-blue-500 to-indigo-600", glow: "bg-blue-400/40", value: "text-slate-900" },
  green: { chip: "from-emerald-500 to-green-600", glow: "bg-emerald-400/40", value: "text-slate-900" },
  indigo: { chip: "from-indigo-500 to-violet-600", glow: "bg-indigo-400/40", value: "text-slate-900" },
  amber: { chip: "from-amber-500 to-orange-600", glow: "bg-amber-400/40", value: "text-slate-900" },
  red: { chip: "from-rose-500 to-red-600", glow: "bg-rose-400/40", value: "text-slate-900" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "blue",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNodeValue;
  hint?: string;
  tone?: keyof typeof TONE;
  /** @deprecated pakai `tone` — dipertahankan supaya call-site lama tidak error */
  iconBg?: string;
  iconColor?: string;
  className?: string;
}) {
  const t = TONE[tone] ?? TONE.blue;
  return (
    <GlassCard className={cn("card-lift group relative overflow-hidden !p-5", className)}>
      <div className={cn("glow-corner -right-6 -top-6", t.glow)} />
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "icon-chip h-12 w-12 rounded-2xl bg-gradient-to-br transition-transform group-hover:scale-105",
            t.chip
          )}
        >
          <Icon className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />
        </div>
      </div>
      <div className="relative mt-4 text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={cn("relative mt-1 text-[30px] font-black leading-tight", t.value)}>{value}</div>
      {hint && <div className="relative mt-1.5 text-xs text-slate-400">{hint}</div>}
    </GlassCard>
  );
}
