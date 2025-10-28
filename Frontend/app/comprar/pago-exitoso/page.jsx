"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, CheckCircle, AlertCircle, Eye, Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { TicketPreviewModal } from "@/app/dashboard/tickets/components/ticket-preview-modal";
import { exportSingleTicketToPDF, exportTicketsToPDF } from "@/app/dashboard/tickets/utils/export-pdf";

const API_BASE = "http://localhost:3001/api/v1";

export default function PagoExitosoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [previewTicket, setPreviewTicket] = useState(null);
  const [showPreview, setShowPreview] = useState(false)
  const [ticketsFormatted, setTicketsFormatted] = useState([]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentIntent = searchParams.get("payment_intent");

    console.log("🔍 URL params:", { sessionId, paymentIntent });

    if (!sessionId && !paymentIntent) {
      setError("No se encontró información de pago en la URL");
      setLoading(false);
      return;
    }

    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const sessionId = searchParams.get("session_id");
      const paymentIntent = searchParams.get("payment_intent");

      console.log("🔍 Verificando pago...");
      console.log("SessionId:", sessionId);
      console.log("PaymentIntent:", paymentIntent);

      let response;

      if (paymentIntent) {
        console.log("💳 Procesando Payment Intent...");
        
        response = await fetch(`${API_BASE}/stripe/confirm-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent }),
        });
      } else if (sessionId) {
        console.log("🛒 Procesando Checkout Session...");
        
        response = await fetch(
          `${API_BASE}/stripe/verify-payment?session_id=${sessionId}`
        );
      } else {
        throw new Error("No se encontró información de pago");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al verificar el pago");
      }

      const data = await response.json();
      console.log("✅ Pago verificado:", data);

      setPaymentData(data);
      
      // Formatear tickets para el modal y PDF
      if (data.tickets && data.tickets.length > 0) {
        const formatted = data.tickets.map(ticket => ({
          id: ticket.ticket_id,
          code: ticket.code,
          price: ticket.price,
          status: ticket.status,
          booking_date: new Date(ticket.booking_date).toLocaleDateString("es-ES"),
          passenger: ticket.userProfile
            ? `${ticket.userProfile.firstName} ${ticket.userProfile.lastName}`
            : ticket.user?.profile
            ? `${ticket.user.profile.firstName} ${ticket.user.profile.lastName}`
            : ticket.user?.email || "-",
          document: ticket.userProfile?.documentNumber || 
                   ticket.user?.profile?.documentNumber || 
                   "No especificado",
          trip_route: ticket.trip?.route?.name || "-",
          departure_time: ticket.trip?.departure_time
            ? new Date(ticket.trip.departure_time).toLocaleString("es-ES")
            : "-",
          seat: ticket.seat?.seat_code || ticket.seat?.seat_number || "-",
          bus_plate: ticket.trip?.bus?.plate || "-",
          payment_status: data.payment?.status || "COMPLETO",
        }));
        
        setTicketsFormatted(formatted);
      }

      toast.success("¡Pago confirmado exitosamente!");

      // Limpiar sessionStorage
      sessionStorage.removeItem("purchaseClient");
      sessionStorage.removeItem("selectedSeats");
    } catch (err) {
      console.error("❌ Error al verificar pago:", err);
      setError(err.message || "Error al verificar el pago");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (ticket) => {
    setPreviewTicket(ticket);
    setShowPreview(true);
  };

  const handleExportSingle = (ticket) => {
    try {
      exportSingleTicketToPDF(ticket);
      toast.success(`Factura ${ticket.code} descargada`);
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar la factura");
    }
  };

  const handleExportAll = () => {
    try {
      if (ticketsFormatted.length === 0) {
        toast.error("No hay tickets para exportar");
        return;
      }
      exportTicketsToPDF(ticketsFormatted);
      toast.success(`${ticketsFormatted.length} facturas descargadas en un PDF`);
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar las facturas");
    }
  };

  const handlePrintTicket = (ticket) => {
    // Abrir el modal de preview que incluye la función de impresión
    handlePreview(ticket);
    // El usuario podrá imprimir desde el modal
    toast.info("Usa el botón 'Imprimir Factura' en el modal");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-16 w-16 text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
          <p className="mt-2 text-sm text-gray-500">Por favor espera...</p>
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
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/salidas")}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Volver a Salidas
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Reintentar Verificación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl border-green-300 shadow-2xl">
          <CardContent className="pt-8">
            {/* Encabezado de éxito */}
            <div className="text-center mb-6">
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

            {/* Resumen del pago */}
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
                      Bs. {parseFloat(paymentData.payment?.amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-medium">Tarjeta de Crédito</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-bold text-green-600">COMPLETADO</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de tickets con acciones */}
            {ticketsFormatted.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tus Tickets ({ticketsFormatted.length})
                  </h3>
                  {ticketsFormatted.length > 1 && (
                    <Button
                      onClick={handleExportAll}
                      size="sm"
                      variant="outline"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Todas
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {ticketsFormatted.map((ticket) => (
                    <Card key={ticket.id} className="bg-white border-2 hover:border-green-300 transition">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-lg text-orange-600">
                                {ticket.code}
                              </span>
                              <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                {ticket.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Pasajero:</span> {ticket.passenger}
                              </div>
                              <div>
                                <span className="font-medium">Asiento:</span> {ticket.seat}
                              </div>
                              <div>
                                <span className="font-medium">Ruta:</span> {ticket.trip_route}
                              </div>
                              <div>
                                <span className="font-medium">Precio:</span>{" "}
                                <span className="text-green-600 font-semibold">
                                  Bs. {parseFloat(ticket.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handlePreview(ticket)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => handleExportSingle(ticket)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={() => handlePrintTicket(ticket)}
                            >
                              <Printer className="w-4 h-4 mr-1" />
                              Imprimir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <Card className="bg-blue-50 border-blue-200 mb-6">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Importante:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Puedes descargar o imprimir tus facturas en cualquier momento</li>
                      <li>Presenta el código QR al momento de abordar</li>
                      <li>Llegada 15 minutos antes de la hora de salida</li>
                      <li>Conserva tu ticket como comprobante de viaje</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones principales */}
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/salidas")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Volver a Salidas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de previsualización */}
      <TicketPreviewModal
        ticket={previewTicket}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
}