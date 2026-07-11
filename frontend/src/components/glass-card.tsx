import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

/**
 * Liquid-glass card, elemen dasar seluruh UI REKA.
 * Pola mengikuti referensi desain di D:\LOMBA\Desain web penjualan.
 */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-card rounded-2xl p-6", className)} {...props} />;
}

export function GlassPill({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-pill rounded-full px-4 py-1.5 text-sm", className)} {...props} />;
}
