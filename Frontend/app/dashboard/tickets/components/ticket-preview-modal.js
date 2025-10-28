"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, X } from "lucide-react";
import { exportSingleTicketToPDF } from "../utils/export-pdf";
import { toast } from "sonner";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

export function TicketPreviewModal({ ticket, open, onClose }) {
  if (!ticket) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-preview");
    if (!printContent) {
      toast.error("No se pudo preparar la impresión");
      return;
    }

    // Crear una nueva ventana para imprimir
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permite las ventanas emergentes");
      return;
    }

    // Escribir el contenido en la nueva ventana
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura - ${ticket.code}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              border-bottom: 4px solid #ea580c;
              padding-bottom: 20px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: start;
            }
            .company-info h1 {
              color: #ea580c;
              font-size: 32px;
              margin-bottom: 8px;
            }
            .company-info p {
              font-size: 12px;
              color: #666;
              margin: 2px 0;
            }
            .invoice-badge {
              background: #ea580c;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-align: center;
            }
            .invoice-badge h2 {
              font-size: 20px;
              margin-bottom: 4px;
            }
            .invoice-badge p {
              font-size: 11px;
              margin: 2px 0;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 8px;
            }
            .status-pendiente { background: #fef3c7; color: #92400e; }
            .status-confirmado { background: #d1fae5; color: #065f46; }
            .status-cancelado { background: #fee2e2; color: #991b1b; }
            .section {
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
            }
            .section h3 {
              font-size: 13px;
              color: #374151;
              text-transform: uppercase;
              margin-bottom: 12px;
              font-weight: 600;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .info-item label {
              display: block;
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .info-item p {
              font-size: 13px;
              font-weight: 600;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            table th {
              background: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-size: 11px;
              color: #374151;
              text-transform: uppercase;
              font-weight: 600;
            }
            table td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .service-description {
              font-weight: 600;
              margin-bottom: 4px;
            }
            .service-details {
              font-size: 11px;
              color: #6b7280;
              margin: 2px 0;
            }
            .totals {
              margin-left: auto;
              width: 300px;
              margin-top: 16px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              font-size: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .total-final {
              background: #dcfce7;
              border: 2px solid #22c55e;
              border-radius: 8px;
              padding: 12px;
              margin-top: 8px;
            }
            .total-final .label {
              font-size: 14px;
              font-weight: 600;
            }
            .total-final .amount {
              font-size: 20px;
              font-weight: 700;
              color: #22c55e;
            }
            .qr-section {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
              margin-top: 20px;
            }
            .verification-code p {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .code {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: 700;
              color: #ea580c;
              margin-bottom: 4px;
            }
            .date-small {
              font-size: 10px;
              color: #9ca3af;
            }
            .qr-container {
              text-align: center;
            }
            .qr-container p {
              font-size: 10px;
              color: #6b7280;
              margin: 8px 0;
              font-weight: 600;
            }
            .qr-box {
              padding: 12px;
              background: white;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              display: inline-block;
            }
            .terms {
              background: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            .terms h3 {
              font-size: 11px;
              color: #111827;
              margin-bottom: 8px;
              font-weight: 600;
            }
            .terms ul {
              list-style: none;
              padding: 0;
            }
            .terms li {
              font-size: 10px;
              color: #4b5563;
              margin: 4px 0;
              padding-left: 12px;
              position: relative;
            }
            .terms li:before {
              content: "•";
              position: absolute;
              left: 0;
            }
            .footer {
              text-align: center;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              margin-top: 20px;
            }
            .footer p {
              font-size: 11px;
              color: #6b7280;
              margin: 4px 0;
            }
            .footer .thank-you {
              font-weight: 600;
              color: #ea580c;
              font-size: 12px;
            }
            .footer .disclaimer {
              font-size: 9px;
              color: #9ca3af;
            }
            @media print {
              body { padding: 0; }
              .container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              // Opcional: cerrar la ventana después de imprimir
              // window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    try {
      exportSingleTicketToPDF(ticket);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        {/* Vista previa de la factura */}
        <div
          id="invoice-preview"
          className="bg-white p-8 space-y-6"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Encabezado */}
          <div className="header">
            <div className="company-info">
              <h1>TRANSARKA</h1>
              <p>Empresa de Transporte</p>
              <p>NIT: 123456789</p>
              <p>Av. Principal #123, Cochabamba</p>
              <p>Tel: +591 4-1234567</p>
              <p>Email: info@transarka.com</p>
            </div>
            <div>
              <div className="invoice-badge">
                <h2>FACTURA</h2>
                <p>N°: {ticket.code}</p>
                <p>Fecha: {currentDate}</p>
              </div>
              <Badge className={`status-badge status-${ticket.status.toLowerCase()}`}>
                {ticket.status}
              </Badge>
            </div>
          </div>

          {/* Información del Pasajero */}
          <div className="section">
            <h3>Datos del Pasajero</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Nombre Completo</label>
                <p>{ticket.passenger}</p>
              </div>
              <div className="info-item">
                <label>Documento</label>
                <p>{ticket.document || "No especificado"}</p>
              </div>
            </div>
          </div>

          {/* Detalles del Servicio */}
          <div>
            <h3 style={{ fontSize: "13px", color: "#374151", textTransform: "uppercase", marginBottom: "12px", fontWeight: "600", background: "#f3f4f6", padding: "8px 12px", borderRadius: "4px" }}>
              Detalles del Servicio
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style={{ textAlign: "center" }}>Cantidad</th>
                  <th style={{ textAlign: "right" }}>Precio Unit.</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="service-description">
                      Pasaje de Bus - {ticket.trip_route}
                    </div>
                    <div className="service-details">Salida: {ticket.departure_time}</div>
                    <div className="service-details">
                      Bus: {ticket.bus_plate} | Asiento: {ticket.seat}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "600" }}>1</td>
                  <td style={{ textAlign: "right", fontWeight: "600" }}>
                    Bs. {parseFloat(ticket.price).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", fontSize: "14px", fontWeight: "600" }}>
                    Bs. {parseFloat(ticket.price).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span style={{ fontWeight: "600" }}>Bs. {parseFloat(ticket.price).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>IVA (0%):</span>
              <span style={{ fontWeight: "600" }}>Bs. 0.00</span>
            </div>
            <div className="total-final">
              <div className="total-row" style={{ border: "none" }}>
                <span className="label">TOTAL A PAGAR:</span>
                <span className="amount">Bs. {parseFloat(ticket.price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* QR y Código de Verificación */}
          <div className="qr-section">
            <div className="verification-code">
              <p>Código de Verificación:</p>
              <div className="code">{ticket.code}</div>
              <div className="date-small">Fecha de emisión: {ticket.booking_date}</div>
            </div>
            <div className="qr-container">
              <p>CÓDIGO QR</p>
              <div className="qr-box">
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
                />
              </div>
              <p>Escanear al abordar</p>
            </div>
          </div>

          {/* Términos y Condiciones */}
          <div className="terms">
            <h3>Términos y Condiciones:</h3>
            <ul>
              <li>El pasajero debe presentarse 15 minutos antes de la hora de salida</li>
              <li>Es obligatorio presentar documento de identidad al momento de abordar</li>
              <li>Las cancelaciones deben realizarse con 24 horas de anticipación</li>
              <li>El ticket es personal e intransferible</li>
              <li>Conserve este documento como comprobante de pago</li>
            </ul>
          </div>

          {/* Pie de página */}
          <div className="footer">
            <p className="thank-you">¡Gracias por viajar con TRANSARKA!</p>
            <p>Este documento es válido como comprobante de compra</p>
            <p className="disclaimer">Generado electrónicamente - No requiere firma ni sello</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 p-4 bg-gray-50 border-t">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Factura
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}