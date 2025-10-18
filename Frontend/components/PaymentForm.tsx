// app/components/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface PaymentFormProps {
  amount: number;
  ticketCode: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  isLoading?: boolean;
}

export default function PaymentForm({
  amount,
  ticketCode,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'EFECTIVO' | 'TARJETA'>('QR');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Crear el pago en el backend
      const paymentResponse = await fetch('http://localhost:3001/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          category: 'adulto',
          notes: `Pago para ticket ${ticketCode}`,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Error al crear el pago');
      }

      const payment = await paymentResponse.json();

      // Simular procesamiento de pago (en producción, esto sería con Stripe, PayPal, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Confirmar el pago (cambiar estado a COMPLETO)
      const confirmResponse = await fetch(
        `http://localhost:3001/api/v1/payments/${payment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETO',
          }),
        }
      );

      if (!confirmResponse.ok) {
        throw new Error('Error al confirmar el pago');
      }

      onPaymentSuccess(payment.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Procesamiento de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monto */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Monto a pagar
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            Bs. {amount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">Ticket: {ticketCode}</p>
        </div>

        {/* Método de pago */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Método de pago</label>
          <div className="grid grid-cols-3 gap-2">
            {(['QR', 'EFECTIVO', 'TARJETA'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                disabled={processing || isLoading}
                className={`p-3 rounded-lg border-2 transition ${
                  paymentMethod === method
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } disabled:opacity-50`}
              >
                <div className="text-sm font-medium">{method}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Información del método */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {paymentMethod === 'QR' && (
              'Este es un pago simulado. En producción se integraría con QR Pay o similar.'
            )}
            {paymentMethod === 'EFECTIVO' && (
              'El cliente pagará en efectivo al abordar el bus.'
            )}
            {paymentMethod === 'TARJETA' && (
              'Se procesará con Stripe o tu pasarela de pago.'
            )}
          </AlertDescription>
        </Alert>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Nota de seguridad */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Esto es una simulación. No se realizará ningún cargo real.
          </AlertDescription>
        </Alert>

        {/* Botón de pago */}
        <Button
          onClick={handlePayment}
          disabled={processing || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Procesando pago...
            </>
          ) : (
            `Pagar Bs. ${amount.toFixed(2)}`
          )}
        </Button>

        {/* Info adicional */}
        <p className="text-xs text-gray-500 text-center">
          Al confirmar aceptas los términos y condiciones
        </p>
      </CardContent>
    </Card>
  );
}