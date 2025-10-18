// app/components/TicketPurchaseConfirmation.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, Download, Eye } from 'lucide-react';
import Link from 'next/link';

interface TicketPurchaseConfirmationProps {
  ticketId: string;
  ticketCode: string;
  tripInfo: {
    origin: string;
    destination: string;
    departureTime: string;
    price: number;
  };
}

export default function TicketPurchaseConfirmation({
  ticketId,
  ticketCode,
  tripInfo,
}: TicketPurchaseConfirmationProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadQR = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/qr`);
      const data = await res.json();

      // Descargar la imagen QR
      const link = document.createElement('a');
      link.href = data.qrCode;
      link.download = `Ticket-${ticketCode}.png`;
      link.click();
    } catch (error) {
      alert('Error al descargar el QR');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg">
      {/* Encabezado de éxito */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Compra Confirmada!</h1>
        <p className="text-gray-600">Tu ticket ha sido generado exitosamente</p>
      </div>

      {/* Información del viaje */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Viaje</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 uppercase">Origen</p>
            <p className="text-lg font-semibold">{tripInfo.origin}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase">Destino</p>
            <p className="text-lg font-semibold">{tripInfo.destination}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase">Salida</p>
            <p className="text-lg font-semibold">
              {new Date(tripInfo.departureTime).toLocaleString('es-BO', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase">Precio</p>
            <p className="text-lg font-bold text-green-600">Bs. {tripInfo.price.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Código del ticket */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded">
        <p className="text-sm text-gray-600 uppercase mb-1">Código del Ticket</p>
        <p className="text-2xl font-mono font-bold text-blue-700">{ticketCode}</p>
        <p className="text-xs text-gray-600 mt-2">Guarda este código para futuras referencias</p>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href={`/tickets/${ticketId}`}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Eye size={20} />
          Ver Ticket
        </Link>
        
        <button
          onClick={handleDownloadQR}
          disabled={downloading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold disabled:opacity-50"
        >
          <Download size={20} />
          {downloading ? 'Descargando...' : 'Descargar QR'}
        </button>
      </div>

      {/* Información importante */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <h3 className="font-semibold text-yellow-900 mb-2">Información Importante</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>✓ Presenta tu QR en el terminal antes de viajar</li>
          <li>✓ Descarga o imprime tu ticket para mayor seguridad</li>
          <li>✓ Puedes compartir tu ticket por email o WhatsApp</li>
          <li>✓ El QR es único e intransferible</li>
        </ul>
      </div>

      {/* Botón para volver */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block px-6 py-2 text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}