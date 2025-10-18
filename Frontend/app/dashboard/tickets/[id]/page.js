// Frontend/app/dashboard/tickets/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  MapPin,
  Calendar,
  DollarSign,
  Bus,
  Armchair,
  CreditCard,
  Ticket as TicketIcon,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { getTicket } from '../api/api-tickets';

const STATUS_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMADO: 'bg-green-100 text-green-800 border-green-300',
  CANCELADO: 'bg-red-100 text-red-800 border-red-300',
};

export default function TicketDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;

  const [ticket, setTicket] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentSuccess = searchParams.get('payment') === 'success';
  const ticketCode = searchParams.get('code');

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || id === 'undefined') {
          throw new Error('ID de ticket inválido');
        }

        // 1. Obtener ticket
        const ticketData = await getTicket(id);
        setTicket(ticketData);

        // 2. Obtener QR si el ticket está confirmado
        if (ticketData.status === 'CONFIRMADO') {
          try {
            const qrResponse = await fetch(`/api/tickets/${id}/qr`);
            if (qrResponse.ok) {
              const qrData = await qrResponse.json();
              setQrCode(qrData.qrCode);
            }
          } catch (qrError) {
            console.error('Error al obtener QR:', qrError);
            // No fallar si no se puede obtener QR
          }
        }
      } catch (err) {
        console.error('Error al cargar ticket:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTicketData();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `Ticket-${ticket?.code}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-6">{error || 'Ticket no encontrado'}</p>
            <Link href="/dashboard/tickets">
              <Button className="bg-red-600 hover:bg-red-700">
                Volver a Tickets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passengerName = ticket.userProfile
    ? `${ticket.userProfile.firstName} ${ticket.userProfile.lastName}`
    : ticket.user?.profile
    ? `${ticket.user.profile.firstName} ${ticket.user.profile.lastName}`
    : ticket.user?.email || 'No disponible';

  const documentNumber =
    ticket.userProfile?.documentNumber ||
    ticket.user?.profile?.documentNumber ||
    'No disponible';

  const phone =
    ticket.userProfile?.phone || ticket.user?.profile?.phone || 'No disponible';

  const email = ticket.user?.email || 'No disponible';

  return (
    <div className="container mx-auto py-6 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <Link href="/dashboard/tickets">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Detalle del Ticket</h1>
          <p className="text-gray-600">Código: {ticket.code}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadQR}
            disabled={!qrCode}
            variant="outline"
            className="text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar QR
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="text-gray-600 hover:text-gray-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Alerta de éxito */}
      {paymentSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            ¡Pago procesado exitosamente! Tu ticket ha sido confirmado.
          </AlertDescription>
        </Alert>
      )}

      {/* Contenedor para impresión */}
      <div id="ticket-preview" className="space-y-6">
        {/* Estado del ticket */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TicketIcon className="w-12 h-12 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Estado del Ticket</p>
                  <Badge
                    className={`${
                      STATUS_COLORS[ticket.status]
                    } text-lg px-4 py-1`}
                  >
                    {ticket.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Precio</p>
                <p className="text-3xl font-bold text-green-600">
                  Bs. {parseFloat(ticket.price).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR - Solo si está confirmado */}
        {ticket.status === 'CONFIRMADO' && qrCode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Código QR - Escanea para Validar
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <img
                src={qrCode}
                alt="Código QR del ticket"
                className="w-64 h-64 border-4 border-blue-600 rounded-lg shadow-lg"
              />
              <p className="mt-4 text-sm text-gray-600 text-center">
                Presenta este código QR al abordar el bus
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Pasajero */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Pasajero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-medium">{passengerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documento</p>
                <p className="font-medium">{documentNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Viaje */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Información del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Ruta</p>
                <p className="font-medium text-lg">
                  {ticket.trip?.route?.originCity?.name || '?'} →{' '}
                  {ticket.trip?.route?.destinationCity?.name || '?'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha y Hora de Salida</p>
                <p className="font-medium">
                  {ticket.trip?.departure_time
                    ? new Date(ticket.trip.departure_time).toLocaleString(
                        'es-ES',
                        {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        }
                      )
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duración Estimada</p>
                <p className="font-medium">
                  {ticket.trip?.route?.duration
                    ? `${ticket.trip.route.duration} horas`
                    : 'No disponible'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Bus y Asiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Bus y Asiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Bus</p>
                <p className="font-medium">
                  {ticket.trip?.bus?.plate || 'No disponible'} -{' '}
                  {ticket.trip?.bus?.model || ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Servicio</p>
                <p className="font-medium capitalize">
                  {ticket.trip?.bus?.service_type?.replace('_', ' ') ||
                    'No disponible'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Asiento</p>
                  <div className="flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-orange-500" />
                    <p className="text-2xl font-bold">
                      {ticket.seat?.seat_number || '-'}
                    </p>
                    <span className="text-sm text-gray-500">
                      ({ticket.seat?.seat_code || '-'})
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Asiento</p>
                  <p className="font-medium capitalize">
                    {ticket.seat?.type?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-medium capitalize">
                    {ticket.seat?.seat_type?.replace('_', ' ') || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.payment ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Método de Pago</p>
                    <p className="font-medium capitalize">
                      {ticket.payment.method?.replace('_', ' ') || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado del Pago</p>
                    <Badge
                      className={
                        ticket.payment.status === 'COMPLETO'
                          ? 'bg-green-100 text-green-800'
                          : ticket.payment.status === 'PENDIENTE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {ticket.payment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-medium text-lg">
                      Bs. {parseFloat(ticket.payment.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Pago</p>
                    <p className="font-medium">
                      {new Date(ticket.payment.payment_date).toLocaleString(
                        'es-ES'
                      )}
                    </p>
                  </div>
                  {ticket.payment.transaction_reference && (
                    <div>
                      <p className="text-sm text-gray-600">Referencia</p>
                      <p className="font-medium text-xs">
                        {ticket.payment.transaction_reference}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    No hay información de pago asociada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información Adicional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha de Reserva</p>
                <p className="font-medium">
                  {new Date(ticket.booking_date).toLocaleString('es-ES')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Creación</p>
                <p className="font-medium">
                  {new Date(ticket.created_at).toLocaleString('es-ES')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Última Actualización</p>
                <p className="font-medium">
                  {new Date(ticket.updated_at).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información importante */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Por favor, guarda este ticket. Lo necesitarás para abordar el bus.
            Puedes descargarlo o imprimirlo cuando lo necesites.
          </AlertDescription>
        </Alert>
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-preview,
          #ticket-preview * {
            visibility: visible;
          }
          #ticket-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}