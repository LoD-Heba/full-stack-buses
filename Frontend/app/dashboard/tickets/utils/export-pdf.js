// Frontend/app/dashboard/tickets/utils/export-pdf.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Exportar lista de tickets a PDF
 */
export function exportTicketsToPDF(tickets) {
  const doc = new jsPDF();
  
  // Configurar el documento
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Título
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12); // Color naranja
  doc.text("Reporte de Tickets", pageWidth / 2, 15, { align: "center" });
  
  // Fecha del reporte
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generado el: ${new Date().toLocaleString("es-ES")}`,
    pageWidth / 2,
    22,
    { align: "center" }
  );
  
  // Línea decorativa
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(14, 25, pageWidth - 14, 25);
  
  // Estadísticas rápidas
  const totalTickets = tickets.length;
  const pendientes = tickets.filter((t) => t.status === "PENDIENTE").length;
  const confirmados = tickets.filter((t) => t.status === "CONFIRMADO").length;
  const cancelados = tickets.filter((t) => t.status === "CANCELADO").length;
  const totalIngresos = tickets
    .filter((t) => t.status === "CONFIRMADO")
    .reduce((sum, t) => sum + parseFloat(t.price), 0);
  
  doc.setFontSize(9);
  doc.setTextColor(60);
  const statsY = 32;
  doc.text(`Total: ${totalTickets}`, 14, statsY);
  doc.text(`Pendientes: ${pendientes}`, 50, statsY);
  doc.text(`Confirmados: ${confirmados}`, 90, statsY);
  doc.text(`Cancelados: ${cancelados}`, 135, statsY);
  doc.setTextColor(34, 197, 94); // Verde
  doc.text(`Ingresos: Bs. ${totalIngresos.toFixed(2)}`, 170, statsY);
  
  // Preparar datos para la tabla
  const tableData = tickets.map((ticket) => [
    ticket.code,
    ticket.passenger,
    ticket.trip_route,
    ticket.seat,
    `Bs. ${parseFloat(ticket.price).toFixed(2)}`,
    ticket.status,
    ticket.booking_date,
  ]);
  
  // Configurar tabla
  doc.autoTable({
    startY: 40,
    head: [
      ["Código", "Pasajero", "Ruta", "Asiento", "Precio", "Estado", "Fecha"],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [234, 88, 12], // Naranja
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [251, 243, 232], // Naranja muy claro
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Código
      1: { cellWidth: 35 }, // Pasajero
      2: { cellWidth: 40 }, // Ruta
      3: { cellWidth: 15, halign: "center" }, // Asiento
      4: { cellWidth: 25, halign: "right" }, // Precio
      5: { cellWidth: 25, halign: "center" }, // Estado
      6: { cellWidth: 25 }, // Fecha
    },
    didParseCell: function (data) {
      // Colorear estados
      if (data.section === "body" && data.column.index === 5) {
        const status = data.cell.raw;
        if (status === "CONFIRMADO") {
          data.cell.styles.textColor = [34, 197, 94]; // Verde
          data.cell.styles.fontStyle = "bold";
        } else if (status === "PENDIENTE") {
          data.cell.styles.textColor = [234, 179, 8]; // Amarillo
          data.cell.styles.fontStyle = "bold";
        } else if (status === "CANCELADO") {
          data.cell.styles.textColor = [239, 68, 68]; // Rojo
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { top: 40, left: 14, right: 14 },
  });
  
  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Guardar el PDF
  const filename = `tickets-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

/**
 * Exportar un ticket individual a PDF
 */
export function exportSingleTicketToPDF(ticket) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Encabezado
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, pageWidth, 30, "F");
  
  doc.setTextColor(255);
  doc.setFontSize(24);
  doc.text("🚌 TICKET DE VIAJE", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("Mi Empresa de Transporte", pageWidth / 2, 22, { align: "center" });
  
  // Código del ticket
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text(`Código: ${ticket.code}`, pageWidth / 2, 45, { align: "center" });
  
  // Estado
  let statusColor = [234, 179, 8]; // Amarillo por defecto
  if (ticket.status === "CONFIRMADO") statusColor = [34, 197, 94];
  if (ticket.status === "CANCELADO") statusColor = [239, 68, 68];
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth / 2 - 20, 50, 40, 8, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.text(ticket.status, pageWidth / 2, 55, { align: "center" });
  
  // Información del pasajero
  let yPos = 70;
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("INFORMACIÓN DEL PASAJERO", 20, yPos);
  
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  yPos += 8;
  doc.text(`Nombre: ${ticket.passenger}`, 20, yPos);
  yPos += 6;
  doc.text(`Documento: ${ticket.document}`, 20, yPos);
  
  // Información del viaje
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("DETALLES DEL VIAJE", 20, yPos);
  
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  yPos += 8;
  doc.text(`Ruta: ${ticket.trip_route}`, 20, yPos);
  yPos += 6;
  doc.text(`Salida: ${ticket.departure_time}`, 20, yPos);
  yPos += 6;
  doc.text(`Bus: ${ticket.bus_plate}`, 20, yPos);
  yPos += 6;
  doc.text(`Asiento: ${ticket.seat}`, 20, yPos);
  
  // Precio
  yPos += 15;
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 15, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.setTextColor(34, 197, 94);
  doc.text(
    `Total: Bs. ${parseFloat(ticket.price).toFixed(2)}`,
    pageWidth / 2,
    yPos + 4,
    { align: "center" }
  );
  
  // Fecha de reserva
  yPos += 25;
  doc.setTextColor(100);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(`Reservado el: ${ticket.booking_date}`, pageWidth / 2, yPos, {
    align: "center",
  });
  
  // Pie de página
  doc.setFontSize(8);
  doc.text(
    "¡Gracias por viajar con nosotros!",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: "center" }
  );
  doc.text(
    "Presente este ticket al abordar",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: "center" }
  );
  
  // Guardar
  doc.save(`ticket-${ticket.code}.pdf`);
}