'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useSession, signOut } from 'next-auth/react';
import { Bus, Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const pathname = usePathname();
  // const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/salidas', label: 'Salidas Hoy' },
    { href: '/rutas', label: 'Rutas' },
    { href: '/ciudades', label: 'Ciudades' },
    { href: '/reglas', label: 'Reglas' },
    { href: '/comprar', label: 'Comprar Pasaje' },
  ];

  const isActive = (path) => pathname === path;

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Bus className="w-8 h-8 text-orange-400" />
            <div className="flex flex-col">
              <span className="font-bold text-xl">Trans Sacaba</span>
              <span className="text-xs text-orange-400">Viajamos por Bolivia</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}

            (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith('/dashboard')
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-slate-700'
                }`}
              >
                Dashboard
              </Link>
            )
          </div>

          <div className="hidden md:flex items-center space-x-3">
            (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4" />
                  <span></span>
                </div>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Salir
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                >
                  <User className="w-4 h-4 mr-1" />
                  Iniciar Sesión
                </Button>
              </Link>
            )
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-slate-700"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.startsWith('/dashboard')
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  Dashboard
                </Link>
              

              <div className="pt-4 border-t border-slate-700">
                {{session: true} ? ( //MODIFICAR SEGUN LA CONEXION
                  <div className="space-y-2">
                    <div className="px-4 py-2 text-sm flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span></span>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-orange-400 hover:bg-slate-700 rounded-md flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Salir</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-orange-400 hover:bg-slate-700 rounded-md"
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
