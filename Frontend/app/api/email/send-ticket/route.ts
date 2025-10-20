import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configurar el transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
  auth: {
    user: process.env.SMTP_USER || 'tu-email@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'tu-contraseña',
  },
});

interface SendTicketRequest {
  to: string;
  ticketId: string;
  passengerName: string;
  ticketCode: string;
  route: string;
  departureDate: string;
  departureTime: string;
  price: number;
  ticketUrl: string;
  qrCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendTicketRequest = await request.json();

    const {
      to,
      passengerName,
      ticketCode,
      route,
      departureDate,
      departureTime,
      price,
      ticketUrl,
      qrCode,
    } = body;

    // Validar email
    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { message: 'Email inválido' },
        { status: 400 }
      );
    }

    // HTML del email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; margin: 20px; border-radius: 8px; }
            .ticket-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #666; }
            .value { color: #333; }
            .qr-section { text-align: center; margin: 30px 0; }
            .qr-image { max-width: 200px; border: 3px solid #667eea; border-radius: 8px; }
            .action-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .action-button:hover { background: #764ba2; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
            .price { font-size: 24px; color: #28a745; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 TICKET CONFIRMADO</h1>
              <p>Tu reserva está lista</p>
            </div>

            <div class="content">
              <h2>Hola ${passengerName},</h2>
              <p>Tu ticket ha sido confirmado exitosamente. A continuación encontrarás los detalles de tu viaje:</p>

              <div class="ticket-info">
                <div class="info-row">
                  <span class="label">Código de Ticket:</span>
                  <span class="value" style="font-family: monospace; font-weight: bold;">${ticketCode}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ruta:</span>
                  <span class="value">${route}</span>
                </div>
                <div class="info-row">
                  <span class="label">Fecha:</span>
                  <span class="value">${departureDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Hora de Salida:</span>
                  <span class="value">${departureTime}</span>
                </div>
                <div class="info-row">
                  <span class="label">Precio:</span>
                  <span class="value price">Bs. ${parseFloat(String(price)).toFixed(2)}</span>
                </div>
              </div>

              ${qrCode ? `
                <div class="qr-section">
                  <p style="color: #666; margin-bottom: 15px;"><strong>Código QR para validación:</strong></p>
                  <img src="${qrCode}" alt="Código QR" class="qr-image">
                  <p style="font-size: 12px; color: #999; margin-top: 10px;">Escanea este código al abordar</p>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${ticketUrl}" class="action-button">Ver Ticket Completo</a>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Presenta este ticket al abordar el bus</li>
                  <li>Guarda este email para futuras referencias</li>
                  <li>El QR es único e intransferible</li>
                  <li>Llega con 15 minutos de anticipación</li>
                </ul>
              </div>

              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Si tienes dudas, contáctanos a través de nuestro sitio web.
              </p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Mi Empresa de Transporte. Todos los derechos reservados.</p>
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@miempresa.com',
      to: to,
      subject: `Tu Ticket Confirmado - ${ticketCode}`,
      html: htmlContent,
      attachments: qrCode
        ? [
            {
              filename: `ticket-${ticketCode}.png`,
              path: qrCode,
            },
          ]
        : [],
    });

    return NextResponse.json(
      { message: 'Email enviado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error enviando email:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Error al enviar email',
      },
      { status: 500 }
    );
  }
}