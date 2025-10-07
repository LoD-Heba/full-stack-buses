"use client"
import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Clock, DollarSign, User, Armchair, Calendar, ArrowRight } from 'lucide-react';

export default function TripListView() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    routeId: '',
    date: ''
  });
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchRoutes();
    fetchTrips();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/routes');
      const data = await res.json();
      setRoutes(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.routeId) params.append('routeId', filters.routeId);
      if (filters.date) params.append('date', filters.date);

      const url = `http://localhost:3001/api/v1/trips/available${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTrips();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBusTypeLabel = (type) => {
    const types = {
      normal: 'Normal',
      semi_cama: 'Semi Cama',
      cama: 'Cama'
    };
    return types[type] || type;
  };

  const getBusTypeColor = (type) => {
    const colors = {
      normal: 'bg-blue-100 text-blue-800',
      semi_cama: 'bg-purple-100 text-purple-800',
      cama: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectTrip = (tripId) => {
     window.location.href = `/comprar/asientos/${tripId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Viajes Disponibles
          </h1>
          <p className="text-gray-600">
            Selecciona tu viaje y reserva tu asiento
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Ruta
              </label>
              <select
                value={filters.routeId}
                onChange={(e) => setFilters({ ...filters, routeId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las rutas</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>
                    {route.origin} → {route.destination}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Buscar Viajes
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Viajes */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando viajes disponibles...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Bus className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay viajes disponibles
            </h3>
            <p className="text-gray-500">
              Intenta buscar con otros filtros o fechas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Imagen del Bus */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  <Bus className="h-24 w-24 text-white opacity-90" />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBusTypeColor(trip.bus.stacks?.seats?.[0]?.type || 'normal')}`}>
                      {getBusTypeLabel(trip.bus.stacks?.seats?.[0]?.type || 'normal')}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <span className="text-white text-sm font-medium">
                      {trip.bus.plate}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Ruta */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-lg font-bold text-gray-800">
                      <span>{trip.route.origin}</span>
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      <span>{trip.route.destination}</span>
                    </div>
                  </div>

                  {/* Información del viaje */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm">{formatDate(trip.departure_time)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm">Salida: {formatTime(trip.departure_time)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm">Llegada: {formatTime(trip.arrival_time)}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm">
                        {trip.bus.user?.userProfile?.first_name || 'Bus'} {trip.bus.user?.userProfile?.last_name || trip.bus.model}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Armchair className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm">
                        {trip.available_seats} asientos disponibles
                      </span>
                    </div>
                  </div>

                  {/* Precio y botón */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Precio desde</p>
                        <div className="flex items-center text-2xl font-bold text-green-600">
                          <DollarSign className="h-6 w-6" />
                          <span>{parseFloat(trip.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectTrip(trip.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                    >
                      Seleccionar Viaje
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}