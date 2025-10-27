"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
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
  Loader,
  AlertCircle,
} from "lucide-react";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PagoTarjetaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripId = searchParams.get("tripId");
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializePayment();
  }, [tripId, clientId]);

  const initializePayment = async () => {
    try {
      if (!tripId || !clientId) {
        throw new Error("Parámetros inválidos");
      }

      // Cargar cliente
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

      // Cargar información del viaje
      const tripRes = await fetch(`${API_BASE}/trips/${tripId}`);
      if (!tripRes.ok) throw new Error("Error al cargar el viaje");
      const tripData = await tripRes.json();
      setTrip(tripData);

      // Obtener layout del bus para mapear asientos
      const layoutRes = await fetch(`${API_BASE}/buses/${tripData.bus.id}/layout`);
      if (!layoutRes.ok) throw new Error("Error al cargar layout del bus");
      const layoutData = await layoutRes.json();

      // Mapear asientos
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

      allSeats = allSeats.map((seat) => ({
        ...seat,
        seat_code: seat.seat_code?.toUpperCase(),
      }));

      const mappedSeats = seats
        .map((code) => {
          const seat = allSeats.find(
            (s) => s.seat_code?.toUpperCase() === code.toUpperCase()
          );
          return seat;
        })
        .filter(Boolean);

      if (mappedSeats.length === 0) {
        throw new Error("No se pudieron mapear los asientos");
      }

      setSelectedSeats(mappedSeats);

      // Crear Payment Intent
      await createPaymentIntent(mappedSeats, tripData);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Error al inicializar");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (seats, tripData) => {
    try {
      console.log("💳 Creando Payment Intent...");

      const ticketsData = seats.map((seat) => ({
        tripId: tripId,
        seatId: seat.id,
        price: parseFloat(tripData.price),
        category: "adulto",
      }));

      const response = await fetch(`${API_BASE}/stripe/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickets: ticketsData,
          userProfileId: clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear Payment Intent");
      }

      const data = await response.json();
      console.log("✅ Payment Intent creado:", data.paymentIntentId);

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log("✅ Pago exitoso, confirmando...");

      // Confirmar el pago en el backend y crear tickets
      const response = await fetch(`${API_BASE}/stripe/confirm-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al confirmar el pago");
      }

      const data = await response.json();
      console.log("✅ Tickets creados:", data.tickets);

      // Limpiar sessionStorage
      sessionStorage.removeItem("purchaseClient");
      sessionStorage.removeItem("selectedSeats");

      toast.success("¡Pago confirmado y tickets creados!");

      // Redirigir al primer ticket
      if (data.tickets && data.tickets.length > 0) {
        router.push(`/tickets/${data.tickets[0].ticket_id}?payment=success`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error al confirmar el pago");
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-16 w-16 text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Preparando formulario de pago...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-300 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-6">{error}</p>
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

  const totalPrice = selectedSeats.length * parseFloat(trip?.price || 0);

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
            <h1 className="text-3xl font-bold text-gray-900">Pago con Tarjeta</h1>
            <p className="text-gray-600 mt-1">
              Completa tu información de pago de forma segura
            </p>
          </div>
        </div>

        {/* Info Cliente */}
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

        {/* Info Viaje */}
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
              </div>
              <div>
                <p className="text-gray-600">Asientos</p>
                <p className="font-medium mt-1">
                  {selectedSeats.map((s) => s.seat_code).join(", ")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-bold text-green-600 text-lg mt-1">
                  Bs. {totalPrice.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de Stripe */}
        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#16a34a",
                  colorBackground: "#ffffff",
                  colorText: "#1f2937",
                  colorDanger: "#ef4444",
                  fontFamily: "system-ui, sans-serif",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <StripeCheckoutForm
              amount={totalPrice}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}