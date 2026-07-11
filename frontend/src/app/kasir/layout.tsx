"use client";

import { RoleShell } from "@/components/role-shell";
import { LayoutDashboard, ClipboardCheck, UserCog, PackageSearch } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/kasir/dashboard", icon: LayoutDashboard },
  { label: "QC / Grading", href: "/kasir/qc-grading", icon: ClipboardCheck },
  { label: "Ajudan Digital", href: "/kasir/ajudan-digital", icon: UserCog },
  { label: "Permintaan Buyer", href: "/kasir/permintaan-buyer", icon: PackageSearch },
];

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell roleLabel="Kasir" navItems={navItems}>
      {children}
    </RoleShell>
  );
}
