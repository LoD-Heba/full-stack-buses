"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Bus as BusIcon,
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  DollarSign,
  Route as RouteIcon,
  Loader2,
} from "lucide-react";
import { getBus, getBusStatistics, deleteBus } from "../api/api-buses";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG = {
  disponible: {
    label: "Disponible",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "✓",
  },
  en_uso: {
    label: "En uso",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "●",
  },
  mantenimiento: {
    label: "Mantenimiento",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "⚙",
  },
  fuera_de_servicio: {
    label: "Fuera de servicio",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "✕",
  },
};

const SERVICE_TYPE_LABELS = {
  normal: "Normal",
  semi_cama: "Semi Cama",
  cama: "Cama",
};

export default function BusDetailPage() {
  const [bus, setBus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadBusData();
    }
  }, [params.id]);

  const loadBusData = async () => {
    try {
      setLoading(true);
      const [busData, statsData] = await Promise.all([
        getBus(params.id),
        getBusStatistics(params.id),
      ]);
      setBus(busData);
      setStatistics(statsData.statistics);
    } catch (error) {
      toast.error("Error al cargar los datos del bus");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBus(params.id);
      toast.success("Bus eliminado exitosamente");
      router.push("/dashboard/buses");
    } catch (error) {
      toast.error(error.message || "Error al eliminar el bus");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Bus no encontrado</p>
        <Link href="/dashboard/buses">
          <Button className="mt-4">Volver a la lista</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[bus.status] || STATUS_CONFIG.disponible;
  
  // Procesar URL de imagen
  const imageUrl = bus.image_url 
    ? (bus.image_url.startsWith('http') ? bus.image_url : `http://localhost:3001${bus.image_url}`)
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/buses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BusIcon className="h-8 w-8 text-orange-500" />
              {bus.plate}
            </h1>
            <p className="text-gray-500 mt-1">{bus.model}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/buses/${bus.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Imagen y Estado */}
        <div className="space-y-6">
          {/* Imagen del Bus */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={bus.plate}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BusIcon className="h-20 w-20 text-gray-300" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`w-full justify-center py-2 text-base ${statusConfig.color}`}
              >
                <span className="mr-2">{statusConfig.icon}</span>
                {statusConfig.label}
              </Badge>
            </CardContent>
          </Card>

          {/* Usuario Responsable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Usuario</p>
                <p className="font-medium">{bus.user?.email || bus.user?.username || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Central - Información General */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Placa</p>
                  <p className="font-semibold text-lg">{bus.plate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Modelo</p>
                  <p className="font-semibold">{bus.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año</p>
                  <p className="font-semibold">{bus.year || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capacidad</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {bus.capacity || 0} asientos
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Servicio</p>
                  <Badge variant="secondary" className="mt-1">
                    {SERVICE_TYPE_LABELS[bus.service_type] || bus.service_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stack de Asientos</p>
                  <p className="font-semibold">
                    {bus.stacks ? (
                      <span className="text-green-600">✓ Asignado</span>
                    ) : (
                      <span className="text-gray-400">Sin asignar</span>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600 mb-2">Amenidades</p>
                <p className="text-sm">{bus.amenities || "No especificadas"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <RouteIcon className="h-5 w-5" />
                      <p className="text-sm font-medium">Viajes</p>
                    </div>
                    <p className="text-2xl font-bold">{statistics.totalTrips}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {statistics.completedTrips} completados
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <Users className="h-5 w-5" />
                      <p className="text-sm font-medium">Tickets</p>
                    </div>
                    <p className="text-2xl font-bold">{statistics.totalTickets}</p>
                    <p className="text-xs text-gray-600 mt-1">vendidos</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <DollarSign className="h-5 w-5" />
                      <p className="text-sm font-medium">Ingresos</p>
                    </div>
                    <p className="text-2xl font-bold">
                      ${statistics.totalRevenue.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <TrendingUp className="h-5 w-5" />
                      <p className="text-sm font-medium">Utilización</p>
                    </div>
                    <p className="text-2xl font-bold">{statistics.utilizationRate}%</p>
                    <p className="text-xs text-gray-600 mt-1">promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rutas Asignadas */}
          {bus.routes && bus.routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rutas Asignadas ({bus.routes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bus.routes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">{route.origin} → {route.destination}</p>
                          <p className="text-sm text-gray-600">
                            Distancia: {route.distance_km} km
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{route.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Viajes Recientes */}
          {bus.trips && bus.trips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Viajes Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bus.trips.slice(0, 5).map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">
                            {new Date(trip.departure_time).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trip.route?.origin} → {trip.route?.destination}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{trip.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este bus?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el bus <strong>{bus.plate}</strong>.
              {bus.trips && bus.trips.length > 0 && (
                <span className="block mt-2 text-yellow-600">
                  ⚠️ Este bus tiene {bus.trips.length} viajes registrados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}