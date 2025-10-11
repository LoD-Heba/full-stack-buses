
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShoppingCart, Settings } from 'lucide-react';
import { getUser, logout, isAuthenticated } from '@/lib/auth';

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
      router.refresh();
      console.log("refresh")
    }
  }, []);

  const handleLogout = () => {
    logout();
    
  };

  if (!user) {

    return (
      <div className="flex items-center gap-2 z-0">
        <button
          onClick={() => router.push('/auth/login')}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => router.push('/auth/register')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Registrarse
        </button>
      </div>
    );
  }

  return (
    <div className="relative ">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-medium text-gray-700">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email || user.phone}</p>
            <p className="text-xs text-blue-600 mt-1 capitalize">{user.role}</p>
          </div>

          <button
            onClick={() => {
              router.push('/comprar');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Mis Compras
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => {
                router.push('/dashboard');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Dashboard Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200 mt-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
