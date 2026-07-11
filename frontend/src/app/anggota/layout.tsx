"use client";

import { RoleShell } from "@/components/role-shell";
import { LayoutDashboard, Wallet, Store, PackageCheck, User } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/anggota/dashboard", icon: LayoutDashboard },
  { label: "Simpan Pinjam", href: "/anggota/simpan-pinjam", icon: Wallet },
  { label: "Toko Saya", href: "/anggota/marketplace", icon: Store },
  { label: "Order Masuk", href: "/anggota/marketplace/order-masuk", icon: PackageCheck },
  { label: "Profil", href: "/anggota/profil", icon: User },
];

export default function AnggotaLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell roleLabel="Anggota Koperasi" navItems={navItems}>
      {children}
    </RoleShell>
  );
}
