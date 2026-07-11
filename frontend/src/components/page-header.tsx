import { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  blue: "from-blue-500 to-indigo-600",
  green: "from-emerald-500 to-green-600",
  indigo: "from-indigo-500 to-violet-600",
  amber: "from-amber-500 to-orange-600",
  red: "from-rose-500 to-red-600",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
  tone = "blue",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof TONE;
}) {
  const chip = TONE[tone] ?? TONE.blue;
  return (
    <div className="mb-1 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className={cn("icon-chip mt-0.5 h-12 w-12 rounded-2xl bg-gradient-to-br", chip)}>
            <Icon className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
        )}
        <div>
          {eyebrow && (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700 shadow-[0_2px_8px_rgba(30,58,138,0.08)] ring-1 ring-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              {eyebrow}
            </span>
          )}
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-xl text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
