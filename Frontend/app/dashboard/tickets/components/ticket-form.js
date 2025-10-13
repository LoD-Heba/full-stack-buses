"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTicket, getAvailableSeatsForTrip } from "../api/api-tickets";
import {
  ArrowLeft,
  User,
  Ticket as TicketIcon,
  Bus,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [backendError, setBackendError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      userId: clientId || "",
      tripId: "",
      seatId: "",
      price: "",
    },
  });

  const watchTripId = watch("tripId");

  // Cargar información del cliente
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3001/api/v1/users/${clientId}`
        );
        const data = await res.json();

        if (
          !data.profile ||
          !data.profile.firstName ||
          !data.profile.lastName ||
          !data.profile.documentNumber
        ) {
          toast.error("El cliente debe tener un perfil completo");
          router.push("/dashboard/clientes");
          return;
        }

        setClientInfo(data);
        setValue("userId", clientId);
      } catch (error) {
        console.error("Error al cargar cliente:", error);
        toast.error("Error al cargar información del cliente");
        router.push("/dashboard/clientes");
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, [clientId]);

  // Cargar viajes disponibles
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/v1/trips/available");
        const data = await res.json();
        setTrips(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar viajes:", error);
        toast.error("Error al cargar viajes disponibles");
      }
    };

    fetchTrips();
  }, []);

  useEffect(() => {
    const fetchAvailableSeats = async () => {
      if (!watchTripId) {
        setAvailableSeats([]);
        setSelectedTrip(null);
        return;
      }

      try {
        // Usar la nueva función del API
        const { trip, availableSeats: seats } = await getAvailableSeatsForTrip(
          watchTripId
        );

        setSelectedTrip(trip);
        setAvailableSeats(seats);

        // Establecer el precio del viaje
        if (trip.price) {
          setValue("price", trip.price);
        }

        // Limpiar asiento seleccionado si ya no está disponible
        const currentSeatId = watch("seatId");
        if (currentSeatId && !seats.find((s) => s.id === currentSeatId)) {
          setValue("seatId", "");
        }
      } catch (error) {
        console.error("Error al cargar asientos:", error);
        toast.error("Error al cargar asientos disponibles");
        setAvailableSeats([]);
        setSelectedTrip(null);
      }
    };

    fetchAvailableSeats();
  }, [watchTripId]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setBackendError(null);

      if (!data.userId) {
        toast.error("Debe seleccionar un cliente");
        return;
      }

      if (!data.tripId) {
        toast.error("Debe seleccionar un viaje");
        return;
      }

      if (!data.seatId) {
        toast.error("Debe seleccionar un asiento");
        return;
      }

      const ticketData = {
        userId: data.userId,
        tripId: data.tripId,
        seatId: data.seatId,
        price: parseFloat(data.price),
        status: "PENDIENTE",
      };

      await createTicket(ticketData);
      toast.success("Ticket creado exitosamente");
      router.push(`/dashboard/clientes/${clientId}/perfil`);
    } catch (error) {
      console.error("Error al crear ticket:", error);
      setBackendError(error.message || "Error al crear el ticket");
      toast.error(error.message || "Error al crear el ticket");
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/clientes")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a clientes
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-orange-600" />
            Nuevo Ticket
          </CardTitle>
          <CardDescription>
            Cree un nuevo ticket de viaje para el cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Información del Cliente */}
            {clientInfo && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Cliente Seleccionado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre Completo</p>
                      <p className="font-medium">
                        {clientInfo.profile.firstName}{" "}
                        {clientInfo.profile.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Documento</p>
                      <p className="font-medium">
                        {clientInfo.profile.documentNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">
                        {clientInfo.email || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">
                        {clientInfo.profile.phone ||
                          clientInfo.phone ||
                          "No especificado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selección de Viaje */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Seleccionar Viaje</h3>
              </div>

              <div>
                <Label>Viaje *</Label>
                <Select
                  onValueChange={(value) => setValue("tripId", value)}
                  value={watchTripId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione un viaje" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">
                        No hay viajes disponibles
                      </div>
                    ) : (
                      trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {trip.route?.originCity?.name || "?"} →{" "}
                              {trip.route?.destinationCity?.name || "?"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Salida:{" "}
                              {new Date(trip.departure_time).toLocaleString(
                                "es-ES"
                              )}{" "}
                              | Bus: {trip.bus?.plate || "?"} | Precio: Bs.{" "}
                              {trip.price}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.tripId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.tripId.message}
                  </p>
                )}
              </div>

              {/* Información del viaje seleccionado */}
              {selectedTrip && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Ruta
                        </p>
                        <p className="font-medium">
                          {selectedTrip.route?.originCity?.name} →{" "}
                          {selectedTrip.route?.destinationCity?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Salida
                        </p>
                        <p className="font-medium">
                          {new Date(
                            selectedTrip.departure_time
                          ).toLocaleDateString("es-ES")}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(
                            selectedTrip.departure_time
                          ).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Bus className="h-4 w-4" />
                          Bus
                        </p>
                        <p className="font-medium">{selectedTrip.bus?.plate}</p>
                        <p className="text-xs text-gray-600">
                          {selectedTrip.bus?.model}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Asientos Disponibles</p>
                        <p className="font-medium text-lg text-green-600">
                          {availableSeats.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Selección de Asiento */}
            {availableSeats.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {availableSeats.length} asientos disponibles
                  </p>
                  {selectedTrip && (
                    <p className="text-sm text-gray-600">
                      Capacidad total: {selectedTrip.bus?.capacity || 0}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Asiento *</Label>
                  <Select onValueChange={(value) => setValue("seatId", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione un asiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeats.map((seat) => (
                        <SelectItem key={seat.id} value={seat.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50">
                              {seat.seat_number}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {seat.stacks?.name || "Piso"} -{" "}
                              {seat.seat_type || "Estándar"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.seatId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.seatId.message}
                    </p>
                  )}
                </div>

                {/* Visualización de asientos disponibles */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {availableSeats.slice(0, 40).map((seat) => {
                    const isSelected = watch("seatId") === seat.id;

                    return (
                      <Button
                        key={seat.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setValue("seatId", seat.id)}
                        className={`h-14 flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-green-50 hover:bg-green-100 border-green-300"
                        }`}
                      >
                        <span className="text-lg font-bold">
                          {seat.seat_number}
                        </span>
                        <span className="text-xs">{seat.seat_code}</span>
                      </Button>
                    );
                  })}
                </div>
                {availableSeats.length > 40 && (
                  <p className="text-sm text-gray-500 text-center">
                    y {availableSeats.length - 40} asientos más disponibles...
                  </p>
                )}
                {availableSeats.length === 0 && (
                  <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600 font-medium">
                      No hay asientos disponibles en este viaje
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Precio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Precio</h3>
              </div>

              <div>
                <Label>Precio del Ticket (Bs.) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("price", {
                    required: "El precio es obligatorio",
                    min: {
                      value: 0.01,
                      message: "El precio debe ser mayor a 0",
                    },
                  })}
                  placeholder="0.00"
                  className="mt-1"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            {/* Error del backend */}
            {backendError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-center font-medium">
                  {backendError}
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Link href="/dashboard/clientes">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!watchTripId || availableSeats.length === 0}
              >
                Crear Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
