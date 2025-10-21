"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AsientoMapa from "../../../components/asientos/AsientoMapa";
import AsientoLegend from "../../../components/asientos/AsientoLegend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function BusLayoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripId = searchParams.get("tripId");
  const clientId = searchParams.get("clientId");

  const [busLayout, setBusLayout] = useState(null);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]); // ✅ Estado para asientos ocupados

  useEffect(() => {
    if (!tripId || !clientId) {
      setError(
        "Parámetros inválidos. Debes seleccionar un viaje y un cliente."
      );
      setLoading(false);
      return;
    }
  }, [tripId, clientId]);

  // ✅ Cargar datos del viaje, layout y asientos ocupados
  useEffect(() => {
    const fetchData = async () => {
      if (!tripId) return;

      try {
        setLoading(true);
        setError(null);

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

        // 1. Obtener datos del viaje
        const tripRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
          }/trips/${tripId}`
        );

        if (!tripRes.ok) throw new Error("Error al cargar el viaje");
        const tripData = await tripRes.json();
        setTrip(tripData);

        // 2. Obtener layout del bus
        const layoutRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
          }/buses/${tripData.bus.id}/layout?tripId=${tripId}`
        );

        if (!layoutRes.ok) {
          throw new Error("Error al cargar el layout del bus");
        }
        const layoutData = await layoutRes.json();
        setBusLayout(layoutData);
        

        // ✅ 3. Obtener tickets confirmados del viaje para saber qué asientos están ocupados
        const ticketsRes = await fetch(
          `${API_URL}/tickets?tripId=${tripId}&status=confirmed`
        );
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();

          // Extraer los códigos de asientos ocupados
          const occupied =
            ticketsData.data
              ?.map((ticket) => ticket.seat?.seat_code?.toUpperCase())
              .filter(Boolean) || [];

          console.log("🔴 Asientos ocupados:", occupied);
          setOccupiedSeats(occupied);
        } else {
          console.warn("No se pudieron cargar los tickets del viaje");
          setOccupiedSeats([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);
  };

  const handleContinueBooking = () => {
    if (selectedSeats.length === 0) {
      toast.error("Por favor selecciona al menos un asiento");
      return;
    }

    const seatsParam = selectedSeats.join(",");
    router.push(
      `/dashboard/tickets/newTicket?tripId=${tripId}&clientId=${clientId}&seats=${seatsParam}`
    );
  };

  const handleBack = () => {
    router.push(`/dashboard/viajes?clientId=${clientId}`);
  };

  // Pantalla de carga
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

  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/dashboard/viajes")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Volver a Viajes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!busLayout || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          No se encontró información del viaje o del bus.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header con botón de volver */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Selección de Asientos
              </h1>
              <p className="text-gray-600 mt-1">
                {trip.route.originCity} → {trip.route.destinationCity}
              </p>
            </div>
          </div>
        </div>

        {/* Información del viaje */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Viaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bus</p>
                <p className="font-semibold">{trip.bus.plate}</p>
                <p className="text-sm text-gray-500">{trip.bus.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Salida</p>
                <p className="font-semibold">
                  {new Date(trip.departure_time).toLocaleDateString("es-ES")}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(trip.departure_time).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Precio por Asiento</p>
                <p className="font-semibold text-green-600">
                  Bs. {parseFloat(trip.price).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Asientos Seleccionados</p>
                <p className="font-semibold text-blue-600">
                  {selectedSeats.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ Mapa de asientos con occupiedSeats */}
        <AsientoMapa
          busLayout={busLayout}
          tripInfo={trip}
          occupiedSeats={occupiedSeats}
          onSeatSelect={handleSeatSelection}
          maxSelection={4}
        />

        {/* Resumen de selección */}
        {selectedSeats.length > 0 && (
          <Card className="bg-blue-50 border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resumen de tu Compra</span>
                <span className="text-sm font-normal text-gray-600">
                  {selectedSeats.length} asiento
                  {selectedSeats.length > 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Asientos Seleccionados:</p>
                <p className="font-semibold text-lg text-blue-900 mt-1">
                  {selectedSeats.join(", ")}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({selectedSeats.length} × Bs.{" "}
                    {parseFloat(trip.price).toFixed(2)}):
                  </span>
                  <span className="font-medium">
                    Bs.{" "}
                    {(selectedSeats.length * parseFloat(trip.price)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">
                    Bs.{" "}
                    {(selectedSeats.length * parseFloat(trip.price)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedSeats([])}
                >
                  Limpiar Selección
                </Button>
                <Button
                  onClick={handleContinueBooking}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Continuar con la Compra →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leyenda */}
        <AsientoLegend />
      </div>
    </div>
  );
}
