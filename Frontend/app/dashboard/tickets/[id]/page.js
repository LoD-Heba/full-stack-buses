import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTicket } from "../api/api-tickets";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  User,
  MapPin,
  Calendar,
  DollarSign,
  Bus,
  Armchair,
  CreditCard,
  Ticket as TicketIcon,
} from "lucide-react";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

export default async function TicketDetailPage({ params }) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  try {
    const ticket = await getTicket(id);

    const passengerName = ticket.user?.profile
      ? `${ticket.user.profile.firstName} ${ticket.user.profile.lastName}`
      : ticket.user?.email || "No disponible";

    const documentNumber =
      ticket.user?.profile?.documentNumber || "No disponible";

    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Detalle del Ticket</h1>
            <p className="text-gray-600">Código: {ticket.code}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/tickets/${id}/edit`}>
              <Button variant="outline">Editar</Button>
            </Link>
            <Link href="/dashboard/tickets">
              <Button variant="default">Volver</Button>
            </Link>
          </div>
        </div>

        {/* Estado del ticket */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TicketIcon className="w-12 h-12 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Estado del Ticket</p>
                  <Badge
                    className={`${
                      STATUS_COLORS[ticket.status]
                    } text-lg px-4 py-1`}
                  >
                    {ticket.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Precio</p>
                <p className="text-3xl font-bold text-green-600">
                  Bs. {parseFloat(ticket.price).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Pasajero */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Pasajero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-medium">{passengerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{ticket.user?.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documento</p>
                <p className="font-medium">{documentNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">
                  {ticket.user?.profile?.phone || "No disponible"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Viaje */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Información del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Ruta</p>
                <p className="font-medium text-lg">
                  {ticket.trip?.route?.originCity?.name || "?"} →{" "}
                  {ticket.trip?.route?.destinationCity?.name || "?"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha y Hora de Salida</p>
                <p className="font-medium">
                  {ticket.trip?.departure_time
                    ? new Date(ticket.trip.departure_time).toLocaleString(
                        "es-ES",
                        {
                          dateStyle: "full",
                          timeStyle: "short",
                        }
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duración Estimada</p>
                <p className="font-medium">
                  {ticket.trip?.route?.duration
                    ? `${ticket.trip.route.duration} horas`
                    : "No disponible"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Bus y Asiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Bus y Asiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Bus</p>
                <p className="font-medium">
                  {ticket.trip?.bus?.plate || "No disponible"} -{" "}
                  {ticket.trip?.bus?.model || ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Servicio</p>
                <p className="font-medium capitalize">
                  {ticket.trip?.bus?.service_type?.replace("_", " ") ||
                    "No disponible"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Asiento</p>
                  <div className="flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-orange-500" />
                    <p className="text-2xl font-bold">
                      {ticket.seat?.seat_number || "-"}
                    </p>
                    <span className="text-sm text-gray-500">
                      ({ticket.seat?.seat_code || "-"})
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Asiento</p>
                  <p className="font-medium capitalize">
                    {ticket.seat?.type?.replace("_", " ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-medium capitalize">
                    {ticket.seat?.seat_type?.replace("_", " ") || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.payment ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Método de Pago</p>
                    <p className="font-medium capitalize">
                      {ticket.payment.payment_method?.replace("_", " ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado del Pago</p>
                    <Badge
                      className={
                        ticket.payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : ticket.payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {ticket.payment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-medium text-lg">
                      Bs. {parseFloat(ticket.payment.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Pago</p>
                    <p className="font-medium">
                      {new Date(ticket.payment.payment_date).toLocaleString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    No hay información de pago asociada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información Adicional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha de Reserva</p>
                <p className="font-medium">
                  {new Date(ticket.booking_date).toLocaleString("es-ES")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Creación</p>
                <p className="font-medium">
                  {new Date(ticket.created_at).toLocaleString("es-ES")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Última Actualización</p>
                <p className="font-medium">
                  {new Date(ticket.updated_at).toLocaleString("es-ES")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error al cargar el ticket:", error);
    notFound();
  }
}
