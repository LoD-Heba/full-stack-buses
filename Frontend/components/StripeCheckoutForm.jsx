"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, CreditCard, AlertCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function StripeCheckoutForm({ amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();

      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/comprar/pago-exitoso`,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Si llegamos aquí, el pago fue exitoso
      onSuccess?.();
    } catch (err) {
      console.error("Error en pago:", err);
      setError(err.message || "Error al procesar el pago");
      onError?.(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stripe Payment Element */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <PaymentElement
              options={{
                layout: "tabs",
                defaultValues: {
                  billingDetails: {
                    email: "test@example.com",
                  },
                },
              }}
            />
          </div>

          {/* Monto a pagar */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total a pagar:</span>
              <span className="text-2xl font-bold text-green-600">
                Bs. {amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Información de seguridad */}
          <Alert className="bg-blue-50 border-blue-200">
            <Lock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Tu pago está protegido por Stripe. No guardamos información de tu
              tarjeta.
            </AlertDescription>
          </Alert>

          {/* Botón de pago */}
          <Button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            size="lg"
          >
            {processing ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Procesando pago...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Pagar Bs. {amount.toFixed(2)}
              </>
            )}
          </Button>

          {/* Tarjetas de prueba */}
          <ProtectedRoute>
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <p className="font-semibold">Tarjetas de prueba:</p>
              <p>Éxito: 4242 4242 4242 4242</p>
              <p>Falla: 4000 0000 0000 0002</p>
              <p>3D Secure: 4000 0027 6000 3184</p>
              <p className="text-gray-400">
                CVV: cualquier 3 dígitos | Fecha: cualquier futura
              </p>
            </div>
          </ProtectedRoute>
        </CardContent>
      </Card>
    </form>
  );
}
