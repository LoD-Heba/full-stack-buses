// Frontend/app/dashboard/viajes/[tripId]/asientos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AsientoMapa from '@/components/asientos/AsientoMapa';

export default function TripSeatsPage() {
  const params = useParams();
  const tripId = params.tripId;
  
  const [busLayout, setBusLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        // Primero obtener información del viaje
        const tripRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`
        );
        const trip = await tripRes.json();
        
        // Luego obtener el layout con asientos ocupados
        const layoutRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/buses/${trip.bus.id}/layout/trip/${tripId}`
        );
        const data = await layoutRes.json();
        
        setBusLayout(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [tripId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AsientoMapa
          busLayout={busLayout}
          occupiedSeats={busLayout?.occupied_seats || []}
          onSeatSelect={(seats) => {
            // Guardar selección para el checkout
            sessionStorage.setItem('selectedSeats', JSON.stringify(seats));
          }}
          maxSelection={4}
        />
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const seats = sessionStorage.getItem('selectedSeats');
              if (seats) {
                // Redirigir al checkout
                window.location.href = `/dashboard/checkout?tripId=${tripId}&seats=${seats}`;
              }
            }}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Continuar con la compra
          </button>
        </div>
      </div>
    </div>
  );
}