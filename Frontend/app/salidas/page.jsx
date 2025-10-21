"use client";
import { useState, useEffect } from "react";
import { MapPin, Clock, ArrowRight, X, Bus, Users, Filter } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SalidasPage() {
  const router = useRouter();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [filtroDestino, setFiltroDestino] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [destinos, setDestinos] = useState([]);

  const API_URL = "http://localhost:3001/api/v1";
  const today = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Cargar viajes disponibles
  useEffect(() => {
    fetchViajes();
    fetchDestinos();
  }, []);

  const fetchDestinos = async () => {
    try {
      const res = await fetch(`${API_URL}/city`);
      const data = await res.json();
      const uniqueDestinos = [...new Set(data.map((c) => c.city))];
      setDestinos(uniqueDestinos);
    } catch (error) {
      console.error("Error al cargar destinos:", error);
    }
  };

  const fetchViajes = async () => {
    try {
      setLoading(true);
      // Obtener viajes disponibles (estado SCHEDULED)
      const res = await fetch(`${API_URL}/trips?limit=100`);
      const data = await res.json();

      // Filtrar solo viajes programados con asientos disponibles
      const viajesDisponibles = (data.data || []).filter(
        (viaje) =>
          viaje.status === "SCHEDULED" &&
          viaje.available_seats > 0 &&
          new Date(viaje.departure_time) > new Date()
      );

      setViajes(viajesDisponibles);
    } catch (error) {
      console.error("Error al cargar viajes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar viajes
  const viajesFiltrados = viajes.filter((viaje) => {
    const destino = viaje.route?.destination || "";
    const fecha = new Date(viaje.departure_time).toLocaleDateString("es-BO");
    const cumpleFecha = !filtroFecha || fecha === filtroFecha;
    const cumpleDestino =
      !filtroDestino ||
      destino.toLowerCase().includes(filtroDestino.toLowerCase());
    return cumpleFecha && cumpleDestino;
  });

  const abrirDetalles = (viaje) => {
    setSelectedTrip(viaje);
    setShowTripModal(true);
  };

  const formatearFecha = (date) => {
    return new Date(date).toLocaleDateString("es-BO", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const formatearHora = (date) => {
    return new Date(date).toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcularDuracion = (salida, llegada) => {
    const diff = new Date(llegada) - new Date(salida);
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">
            Salidas Disponibles
          </h1>
          <p className="text-gray-600 capitalize">{today}</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline w-4 h-4 mr-2" />
                Destino
              </label>
              <input
                type="text"
                placeholder="Buscar destino..."
                value={filtroDestino}
                onChange={(e) => setFiltroDestino(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setFiltroDestino("");
                setFiltroFecha("");
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <p className="text-sm text-gray-600 mb-4">
            {viajesFiltrados.length} viaje
            {viajesFiltrados.length !== 1 ? "s" : ""} disponible
            {viajesFiltrados.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-3">Cargando viajes...</p>
          </div>
        )}

        {/* Grid de viajes */}
        {!loading && viajesFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viajesFiltrados.map((viaje) => (
              <div
                key={viaje.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Header del viaje */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                      {viaje.route?.name || "Ruta"}
                    </span>
                    <span className="text-xs bg-green-400/30 text-green-900 font-bold px-2 py-1 rounded">
                      {viaje.available_seats} asientos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{viaje.route?.origin || "Origen"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <ArrowRight className="w-4 h-4" />
                    <span>{viaje.route?.destination || "Destino"}</span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  {/* Tiempos */}
                  <div className="space-y-3 mb-4 pb-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Salida
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {formatearHora(viaje.departure_time)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatearFecha(viaje.departure_time)}
                        </p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 font-medium">
                          {calcularDuracion(
                            viaje.departure_time,
                            viaje.arrival_time
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Llegada
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {formatearHora(viaje.arrival_time)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatearFecha(viaje.arrival_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información del bus */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                      <Bus className="w-4 h-4" />
                      {viaje.bus?.model || "Bus"}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Placa: {viaje.bus?.license_plate || "N/A"}
                    </p>
                  </div>

                  {/* Precio y botón */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">
                        Precio por asiento
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        Bs. {parseFloat(viaje.price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => abrirDetalles(viaje)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                    >
                      Ver más
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && viajesFiltrados.length === 0 && (
          <div className="text-center py-12">
            {viajes.length === 0 ? (
              <>
                <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  No hay viajes disponibles en este momento
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Por favor, intenta más tarde
                </p>
              </>
            ) : (
              <>
                <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  No se encontraron viajes con estos filtros
                </p>
                <button
                  onClick={() => {
                    setFiltroDestino("");
                    setFiltroFecha("");
                  }}
                  className="mt-3 text-green-600 hover:text-green-700 font-medium"
                >
                  Limpiar filtros
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showTripModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="relative h-40 bg-gradient-to-r from-green-500 to-green-600">
              <button
                onClick={() => setShowTripModal(false)}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition"
              >
                <X className="text-white w-6 h-6" />
              </button>
              <div className="h-full flex flex-col justify-end p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">
                  {selectedTrip.route?.origin} →{" "}
                  {selectedTrip.route?.destination}
                </h2>
                <p className="text-orange-100">{selectedTrip.route?.name}</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
              {/* Información de horarios */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Salida
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatearHora(selectedTrip.departure_time)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatearFecha(selectedTrip.departure_time)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Duración
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {calcularDuracion(
                      selectedTrip.departure_time,
                      selectedTrip.arrival_time
                    )}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Llegada
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatearHora(selectedTrip.arrival_time)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatearFecha(selectedTrip.arrival_time)}
                  </p>
                </div>
              </div>

              {/* Detalles del bus */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-green-600" />
                  Información del Bus
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Modelo</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTrip.bus?.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Placa</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTrip.bus?.license_plate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="bg-orange-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Asientos Disponibles
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedTrip.available_seats}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Precio</p>
                    <p className="text-3xl font-bold text-green-600">
                      Bs. {parseFloat(selectedTrip.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de compra */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTripModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Guardar el viaje seleccionado en sessionStorage
                    sessionStorage.setItem(
                      "selectedTrip",
                      JSON.stringify(selectedTrip)
                    );
                    // Redirigir a la página de registro del cliente
                    router.push(`/comprar/cliente?tripId=${selectedTrip.id}`);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Bus className="w-5 h-5" />
                  Comprar Pasaje
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
