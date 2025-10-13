"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  MapPin,
  Calendar,
  Bus as BusIcon,
  ArrowLeft,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import BusLayoutDesigner from "../components/bus-layout-designer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function SeatSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const tripId = searchParams.get("tripId");

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [trip, setTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "success" }),
      3000
    );
  };

  useEffect(() => {
    if (!clientId || !tripId) {
      showAlert(
        "Faltan datos. Por favor inicie desde la selección de cliente.",
        "error"
      );
      router.push("/dashboard/clientes");
      return;
    }

    loadData();
  }, [clientId, tripId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar cliente
      const clientRes = await fetch(`${API_URL}/clients/${clientId}`);
      const clientData = await clientRes.json();
      setClient(clientData);

      // Cargar viaje con relaciones completas
      const tripRes = await fetch(`${API_URL}/trips/${tripId}`);
      const tripData = await tripRes.json();
      setTrip(tripData);

      // Verificar que el bus tenga stack de asientos
      if (!tripData.bus?.stacks?.seats) {
        showAlert("Este bus no tiene asientos configurados", "error");
        setSeats([]);
        return;
      }

      // Obtener tickets del viaje para saber qué asientos están ocupados
      const ticketsRes = await fetch(`${API_URL}/tickets/trip/${tripId}`);
      const ticketsData = await ticketsRes.json();
      const occupiedSeatIds = ticketsData
        .filter((t) => t.status === "CONFIRMADO" || t.status === "PENDIENTE")
        .map((t) => t.seat?.id)
        .filter(Boolean);

      setOccupiedSeats(occupiedSeatIds);

      // Procesar asientos para el componente
      const processedSeats = tripData.bus.stacks.seats.map((seat, idx) => ({
        ...seat,
        row: seat.row || Math.floor(idx / 3) + 1, // Calcular row si no existe
        col: seat.col || (idx % 3) + 1, // Calcular col si no existe
      }));

      setSeats(processedSeats);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showAlert("Error al cargar la información", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    if (selectedSeats.length === 0) {
      showAlert("Por favor seleccione al menos un asiento", "error");
      return;
    }

    // Redirigir a tickets con todos los datos
    const seatIds = selectedSeats.map((s) => s.id).join(",");
    router.push(
      `/dashboard/tickets/nuevo?clientId=${clientId}&tripId=${tripId}&seatIds=${seatIds}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-lg">Cargando asientos...</p>
        </div>
      </div>
    );
  }

  if (!client || !trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Error al cargar la información</p>
      </div>
    );
  }

  const availableSeatsCount = seats.filter(
    (s) => s.is_active && !occupiedSeats.includes(s.id)
  ).length;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {alert.show && (
        <Alert
          className={
            alert.type === "error"
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }
        >
          <AlertCircle
            className={`h-4 w-4 ${
              alert.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          />
          <AlertDescription
            className={
              alert.type === "error" ? "text-red-800" : "text-green-800"
            }
          >
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <Button
        variant="ghost"
        onClick={() => router.push(`/dashboard/viajes?clientId=${clientId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a viajes
      </Button>

      {/* Cliente Seleccionado */}
      <Card className="bg-blue-50 border-blue-300">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white rounded-full p-2">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Cliente:</p>
              <p className="text-lg font-bold text-blue-900">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-sm text-blue-600">
                C.I.: {client.documentNumber}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del Viaje */}
      <Card className="bg-green-50 border-green-300">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-700" />
              <div>
                <p className="text-sm text-green-700">Ruta:</p>
                <p className="font-bold text-green-900">
                  {trip.route?.originCity?.name} →{" "}
                  {trip.route?.destinationCity?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-700" />
              <div>
                <p className="text-sm text-green-700">Salida:</p>
                <p className="font-bold text-green-900">
                  {new Date(trip.departure_time).toLocaleDateString("es-ES")}
                </p>
                <p className="text-xs text-green-700">
                  {new Date(trip.departure_time).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BusIcon className="w-5 h-5 text-green-700" />
              <div>
                <p className="text-sm text-green-700">Bus:</p>
                <p className="font-bold text-green-900">{trip.bus?.plate}</p>
                <p className="text-xs text-green-700 capitalize">
                  {trip.bus?.service_type?.replace("_", " ")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-green-700">💰</div>
              <div>
                <p className="text-sm text-green-700">Precio:</p>
                <p className="text-2xl font-bold text-green-900">
                  Bs. {parseFloat(trip.price).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección de Asientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Seleccione su(s) Asiento(s)</span>
            <Badge variant="outline" className="text-lg">
              {availableSeatsCount} disponibles
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableSeatsCount === 0 ? (
            <div className="text-center py-12">
              <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-red-600 mb-2">
                No hay asientos disponibles
              </p>
              <p className="text-gray-600">
                Este viaje está completo. Por favor seleccione otro viaje.
              </p>
              <Button
                onClick={() =>
                  router.push(`/dashboard/viajes?clientId=${clientId}`)
                }
                className="mt-4"
              >
                Ver otros viajes
              </Button>
            </div>
          ) : (
            <>
              <BusLayoutDesigner
                seats={seats}
                occupiedSeats={occupiedSeats}
                selectedSeats={selectedSeats}
                onSeatClick={(seat) => {
                  // Solo permitir clicks en asientos, no en pasillos, baños, etc.
                  if (seat.visual_type !== "seat") return;

                  const isOccupied = occupiedSeats.includes(seat.id);
                  const isSelected = selectedSeats.some(
                    (s) => s.id === seat.id
                  );

                  if (isOccupied || !seat.is_active) return;

                  if (isSelected) {
                    // Deseleccionar
                    setSelectedSeats(
                      selectedSeats.filter((s) => s.id !== seat.id)
                    );
                  } else {
                    // Seleccionar (máximo 5)
                    if (selectedSeats.length < 5) {
                      setSelectedSeats([...selectedSeats, seat]);
                    }
                  }
                }}
                mode="selection"
                gridWidth={5} // Ajusta según la configuración real del bus
                gridHeight={12} // Ajusta según la configuración real del bus
                showControls={true} // Mostrar leyenda de colores
              />
              {/* Información de asientos seleccionados */}
              {selectedSeats.length > 0 && (
                <Card className="bg-orange-50 border-orange-300 mt-6">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700">
                          Asientos Seleccionados:
                        </p>
                        <div className="flex gap-2 mt-2">
                          {selectedSeats.map((seat) => (
                            <Badge
                              key={seat.id}
                              className="bg-orange-500 text-white text-lg px-3 py-1"
                            >
                              #{seat.seat_number}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-orange-700 mt-2 capitalize">
                          Tipo: {selectedSeats[0]?.type?.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-orange-700">
                          Total a Pagar:
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          Bs.{" "}
                          {(
                            parseFloat(trip.price) * selectedSeats.length
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {selectedSeats.length} x Bs.{" "}
                          {parseFloat(trip.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de acción */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/viajes?clientId=${clientId}`)
                  }
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleContinueToPayment}
                  disabled={selectedSeats.length === 0}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                >
                  Continuar a Pago
                  {selectedSeats.length > 0 && (
                    <CheckCircle className="w-5 h-5 ml-2" />
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
