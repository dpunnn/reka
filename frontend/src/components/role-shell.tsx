"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { NotificationBell } from "@/components/notification-bell";
import { PageBlobBackground } from "@/components/page-blob-background";
import { cn } from "@/lib/utils";
import { LogOut, Wheat, Menu, X, type LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function RoleShell({
  roleLabel,
  navItems,
  children,
}: {
  roleLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-[#EAF1FF] via-[#F1F4FF] to-[#EAF6FF]">
      <PageBlobBackground className="fixed" />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass-sidebar fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col p-5 transition-transform duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:max-w-none md:translate-x-0 md:rounded-r-[26px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="icon-chip h-10 w-10 rounded-[13px] bg-gradient-to-br from-blue-500 to-indigo-600">
              <Wheat className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[17px] font-black leading-none tracking-tight text-white">REKA</p>
              <p className="mt-1 text-[11px] font-medium leading-none text-blue-200/70">{roleLabel}</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute -left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-white/90" />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110",
                    active ? "text-white" : "text-blue-300"
                  )}
                  strokeWidth={2.2}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-red-500/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.2} />
          Keluar
        </button>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="glass-pill sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 md:justify-end md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-lg p-2 text-slate-600 hover:bg-white/60 md:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-bold text-slate-700">{roleLabel}</span>
          </button>
          <NotificationBell />
        </div>
        <div key={pathname} className="animate-rise p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
