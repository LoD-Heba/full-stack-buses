"use client";

import Link from "next/link";
import { Bus, MapPin, Clock, Shield, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import departamentos from "@/src/data/departamentos.json";
import noticias from "@/src/data/noticias.json";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20">
        <Image
          src="/buses.webp"
          alt="Buses"
          fill
          className="object-cover z-0 opacity-60"
          priority
        />

        <div className=" inset-0 bg-black/50 z-10">
          <div className="relative z-20 flex flex-col items-start justify-center h-full px-10 text-white ">
            <h1 className="text-5xl font-bold mb-4 ">
              Bienvenido a Trans Sacaba
            </h1>
            <p className="text-xl mb-8 text-gray-200 text-shadow-sm">
              Conectando los 9 departamentos de Bolivia con seguridad, comodidad
              y puntualidad. Tu viaje comienza aquí.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/comprar">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Bus className="w-5 h-5 mr-2" />
                  Comprar Pasaje
                </Button>
              </Link>
              <Link href="/salidas">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-slate-950 hover:bg-white hover:text-slate-800"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Ver Salidas Hoy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Bus className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold text-lg mb-2">Flota Moderna</h3>
                <p className="text-sm text-gray-600">Buses nuevos y cómodos</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold text-lg mb-2">Viaje Seguro</h3>
                <p className="text-sm text-gray-600">
                  Conductores certificados
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold text-lg mb-2">Puntualidad</h3>
                <p className="text-sm text-gray-600">Salidas a tiempo</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Star className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold text-lg mb-2">Mejor Servicio</h3>
                <p className="text-sm text-gray-600">Atención de calidad</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nuestros Destinos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {departamentos.map((depto) => (
              <Card
                key={depto.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${depto.imagen})` }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="text-xl font-bold">{depto.nombre}</h3>
                      <p className="text-sm">{depto.descripcion}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link href="/rutas">
                    <Button variant="outline" className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver Rutas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Noticias Recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {noticias.map((noticia) => (
              <Card
                key={noticia.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${noticia.imagen})` }}
                ></div>
                <CardHeader>
                  <CardTitle className="text-lg">{noticia.titulo}</CardTitle>
                  <CardDescription className="text-xs">
                    {noticia.fecha}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {noticia.contenido}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
