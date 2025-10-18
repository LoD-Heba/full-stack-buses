// app/checkout/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import CheckoutFlow from '../../components/CheckoutFlow';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  
  const ticketId = searchParams.get('ticketId') || '';
  const ticketCode = searchParams.get('code') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');

  if (!ticketId || !ticketCode || amount === 0) {
    return <div>Error: Parámetros inválidos</div>;
  }

  return (
    <CheckoutFlow
      ticketId={ticketId}
      ticketCode={ticketCode}
      totalAmount={amount}
      tripInfo={{
        origin: 'La Paz', // Obtener del contexto/sesión
        destination: 'Cochabamba',
        departureTime: new Date().toISOString(),
        price: amount,
      }}
    />
  );
}