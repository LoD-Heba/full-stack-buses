// app/api/tickets/qr/validate/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;

    if (!code || code.trim() === '') {
      return NextResponse.json(
        { error: 'Código de ticket requerido' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/tickets/qr/validate/${encodeURIComponent(code)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // No cachear para que siempre sea actual
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Ticket no válido' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error validating QR:', error);
    return NextResponse.json(
      { error: 'Error al validar el ticket' },
      { status: 500 }
    );
  }
}