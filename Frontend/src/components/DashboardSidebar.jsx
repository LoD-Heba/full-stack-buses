"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowBigLeft } from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Panel Principal" },
  { href: "/dashboard/usuarios", label: "Usuarios" },
  { href: "/dashboard/roles", label: "Roles" },
  { href: "/dashboard/rutas", label: "Rutas" },
  { href: "/dashboard/ciudades", label: "Ciudades" },
  { href: "/dashboard/tickets", label: "Tickeds" },
  { href: "/dashboard/buses", label: "Buses" },
  { href: "/dashboard/stack-asientos", label: "Stack Asientos" },
  { href: "/dashboard/asientos", label: "Asientos" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/viajes", label: "Viajes" },
  { href: "/dashboard/noticias", label: "Noticias" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-52 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">Dashboard</h2>
        <p className="text-xs text-gray-400">Panel de Administración</p>
      </div>

      <nav className="px-3 ">
        <div className="flex-col justify-between">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive ? "bg-gradient-to-br from-green-400 to-green-900" : " hover:bg-green-50"
                }`}
              >
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
          <Button className="mt-10 bg-green-950" onClick={() => router.push('/')}>
            <ArrowBigLeft />
            Salir
          </Button>
        </div>
      </nav>
    </aside>
  );
}
