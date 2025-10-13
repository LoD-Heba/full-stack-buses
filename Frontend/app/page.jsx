"use client"
import { useState, useEffect } from 'react';
import Link from "next/link";
import { Bus, MapPin, Clock, Shield, Star, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import noticias from "@/src/data/noticias.json";
import Image from "next/image";

export default function Home() {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const API_URL = 'http://localhost:3001/api/v1/city';

  useEffect(() => {
    fetchCiudades();
  }, []);

  const fetchCiudades = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setCiudades(data);
    } catch (error) {
      console.error('Error al cargar ciudades');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchedule = (ciudad, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCity(ciudad);
    setShowScheduleModal(true);
  };

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

        <div className="inset-0 bg-black/50 z-10">
          <div className="relative z-20 flex flex-col items-start justify-center h-full px-10 text-white">
            <h1 className="text-5xl font-bold mb-4">
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
          
          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando destinos...</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ciudades.map((ciudad) => (
              <Card
                key={ciudad.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
                  {ciudad.image_url ? (
                    <Image
                      src={`http://localhost:3001${ciudad.image_url}`}
                      alt={ciudad.city}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <MapPin size={64} className="text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 text-white w-full">
                      <h3 className="text-xl font-bold">{ciudad.city}</h3>
                      <p className="text-sm opacity-90">{ciudad.department}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  {ciudad.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {ciudad.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleViewSchedule(ciudad, e)}
                      className="flex-1 border border-orange-500 text-orange-500 hover:bg-orange-50 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Clock className="w-4 h-4" />
                      Ver Horarios
                    </button>
                    <Link href="/comprar" className="flex-1">
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        size="sm"
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Comprar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && ciudades.length === 0 && (
            <div className="text-center py-12">
              <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay destinos disponibles</p>
            </div>
          )}
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

      {showScheduleModal && selectedCity && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowScheduleModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
              {selectedCity.image_url ? (
                <Image
                  src={`http://localhost:3001${selectedCity.image_url}`}
                  alt={selectedCity.city}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <MapPin size={64} className="text-white opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <button
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition"
              >
                <span className="text-white text-xl">×</span>
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <h2 className="text-3xl font-bold mb-1">{selectedCity.city}</h2>
                <p className="text-lg opacity-90">{selectedCity.department}</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-12rem)]">
              {selectedCity.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedCity.description}</p>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={24} className="text-orange-600" />
                Horarios de Salida
              </h3>

              {selectedCity.schedule && selectedCity.schedule.length > 0 ? (
                <div className="space-y-3">
                  {selectedCity.schedule.map((horario, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg hover:bg-orange-100 transition"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <Clock size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{horario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay horarios registrados</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t flex gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cerrar
                </button>
                <Link href="/comprar" className="flex-1">
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition">
                    Comprar Pasaje
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}