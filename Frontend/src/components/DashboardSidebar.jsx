"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/dashboard", label: "Panel Principal"},
  { href: "/dashboard/usuarios", label: "Usuarios"},
  { href: "/dashboard/roles", label: "Roles"},
  { href: "/dashboard/rutas", label: "Rutas"},
  { href: "/dashboard/ciudades", label: "Ciudades"},
  { href: "/dashboard/tickets", label: "Tickeds"},
  { href: "/dashboard/buses", label: "Buses"},
  { href: "/dashboard/stack-asientos", label: "Stack Asientos"},
  { href: "/dashboard/asientos", label: "Asientos"},
  { href: "/dashboard/clientes", label: "Clientes"},
  { href: "/dashboard/viajes", label: "Viajes" },
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
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive ? "bg-orange-500" : " hover:bg-slate-800"
              }`}
            >
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
