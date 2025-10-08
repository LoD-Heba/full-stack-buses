"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Ticket, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Bus,
  Armchair,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'cancelled'

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token || !user.id) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/v1/tickets/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los tickets');
      }

      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Error al cargar tus tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pendiente', icon: Clock },
      CONFIRMED: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Confirmado', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelado', icon: XCircle }
    };

    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status.toLowerCase() === filter;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'PENDING').length,
    confirmed: tickets.filter(t => t.status === 'CONFIRMED').length,
    cancelled: tickets.filter(t => t.status === 'CANCELLED').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tus tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/comprar')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buscar viajes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Tickets</h1>
          <p className="text-gray-600">Gestiona tus reservas y viajes</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div 
            onClick={() => setFilter('all')}
            className={`bg-white p-6 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl ${filter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Ticket className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div 
            onClick={() => setFilter('pending')}
            className={`bg-white p-6 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl ${filter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div 
            onClick={() => setFilter('confirmed')}
            className={`bg-white p-6 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl ${filter === 'confirmed' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmados</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div 
            onClick={() => setFilter('cancelled')}
            className={`bg-white p-6 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl ${filter === 'cancelled' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cancelados</p>
                <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Lista de tickets */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Ticket className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tienes tickets {filter !== 'all' ? `${filter}s` : ''}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Comienza a reservar tus viajes ahora'
                : 'No hay tickets con este estado'}
            </p>
            <button
              onClick={() => router.push('/comprar')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar viajes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Header del ticket */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Ticket #{ticket.code}</span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span>{ticket.trip?.route?.originCity?.name || 'Origen'}</span>
                    <span className="text-lg">→</span>
                    <span>{ticket.trip?.route?.destinationCity?.name || 'Destino'}</span>
                  </div>
                </div>

                {/* Contenido del ticket */}
                <div className="p-6 space-y-4">
                  {/* Información del viaje */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Fecha y hora de salida</p>
                        <p className="font-medium">
                          {ticket.trip?.departure_time 
                            ? new Date(ticket.trip.departure_time).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Bus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Bus</p>
                        <p className="font-medium">
                          {ticket.trip?.bus?.plate || 'N/A'} - {ticket.trip?.bus?.model || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Armchair className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Asiento</p>
                        <p className="font-medium text-lg">
                          {ticket.seat?.seat_code || `#${ticket.seat?.seat_number}` || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Precio</span>
                      <span className="text-2xl font-bold text-green-600 flex items-center">
                        <DollarSign className="w-6 h-6" />
                        {parseFloat(ticket.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => router.push(`/mis-tickets/${ticket.ticket_id}`)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Ver detalles
                    </button>

                    {ticket.status === 'CONFIRMED' && (
                      <button
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón para buscar más viajes */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/comprar')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Buscar más viajes
          </button>
        </div>
      </div>
    </div>
  );
}
