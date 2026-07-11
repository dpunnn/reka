"use client";

import { RoleShell } from "@/components/role-shell";
import { Store, ShoppingBag, PackageSearch } from "lucide-react";

const navItems = [
  { label: "Beranda / Browse", href: "/pembeli", icon: Store },
  { label: "Ajukan Permintaan", href: "/pembeli/permintaan", icon: PackageSearch },
  { label: "Pesanan Saya", href: "/pembeli/pesanan", icon: ShoppingBag },
];

export default function PembeliLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell roleLabel="Pembeli Kota" navItems={navItems}>
      {children}
    </RoleShell>
  );
}
