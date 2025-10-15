"use client";

import "./globals.css";
import { Inter } from "next/font/google";
// import { SessionProvider } from 'next-auth/react';
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { clsx } from "clsx";
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
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={clsx(inter.className, "w-[90%] h-[800px] mx-auto z-0 bg-green-950")}>
        <div className="flex flex-col min-h-screen z-40">
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
