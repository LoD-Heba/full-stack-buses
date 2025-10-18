// app/components/TicketQRDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';

interface Ticket {
  ticket_id: string;
  code: string;
  price: number;
  status: string;
  booking_date: string;
  trip: {
    id: string;
    departure_time: string;
    arrival_time: string;
    route: {
      originCity: { name: string };
      destinationCity: { name: string };
    };
  };
  seat: {
    seat_code: string;
  };
  userProfile: {
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
}

interface TicketWithQR {
  ticket: Ticket;
  qrCode: string;
  ticketUrl: string;
  isValid: boolean;
}

export default function TicketQRDisplay({ ticketId }: { ticketId: string }) {
  const [data, setData] = useState<TicketWithQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/qr`);
        if (!res.ok) throw new Error('No se pudo cargar el ticket');
        const ticketData = await res.json();
        setData(ticketData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleDownload = () => {
    if (!data?.qrCode) return;
    
    const link = document.createElement('a');
    link.href = data.qrCode;
    link.download = `Ticket-${data.ticket.code}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Cargando ticket...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">Error: {error}</div>;
  }

  if (!data) {
    return <div className="text-center p-4">No hay datos del ticket</div>;
  }

  const { ticket, qrCode, isValid } = data;
  const departure = new Date(ticket.trip.departure_time);
  const arrival = new Date(ticket.trip.arrival_time);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg print:shadow-none">
      {/* Header */}
      <div className="border-b-2 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-blue-600">TICKET DE VIAJE</h1>
        <p className="text-gray-600">Código: {ticket.code}</p>
        <div className={`mt-2 inline-block px-3 py-1 rounded-full text-white ${
          isValid ? 'bg-green-500' : 'bg-yellow-500'
        }`}>
          {ticket.status}
        </div>
      </div>

      {/* Información del viaje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <h3 className="text-gray-600 text-sm uppercase font-semibold">Origen</h3>
          <p className="text-xl font-bold">{ticket.trip.route.originCity.name}</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="text-3xl text-gray-400">→</div>
        </div>
        <div>
          <h3 className="text-gray-600 text-sm uppercase font-semibold">Destino</h3>
          <p className="text-xl font-bold">{ticket.trip.route.destinationCity.name}</p>
        </div>
      </div>

      {/* Fechas y horas */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
        <div>
          <p className="text-gray-600 text-sm">Salida</p>
          <p className="text-lg font-semibold">{departure.toLocaleDateString('es-BO')}</p>
          <p className="text-lg font-semibold text-blue-600">{departure.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Llegada</p>
          <p className="text-lg font-semibold">{arrival.toLocaleDateString('es-BO')}</p>
          <p className="text-lg font-semibold text-blue-600">{arrival.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Información del pasajero */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded">
        <div>
          <p className="text-gray-600 text-sm">Pasajero</p>
          <p className="text-lg font-semibold">{ticket.userProfile.firstName} {ticket.userProfile.lastName}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Documento</p>
          <p className="text-lg font-semibold">{ticket.userProfile.documentNumber}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Asiento</p>
          <p className="text-2xl font-bold text-green-600">{ticket.seat.seat_code}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Precio</p>
          <p className="text-2xl font-bold text-green-600">Bs. {parseFloat(String(ticket.price)).toFixed(2)}</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center justify-center mb-6 p-6 bg-gray-50 rounded">
        <p className="text-gray-600 text-sm mb-4 uppercase font-semibold">Escanea para validar</p>
        <img src={qrCode} alt="Código QR del ticket" className="w-64 h-64 border-4 border-blue-600" />
      </div>

      {/* Información adicional */}
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-6">
        <p className="text-sm text-gray-700">
          <strong>Importante:</strong> Presenta este ticket en el momento del viaje. Guarda este QR para poder validarlo.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 justify-center print:hidden">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Download size={20} />
          Descargar
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          <Printer size={20} />
          Imprimir
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
        <p>Generado: {new Date(ticket.booking_date).toLocaleString('es-BO')}</p>
        <p>Este ticket es válido solo para el viaje especificado</p>
      </div>
    </div>
  );
}