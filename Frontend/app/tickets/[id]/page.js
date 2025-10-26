'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  MapPin,
  Calendar,
  Bus,
  Armchair,
  CreditCard,
  Ticket as TicketIcon,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  QrCode,
  Loader,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { ShareTicketModal } from '@/components/ShareTicketModal';

const BASE_URL = 'http://localhost:3001/api/v1';

const STATUS_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMADO: 'bg-green-100 text-green-800 border-green-300',
  CANCELADO: 'bg-red-100 text-red-800 border-red-300',
};

export default function PublicTicketPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;

  const [ticket, setTicket] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentSuccess = searchParams.get('payment') === 'success';

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || id === 'undefined') {
          throw new Error('ID de ticket inválido');
        }

        // Obtener ticket
        const ticketRes = await fetch(`${BASE_URL}/tickets/${id}`, {
          cache: 'no-store',
        });

        if (!ticketRes.ok) {
          throw new Error('Ticket no encontrado');
        }

        const ticketData = await ticketRes.json();
        setTicket(ticketData);

        // Obtener QR si está confirmado
        if (ticketData.status === 'CONFIRMADO') {
          try {
            const qrRes = await fetch(`/api/tickets/${id}/qr`);
            if (qrRes.ok) {
              const qrData = await qrRes.json();
              setQrCode(qrData.qrCode);
            }
          } catch (qrError) {
            console.error('Error al obtener QR:', qrError);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-6">{error || 'Ticket no encontrado'}</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Volver al Inicio
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto py-6 px-4 space-y-6 print:p-0">
        {/* Header */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            {/* Agregar redirección a dashboard en caso de ser admin ##### */}
            <Link href="/">
              <Button variant="outline" size="sm" className="mb-4">
                ← Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Mi Ticket</h1>
            <p className="text-gray-600">Código: {ticket.code}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadQR}
              disabled={!qrCode}
              variant="outline"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar QR
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Alerta de éxito */}
        {paymentSuccess && (
          <Alert className="bg-green-50 border-green-200 border-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              ¡Pago procesado exitosamente! Tu ticket ha sido confirmado.
            </AlertDescription>
          </Alert>
        )}

        {/* Contenedor para impresión */}
        <div id="ticket-preview" className="space-y-6">
          {/* Estado del ticket */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TicketIcon className="w-12 h-12 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Estado del Ticket</p>
                    <div
                      className={`${
                        STATUS_COLORS[ticket.status]
                      } text-lg px-4 py-1 rounded inline-block border`}
                    >
                      {ticket.status}
                    </div>
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
            <Card className="bg-blue-50 border-blue-200 border-2 shadow-md">
              <CardContent className="flex flex-col items-center py-8">
                <QrCode className="w-6 h-6 mb-4 text-blue-600" />
                <p className="text-gray-600 text-sm mb-4 uppercase font-semibold">
                  Escanea para Validar
                </p>
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
            <Card className="shadow-md">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                  <User className="w-5 h-5 text-blue-600" />
                  Pasajero
                </h3>
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{passengerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium text-gray-900">{documentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Información del Viaje */}
            <Card className="shadow-md">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Información del Viaje
                </h3>
                <div>
                  <p className="text-sm text-gray-600">Ruta</p>
                  <p className="font-medium text-lg text-gray-900">
                    {ticket.trip?.route?.originCity?.name || '?'} →{' '}
                    {ticket.trip?.route?.destinationCity?.name || '?'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Salida</p>
                  <p className="font-medium text-gray-900">
                    {ticket.trip?.departure_time
                      ? new Date(ticket.trip.departure_time).toLocaleString(
                          'es-ES'
                        )
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bus y Asiento */}
            <Card className="shadow-md">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                  <Bus className="w-5 h-5 text-purple-600" />
                  Bus y Asiento
                </h3>
                <div>
                  <p className="text-sm text-gray-600">Bus</p>
                  <p className="font-medium text-gray-900">
                    {ticket.trip?.bus?.plate || '-'} - {ticket.trip?.bus?.model || ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Asiento</p>
                    <div className="flex items-center gap-2">
                      <Armchair className="w-5 h-5 text-orange-500" />
                      <p className="text-2xl font-bold text-gray-900">
                        {ticket.seat?.seat_number || '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="font-medium text-gray-900">{ticket.seat?.seat_code || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pago */}
            <Card className="shadow-md">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  Información de Pago
                </h3>
                {ticket.payment ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Método</p>
                      <p className="font-medium text-gray-900">{ticket.payment.method || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <p className="font-medium text-gray-900">{ticket.payment.status || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monto</p>
                      <p className="font-medium text-gray-900">
                        Bs. {parseFloat(ticket.payment.amount).toFixed(2)}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Sin pago asociado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Nota */}
          <Alert className="bg-yellow-50 border-yellow-200 border-2">
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
    </div>
  );
}