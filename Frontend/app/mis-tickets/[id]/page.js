"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Bus,
  Armchair,
  User,
  CreditCard,
  AlertCircle,
  Loader2,
  Download,
  XCircle
} from 'lucide-react';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetail();
    }
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/v1/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el ticket');
      }

      const data = await response.json();
      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Error al cargar el detalle del ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar este ticket?')) {
      return;
    }

    setCancelling(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:3001/api/v1/tickets/${ticketId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cancelar el ticket');
      }

      alert('Ticket cancelado exitosamente');
      fetchTicketDetail(); // Recargar datos
    } catch (err) {
      console.error('Error cancelling ticket:', err);
      alert('Error al cancelar el ticket');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      CONFIRMED: { color: 'bg-green-100 text-green-800', label: 'Confirmado' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };

    const badge = badges[status] || badges.PENDING;

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalle del ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Ticket no encontrado'}</p>
          <button
            onClick={() => router.push('/mis-tickets')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a mis tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/mis-tickets')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a mis tickets
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Detalle del Ticket</h1>
                <p className="text-gray-600">Código: {ticket.code}</p>
              </div>
              {getStatusBadge(ticket.status)}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del viaje */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Información del Viaje
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Ruta</p>
                <p className="text-xl font-bold text-gray-800">
                  {ticket.trip?.route?.originCity?.name || 'Origen'} → {ticket.trip?.route?.destinationCity?.name || 'Destino'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha y hora de salida</p>
                <p className="font-medium">
                  {ticket.trip?.departure_time 
                    ? new Date(ticket.trip.departure_time).toLocaleString('es-ES', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })
                    : 'No disponible'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha y hora de llegada</p>
                <p className="font-medium">
                  {ticket.trip?.arrival_time 
                    ? new Date(ticket.trip.arrival_time).toLocaleString('es-ES', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })
                    : 'No disponible'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Duración estimada</p>
                <p className="font-medium">
                  {ticket.trip?.route?.duration ? `${ticket.trip.route.duration} horas` : 'No disponible'}
                </p>
              </div>
            </div>
          </div>

          {/* Información del bus y asiento */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600" />
              Bus y Asiento
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Bus</p>
                <p className="font-medium">
                  {ticket.trip?.bus?.plate || 'N/A'} - {ticket.trip?.bus?.model || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Tipo de servicio</p>
                <p className="font-medium capitalize">
                  {ticket.trip?.bus?.service_type?.replace('_', ' ') || 'Normal'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Número de asiento</p>
                <div className="flex items-center gap-2 mt-1">
                  <Armchair className="w-6 h-6 text-blue-600" />
                  <p className="text-3xl font-bold text-blue-600">
                    {ticket.seat?.seat_code || `#${ticket.seat?.seat_number}` || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Tipo de asiento</p>
                <p className="font-medium capitalize">
                  {ticket.seat?.type?.replace('_', ' ') || 'Normal'}
                </p>
              </div>
            </div>
          </div>

          {/* Información del pasajero */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información del Pasajero
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nombre completo</p>
                <p className="font-medium">
                  {ticket.user?.profile 
                    ? `${ticket.user.profile.firstName} ${ticket.user.profile.lastName}`
                    : ticket.user?.name || 'No disponible'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{ticket.user?.email || 'No disponible'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">
                  {ticket.user?.profile?.phone || ticket.user?.phone || 'No disponible'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Documento</p>
                <p className="font-medium">
                  {ticket.user?.profile?.documentNumber || 'No disponible'}
                </p>
              </div>
            </div>
          </div>

          {/* Información de pago */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Información de Pago
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Precio del ticket</p>
                <p className="text-3xl font-bold text-green-600">
                  Bs. {parseFloat(ticket.price).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha de reserva</p>
                <p className="font-medium">
                  {new Date(ticket.booking_date).toLocaleString('es-ES')}
                </p>
              </div>

              {ticket.payment && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Método de pago</p>
                    <p className="font-medium capitalize">
                      {ticket.payment.payment_method?.replace('_', ' ') || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Estado del pago</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      ticket.payment.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ticket.payment.status}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {ticket.status === 'CONFIRMED' && (
              <button
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar ticket PDF
              </button>
            )}

            {(ticket.status === 'PENDING' || ticket.status === 'CONFIRMED') && (
              <button
                onClick={handleCancelTicket}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Cancelar ticket
                  </>
                )}
              </button>
            )}
          </div>

          {ticket.status === 'PENDING' && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Tu ticket está pendiente de confirmación de pago
            </p>
          )}
        </div>
      </div>
    </div>
  );
}