"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AsientoMapa from "@/components/asientos/AsientoMapa";
import { AlertCircle, Loader } from "lucide-react";

export default function BusLayoutPage() {
  const params = useParams();
  const busId = params.busId;

  const [busLayout, setBusLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusLayout = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!busId) {
          setError("ID del bus no válido");
          setLoading(false);
          return;
        }

        console.log("Cargando layout para bus:", busId);
        
        // ✅ CORRECCIÓN 1: Eliminar llave extra en la URL
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/buses/${busId}/layout`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Error ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Layout cargado:", data);

        // ✅ CORRECCIÓN 2: Validar que los datos tengan la estructura correcta
        if (!data || !data.decks) {
          throw new Error("Layout del bus inválido o sin pisos configurados");
        }

        setBusLayout(data);
      } catch (err) {
        console.error("Error al cargar layout:", err);
        setError(err.message || "Error al cargar el mapa de asientos");
      } finally {
        setLoading(false);
      }
    };

    if (busId) {
      fetchBusLayout();
    }
  }, [busId]);

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Por favor, intenta recargar la página o contacta al soporte
          </p>
        </div>
      </div>
    );
  }

  // Sin datos
  if (!busLayout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">No se encontró información del bus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AsientoMapa
          busLayout={busLayout}
          occupiedSeats={busLayout.occupied_seats || []}
          onSeatSelect={(seats) => {
            console.log("Asientos seleccionados:", seats);
            // Guardar en sessionStorage para uso posterior
            if (typeof window !== "undefined") {
              sessionStorage.setItem("selectedSeats", JSON.stringify(seats));
            }
          }}
          maxSelection={4}
        />
      </div>
    </div>
  );
}