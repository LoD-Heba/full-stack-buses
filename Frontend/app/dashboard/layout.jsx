'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/src/components/DashboardSidebar';

export default function DashboardLayout({ children }) {
  // const { data: session, status } = useSession();
  const router = useRouter();

  // useEffect(() => {
  //   if (status === 'loading') return;

  //   if (!session) {
  //     router.push('/login');
  //     return;
  //   }

  //   if (session.user.role !== 'admin') {
  //     router.push('/');
  //   }
  // }, [session, status, router]);

  if (!'loading') { //MODIFICAR
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // if (!session || session.user.role !== 'admin') {
  //   return null;
  // }

  return (
    <div className="flex bg-green-50">
      <DashboardSidebar />
      <main className="flex-1">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
