"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Map,
  Building2,
  ShoppingCart,
  Bus,
  Layers,
  Armchair,
  LayoutDashboard,
  ShoppingBasketIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/dashboard", label: "Panel Principal", icon: LayoutDashboard },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
  { href: "/dashboard/roles", label: "Roles", icon: Shield },
  { href: "/dashboard/rutas", label: "Rutas", icon: Map },
  { href: "/dashboard/ciudades", label: "Ciudades", icon: Building2 },
  { href: "/dashboard/tickets", label: "Tickeds", icon: ShoppingCart },
  { href: "/dashboard/buses", label: "Buses", icon: Bus },
  { href: "/dashboard/stack-asientos", label: "Stack Asientos", icon: Layers },
  { href: "/dashboard/asientos", label: "Asientos", icon: Armchair },
  { href: "/dashboard/clientes", label: "Clientes", icon: ShoppingBasketIcon },
  { href: "/dashboard/viajes", label: "Viajes", icon: TriangleAlertIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-52 bg-black min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">Dashboard</h2>
        <p className="text-xs text-gray-400">Panel de Administración</p>
        <Button
          className="mt-2 bg-green-500"
          onClick={() => {
            router.push(`/`);
          }}
        >
          Inicio
        </Button>
      </div>

      <nav className="px-3 bg-black ">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive ? "bg-orange-500" : " hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
