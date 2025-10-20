'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function RutasPage() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRutas();
  }, []);

  const fetchRutas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/routes`);
      if (!response.ok) throw new Error('Error al cargar rutas');
      
      const data = await response.json();
      // Extraer datos del array si viene paginado
      const rutasData = Array.isArray(data) ? data : data.data || [];
      console.log('Rutas cargadas:', rutasData);
      console.log('Primera ruta:', rutasData[0]);
      setRutas(rutasData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando rutas disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Nuestras Rutas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Conectamos los principales departamentos de Bolivia con seguridad y comodidad
          </p>
        </div>

        {/* Grid de Rutas */}
        {rutas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rutas.map((ruta) => (
              <Card
                key={ruta.id}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white"
              >
                {/* Imágenes de Ciudades */}
                <div className="relative h-48 bg-gradient-to-r from-indigo-100 to-blue-100 overflow-hidden flex items-center justify-between">
                  {/* Ciudad Origen */}
                  <div className="flex-1 h-full relative overflow-hidden">
                    {ruta.originCity?.image_url ? (
                      <>
                        <img
                          src={`http://localhost:3001${ruta.originCity.image_url}`}
                          alt={ruta.originCity.city}
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) => {
                            console.error('Error cargando imagen origen:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                      </>
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-indigo-300 to-indigo-400 flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-white opacity-50" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                      </>
                    )}
                  </div>

                  {/* Separador con ícono */}
                  <div className="w-16 h-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-l border-r border-white/20">
                    <div className="flex flex-col items-center gap-1">
                      <MapPin className="w-6 h-6 text-white" />
                      <span className="text-white text-xs font-bold">→</span>
                    </div>
                  </div>

                  {/* Ciudad Destino */}
                  <div className="flex-1 h-full relative overflow-hidden">
                    {ruta.destinationCity?.image_url ? (
                      <>
                        <img
                          src={`http://localhost:3001${ruta.destinationCity.image_url}`}
                          alt={ruta.destinationCity.city}
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) => {
                            console.error('Error cargando imagen destino:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-black/30 to-transparent" />
                      </>
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-blue-300 to-blue-400 flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-white opacity-50" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-l from-black/30 to-transparent" />
                      </>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <CardContent className="p-6 space-y-4">
                  {/* Ciudades */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Desde</p>
                        <p className="font-bold text-gray-900">{ruta.originCity?.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Hacia</p>
                        <p className="font-bold text-gray-900">{ruta.destinationCity?.city}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {/* Duración */}
                    {ruta.approx_duration && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Duración</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {ruta.approx_duration}
                        </span>
                      </div>
                    )}

                    {/* Distancia */}
                    {ruta.distance_km && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm">Distancia</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {ruta.distance_km} km
                        </span>
                      </div>
                    )}

                    {/* Precio */}
                    {ruta.base_price && (
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm">Precio Base</span>
                        </div>
                        <span className="text-2xl font-bold text-orange-600">
                          Bs. {parseFloat(ruta.base_price).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Buses disponibles */}
                    {ruta.buses && ruta.buses.length > 0 && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{ruta.buses.length} bus{ruta.buses.length > 1 ? 'es' : ''} disponible{ruta.buses.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Descripción */}
                    {ruta.description && (
                      <p className="text-sm text-gray-600 italic">
                        "{ruta.description}"
                      </p>
                    )}
                  </div>

                  {/* Botón de Compra */}
                  <Link href={`/comprar?routeId=${ruta.id}`} className="block w-full pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors">
                      Comprar Pasaje
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay rutas disponibles en este momento</p>
          </div>
        )}
      </div>
    </div>
  );
}