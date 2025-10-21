"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AsientoMapa from "@/components/asientos/AsientoMapa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/v1";

export default function ComprarAsientosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripId = searchParams.get("tripId");
  const clientId = searchParams.get("clientId");

  const [busLayout, setBusLayout] = useState(null);
  const [trip, setTrip] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  useEffect(() => {
    if (!tripId || !clientId) {
      setError("Parámetros inválidos. Debes seleccionar un viaje.");
      setLoading(false);
      return;
    }

    // Cargar cliente de sessionStorage
    const savedClient = sessionStorage.getItem("purchaseClient");
    if (savedClient) {
      setClient(JSON.parse(savedClient));
    }
  }, [tripId, clientId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!tripId) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Obtener datos del viaje
        const tripRes = await fetch(`${API_BASE}/trips/${tripId}`);
        if (!tripRes.ok) throw new Error("Error al cargar el viaje");
        const tripData = await tripRes.json();
        setTrip(tripData);

        // 2. Obtener layout del bus
        const layoutRes = await fetch(
          `${API_BASE}/buses/${tripData.bus.id}/layout`
        );
        if (!layoutRes.ok) throw new Error("Error al cargar el layout del bus");
        const layoutData = await layoutRes.json();
        setBusLayout(layoutData);

        // 3. Obtener tickets del viaje
        try {
          const ticketsRes = await fetch(`${API_BASE}/tickets/trip/${tripId}`);

          if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json();
            const occupiedTickets = ticketsData.filter(
              (ticket) =>
                (ticket.status === "CONFIRMADO" ||
                  ticket.status === "PENDIENTE") &&
                ticket.is_active
            );

            const occupied = occupiedTickets
              .map((ticket) => ticket.seat?.seat_code?.toUpperCase())
              .filter(Boolean);

            console.log("🔴 Asientos ocupados/reservados:", occupied);
            setOccupiedSeats(occupied);
          }
        } catch (err) {
          console.warn("Error al cargar tickets:", err);
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

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      toast.error("Por favor selecciona al menos un asiento");
      return;
    }

    // Guardar asientos seleccionados (solo los códigos)
    const seatCodes = selectedSeats.map((s) => s.toUpperCase());
    sessionStorage.setItem("selectedSeats", JSON.stringify(seatCodes));

    toast.success(`Has seleccionado ${selectedSeats.length} asiento(s)`);

    // Redirigir a página de pago
    router.push(`/comprar/pago?tripId=${tripId}&clientId=${clientId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/salidas")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Volver a Salidas
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/salidas")}
              className="hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Selecciona tu Asiento
              </h1>
              <p className="text-gray-600 mt-1">
                {trip.route?.originCity?.name || trip.route?.origin} →{" "}
                {trip.route?.destinationCity?.name || trip.route?.destination}
              </p>
            </div>
          </div>
        </div>

        {/* Info del cliente */}
        {client && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-sm text-blue-700">
                    C.I.: {client.documentNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Mapa de asientos */}
        <AsientoMapa
          busLayout={busLayout}
          tripInfo={trip}
          occupiedSeats={occupiedSeats}
          onSeatSelect={handleSeatSelection}
          maxSelection={4}
        />

        {/* Resumen de selección */}
        {selectedSeats.length > 0 && (
          <Card className="bg-orange-50 border-orange-300">
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
                <p className="font-semibold text-lg text-orange-900 mt-1">
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
                  onClick={handleContinue}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Confirmar Selección →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
