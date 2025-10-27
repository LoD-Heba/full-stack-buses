"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bus, MapPin, Clock, Shield, Star, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import NoticiasSection from "./noticias/page";

export default function Home() {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const API_URL = "http://localhost:3001/api/v1/city";

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
      console.error("Error al cargar ciudades");
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
    <div className="flex-row ">
      <section className="relative py-40 mx-auto">
        <div className="inset-0 bg-black/50 z-10 ">
          <Image
            src="/buses.webp"
            alt="Buses"
            fill
            className="object-cover z-0 opacity-185 absolute"
            priority
          />
          <div className="relative z-20 flex flex-col items-start justify-center h-full px-10 text-white">
            <h1 className="text-5xl font-bold mb-4">
              Bienvenido a Trans Sacaba
            </h1>
            <p className="text-xl mb-8 text-gray-100 font-semibold text-shadow-lg ">
              Conectando los 9 departamentos de Bolivia con seguridad, comodidad
              y puntualidad. Tu viaje comienza aquí.
            </p>
            <div className="flex flex-wrap gap-4">
              
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
                <Bus className="w-12 h-12 mx-auto mb-4 text-verde-500" />
                <h3 className="font-semibold text-lg mb-2">Flota Moderna</h3>
                <p className="text-sm text-gray-600">Buses nuevos y cómodos</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 mx-auto mb-4 text-verde-500" />
                <h3 className="font-semibold text-lg mb-2">Viaje Seguro</h3>
                <p className="text-sm text-gray-600">
                  Conductores certificados
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="w-12 h-12 mx-auto mb-4 text-verde-500" />
                <h3 className="font-semibold text-lg mb-2">Puntualidad</h3>
                <p className="text-sm text-gray-600">Salidas a tiempo</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Star className="w-12 h-12 mx-auto mb-4 text-verde-500" />
                <h3 className="font-semibold text-lg mb-2">Mejor Servicio</h3>
                <p className="text-sm text-gray-600">Atención de calidad</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Nuestros Destinos
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Explora nuestros destinos principales en toda Bolivia
          </p>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando destinos...</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ciudades.map((ciudad) => (
              <div
                key={ciudad.id}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-96"
              >
                {/* Imagen de fondo */}
                <div className="absolute inset-0">
                  {ciudad.image_url ? (
                    <Image
                      src={`http://localhost:3001${ciudad.image_url}`}
                      alt={ciudad.city}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      priority
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-verde-400 to-verde-600">
                      <MapPin size={80} className="text-white opacity-30" />
                    </div>
                  )}
                </div>

                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 group-hover:opacity-95 transition-opacity duration-300"></div>

                {/* Contenido */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                  {/* Descripción - aparece en hover */}
                  {ciudad.description && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <p className="text-sm text-gray-200 line-clamp-3">
                        {ciudad.description}
                      </p>
                    </div>
                  )}

                  {/* Título y departamento - siempre visible */}
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{ciudad.city}</h3>
                    <p className="text-sm opacity-80 flex items-center gap-1">
                      <MapPin size={16} />
                      {ciudad.department}
                    </p>
                  </div>

                  {/* Botones - aparecen en hover */}
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <button
                      onClick={(e) => handleViewSchedule(ciudad, e)}
                      className="flex-1 border-2 border-white text-white hover:bg-white hover:text-gray-900 py-2 px-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      Horarios
                    </button>
                    <Link href="/salidas" className="flex-1">
                      <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4" />
                        Comprar
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
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

      <section
        className="py-16 bg-opacity-30 bg-green-300"
        style={{
          backgroundImage: ` linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
      url('/img/img8.avif')
    `,
          backgroundSize: "cover",
          backgroundPosition: " center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4 opacity-100">
          <NoticiasSection></NoticiasSection>
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
            <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
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
                <Clock size={24} className="text-green-600" />
                Horarios de Salida
              </h3>

              {selectedCity.schedule && selectedCity.schedule.length > 0 ? (
                <div className="space-y-3">
                  {selectedCity.schedule.map((horario, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-orange-50 border-l-4 border-green-500 rounded-r-lg hover:bg-orange-100 transition"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
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
                  <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition">
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