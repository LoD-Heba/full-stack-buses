// Frontend/app/dashboard/tickets/utils/export-pdf.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Exportar un ticket individual a PDF como factura profesional
 */
export function exportSingleTicketToPDF(ticket) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ENCABEZADO DE LA EMPRESA
  doc.setFillColor(234, 88, 12); // Naranja
  doc.rect(0, 0, pageWidth, 35, "F");

  // Logo/Nombre de empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, "bold");
  doc.text("TRANSARKA", 15, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Empresa de Transporte", 15, 22);

  // Datos de la empresa
  doc.setFontSize(8);
  doc.text("NIT: 123456789", 15, 27);
  doc.text("Av. Principal #123, Cochabamba", 15, 31);

  // FACTURA - Lado derecho
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 65, 8, 50, 20, 2, 2, "F");

  doc.setTextColor(234, 88, 12);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("FACTURA", pageWidth - 40, 15, { align: "center" });

  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(`N°: ${ticket.code}`, pageWidth - 40, 20, { align: "center" });
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-ES")}`,
    pageWidth - 40,
    24,
    { align: "center" }
  );

  // ESTADO DEL TICKET
  let yPos = 42;
  let statusColor = [234, 179, 8]; // Amarillo
  if (ticket.status === "CONFIRMADO") statusColor = [34, 197, 94]; // Verde
  if (ticket.status === "CANCELADO") statusColor = [239, 68, 68]; // Rojo

  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 45, yPos - 5, 30, 8, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.text(ticket.status, pageWidth - 30, yPos, { align: "center" });

  // DATOS DEL PASAJERO
  yPos = 55;
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, 20);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("DATOS DEL PASAJERO", 18, yPos + 6);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("Nombre Completo:", 18, yPos + 12);
  doc.setFont(undefined, "bold");
  doc.text(ticket.passenger, 52, yPos + 12);

  doc.setFont(undefined, "normal");
  doc.text("Documento:", 18, yPos + 17);
  doc.setFont(undefined, "bold");
  doc.text(ticket.document, 52, yPos + 17);

  // DETALLES DEL SERVICIO - Encabezado de tabla
  yPos = 82;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos, pageWidth - 30, 8, "F");

  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  doc.setTextColor(60);
  doc.text("DESCRIPCIÓN", 18, yPos + 5);
  doc.text("CANT.", pageWidth / 2 + 20, yPos + 5, { align: "center" });
  doc.text("PRECIO UNIT.", pageWidth / 2 + 50, yPos + 5, { align: "right" });
  doc.text("TOTAL", pageWidth - 20, yPos + 5, { align: "right" });

  // Contenido de la tabla
  yPos += 10;
  doc.setDrawColor(220);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0);
  doc.text(`Pasaje de Bus - ${ticket.trip_route}`, 18, yPos);

  yPos += 4;
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100);
  doc.text(`Salida: ${ticket.departure_time}`, 18, yPos);

  yPos += 4;
  doc.text(`Bus: ${ticket.bus_plate} | Asiento: ${ticket.seat}`, 18, yPos);

  // Cantidad, precio unitario y total
  doc.setTextColor(0);
  doc.setFont(undefined, "bold");
  doc.text("1", pageWidth / 2 + 20, yPos - 4, { align: "center" });
  doc.text(
    `Bs. ${parseFloat(ticket.price).toFixed(2)}`,
    pageWidth / 2 + 50,
    yPos - 4,
    { align: "right" }
  );
  doc.setFontSize(10);
  doc.text(
    `Bs. ${parseFloat(ticket.price).toFixed(2)}`,
    pageWidth - 20,
    yPos - 4,
    { align: "right" }
  );

  yPos += 5;
  doc.setDrawColor(220);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // RESUMEN DE TOTALES
  yPos += 10;
  const boxX = pageWidth - 70;
  const boxWidth = 55;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("Subtotal:", boxX, yPos);
  doc.setFont(undefined, "bold");
  doc.text(
    `Bs. ${parseFloat(ticket.price).toFixed(2)}`,
    boxX + boxWidth,
    yPos,
    { align: "right" }
  );

  yPos += 6;
  doc.setFont(undefined, "normal");
  doc.text("IVA (0%):", boxX, yPos);
  doc.setFont(undefined, "bold");
  doc.text("Bs. 0.00", boxX + boxWidth, yPos, { align: "right" });

  // Total - destacado
  yPos += 10;
  doc.setFillColor(220, 252, 231); // Verde claro
  doc.setDrawColor(34, 197, 94); // Verde
  doc.setLineWidth(1);
  doc.roundedRect(boxX - 5, yPos - 6, boxWidth + 10, 12, 2, 2, "FD");

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0);
  doc.text("TOTAL A PAGAR:", boxX, yPos);
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text(
    `Bs. ${parseFloat(ticket.price).toFixed(2)}`,
    boxX + boxWidth,
    yPos + 1,
    { align: "right" }
  );

  // CÓDIGO QR Y VERIFICACIÓN
  yPos += 20;
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // Código de verificación
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont(undefined, "normal");
  doc.text("Código de Verificación:", 18, yPos);

  yPos += 5;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(234, 88, 12);
  doc.text(ticket.code, 18, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont(undefined, "normal");
  doc.text(`Fecha de emisión: ${ticket.booking_date}`, 18, yPos);

  // QR Code (simulado con texto)
  const qrX = pageWidth - 45;
  const qrY = yPos - 18;
  doc.setDrawColor(100);
  doc.setLineWidth(1);
  doc.rect(qrX, qrY, 25, 25);
  doc.setFontSize(7);
  doc.setTextColor(0);
  doc.text("QR", qrX + 12.5, qrY + 13, { align: "center" });
  doc.text("CODE", qrX + 12.5, qrY + 16, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("CÓDIGO QR", qrX + 12.5, qrY - 2, { align: "center" });
  doc.text("Escanear al abordar", qrX + 12.5, qrY + 28, { align: "center" });

  // TÉRMINOS Y CONDICIONES
  yPos += 18;
  doc.setFillColor(250, 250, 250);
  doc.rect(15, yPos, pageWidth - 30, 35, "F");

  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.rect(15, yPos, pageWidth - 30, 35);

  yPos += 5;
  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0);
  doc.text("Términos y Condiciones:", 18, yPos);

  yPos += 5;
  doc.setFont(undefined, "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);

  const terms = [
    "• El pasajero debe presentarse 15 minutos antes de la hora de salida",
    "• Es obligatorio presentar documento de identidad al momento de abordar",
    "• Las cancelaciones deben realizarse con 24 horas de anticipación",
    "• El ticket es personal e intransferible",
    "• Conserve este documento como comprobante de pago",
  ];

  terms.forEach((term) => {
    doc.text(term, 18, yPos);
    yPos += 4;
  });

  // PIE DE PÁGINA
  yPos = pageHeight - 25;
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 5;
  doc.setFontSize(9);
  doc.setTextColor(234, 88, 12);
  doc.setFont(undefined, "bold");
  doc.text("¡Gracias por viajar con TRANSARKA!", pageWidth / 2, yPos, {
    align: "center",
  });

  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont(undefined, "normal");
  doc.text(
    "Este documento es válido como comprobante de compra",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  yPos += 4;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    "Generado electrónicamente - No requiere firma ni sello",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  // Guardar
  doc.save(`factura-${ticket.code}.pdf`);
}