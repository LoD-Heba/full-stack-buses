import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const generateInvoicePDF = async (
  client,
  trip,
  tickets,
  payment,
  totalAmount
) => {
  // Crear elemento HTML temporal
  const invoiceElement = document.createElement("div");
  invoiceElement.style.position = "absolute";
  invoiceElement.style.left = "-9999px";
  invoiceElement.style.width = "210mm"; // Ancho A4
  invoiceElement.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 3px solid #ff9800; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #ff9800; font-size: 28px;">🚌 BUS TICKETS</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">Sistema de Reserva de Pasajes</p>
      </div>

      <!-- Información de Factura -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div>
          <h3 style="color: #ff9800; margin-top: 0;">Información del Pasajero</h3>
          <p><strong>Nombre:</strong> ${client.firstName} ${client.lastName}</p>
          <p><strong>Documento:</strong> ${client.documentNumber}</p>
          <p><strong>Teléfono:</strong> ${client.phone || "N/A"}</p>
        </div>
        <div>
          <h3 style="color: #ff9800; margin-top: 0;">Información del Pago</h3>
          <p><strong>ID Pago:</strong> ${payment.id}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-ES")}</p>
          <p><strong>Método:</strong> ${payment.method || "QR"}</p>
          <p><strong>Estado:</strong> <span style="color: #4CAF50; font-weight: bold;">PAGADO</span></p>
        </div>
      </div>

      <!-- Información del Viaje -->
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
        <h3 style="color: #ff9800; margin-top: 0;">Detalles del Viaje</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">RUTA</p>
            <p style="margin: 5px 0; font-weight: bold;">
              ${trip.route?.name || "?"}
            </p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">BUS</p>
            <p style="margin: 5px 0; font-weight: bold;">${trip.bus?.plate} (${trip.bus?.model})</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">SALIDA</p>
            <p style="margin: 5px 0; font-weight: bold;">
              ${new Date(trip.departure_time).toLocaleDateString("es-ES")} 
              ${new Date(trip.departure_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      <!-- Tickets -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #ff9800;">Tickets Comprados</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #ff9800; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Código</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Asiento</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Tipo</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${tickets
              .map(
                (ticket) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #ff9800;">${ticket.code}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${ticket.seat?.seat_code || "N/A"}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${ticket.seat?.type || "normal"}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">Bs. ${parseFloat(ticket.price).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div style="border-top: 2px solid #ff9800; border-bottom: 2px solid #ff9800; padding: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; font-size: 18px; margin-bottom: 10px;">
          <strong>Cantidad de Asientos:</strong>
          <strong>${tickets.length}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 24px; color: #ff9800;">
          <strong>TOTAL PAGADO:</strong>
          <strong>Bs. ${totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      <!-- Código QR -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px;">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">Código de Referencia</p>
        <p style="margin: 0; font-family: monospace; font-weight: bold; font-size: 14px; word-break: break-all;">
          ${payment.id}
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 5px 0;">Gracias por tu compra. Conserva este documento para tu referencia.</p>
        <p style="margin: 5px 0;">Fecha de emisión: ${new Date().toLocaleString("es-ES")}</p>
        <p style="margin: 5px 0; font-weight: bold;">Sistema de Reserva de Pasajes © 2024</p>
      </div>
    </div>
  `;

  document.body.appendChild(invoiceElement);

  try {
    // Convertir HTML a canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // Crear PDF desde canvas
    const pdf = new jsPDF({
      format: "a4",
      orientation: "portrait",
      unit: "px",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Descargar PDF
    const fileName = `Factura-${payment.id}-${new Date().getTime()}.pdf`;
    pdf.save(fileName);

    console.log("✅ PDF generado:", fileName);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    throw new Error("Error al generar la factura");
  } finally {
    document.body.removeChild(invoiceElement);
  }
};