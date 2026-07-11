import { cn } from "@/lib/utils";

/**
 * Animated gradient-blob backdrop, dipakai di landing page & auth screens.
 * Pola mengikuti referensi desain di D:\LOMBA\Desain web penjualan (index.html).
 */
export function PageBlobBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div
        className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)",
          animation: "blob-float 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-24 top-24 h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
        style={{
          background: "radial-gradient(circle, #818cf8 0%, transparent 70%)",
          animation: "blob-float 18s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-[-6rem] left-1/3 h-[26rem] w-[26rem] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)",
          animation: "blob-float 20s ease-in-out infinite",
        }}
      />
    </div>
  );
}
