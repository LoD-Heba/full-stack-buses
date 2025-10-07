"use client";

import "./globals.css";
import { Inter } from "next/font/google";
// import { SessionProvider } from 'next-auth/react';
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //const pathname = usePathname();
  //const isDashboard = pathname?.startsWith("/dashboard");
  // const isLogin = pathname === '/login';

  return (
    <html lang="es">
      <head>
        <title>Trans Sacaba - Transporte Interdepartamental Bolivia</title>
        <meta
          name="description"
          content="Viajamos por los 9 departamentos de Bolivia con seguridad y comodidad"
        />
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {/* {!isDashboard && !isLogin && <Navbar />} */}
          <Navbar></Navbar>
          <main className="flex-1">{children}</main>
          {/* {!isDashboard && !isLogin && <Footer />} */}
          <Footer></Footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
