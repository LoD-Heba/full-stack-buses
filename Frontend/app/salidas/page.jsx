"use client"
import { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowRight, X } from 'lucide-react';

export default function SalidasPage() {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const API_URL = 'http://localhost:3001/api/v1/city';

  const today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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

  const handleCityClick = (ciudad) => {
    setSelectedCity(ciudad);
    setShowScheduleModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Destinos Disponibles</h1>
          <p className="text-gray-600 capitalize">{today}</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando destinos...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ciudades.map((ciudad) => (
            <div
              key={ciudad.id}
              onClick={() => handleCityClick(ciudad)}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="relative h-56 bg-gradient-to-br from-orange-400 to-orange-600">
                {ciudad.image_url ? (
                  <img
                    src={`http://localhost:3001/api/v1/${ciudad.image_url}`}
                    alt={ciudad.city}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <MapPin size={72} className="text-white opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-2xl font-bold mb-1">{ciudad.city}</h3>
                  <p className="text-sm opacity-90">{ciudad.department}</p>
                </div>
              </div>

              <div className="p-5">
                {ciudad.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {ciudad.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock size={18} />
                    <span className="text-sm font-medium">
                      {ciudad.schedule?.length || 0} horarios
                    </span>
                  </div>
                  <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm">
                    Ver horarios
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && ciudades.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No hay destinos disponibles</p>
          </div>
        )}
      </div>

      {showScheduleModal && selectedCity && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
              {selectedCity.image_url ? (
                <img
                  src={`http://localhost:3001${selectedCity.image_url}`}
                  alt={selectedCity.city}
                  className="w-full h-full object-cover"
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
                <X size={24} className="text-white" />
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

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}