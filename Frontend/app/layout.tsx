"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { clsx } from "clsx";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <title>Trans Sacaba - Transporte Interdepartamental Bolivia</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={clsx(
          inter.className,
          "w-[90%] h-[800px] mx-auto z-0 bg-green-950"
        )}
        style={{
          backgroundImage: `
      url('/img/iconobus.jpg')
    `,
          backgroundSize: 200,
          backgroundRepeat: "repeat",
        }}
      >
        <div className="flex flex-col min-h-screen z-40">
          {/* {!isDashboard && !isLogin && <Navbar />} */}
          <Navbar />
          <main className="flex-1">{children}</main>
          {/* {!isDashboard && !isLogin && <Footer />} */}
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
