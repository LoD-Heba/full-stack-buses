"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AsientoMapa from "@/components/asientos/AsientoMapa";

export default function BusLayoutPage() {
  const params = useParams();
  const busId = params.busId;

  const [busLayout, setBusLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusLayout = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/buses/${busId}/layout}`
        );

        if (!response.ok) {
          throw new Error("Error al cargar el layout del bus");
        }

        const data = await response.json();
        setBusLayout(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (busId) {
      fetchBusLayout();
    }
  }, [busId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!busLayout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No se encontró información del bus.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AsientoMapa
          busLayout={busLayout}
          occupiedSeats={[]} // Obtener asientos ocupados del viaje
          onSeatSelect={(seats) => console.log("Seleccionados:", seats)}
          maxSelection={4}
        />
      </div>
    </div>
  );
}
