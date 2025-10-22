"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, X } from "lucide-react";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export function TicketPreviewModal({ ticket, open, onClose }) {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mx-auto max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        {/* Ticket Preview */}
        <div
          id="ticket-preview"
          className="space-y-3 sm:space-y-4 p-4 sm:p-6 border-2 border-dashed border-orange-300 rounded-lg bg-gradient-to-br from-green-500 to-white"
        >
          {/* Header con logo */}
          <div className="text-center border-b-2 border-orange-200 pb-3 sm:pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-orange-600">
              Mi Empresa
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Viajes Seguros y Cómodos
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-3 sm:py-4">
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow-md">
              <QRCodeSVG
                value={JSON.stringify({
                  code: ticket.code,
                  passenger: ticket.passenger,
                  seat: ticket.seat,
                  trip: ticket.trip_route,
                  price: ticket.price,
                })}
                size={window.innerWidth < 640 ? 100 : 120}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Código del ticket */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Código de Ticket</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 break-all">
              {ticket.code}
            </p>
            <Badge className={`mt-2 text-xs sm:text-sm ${STATUS_COLORS[ticket.status]}`}>
              {ticket.status}
            </Badge>
          </div>

          {/* Información del pasajero */}
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2 shadow-sm">
            <h3 className="font-semibold text-orange-600 mb-2 text-sm sm:text-base">
              👤 Pasajero
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:contents">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium break-words">{ticket.passenger}</span>
              </div>

              <div className="flex flex-col sm:contents">
                <span className="text-gray-600">Documento:</span>
                <span className="font-medium">{ticket.document}</span>
              </div>
            </div>
          </div>

          {/* Información del viaje */}
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2 shadow-sm">
            <h3 className="font-semibold text-orange-600 mb-2 text-sm sm:text-base">
              🚍 Detalles del Viaje
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Ruta:</span>
                <span className="font-medium sm:text-right break-words">
                  {ticket.trip_route}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Salida:</span>
                <span className="font-medium">{ticket.departure_time}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Bus:</span>
                <span className="font-medium">{ticket.bus_plate}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Asiento:</span>
                <span className="font-medium text-base sm:text-lg text-orange-600">
                  {ticket.seat}
                </span>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border-2 border-green-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-gray-700 font-medium text-sm sm:text-base">
                Total Pagado:
              </span>
              <span className="text-xl sm:text-2xl font-bold text-green-600">
                Bs. {parseFloat(ticket.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Fecha de reserva */}
          <div className="text-center text-xs text-gray-500 pt-2 border-t">
            <p>Reservado el: {ticket.booking_date}</p>
            <p className="mt-1">¡Gracias por viajar con nosotros!</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={handlePrint}
            className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="w-full sm:flex-1"
          >
            Cerrar
          </Button>
        </div>

        {/* Instrucciones de impresión */}
        <p className="text-xs text-center text-gray-500 mt-2 hidden sm:block">
          💡 Tip: Usa Ctrl+P para imprimir directamente
        </p>
      </DialogContent>

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
            background: white !important;
          }
          
          /* Optimizar para impresión */
          #ticket-preview {
            padding: 20px;
            border: 2px solid #000;
          }
        }

        /* Mejoras para scroll en móviles */
        @media (max-width: 640px) {
          .overflow-y-auto {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </Dialog>
  );
}