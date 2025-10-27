"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/v1";

export default function PagoExitosoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Sesión de pago inválida");
      setLoading(false);
      return;
    }

    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      console.log("🔍 Verificando pago...");

      // Extraer payment_intent de la URL
      const paymentIntent = searchParams.get("payment_intent");

      if (paymentIntent) {
        // Es un Payment Intent (formulario embebido)
        const response = await fetch(
          `${API_BASE}/stripe/confirm-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: paymentIntent }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al verificar el pago");
        }

        const data = await response.json();
        console.log("✅ Pago verificado:", data);

        setPaymentData(data);
        toast.success("¡Pago confirmado exitosamente!");

        // Limpiar sessionStorage
        sessionStorage.removeItem("purchaseClient");
        sessionStorage.removeItem("selectedSeats");

        // Redirigir al primer ticket después de 3 segundos
        setTimeout(() => {
          if (data.tickets && data.tickets.length > 0) {
            router.push(
              `/tickets/${data.tickets[0].ticket_id}?payment=success`
            );
          }
        }, 3000);
      } else if (sessionId) {
        // Es una sesión de Checkout (redirección a Stripe)
        const response = await fetch(
          `${API_BASE}/stripe/verify-payment?session_id=${sessionId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al verificar el pago");
        }

        const data = await response.json();
        console.log("✅ Pago verificado:", data);

        setPaymentData(data);
        toast.success("¡Pago confirmado exitosamente!");

        // Limpiar sessionStorage
        sessionStorage.removeItem("purchaseClient");
        sessionStorage.removeItem("selectedSeats");

        // Redirigir al primer ticket después de 3 segundos
        setTimeout(() => {
          if (data.tickets && data.tickets.length > 0) {
            router.push(
              `/tickets/${data.tickets[0].ticket_id}?payment=success`
            );
          }
        }, 3000);
      } else {
        throw new Error("No se encontró información de pago");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Error al verificar el pago");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-16 w-16 text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

          {paymentData && (
            <Card className="bg-white mb-6">
              <CardContent className="pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets comprados:</span>
                  <span className="font-bold">
                    {paymentData.tickets?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total pagado:</span>
                  <span className="font-bold text-green-600 text-xl">
                    Bs.{" "}
                    {parseFloat(paymentData.payment?.amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">Tarjeta de Crédito</span>
                </div>
              </CardContent>
            </Card>
          )}

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
                if (paymentData?.tickets && paymentData.tickets.length > 0) {
                  router.push(
                    `/tickets/${paymentData.tickets[0].ticket_id}?payment=success`
                  );
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Ver Mis Tickets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
