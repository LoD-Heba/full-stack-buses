// app/components/CheckoutFlow.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import PaymentForm from './PaymentForm';
import TicketQRDisplay from './TicketQRDisplay';
import TicketPurchaseConfirmation from './TicketPurchaseConfirmation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CheckoutFlowProps {
  ticketCode: string;
  ticketId: string;
  totalAmount: number;
  tripInfo: {
    origin: string;
    destination: string;
    departureTime: string;
    price: number;
  };
}

type CheckoutStep = 'payment' | 'confirmation' | 'qr';

export default function CheckoutFlow({
  ticketCode,
  ticketId,
  totalAmount,
  tripInfo,
}: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('payment');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentSuccess = (newPaymentId: string) => {
    setPaymentId(newPaymentId);
    setCurrentStep('confirmation');
    setError(null);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleConfirmationComplete = () => {
    setCurrentStep('qr');
  };

  const handleDownloadTicket = () => {
    // Aquí puedes agregar lógica para descargar el ticket
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div
            className={`flex flex-col items-center ${
              currentStep === 'payment' ? 'text-blue-600' : 'text-green-600'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                currentStep === 'payment' ? 'bg-blue-600' : 'bg-green-600'
              }`}
            >
              1
            </div>
            <span className="text-sm mt-2 font-medium">Pago</span>
          </div>

          <div className="flex-1 h-1 bg-gray-300 mx-4 relative top-5">
            {(currentStep === 'confirmation' || currentStep === 'qr') && (
              <div className="h-full bg-green-600 transition-all duration-300" />
            )}
          </div>

          <div
            className={`flex flex-col items-center ${
              currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                currentStep === 'confirmation' || currentStep === 'qr'
                  ? 'bg-green-600'
                  : 'bg-gray-300'
              }`}
            >
              2
            </div>
            <span className="text-sm mt-2 font-medium">Confirmación</span>
          </div>

          <div className="flex-1 h-1 bg-gray-300 mx-4 relative top-5">
            {currentStep === 'qr' && (
              <div className="h-full bg-green-600 transition-all duration-300" />
            )}
          </div>

          <div
            className={`flex flex-col items-center ${
              currentStep === 'qr' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                currentStep === 'qr' ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              3
            </div>
            <span className="text-sm mt-2 font-medium">QR</span>
          </div>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="space-y-6">
        {currentStep === 'payment' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Paso 1: Procesamiento de Pago</h2>
            <PaymentForm
              amount={totalAmount}
              ticketCode={ticketCode}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {currentStep === 'confirmation' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Paso 2: Confirmación de Pago</h2>
            <TicketPurchaseConfirmation
              ticketId={ticketId}
              ticketCode={ticketCode}
              tripInfo={tripInfo}
            />
            <Button
              onClick={handleConfirmationComplete}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Continuar a Descargar QR →
            </Button>
          </div>
        )}

        {currentStep === 'qr' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Paso 3: Tu Código QR</h2>
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Compra completada! Tu pago ha sido procesado exitosamente.
              </AlertDescription>
            </Alert>
            <TicketQRDisplay ticketId={ticketId} />
          </div>
        )}
      </div>
    </div>
  );
}