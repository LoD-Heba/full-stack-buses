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
} from "lucide-react";
import { toast } from "sonner";
import { EditProfileModal } from "../../../usuarios/components/EditProfileModal";

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

  const loadProfile = async () => {
    setLoading(true);
    const clientData = await getClientProfile(params.id);
    setClient(clientData);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const handleProfileUpdated = (updatedProfile) => {
    setClient({ ...client, profile: updatedProfile });
    loadProfile();
  };

  const handleGoToTickets = () => {
    router.push(`/dashboard/tickets?clientId=${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Cargando perfil...</p>
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
                  {client.isEmailVerified && (
                    <Badge variant="outline" className="bg-blue-50">
                      Email Verificado
                    </Badge>
                  )}
                  {client.isPhoneVerified && (
                    <Badge variant="outline" className="bg-blue-50">
                      Teléfono Verificado
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
              <Button onClick={handleGoToTickets}>
                <Ticket/>
                Ver Tickets
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

        {/* Estadísticas de Actividad */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
            <CardDescription>
              Historial de tickets del cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <Ticket className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{client.tickets?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Tickets</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <Ticket className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold">
                  {client.tickets?.filter(t => t.status === "CONFIRMED")?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Confirmados</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-orange-50 rounded-lg">
                <Ticket className="h-8 w-8 text-orange-600 mb-2" />
                <p className="text-2xl font-bold">
                  {client.tickets?.filter(t => t.status === "PENDING")?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Recientes */}
        {client.tickets && client.tickets.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Tickets Recientes ({client.tickets.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleGoToTickets}>
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {client.tickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{ticket.code}</p>
                      <p className="text-sm text-gray-500">
                        Bs. {ticket.price} - {formatDate(ticket.booking_date)}
                      </p>
                    </div>
                    <Badge
                      className={
                        ticket.status === "CONFIRMED"
                          ? "bg-green-500"
                          : ticket.status === "PENDING"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Edición */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={client}
        onSuccess={handleProfileUpdated}
      />
    </div>
  );
}