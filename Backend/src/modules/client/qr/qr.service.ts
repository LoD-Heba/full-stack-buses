// Backend/src/modules/client/qr/qr.service.ts
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QRService {
  /**
   * Genera un código QR en formato imagen base64
   * @param data - Datos a codificar en el QR (generalmente una URL)
   * @returns Promise con la imagen QR en base64
   */
  async generateQRCode(data: string): Promise<string> {
    try {
      const qrImage = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
      });
      return qrImage;
    } catch (error) {
      throw new Error(`Error generando QR: ${error.message}`);
    }
  }

  /**
   * Genera múltiples códigos QR para varios tickets
   * @param dataArray - Array de datos para cada QR
   * @returns Promise con array de imágenes QR en base64
   */
  async generateMultipleQRCodes(dataArray: string[]): Promise<string[]> {
    try {
      return await Promise.all(
        dataArray.map((data) => this.generateQRCode(data))
      );
    } catch (error) {
      throw new Error(`Error generando múltiples QRs: ${error.message}`);
    }
  }

  /**
   * Construye la URL del ticket que se codificará en el QR
   * @param ticketCode - Código único del ticket (ej: TCK-2025-0001)
   * @param baseUrl - URL base de tu frontend (ej: https://tuapp.com)
   * @returns URL completa para el QR
   */
  buildTicketUrl(ticketCode: string, baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000'): string {
    return `${baseUrl}/tickets/validate/${ticketCode}`;
  }
}