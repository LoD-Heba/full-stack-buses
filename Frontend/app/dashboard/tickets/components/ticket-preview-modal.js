"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, X } from "lucide-react";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

export function TicketPreviewModal({ ticket, open, onClose }) {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        {/* Factura Preview */}
        <div
          id="invoice-preview"
          className="bg-white p-8 space-y-6"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Encabezado con logo y datos de empresa */}
          <div className="flex justify-between items-start border-b-4 border-orange-600 pb-6">
            <div>
              <h1 className="text-4xl font-bold text-orange-600 mb-2">
                TRANSARKA
              </h1>
              <p className="text-sm text-gray-600">Empresa de Transporte</p>
              <p className="text-xs text-gray-500 mt-1">NIT: 123456789</p>
              <p className="text-xs text-gray-500">
                Av. Principal #123, Cochabamba
              </p>
              <p className="text-xs text-gray-500">Tel: +591 4-1234567</p>
              <p className="text-xs text-gray-500">
                Email: info@transarka.com
              </p>
            </div>
            <div className="text-right">
              <div className="bg-orange-600 text-white px-6 py-3 rounded-lg mb-3">
                <p className="text-2xl font-bold">FACTURA</p>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">N°:</span> {ticket.code}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Fecha:</span> {currentDate}
              </p>
              <Badge
                className={`mt-2 ${STATUS_COLORS[ticket.status]}`}
              >
                {ticket.status}
              </Badge>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Datos del Pasajero
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-gray-600">Nombre Completo:</span>
                <p className="font-semibold">{ticket.passenger}</p>
              </div>
              <div>
                <span className="text-gray-600">Documento:</span>
                <p className="font-semibold">{ticket.document}</p>
              </div>
            </div>
          </div>

          {/* Detalles del Servicio */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide bg-gray-100 px-3 py-2 rounded">
              Detalles del Servicio
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                    Descripción
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                    Cantidad
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                    Precio Unit.
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">
                    <p className="font-semibold text-sm">
                      Pasaje de Bus - {ticket.trip_route}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Salida: {ticket.departure_time}
                    </p>
                    <p className="text-xs text-gray-600">
                      Bus: {ticket.bus_plate} | Asiento: {ticket.seat}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-semibold">1</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold">
                      Bs. {parseFloat(ticket.price).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-lg">
                      Bs. {parseFloat(ticket.price).toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  Bs. {parseFloat(ticket.price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-600">IVA (0%):</span>
                <span className="font-semibold">Bs. 0.00</span>
              </div>
              <div className="flex justify-between bg-green-50 px-4 py-3 rounded-lg border-2 border-green-200">
                <span className="text-lg font-bold text-gray-800">
                  TOTAL A PAGAR:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  Bs. {parseFloat(ticket.price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* QR y Código */}
          <div className="flex justify-between items-center border-t-2 border-gray-200 pt-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Código de Verificación:</span>
              </p>
              <p className="font-mono text-lg font-bold text-orange-600">
                {ticket.code}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Fecha de emisión: {ticket.booking_date}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                CÓDIGO QR
              </p>
              <div className="p-3 bg-white border-2 border-gray-300 rounded-lg inline-block">
                <QRCodeSVG
                  value={JSON.stringify({
                    code: ticket.code,
                    passenger: ticket.passenger,
                    seat: ticket.seat,
                    trip: ticket.trip_route,
                    price: ticket.price,
                    document: ticket.document,
                  })}
                  size={100}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Escanear al abordar
              </p>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800 mb-2">
              Términos y Condiciones:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                El pasajero debe presentarse 15 minutos antes de la hora de
                salida
              </li>
              <li>
                Es obligatorio presentar documento de identidad al momento de
                abordar
              </li>
              <li>
                Las cancelaciones deben realizarse con 24 horas de anticipación
              </li>
              <li>El ticket es personal e intransferible</li>
              <li>Conserve este documento como comprobante de pago</li>
            </ul>
          </div>

          {/* Pie de página */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p className="font-semibold">
              ¡Gracias por viajar con TRANSARKA!
            </p>
            <p className="mt-1">
              Este documento es válido como comprobante de compra
            </p>
            <p className="mt-2 text-gray-400">
              Generado electrónicamente - No requiere firma ni sello
            </p>
          </div>
        </div>

        {/* Botones de acción - No se imprimen */}
        <div className="flex gap-2 p-4 bg-gray-50 border-t print:hidden">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Factura
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-preview,
          #invoice-preview * {
            visibility: visible;
          }
          #invoice-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20mm;
          }
          
          /* Ocultar elementos no necesarios */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Optimizar colores para impresión */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Evitar saltos de página dentro de elementos */
          table,
          .border-2 {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </Dialog>
  );
}