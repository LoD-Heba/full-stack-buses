"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Edit,
  ArrowLeft,
  Ticket,
  Plus,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { EditProfileModal } from "../../../usuarios/components/EditProfileModal";
import { getUserTicketHistory } from "../../../tickets/api/api-tickets";
import { TicketPreviewModal } from "../../../tickets/components/ticket-preview-modal";
import { exportSingleTicketToPDF } from "../../../tickets/utils/export-pdf";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-500 text-white",
  CONFIRMADO: "bg-green-500 text-white",
  CANCELADO: "bg-red-500 text-white",
};

async function getClientProfile(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch client profile");
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return null;
  }
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketHistory, setTicketHistory] = useState({
    upcoming: [],
    past: [],
    cancelled: [],
  });
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [previewTicket, setPreviewTicket] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    const clientData = await getClientProfile(params.id);
    setClient(clientData);
    setLoading(false);
  };

  const loadTicketHistory = async () => {
    if (!params.id) return;
    
    setLoadingTickets(true);
    try {
      const history = await getUserTicketHistory(params.id);
      setTicketHistory(history);
    } catch (error) {
      console.error("Error al cargar tickets:", error);
      toast.error("Error al cargar el historial de tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadTicketHistory();
  }, [params.id]);

  const handleProfileUpdated = (updatedProfile) => {
    setClient({ ...client, profile: updatedProfile });
    loadProfile();
  };

  const handleAddTicket = () => {
    if (!client.profile || !client.profile.firstName || !client.profile.lastName || !client.profile.documentNumber) {
      toast.error("El cliente debe completar su perfil antes de comprar tickets", {
        description: "Nombre, apellido y documento son requeridos",
      });
      setIsEditModalOpen(true);
      return;
    }
    router.push(`/dashboard/tickets/nuevo?clientId=${params.id}`);
  };

  const handlePreviewTicket = (ticket) => {
    const formattedTicket = {
      code: ticket.code,
      status: ticket.status,
      passenger: `${client.profile?.firstName || ""} ${client.profile?.lastName || ""}`.trim() || client.name,
      document: client.profile?.documentNumber || "Sin documento",
      trip_route: `${ticket.trip?.route?.originCity?.name || "?"} → ${ticket.trip?.route?.destinationCity?.name || "?"}`,
      departure_time: new Date(ticket.trip?.departure_time).toLocaleString("es-ES"),
      bus_plate: ticket.trip?.bus?.plate || "—",
      seat: ticket.seat?.seat_number || "—",
      price: ticket.price,
      booking_date: new Date(ticket.booking_date).toLocaleDateString("es-ES"),
    };
    
    setPreviewTicket(formattedTicket);
    setShowPreview(true);
  };

  const handleExportTicket = (ticket) => {
    const formattedTicket = {
      code: ticket.code,
      status: ticket.status,
      passenger: `${client.profile?.firstName || ""} ${client.profile?.lastName || ""}`.trim() || client.name,
      document: client.profile?.documentNumber || "Sin documento",
      trip_route: `${ticket.trip?.route?.originCity?.name || "?"} → ${ticket.trip?.route?.destinationCity?.name || "?"}`,
      departure_time: new Date(ticket.trip?.departure_time).toLocaleString("es-ES"),
      bus_plate: ticket.trip?.bus?.plate || "—",
      seat: ticket.seat?.seat_number || "—",
      price: ticket.price,
      booking_date: new Date(ticket.booking_date).toLocaleDateString("es-ES"),
    };
    
    try {
      exportSingleTicketToPDF(formattedTicket);
      toast.success(`Ticket ${ticket.code} exportado a PDF`);
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar el ticket");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Cliente no encontrado</p>
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalTickets = ticketHistory.upcoming.length + ticketHistory.past.length + ticketHistory.cancelled.length;
  const hasCompleteProfile = client.profile && client.profile.firstName && client.profile.lastName && client.profile.documentNumber;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/clientes")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a clientes
      </Button>

      {/* Header del perfil */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-blue-500 text-white">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">{client.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {client.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={client.isActive ? "bg-green-500" : "bg-gray-500"}>
                    {client.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  {hasCompleteProfile ? (
                    <Badge className="bg-green-500">
                      ✓ Perfil Completo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      ⚠ Perfil Incompleto
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                onClick={handleAddTicket}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.profile ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Nombre Completo</p>
                  <p className="font-medium">
                    {client.profile.firstName} {client.profile.lastName}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{client.profile.documentNumber || "No especificado"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{client.profile.phone || "No especificado"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </p>
                  <p className="font-medium">{client.profile.address || "No especificado"}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No hay información de perfil disponible
                </p>
                <Button onClick={() => setIsEditModalOpen(true)}>
                  Crear Perfil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">ID de Cliente</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">{client.id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Fecha de Registro</p>
              <p className="font-medium">{formatDate(client.createdAt)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Última Actualización</p>
              <p className="font-medium">{formatDate(client.updatedAt)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Tipo de Usuario</p>
              <Badge variant="outline">Cliente</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de Tickets */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumen de Tickets</CardTitle>
            <CardDescription>
              Estadísticas del historial de viajes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <Ticket className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{totalTickets}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <Ticket className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold">{ticketHistory.upcoming.length}</p>
                <p className="text-sm text-gray-600">Próximos</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Ticket className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-2xl font-bold">{ticketHistory.past.length}</p>
                <p className="text-sm text-gray-600">Completados</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <Ticket className="h-8 w-8 text-red-600 mb-2" />
                <p className="text-2xl font-bold">{ticketHistory.cancelled.length}</p>
                <p className="text-sm text-gray-600">Cancelados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Próximos */}
        {ticketHistory.upcoming.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-green-600" />
                Próximos Viajes ({ticketHistory.upcoming.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticketHistory.upcoming.map((ticket) => (
                  <Card key={ticket.ticket_id} className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-lg">{ticket.code}</p>
                            <Badge className={STATUS_COLORS[ticket.status]}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Ruta:</span>{" "}
                            {ticket.trip?.route?.originCity?.name} → {ticket.trip?.route?.destinationCity?.name}
                          </p>
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Salida:</span>{" "}
                            {new Date(ticket.trip?.departure_time).toLocaleString("es-ES")}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>Asiento: {ticket.seat?.seat_number}</span>
                            <span>Bus: {ticket.trip?.bus?.plate}</span>
                            <span className="font-semibold text-green-700">Bs. {parseFloat(ticket.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewTicket(ticket)}
                            className="text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportTicket(ticket)}
                            className="text-purple-600"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Viajes */}
        {(ticketHistory.past.length > 0 || ticketHistory.cancelled.length > 0) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Historial de Viajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...ticketHistory.past, ...ticketHistory.cancelled]
                  .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))
                  .slice(0, 10)
                  .map((ticket) => (
                    <div
                      key={ticket.ticket_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{ticket.code}</p>
                          <Badge className={STATUS_COLORS[ticket.status]}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {ticket.trip?.route?.originCity?.name} → {ticket.trip?.route?.destinationCity?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(ticket.booking_date)} | Bs. {parseFloat(ticket.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportTicket(ticket)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensaje cuando no hay tickets */}
        {totalTickets === 0 && (
          <Card className="md:col-span-2 border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay tickets registrados
              </h3>
              <p className="text-gray-500 mb-6">
                Este cliente aún no ha comprado ningún ticket de viaje
              </p>
              {hasCompleteProfile ? (
                <Button
                  onClick={handleAddTicket}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Ticket
                </Button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-yellow-800 mb-3">
                    El cliente debe completar su perfil antes de comprar tickets
                  </p>
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Completar Perfil
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Edición de Perfil */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={client}
        onSuccess={handleProfileUpdated}
      />

      {/* Modal de Vista Previa del Ticket */}
      <TicketPreviewModal
        ticket={previewTicket}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}