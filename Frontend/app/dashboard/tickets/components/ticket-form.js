"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getAvailableSeatsForTrip } from "../api/api-tickets";
import {
  ArrowLeft,
  User,
  Ticket as TicketIcon,
  Bus,
  MapPin,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("clientId");
  const tripId = searchParams.get("tripId");
  const seatsParam = searchParams.get("seats"); // "1A,2A,3A"

  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);
  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]); // ✅ NUEVO
  const [backendError, setBackendError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      userProfileId: clientId || "", // ✅ CAMBIO: userId → userProfileId
      tripId: tripId || "",
      price: "",
    },
  });

  // Validar parámetros requeridos
  useEffect(() => {
    if (!clientId || !tripId || !seatsParam) {
      setBackendError(
        "Parámetros inválidos. Debes venir desde la página de selección de asientos."
      );
      setLoading(false);
      return;
    }
  }, [clientId, tripId, seatsParam]);

  // Cargar información del cliente
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3001/api/v1/clients/${clientId}`
        );

        if (!res.ok) {
          throw new Error("Cliente no encontrado");
        }

        const data = await res.json();

        if (!data.firstName || !data.lastName || !data.documentNumber) {
          toast.error("El cliente debe tener un perfil completo");
          router.push("/dashboard/clientes");
          return;
        }

        setClientInfo(data);
        setValue("userProfileId", clientId); // ✅ CAMBIO
      } catch (error) {
        console.error("Error al cargar cliente:", error);
        toast.error("Error al cargar información del cliente");
        router.push("/dashboard/clientes");
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, [clientId, setValue, router]);

  // ✅ Cargar información del viaje y asientos seleccionados
  useEffect(() => {
    const fetchTripAndSeats = async () => {
      if (!tripId || !seatsParam) return;

      try {
        console.log("🔄 Iniciando carga de datos...");
        console.log("📝 Parámetros:", { tripId, seatsParam });

        // ✅ Obtener viaje y asientos disponibles con la función corregida
        const { trip: tripData, availableSeats: seats } =
          await getAvailableSeatsForTrip(tripId);

        console.log("✅ Datos obtenidos:", {
          tripId: tripData.id,
          availableSeatsCount: seats.length,
          seatsParam,
        });

        setTrip(tripData);
        setAvailableSeats(seats);
        setValue("tripId", tripId);
        setValue("price", tripData.price);

        // ✅ Procesar asientos seleccionados
        const seatCodes = seatsParam
          .split(",")
          .map((s) => s.trim().toUpperCase());
        console.log("🔍 Buscando códigos:", seatCodes);

        // Mostrar todos los códigos disponibles para debug
        console.log(
          "📋 Códigos disponibles en el bus:",
          seats.map((s) => s.seat_code)
        );

        const mappedSeats = seatCodes
          .map((code) => {
            const seat = seats.find(
              (s) =>
                s.seat_code?.toUpperCase() === code ||
                s.seat_number?.toString() === code
            );

            if (!seat) {
              console.warn(`⚠️ Asiento no encontrado: ${code}`);
            } else {
              // ✅ Validar status del asiento
              if (seat.status && seat.status !== "disponible") {
                console.warn(
                  `⚠️ Asiento ${code} no disponible (status: ${seat.status})`
                );
                toast.warning(`El asiento ${code} no está disponible`);
                return null;
              }
              console.log(
                `✅ Asiento encontrado: ${code} → ID: ${seat.id}, status: ${
                  seat.status || "N/A"
                }`
              );
            }

            return seat;
          })
          .filter(Boolean);
        if (mappedSeats.length === 0) {
          throw new Error(
            `No se encontraron los asientos seleccionados: ${seatCodes.join(
              ", "
            )}. ` +
              `Asientos disponibles: ${seats
                .map((s) => s.seat_code)
                .slice(0, 10)
                .join(", ")}...`
          );
        }

        if (mappedSeats.length < seatCodes.length) {
          const found = mappedSeats.map((s) => s.seat_code);
          const notFound = seatCodes.filter((code) => !found.includes(code));
          console.warn(
            `⚠️ Algunos asientos no se encontraron: ${notFound.join(", ")}`
          );
          toast.warning(
            `Algunos asientos no están disponibles: ${notFound.join(", ")}`
          );
        }

        console.log(
          "✅ Asientos mapeados correctamente:",
          mappedSeats.map((s) => ({
            id: s.id,
            code: s.seat_code,
            number: s.seat_number,
          }))
        );

        setSelectedSeats(mappedSeats);
      } catch (error) {
        console.error("❌ Error al cargar viaje:", error);
        toast.error(error.message || "Error al cargar información del viaje");
        setBackendError(error.message);
      }
    };

    fetchTripAndSeats();
  }, [tripId, seatsParam, setValue]);

  // ✅ Manejar envío del formulario
  const onSubmit = handleSubmit(async () => {
    try {
      setSubmitting(true);
      setBackendError(null);

      if (!clientId) {
        toast.error("Cliente no válido");
        return;
      }

      if (!tripId) {
        toast.error("Viaje no válido");
        return;
      }

      if (selectedSeats.length === 0) {
        toast.error("Debe seleccionar al menos un asiento");
        return;
      }

      // ✅ Validar que todos los asientos tienen ID UUID válido
      const invalidSeats = selectedSeats.filter(
        (seat) => !seat.id || typeof seat.id !== "string" || seat.id.length < 30
      );

      if (invalidSeats.length > 0) {
        console.error("❌ Asientos con ID inválido:", invalidSeats);
        toast.error("Error: Algunos asientos no tienen ID válido");
        setBackendError("Algunos asientos seleccionados no son válidos");
        return;
      }

      console.log("📤 Creando tickets para:", {
        userProfileId: clientId,
        tripId: tripId,
        seats: selectedSeats.map((s) => ({ id: s.id, code: s.seat_code })),
      });

      const ticketsCreated = [];
      const ticketErrors = [];

      // Crear un ticket por cada asiento seleccionado
      for (const seat of selectedSeats) {
        try {
          // ✅ Construir payload correcto según CreateTicketDto
          const ticketData = {
            userProfileId: clientId, // ✅ REQUERIDO
            userId: undefined, // ✅ Opcional (usuario registrado)
            tripId: tripId,
            seatId: seat.id, // ✅ UUID del asiento
            price: parseFloat(trip.price),
            status: "PENDIENTE",
          };

          console.log("📤 Enviando ticket:", ticketData);

          const response = await fetch("http://localhost:3001/api/v1/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData),
          });

          const responseData = await response.json();

          if (!response.ok) {
            console.error(
              `❌ Error en asiento ${seat.seat_code}:`,
              responseData
            );
            ticketErrors.push(
              `Asiento ${seat.seat_code}: ${
                responseData.message || "Error desconocido"
              }`
            );
          } else {
            console.log(`✅ Ticket creado para ${seat.seat_code}`);
            ticketsCreated.push(responseData);
          }
        } catch (error) {
          console.error(`❌ Error en asiento ${seat.seat_code}:`, error);
          ticketErrors.push(
            `Asiento ${seat.seat_code}: ${
              error instanceof Error ? error.message : "Error"
            }`
          );
        }
      }

      // Mostrar resultado
      if (ticketsCreated.length > 0) {
        toast.success(
          `${ticketsCreated.length} ticket${
            ticketsCreated.length > 1 ? "s" : ""
          } creado${ticketsCreated.length > 1 ? "s" : ""} exitosamente`
        );

        setTimeout(() => {
          router.push(`/dashboard/clientes/${clientId}/perfil`);
        }, 1500);
      }

      if (ticketErrors.length > 0) {
        const errorMessage = ticketErrors.join("\n");
        setBackendError(errorMessage);
        toast.error(`Se encontraron errores:\n${errorMessage}`);
      }
    } catch (error) {
      console.error("Error en onSubmit:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear los tickets";
      setBackendError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (backendError && !clientInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-6 whitespace-pre-line">
              {backendError}
            </p>
            <Button
              onClick={() => router.push("/dashboard/viajes")}
              className="bg-red-600 hover:bg-red-700"
            >
              Volver a Viajes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = selectedSeats.length * (trip ? parseFloat(trip.price) : 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Confirmar Compra de Tickets
          </h1>
          <p className="text-gray-600 mt-1">
            Revisa los detalles antes de confirmar
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Información del Cliente */}
        {clientInfo && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">
                    {clientInfo.firstName} {clientInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{clientInfo.documentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">
                    {clientInfo.phone || "No especificado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información del Viaje */}
        {trip && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5 text-green-600" />
                Detalles del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Ruta
                  </p>
                  <p className="font-medium mt-1">
                    {trip.route?.originCity?.name} →{" "}
                    {trip.route?.destinationCity?.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Salida
                  </p>
                  <p className="font-medium mt-1">
                    {new Date(trip.departure_time).toLocaleDateString("es-ES")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(trip.departure_time).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Bus className="h-4 w-4" />
                    Bus
                  </p>
                  <p className="font-medium mt-1">{trip.bus?.plate}</p>
                  <p className="text-xs text-gray-500">{trip.bus?.model}</p>
                </div>
                <div>
                  <p className="text-gray-600">Precio/Asiento</p>
                  <p className="font-semibold text-green-600 mt-1">
                    Bs. {parseFloat(trip.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asientos Seleccionados */}
        {selectedSeats.length > 0 && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">
                Asientos Seleccionados ({selectedSeats.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <Badge
                    key={seat.id}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-2 text-sm"
                  >
                    {seat.seat_code}{" "}
                    {seat.seat_number && `(Asiento ${seat.seat_number})`}
                  </Badge>
                ))}
              </div>

              <Card className="bg-white border">
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio unitario:</span>
                      <span className="font-medium">
                        Bs. {trip ? parseFloat(trip.price).toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Cantidad de asientos:
                      </span>
                      <span className="font-medium">
                        {selectedSeats.length}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        Bs. {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Errores del servidor */}
        {backendError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">
              {backendError}
            </AlertDescription>
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting || selectedSeats.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              `Confirmar Compra (Bs. ${totalPrice.toFixed(2)})`
            )}
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Al confirmar, se crearán {selectedSeats.length} ticket
            {selectedSeats.length > 1 ? "s" : ""} con estado "Pendiente". Serán
            confirmados una vez se realice el pago.
          </AlertDescription>
        </Alert>
      </form>
    </div>
  );
}
