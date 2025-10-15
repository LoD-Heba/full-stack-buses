"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bus, Menu, X } from "lucide-react";
import { useState } from "react";
import UserMenu from "../../components/UserMenu";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const excludedPaths = ["/dashboard", "/auth/login", "/auth/register"];
  if (excludedPaths.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  const navLinks = [
    { href: "/salidas", label: "Salidas Hoy" },
    { href: "/rutas", label: "Rutas" },
    { href: "/ciudades", label: "Ciudades" },
    { href: "/reglas", label: "Reglas" },
    { href: "/comprar", label: "Comprar Pasaje" },
  ];
  const isActive = (path) => pathname === path;

  return (
    <nav className=" sticky top-0 z-50 bg-verde-300 ">
      <div className="flex container justify-around px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity m-4"
          >
            <Bus className="w-8 h-8 " />
            <div className="flex flex-col">
              <span className="font-bold text-stone-100 hover:text-green-100">
                Trans Sacaba
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-orange-500 text-white"
                    : "hover:bg-green-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <UserMenu />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-slate-700 z-50" 
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
