"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Bus,
  MapPin,
  Calendar,
  Armchair,
  CreditCard,
  Loader,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const API_BASE = "http://localhost:3001/api/v1";

export default function PagoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripId = searchParams.get("tripId");
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [client, setClient] = useState(null);
  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("QR");
  const [createdTickets, setCreatedTickets] = useState([]);
  const [step, setStep] = useState("creating"); // "creating" -> "payment" -> "success"
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Validar parámetros
        if (!tripId || !clientId) {
          throw new Error("Parámetros inválidos");
        }

        // Cargar cliente de sessionStorage
        const savedClient = sessionStorage.getItem("purchaseClient");
        if (!savedClient) {
          throw new Error("Cliente no encontrado");
        }
        setClient(JSON.parse(savedClient));

        // Cargar asientos seleccionados
        const savedSeats = sessionStorage.getItem("selectedSeats");
        if (!savedSeats) {
          throw new Error("No hay asientos seleccionados");
        }
        const seats = JSON.parse(savedSeats);
        if (seats.length === 0) {
          throw new Error("Debe seleccionar al menos un asiento");
        }
        setSelectedSeats(seats);

        // Cargar información del viaje
        const tripRes = await fetch(`${API_BASE}/trips/${tripId}`);
        if (!tripRes.ok) throw new Error("Error al cargar el viaje");
        const tripData = await tripRes.json();
        setTrip(tripData);

        // Obtener layout del bus para mapear asientos
        const layoutRes = await fetch(
          `${API_BASE}/buses/${tripData.bus.id}/layout`
        );
        if (!layoutRes.ok) throw new Error("Error al cargar layout del bus");
        const layoutData = await layoutRes.json();

        // Extraer todos los asientos del bus
        let allSeats = [];
        if (layoutData.decks && Array.isArray(layoutData.decks)) {
          layoutData.decks.forEach((deck) => {
            if (deck.layout && Array.isArray(deck.layout)) {
              const deckSeats = deck.layout.filter(
                (seat) =>
                  seat.visual_type === "seat" &&
                  seat.id &&
                  seat.seat_code &&
                  seat.seat_code.trim() !== ""
              );
              allSeats.push(...deckSeats);
            }
          });
        }

        // Normalizar códigos
        allSeats = allSeats.map((seat) => ({
          ...seat,
          seat_code: seat.seat_code?.toUpperCase(),
        }));

        // Mapear los códigos seleccionados a los objetos completos de asientos
        const mappedSeats = seats
          .map((code) => {
            const seat = allSeats.find(
              (s) => s.seat_code?.toUpperCase() === code.toUpperCase()
            );
            if (!seat) {
              console.warn(`⚠️ Asiento no encontrado: ${code}`);
            }
            return seat;
          })
          .filter(Boolean);

        if (mappedSeats.length === 0) {
          throw new Error("No se pudieron mapear los asientos seleccionados");
        }

        setSelectedSeats(mappedSeats);

        // Crear tickets automáticamente
        await createTickets(mappedSeats, tripData);
      } catch (err) {
        console.error("Error al inicializar pago:", err);
        setError(err.message || "Error al inicializar el proceso de pago");
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [tripId, clientId]);

  const createTickets = async (seats, tripData) => {
    try {
      console.log("📤 Creando tickets...");

      const ticketsCreated = [];
      const ticketErrors = [];

      for (const seat of seats) {
        try {
          const ticketData = {
            userProfileId: clientId,
            tripId: tripId,
            seatId: seat.id,
            price: parseFloat(tripData.price),
            status: "PENDIENTE",
          };

          const response = await fetch(`${API_BASE}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData),
          });

          const responseData = await response.json();

          if (!response.ok) {
            console.error(`❌ Error en asiento ${seat.seat_code}:`, responseData);
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
        throw new Error(
          `Errores al crear algunos tickets:\n${ticketErrors.join("\n")}`
        );
      }

      setCreatedTickets(ticketsCreated);
      setStep("payment");
      toast.success(
        `${ticketsCreated.length} ticket${
          ticketsCreated.length > 1 ? "s" : ""
        } creado${ticketsCreated.length > 1 ? "s" : ""}`
      );
    } catch (error) {
      throw error;
    }
  };

  const handlePayment = async () => {
    try {
      setProcessingPayment(true);
      setError(null);

      if (createdTickets.length === 0) {
        throw new Error("No hay tickets para pagar");
      }

      const totalAmount = createdTickets.reduce(
        (sum, ticket) => sum + parseFloat(ticket.price),
        0
      );

      // 1. Crear el pago
      console.log("💳 Creando pago...");
      const paymentResponse = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          method: paymentMethod,
          category: "adulto",
          notes: `Compra web - ${createdTickets.length} ticket(s): ${createdTickets
            .map((t) => t.code)
            .join(", ")}`,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || "Error al crear el pago");
      }

      const payment = await paymentResponse.json();
      console.log("✅ Pago creado:", payment.id);

      // 2. Simular procesamiento
      console.log("⏳ Procesando pago...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Confirmar el pago
      console.log("✔️ Confirmando pago...");
      const confirmResponse = await fetch(`${API_BASE}/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETO",
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error("Error al confirmar el pago");
      }

      console.log("✅ Pago confirmado");

      // 4. Actualizar tickets con payment_id y cambiar a CONFIRMADO
      console.log("🔗 Vinculando tickets con pago...");
      const updateTicketPromises = createdTickets.map((ticket) =>
        fetch(`${API_BASE}/tickets/${ticket.ticket_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: payment.id,
            status: "CONFIRMADO",
          }),
        })
      );

      const updateResults = await Promise.all(updateTicketPromises);
      const allUpdatesOk = updateResults.every((res) => res.ok);

      if (!allUpdatesOk) {
        throw new Error("Error al actualizar tickets");
      }

      console.log("✅ Tickets confirmados");

      // Limpiar sessionStorage
      sessionStorage.removeItem("purchaseClient");
      sessionStorage.removeItem("selectedSeats");

      setStep("success");
      toast.success("¡Pago procesado exitosamente!");

      // Redirigir después de mostrar éxito
      setTimeout(() => {
        const firstTicketId = createdTickets[0].ticket_id;
        router.push(`/tickets/${firstTicketId}?payment=success`);
      }, 3000);
    } catch (error) {
      console.error("Error en handlePayment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al procesar el pago";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-16 w-16 text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Preparando tu compra...</p>
        </div>
      </div>
    );
  }

  if (error && !createdTickets.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-6 whitespace-pre-line">{error}</p>
            <Button
              onClick={() => router.push("/salidas")}
              className="bg-red-600 hover:bg-red-700"
            >
              Volver a Salidas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = createdTickets.reduce(
    (sum, ticket) => sum + parseFloat(ticket.price),
    0
  );

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-green-300 shadow-2xl">
          <CardContent className="pt-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">
                ¡Pago Exitoso!
              </h2>
              <p className="text-green-700 text-lg">
                Tu compra se ha procesado correctamente
              </p>
            </div>

            <Card className="bg-white mb-6">
              <CardContent className="pt-4">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tickets comprados:</span>
                    <span className="font-bold">{createdTickets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total pagado:</span>
                    <span className="font-bold text-green-600 text-xl">
                      Bs. {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium">{paymentMethod}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-blue-50 border-blue-200 mb-6">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Serás redirigido a tu ticket en unos segundos...
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/salidas")}
                variant="outline"
                className="flex-1"
              >
                Volver a Salidas
              </Button>
              <Button
                onClick={() => {
                  const firstTicketId = createdTickets[0].ticket_id;
                  router.push(`/tickets/${firstTicketId}?payment=success`);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Ver Mi Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
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
              Procesar Pago
            </h1>
            <p className="text-gray-600 mt-1">
              Completa tu compra para confirmar tu viaje
            </p>
          </div>
        </div>

        {/* Indicador de progreso */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-green-600 font-medium text-sm">
              Datos del Cliente
            </span>
          </div>
          <div className="flex-1 h-1 bg-green-600 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-green-600 font-medium text-sm">
              Asientos
            </span>
          </div>
          <div className="flex-1 h-1 bg-green-600 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-green-600 font-medium text-sm">
              Tickets Creados
            </span>
          </div>
          <div className="flex-1 h-1 bg-orange-600 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
              4
            </div>
            <span className="text-orange-600 font-medium text-sm">Pago</span>
          </div>
        </div>

        {/* Información del Cliente */}
        {client && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información del Pasajero
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Nombre</p>
                <p className="font-medium">
                  {client.firstName} {client.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Documento</p>
                <p className="font-medium">{client.documentNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Teléfono</p>
                <p className="font-medium">{client.phone || "No especificado"}</p>
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
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
            </CardContent>
          </Card>
        )}

        {/* Tickets Creados */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Armchair className="h-5 w-5 text-purple-600" />
              Tickets Creados ({createdTickets.length})
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
                <div className="text-right">
                  <Badge className="bg-yellow-100 text-yellow-800 mb-1">
                    {ticket.status}
                  </Badge>
                  <p className="text-sm font-medium">
                    Bs. {parseFloat(ticket.price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Método de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Selecciona el Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {["QR", "EFECTIVO", "TARJETA"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  disabled={processingPayment}
                  className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === method
                      ? "border-orange-600 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {method === "QR" && "📱"}
                      {method === "EFECTIVO" && "💵"}
                      {method === "TARJETA" && "💳"}
                    </div>
                    <div className="text-sm font-medium">{method}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Pago */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between text-lg">
              <span className="text-gray-700">
                {createdTickets.length} ticket(s) × Bs.{" "}
                {trip ? parseFloat(trip.price).toFixed(2) : "0.00"}
              </span>
              <span className="font-medium">
                Bs. {totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="border-t-2 border-orange-400 pt-4 flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">
                Total a Pagar:
              </span>
              <span className="text-3xl font-bold text-orange-600">
                Bs. {totalPrice.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Errores */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Información importante */}
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Este es un pago simulado para demostración. Al confirmar, se
            procesará tu compra y recibirás tu código QR para abordar el bus.
          </AlertDescription>
        </Alert>

        {/* Botones de Acción */}
        <div className="flex gap-3 pb-8">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={processingPayment}
          >
            ← Volver
          </Button>
          <Button
            onClick={handlePayment}
            disabled={processingPayment || createdTickets.length === 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-lg py-6"
            size="lg"
          >
            {processingPayment ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Procesando pago...
              </>
            ) : (
              <>
                Confirmar Pago de Bs. {totalPrice.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}