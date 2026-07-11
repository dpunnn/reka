"use client";

import { RoleShell } from "@/components/role-shell";
import { Map, MapPinned, ShieldCheck } from "lucide-react";

const navItems = [
  { label: "Dashboard Wilayah", href: "/pemkab/dashboard", icon: Map },
  { label: "Village Potential Mapping", href: "/pemkab/village-potential", icon: MapPinned },
  { label: "Audit Trail", href: "/pemkab/audit-trail", icon: ShieldCheck },
];

export default function PemkabLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell roleLabel="Dinas Koperasi Kabupaten" navItems={navItems}>
      {children}
    </RoleShell>
  );
}
