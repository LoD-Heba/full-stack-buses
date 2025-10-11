"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa del Ticket</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Ticket Preview */}
        <div id="ticket-preview" className="space-y-4 p-6 border-2 border-dashed border-orange-300 rounded-lg bg-gradient-to-br from-orange-50 to-white">
          {/* Header con logo */}
          <div className="text-center border-b-2 border-orange-200 pb-4">
            <h2 className="text-2xl font-bold text-orange-600">🚌 Mi Empresa</h2>
            <p className="text-sm text-gray-600">Viajes Seguros y Cómodos</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <QRCodeSVG
                value={`TICKET-${ticket.code}`}
                size={120}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Código del ticket */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Código de Ticket</p>
            <p className="text-2xl font-bold text-gray-800">{ticket.code}</p>
            <Badge className={`mt-2 ${STATUS_COLORS[ticket.status]}`}>
              {ticket.status}
            </Badge>
          </div>

          {/* Información del pasajero */}
          <div className="bg-white rounded-lg p-4 space-y-2 shadow-sm">
            <h3 className="font-semibold text-orange-600 mb-2">👤 Pasajero</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{ticket.passenger}</span>
              
              <span className="text-gray-600">Documento:</span>
              <span className="font-medium">{ticket.document}</span>
            </div>
          </div>

          {/* Información del viaje */}
          <div className="bg-white rounded-lg p-4 space-y-2 shadow-sm">
            <h3 className="font-semibold text-orange-600 mb-2">🚍 Detalles del Viaje</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ruta:</span>
                <span className="font-medium text-right">{ticket.trip_route}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Salida:</span>
                <span className="font-medium">{ticket.departure_time}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Bus:</span>
                <span className="font-medium">{ticket.bus_plate}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Asiento:</span>
                <span className="font-medium text-lg text-orange-600">{ticket.seat}</span>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total Pagado:</span>
              <span className="text-2xl font-bold text-green-600">
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
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cerrar
          </Button>
        </div>

        {/* Instrucciones de impresión */}
        <p className="text-xs text-center text-gray-500 mt-2">
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
          }
        }
      `}</style>
    </Dialog>
  );
}