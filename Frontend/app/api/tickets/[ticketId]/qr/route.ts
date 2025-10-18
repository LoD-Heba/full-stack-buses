// app/api/tickets/[ticketId]/qr/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const ticketId = params.ticketId;

    const response = await fetch(
      `${BACKEND_URL}/tickets/${ticketId}/qr`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ticket QR:', error);
    return NextResponse.json(
      { error: 'Error al obtener el ticket' },
      { status: 500 }
    );
  }
}

// app/api/tickets/qr/validate/[code]/route.ts
export async function GET_VALIDATE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;

    const response = await fetch(
      `${BACKEND_URL}/tickets/qr/validate/${code}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Ticket no válido' },
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