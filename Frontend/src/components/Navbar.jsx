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
    { href: "/", label: "Inicio" },
    { href: "/salidas", label: "Salidas Hoy" },
    { href: "/rutas", label: "Rutas" },
    { href: "/ciudades", label: "Ciudades" },
    { href: "/reglas", label: "Reglas" },
    { href: "/comprar", label: "Comprar Pasaje" },
  ];

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-black shadow-lg sticky top-0 z-50 ">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Bus className="w-8 h-8 text-orange-400" />
            <div className="flex flex-col">
              <span className="font-bold text-xl ">Trans Sacaba</span>
              <span className="text-xs text-orange-400">
                Viajamos por Bolivia
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
                    : "hover:bg-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname?.startsWith("/dashboard")
                  ? "bg-orange-500 text-white"
                  : "hover:bg-slate-700"
              }`}
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center">
            <UserMenu />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-slate-700"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-orange-500 text-white"
                      : "hover:bg-slate-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith("/dashboard")
                    ? "bg-orange-500 text-white"
                    : "hover:bg-slate-700"
                }`}
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
