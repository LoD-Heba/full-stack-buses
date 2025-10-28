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
  Loader,
  QrCode,
  CreditCard,
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
  const [availableSeats, setAvailableSeats] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("review"); // "review" o "payment-selection"
  const [createdTickets, setCreatedTickets] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("QR");

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      userProfileId: clientId || "",
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
        setValue("userProfileId", clientId);
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

  // Cargar información del viaje y asientos seleccionados
  useEffect(() => {
    const fetchTripAndSeats = async () => {
      if (!tripId || !seatsParam) return;

      try {
        console.log("🔄 Iniciando carga de datos...");
        console.log("📝 Parámetros:", { tripId, seatsParam });

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

        // Procesar asientos seleccionados
        const seatCodes = seatsParam
          .split(",")
          .map((s) => s.trim().toUpperCase());
        console.log("🔍 Buscando códigos:", seatCodes);

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

  // Crear tickets sin pagar (PENDIENTE)
  const createTicketsOnly = async () => {
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

      console.log("📤 Creando tickets para:", {
        userProfileId: clientId,
        tripId: tripId,
        seats: selectedSeats.map((s) => ({ id: s.id, code: s.seat_code })),
      });

      const ticketsCreated = [];
      const ticketErrors = [];

      for (const seat of selectedSeats) {
        try {
          const ticketData = {
            userProfileId: clientId,
            userId: undefined,
            tripId: tripId,
            seatId: seat.id,
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

      if (ticketsCreated.length === 0) {
        throw new Error("No se pudieron crear los tickets");
      }

      if (ticketErrors.length > 0) {
        const errorMessage = ticketErrors.join("\n");
        setBackendError(errorMessage);
        toast.error(`Se encontraron errores:\n${errorMessage}`);
        return;
      }

      setCreatedTickets(ticketsCreated);
      toast.success(
        `${ticketsCreated.length} ticket${
          ticketsCreated.length > 1 ? "s" : ""
        } creado${ticketsCreated.length > 1 ? "s" : ""}`
      );
      setStep("payment-selection");
    } catch (error) {
      console.error("Error en createTicketsOnly:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear los tickets";
      setBackendError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Procesar selección de método de pago
  const handlePaymentMethodSelection = () => {
    // Guardar datos en sessionStorage para mantenerlos entre páginas
    sessionStorage.setItem("dashboardPurchaseClient", JSON.stringify({
      id: clientInfo.id,
      firstName: clientInfo.firstName,
      lastName: clientInfo.lastName,
      documentNumber: clientInfo.documentNumber,
      phone: clientInfo.phone,
    }));
    
    sessionStorage.setItem("dashboardSelectedSeats", JSON.stringify(
      selectedSeats.map(s => s.seat_code)
    ));

    sessionStorage.setItem("dashboardCreatedTickets", JSON.stringify(
      createdTickets.map(t => t.ticket_id)
    ));

    // Redirigir según el método de pago
    if (paymentMethod === "TARJETA") {
      router.push(
        `/comprar/pago-tarjeta?tripId=${tripId}&clientId=${clientId}&source=dashboard`
      );
    } else {
      router.push(
        `/comprar/pago-qr?tripId=${tripId}&clientId=${clientId}&source=dashboard`
      );
    }
  };

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
            {step === "review"
              ? "Confirmar Compra de Tickets"
              : "Seleccionar Método de Pago"}
          </h1>
          <p className="text-gray-600 mt-1">
            {step === "review"
              ? "Revisa los detalles antes de proceder al pago"
              : "Elige cómo deseas pagar tus tickets"}
          </p>
        </div>
      </div>

      {/* Pasos */}
      {step === "payment-selection" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-green-600 font-medium">Tickets Creados</span>
          </div>
          <div className="flex-1 h-1 bg-green-600 mx-4" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-orange-600 font-medium">Método de Pago</span>
          </div>
        </div>
      )}

      {step === "review" && (
        <form onSubmit={handleSubmit(createTicketsOnly)} className="space-y-6">
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
                      {trip.route?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Salida
                    </p>
                    <p className="font-medium mt-1">
                      {new Date(trip.departure_time).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(trip.departure_time).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
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
                          Bs.{" "}
                          {trip ? parseFloat(trip.price).toFixed(2) : "0.00"}
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
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Procesando...
                </>
              ) : (
                `Proceder al Pago → Bs. ${totalPrice.toFixed(2)}`
              )}
            </Button>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Al confirmar, se crearán {selectedSeats.length} ticket
              {selectedSeats.length > 1 ? "s" : ""} con estado "Pendiente". A
              continuación podrás seleccionar tu método de pago.
            </AlertDescription>
          </Alert>
        </form>
      )}

      {step === "payment-selection" && (
        <div className="space-y-6">
          {/* Resumen de Tickets Creados */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-green-600" />
                Tickets Creados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {createdTickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className="flex justify-between items-center p-3 bg-white rounded border"
                >
                  <div>
                    <p className="font-medium">{ticket.code}</p>
                    <p className="text-sm text-gray-600">
                      Asiento: {ticket.seat?.seat_code}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Método de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecciona Método de Pago</CardTitle>
              <CardDescription>
                Elige cómo deseas completar tu compra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("QR")}
                  className={`p-6 rounded-lg border-2 transition flex flex-col items-center gap-3 ${
                    paymentMethod === "QR"
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <QrCode className="h-12 w-12 text-blue-600" />
                  <div className="text-center">
                    <div className="font-semibold text-lg">Pago QR</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Escanea el código QR con tu billetera móvil
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("TARJETA")}
                  className={`p-6 rounded-lg border-2 transition flex flex-col items-center gap-3 ${
                    paymentMethod === "TARJETA"
                      ? "border-green-600 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="h-12 w-12 text-green-600" />
                  <div className="text-center">
                    <div className="font-semibold text-lg">Tarjeta</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Paga con tarjeta de crédito o débito
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Pago */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {createdTickets.length} ticket(s) × Bs.{" "}
                  {trip ? parseFloat(trip.price).toFixed(2) : "0.00"}
                </span>
                <span className="font-medium">
                  Bs.{" "}
                  {(
                    createdTickets.length * parseFloat(trip?.price || 0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="border-t-2 border-green-300 pt-4 flex justify-between">
                <span className="text-lg font-bold">Total a Pagar:</span>
                <span className="text-2xl font-bold text-green-600">
                  Bs.{" "}
                  {(
                    createdTickets.length * parseFloat(trip?.price || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Errores */}
          {backendError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{backendError}</AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStep("review");
                setCreatedTickets([]);
                setBackendError(null);
              }}
            >
              ← Volver
            </Button>
            <Button
              onClick={handlePaymentMethodSelection}
              disabled={createdTickets.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Continuar con {paymentMethod}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}