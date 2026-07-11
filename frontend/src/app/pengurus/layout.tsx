"use client";

import { RoleShell } from "@/components/role-shell";
import {
  LayoutDashboard,
  UserCheck,
  HandCoins,
  Store,
  FileBarChart,
  ClipboardCheck,
  UserCog,
  MapPinned,
  ShieldCheck,
  PackageSearch,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/pengurus/dashboard", icon: LayoutDashboard },
  { label: "Verifikasi Anggota", href: "/pengurus/verifikasi-anggota", icon: UserCheck },
  { label: "Pinjaman", href: "/pengurus/pinjaman", icon: HandCoins },
  { label: "Marketplace (Bundling & Expiry)", href: "/pengurus/marketplace", icon: Store },
  { label: "QC / Grading", href: "/pengurus/qc-grading", icon: ClipboardCheck },
  { label: "Ajudan Digital", href: "/pengurus/ajudan-digital", icon: UserCog },
  { label: "Permintaan Buyer", href: "/pengurus/permintaan-buyer", icon: PackageSearch },
  { label: "Village Potential Mapping", href: "/pengurus/village-potential", icon: MapPinned },
  { label: "Audit Trail", href: "/pengurus/audit-trail", icon: ShieldCheck },
  { label: "Laporan", href: "/pengurus/laporan", icon: FileBarChart },
];

export default function PengurusLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell roleLabel="Pengurus Koperasi" navItems={navItems}>
      {children}
    </RoleShell>
  );
}
