'use client';

import { useState } from 'react';
import { Copy, Mail, MessageCircle, Check, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ShareTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: {
    code: string;
    id: string;
    userProfile?: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
    user?: {
      email?: string;
    };
    price: number;
    trip?: {
      departure_time: string;
      route?: {
        originCity?: { name: string };
        destinationCity?: { name: string };
      };
    };
  };
  qrCode?: string;
}

export function ShareTicketModal({
  open,
  onClose,
  ticket,
  qrCode,
}: ShareTicketModalProps) {
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'email' | 'link'>('link');
  const [email, setEmail] = useState(ticket.user?.email || '');
  const [phone, setPhone] = useState(ticket.userProfile?.phone || '');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const ticketUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tickets/${ticket.id}`;
  const passengerName = ticket.userProfile
    ? `${ticket.userProfile.firstName} ${ticket.userProfile.lastName}`
    : 'Cliente';

  const departureDate = ticket.trip?.departure_time
    ? new Date(ticket.trip.departure_time).toLocaleDateString('es-BO')
    : 'N/A';

  const departureTime = ticket.trip?.departure_time
    ? new Date(ticket.trip.departure_time).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const route = ticket.trip?.route
    ? `${ticket.trip.route.originCity?.name || '?'} → ${ticket.trip.route.destinationCity?.name || '?'}`
    : 'N/A';

  // Mensaje personalizado
  const messageText = `
🎫 *TICKET DE VIAJE CONFIRMADO*

Pasajero: ${passengerName}
Código: ${ticket.code}
Ruta: ${route}
Fecha: ${departureDate}
Hora: ${departureTime}
Precio: Bs. ${parseFloat(String(ticket.price)).toFixed(2)}

Ver ticket completo: ${ticketUrl}

¡Gracias por viajar con nosotros! 🚌
`.trim();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(ticketUrl);
    toast.success('Enlace copiado al portapapeles');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!phone) {
      toast.error('Número de teléfono no disponible');
      return;
    }

    // Formato: país + número (ejemplo: +591 72234567)
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappPhone = cleanPhone.startsWith('591')
      ? `+${cleanPhone}`
      : `+591${cleanPhone}`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Abriendo WhatsApp...');
  };

  const handleEmail = async () => {
    if (!email) {
      toast.error('Email no disponible');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/email/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          ticketId: ticket.id,
          passengerName,
          ticketCode: ticket.code,
          route,
          departureDate,
          departureTime,
          price: ticket.price,
          ticketUrl,
          qrCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar email');
      }

      toast.success('Email enviado exitosamente');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Ticket</DialogTitle>
          <DialogDescription>
            Envía tu ticket a través de WhatsApp, Email o comparte el enlace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opciones */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShareMethod('link')}
              className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                shareMethod === 'link'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Copy className="w-5 h-5" />
              <span className="text-xs font-medium">Enlace</span>
            </button>

            <button
              onClick={() => setShareMethod('whatsapp')}
              className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                shareMethod === 'whatsapp'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">WhatsApp</span>
            </button>

            <button
              onClick={() => setShareMethod('email')}
              className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                shareMethod === 'email'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Mail className="w-5 h-5" />
              <span className="text-xs font-medium">Email</span>
            </button>
          </div>

          {/* Contenido según método */}
          {shareMethod === 'link' && (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-600 mb-2">Enlace del ticket:</p>
                <p className="text-sm font-mono break-all text-gray-900">{ticketUrl}</p>
              </div>
              <Button
                onClick={handleCopyLink}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={success}
              >
                {success ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Enlace
                  </>
                )}
              </Button>
            </div>
          )}

          {shareMethod === 'whatsapp' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Número de WhatsApp
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+591 72234567"
                  className="mb-2"
                />
                {!phone && (
                  <Alert className="mb-3 bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-sm">
                      No hay número de WhatsApp registrado
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-600 mb-2">Mensaje a enviar:</p>
                <p className="text-xs text-gray-900 whitespace-pre-wrap">
                  {messageText}
                </p>
              </div>

              <Button
                onClick={handleWhatsApp}
                disabled={!phone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar por WhatsApp
              </Button>
            </div>
          )}

          {shareMethod === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@example.com"
                  className="mb-2"
                />
                {!email && (
                  <Alert className="mb-3 bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-sm">
                      No hay email registrado
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm">
                  Se enviará el ticket con el QR y toda la información del viaje
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleEmail}
                disabled={!email || sending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {sending ? (
                  <>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar por Email
                  </>
                )}
              </Button>
            </div>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-sm text-green-800">
                ✓ Compartido exitosamente
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}