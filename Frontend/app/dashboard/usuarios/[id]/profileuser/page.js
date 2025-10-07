// app/dashboard/usuarios/[id]/profileuser/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Shield, 
  MapPin, 
  CreditCard,
  Bus,
  Ticket,
  FileText,
  Newspaper,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { EditProfileModal } from "@/components/EditProfileModal";

async function getUserProfile(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export default function UserProfilePage() {
  const params = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    const userData = await getUserProfile(params.id);
    setUser(userData);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const handleProfileUpdated = (updatedProfile) => {
    setUser({ ...user, profile: updatedProfile });
    loadProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Usuario no encontrado</p>
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
      {/* Header del perfil */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-orange-500 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {user.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={user.isActive ? "bg-green-500" : "bg-gray-500"}>
                    {user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user.roles?.name || "Sin rol"}
                  </Badge>
                  {user.isEmailVerified && (
                    <Badge variant="outline" className="bg-blue-50">
                      Email Verificado
                    </Badge>
                  )}
                  {user.isPhoneVerified && (
                    <Badge variant="outline" className="bg-blue-50">
                      Teléfono Verificado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
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
            {user.profile ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Nombre Completo</p>
                  <p className="font-medium">
                    {user.profile.firstName} {user.profile.lastName}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{user.profile.documentNumber || "No especificado"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{user.profile.phone || "No especificado"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </p>
                  <p className="font-medium">{user.profile.address || "No especificado"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Usuario</p>
                  <Badge variant={user.profile.isGuest ? "secondary" : "default"}>
                    {user.profile.isGuest ? "Invitado" : "Registrado"}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay información de perfil disponible
              </p>
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
              <p className="text-sm text-gray-500">ID de Usuario</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">{user.id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Fecha de Registro</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Última Actualización</p>
              <p className="font-medium">{formatDate(user.updatedAt)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Rol Asignado</p>
              <p className="font-medium">{user.roles?.name || "No asignado"}</p>
              {user.roles?.description && (
                <p className="text-xs text-gray-500 mt-1">{user.roles.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de Actividad */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
            <CardDescription>
              Estadísticas de uso y actividad del usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <Ticket className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{user.tickets?.length || 0}</p>
                <p className="text-sm text-gray-600">Tickets</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <Bus className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold">{user.buses?.length || 0}</p>
                <p className="text-sm text-gray-600">Buses</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold">{user.reports?.length || 0}</p>
                <p className="text-sm text-gray-600">Reportes</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-orange-50 rounded-lg">
                <Newspaper className="h-8 w-8 text-orange-600 mb-2" />
                <p className="text-2xl font-bold">{user.news?.length || 0}</p>
                <p className="text-sm text-gray-600">Noticias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Recientes */}
        {user.tickets && user.tickets.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets ({user.tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.tickets.slice(0, 5).map((ticket) => (
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
                        ticket.status === "CONFIRMADO"
                          ? "bg-green-500"
                          : ticket.status === "PENDIENTE"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                ))}
              </div>
              {user.tickets.length > 5 && (
                <Button variant="link" className="w-full mt-3">
                  Ver todos los tickets
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Buses Gestionados */}
        {user.buses && user.buses.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Buses Gestionados ({user.buses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.buses.map((bus) => (
                  <div
                    key={bus.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{bus.plate}</p>
                      <p className="text-sm text-gray-500">
                        {bus.model} - {bus.year}
                      </p>
                      <p className="text-xs text-gray-400">
                        Capacidad: {bus.capacity} - {bus.service_type}
                      </p>
                    </div>
                    <Badge
                      variant={bus.status === "DISPONIBLE" ? "default" : "secondary"}
                    >
                      {bus.status}
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
        user={user}
        onSuccess={handleProfileUpdated}
      />
    </div>
  );
}