import { type LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="glass-card relative flex flex-col items-center justify-center gap-3 overflow-hidden !rounded-2xl px-6 py-14 text-center">
      <div className="glow-corner -top-8 left-1/2 -translate-x-1/2 bg-blue-300/30" />
      <div className="icon-chip relative h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 !shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_12px_rgba(30,58,138,0.08)]">
        <Icon className="h-6 w-6 text-slate-400" strokeWidth={2} />
      </div>
      <p className="relative text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
