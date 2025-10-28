"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { generateInvoicePDF } from "./generateInvoicePDF";
import {
  ArrowLeft,
  User,
  Bus,
  MapPin,
  Calendar,
  QrCode,
  Loader,
  CheckCircle,
  AlertCircle,
  Download,
  MessageCircle,
  CreditCard,
} from "lucide-react";

const API_BASE = "http://localhost:3001/api/v1";

const generateSimulatedQR = (paymentId, amount) => {
  const text = `PAGO|${paymentId}|${amount}|${new Date().toISOString()}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    text
  )}`;
};

export default function PagoQRPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripId = searchParams.get("tripId");
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [client, setClient] = useState(null);
  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [payment, setPayment] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [step, setStep] = useState("creating");
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("QR");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    initializePayment();
  }, [tripId, clientId]);

  // Countdown para simulación de pago
  useEffect(() => {
    if (confirmingPayment && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [confirmingPayment, countdown]);

  const initializePayment = async () => {
    try {
      if (!tripId || !clientId) {
        throw new Error("Parámetros inválidos");
      }

      const savedClient = sessionStorage.getItem("purchaseClient");
      if (!savedClient) {
        throw new Error("Cliente no encontrado");
      }
      setClient(JSON.parse(savedClient));

      const savedSeats = sessionStorage.getItem("selectedSeats");
      if (!savedSeats) {
        throw new Error("No hay asientos seleccionados");
      }
      const seats = JSON.parse(savedSeats);
      if (seats.length === 0) {
        throw new Error("Debe seleccionar al menos un asiento");
      }

      const tripRes = await fetch(`${API_BASE}/trips/${tripId}`);
      if (!tripRes.ok) throw new Error("Error al cargar el viaje");
      const tripData = await tripRes.json();
      setTrip(tripData);

      const layoutRes = await fetch(
        `${API_BASE}/buses/${tripData.bus.id}/layout`
      );
      if (!layoutRes.ok) throw new Error("Error al cargar layout del bus");
      const layoutData = await layoutRes.json();

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
      await createPaymentAndQR(mappedSeats, tripData);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Error al inicializar");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentAndQR = async (seats, tripData) => {
    try {
      console.log("💳 Creando pago...");

      const totalAmount = seats.length * parseFloat(tripData.price);

      const paymentResponse = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          method: paymentMethod,
          category: "adulto",
          notes: `Compra web - ${seats.length} asientos: ${seats
            .map((s) => s.seat_code)
            .join(", ")}`,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || "Error al crear pago");
      }

      const paymentData = await paymentResponse.json();
      console.log("✅ Pago creado:", paymentData.id);

      setPayment(paymentData);
      const qr = generateSimulatedQR(paymentData.id, totalAmount);
      setQrUrl(qr);
      setStep("qr");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleSendToWhatsApp = () => {
    if (!client || !payment) return;

    const message = `
*Hola ${client.firstName}* 👋

Tu pago está listo. Aquí están tus instrucciones:

📋 *Información del Pago*
Monto: Bs. ${(selectedSeats.length * parseFloat(trip.price)).toFixed(2)}
Asientos: ${selectedSeats.map((s) => s.seat_code).join(", ")}

📱 *Cómo Pagar*
1. Escanea el código QR adjunto
2. Realiza el pago según las instrucciones
3. Confirma el pago en la app

❓ ¿Dudas? Responde este mensaje.
    `.trim();

    try {
      const whatsappUrl = `https://wa.me/${client.phone.replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      toast.info("Se abrirá WhatsApp en una nueva ventana");
    } catch (err) {
      toast.error("Error al enviar a WhatsApp");
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `qr-pago-${payment.id}.png`;
    link.click();
    toast.success("QR descargado");
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirmingPayment(true);
      setError(null);

      // Si es pago con tarjeta, usar Stripe
      if (paymentMethod === "TARJETA") {
        console.log("💳 Redirigiendo a formulario de tarjeta...");
        router.push(
          `/comprar/pago-tarjeta?tripId=${tripId}&clientId=${clientId}`
        );
        return;
      }

      // Para QR y otros métodos, mantener el flujo existente
      setCountdown(3);
      console.log("⏳ Simulando procesamiento de pago...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 1. Confirmar el pago
      console.log("✔️ Confirmando pago...");
      const confirmResponse = await fetch(
        `${API_BASE}/payments/${payment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETO",
          }),
        }
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.message || "Error al confirmar pago");
      }

      console.log("✅ Pago confirmado");

      // 2. Crear los tickets con el pago confirmado
      console.log("🎫 Creando tickets...");
      const ticketsCreated = [];
      const ticketErrors = [];

      for (const seat of selectedSeats) {
        try {
          const ticketData = {
            userProfileId: clientId,
            tripId: tripId,
            seatId: seat.id,
            price: parseFloat(trip.price),
            status: "CONFIRMADO",
            paymentId: payment.id,
          };

          const response = await fetch(`${API_BASE}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData),
          });

          const responseData = await response.json();

          if (!response.ok) {
            console.error(`❌ Error en ${seat.seat_code}:`, responseData);
            ticketErrors.push(
              `${seat.seat_code}: ${responseData.message || "Error"}`
            );
          } else {
            console.log(`✅ Ticket creado: ${seat.seat_code}`);
            ticketsCreated.push(responseData);
          }
        } catch (error) {
          console.error(`❌ Error en ${seat.seat_code}:`, error);
          ticketErrors.push(`${seat.seat_code}: ${error.message}`);
        }
      }

      if (ticketsCreated.length === 0) {
        throw new Error("No se pudieron crear los tickets");
      }

      if (ticketErrors.length > 0) {
        console.warn("Algunos tickets tuvieron errores:", ticketErrors);
        toast.warning(
          `${ticketErrors.length} asiento(s) no se pudieron procesar`
        );
      }

      setCreatedTickets(ticketsCreated);
      setStep("success");

      // Limpiar sessionStorage
      sessionStorage.removeItem("purchaseClient");
      sessionStorage.removeItem("selectedSeats");

      toast.success("¡Pago confirmado y tickets creados!");

      // Redirigir después de 3 segundos
      setTimeout(() => {
        const firstTicketId = ticketsCreated[0].ticket_id;
        router.push(`/tickets/${firstTicketId}?payment=success`);
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al confirmar pago";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConfirmingPayment(false);
      setCountdown(0);
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

  if (error && !payment) {
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

  if (step === "success") {
    const handleDownloadInvoice = async () => {
      try {
        await generateInvoicePDF(
          client,
          trip,
          createdTickets,
          payment,
          totalPrice
        );
        toast.success("Factura descargada correctamente");
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al descargar la factura");
      }
    };

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
              <CardContent className="pt-4 text-left space-y-3">
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
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Pago:</span>
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                    {payment?.id.substring(0, 12)}...
                  </code>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-blue-50 border-blue-200 mb-6">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Serás redirigido a tus tickets en unos segundos...
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3 mb-6">
              <Button
                onClick={handleDownloadInvoice}
                className="gap-2 bg-blue-600 hover:bg-blue-700 w-full"
              >
                <Download className="h-4 w-4" />
                Descargar Factura PDF
              </Button>
            </div>

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
              Proceso de Pago
            </h1>
            <p className="text-gray-600 mt-1">
              {step === "qr"
                ? "Escanea el código QR o confirma tu pago"
                : "Preparando información de pago"}
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
                <p className="text-gray-600">Teléfono</p>
                <p className="font-medium">
                  {client.phone || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Documento</p>
                <p className="font-medium">{client.documentNumber}</p>
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
                  {trip.route?.name}
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
                <p className="text-gray-600">Bus</p>
                <p className="font-medium mt-1">{trip.bus?.plate}</p>
              </div>
              <div>
                <p className="text-gray-600">Asientos</p>
                <p className="font-medium mt-1">
                  {selectedSeats.map((s) => s.seat_code).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Método de Pago */}
        {step === "qr" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Selecciona Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {["QR", "TARJETA"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      paymentMethod === method
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {method === "QR" && <QrCode className="h-6 w-6" />}
                    {method === "TARJETA" && <CreditCard className="h-6 w-6" />}
                    <span className="text-sm font-medium">{method}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Grande */}
        {qrUrl && step === "qr" && paymentMethod === "QR" && (
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <QrCode className="h-6 w-6 text-orange-600" />
                Tu Código QR
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-white p-8 rounded-lg inline-block shadow-lg">
                <img
                  src={qrUrl}
                  alt="QR de Pago"
                  className="w-64 h-64 mx-auto"
                />
              </div>

              <div className="space-y-3">
                <p className="text-gray-700 font-medium">
                  Monto a pagar:{" "}
                  <span className="text-2xl text-orange-600 font-bold">
                    Bs. {totalPrice.toFixed(2)}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  ID de Pago:{" "}
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    {payment?.id}
                  </code>
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  onClick={handleDownloadQR}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Descargar QR
                </Button>
                <Button
                  onClick={handleSendToWhatsApp}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar a WhatsApp
                </Button>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Esta es una simulación. Al confirmar, se procesará el pago
                  automáticamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Resumen y Confirmación */}
        {step === "qr" && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">
                  {selectedSeats.length} asiento(s) × Bs.{" "}
                  {parseFloat(trip?.price || 0).toFixed(2)}
                </span>
                <span className="font-medium">Bs. {totalPrice.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-green-400 pt-4 flex justify-between">
                <span className="text-xl font-bold">Total a Pagar:</span>
                <span className="text-2xl font-bold text-green-600">
                  Bs. {totalPrice.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón Confirmar */}
        {step === "qr" && (
          <Button
            onClick={handleConfirmPayment}
            disabled={confirmingPayment}
            className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
            size="lg"
          >
            {confirmingPayment ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Procesando pago... ({countdown}s)
              </>
            ) : (
              <>✓ Confirmar Pago</>
            )}
          </Button>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
