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
  Shield, 
  MapPin,
  Bus,
  Ticket,
  FileText,
  Newspaper,
  Edit,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { EditProfileModal } from "../../components/EditProfileModal";
import { getUserWithStats } from "../../api/api-users";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserWithStats(params.id);
      console.log("Datos del usuario:", data);
      setUserData(data);
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      toast.error("Error al cargar el perfil del usuario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const handleProfileUpdated = () => {
    loadProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData || !userData.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-500">Usuario no encontrado</p>
          <Button 
            onClick={() => router.push("/dashboard/usuarios")} 
            className="mt-4"
          >
            Volver al listado
          </Button>
        </div>
      </div>
    );
  }

  const user = userData.user;
  const stats = userData.statistics || {};

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/usuarios")}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al listado
      </Button>

      {/* Header del perfil */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                {user.image_url ? (
                  <img src={user.image_url} alt={user.name} />
                ) : (
                  <AvatarFallback className="text-2xl bg-orange-500 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {user.profile?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.profile.email}
                    </div>
                  )}
                  {user.profile?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {user.profile.phone}
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
                  {stats.hasProfile && (
                    <Badge variant="outline" className="bg-blue-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Perfil Completo
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
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No hay información de perfil</p>
                <Button 
                  size="sm" 
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumen de Actividad
            </CardTitle>
            <CardDescription>
              Estadísticas de uso y actividad del usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <Ticket className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{stats.totalTickets || 0}</p>
                <p className="text-sm text-gray-600">Tickets Totales</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-gray-500">
                    {stats.confirmedTickets || 0} confirmados
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <Bus className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold">{stats.totalBuses || 0}</p>
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

            {stats.totalSpent > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Gasto Total en Tickets</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(stats.totalSpent)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets Recientes */}
        {user.tickets && user.tickets.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets Recientes ({user.tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.tickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{ticket.code}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(ticket.price)} - {formatDate(ticket.booking_date)}
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
                  Ver todos los {user.tickets.length} tickets
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
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
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