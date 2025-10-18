// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * POST /api/payments
 * Crear un pago
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Error al crear pago' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Error al crear el pago' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/[id]
 * Actualizar un pago
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const paymentId = params.id;

    const response = await fetch(`${BACKEND_URL}/payments/${paymentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Error al actualizar pago' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pago' },
      { status: 500 }
    );
  }
}

// app/api/payments/[id]/route.ts
export async function PATCH_BY_ID(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const paymentId = params.id;

    const response = await fetch(`${BACKEND_URL}/payments/${paymentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Error al actualizar pago' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pago' },
      { status: 500 }
    );
  }
}