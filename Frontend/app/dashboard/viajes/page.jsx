"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter } from "next/navigation";
import { tripsAPI, routesAPI } from "./api/tripsApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Play,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function TripsManagement() {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTripForTicket, setSelectedTripForTicket] = useState(null);

  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const router = useRouter();
  const fetchBuses = async () => {
    try {
      const response = await fetch(`${API_URL}/buses?limit=100`);
      const data = await response.json();
      setBuses(data.data || []);
    } catch (error) {
      console.error("Error al cargar buses:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routesAPI.getAll(100);
      setRoutes(data.data || []);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
      showAlert("Error al cargar rutas", "error");
    }
  };

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "success" }),
      3000
    );
  };

  useEffect(() => {
    const loadClient = async () => {
      if (clientId) {
        try {
          const response = await fetch(`${API_URL}/clients/${clientId}`);
          const data = await response.json();
          setSelectedClient(data);
        } catch (error) {
          console.error("Error al cargar cliente:", error);
          showAlert("Error al cargar información del cliente", "error");
        }
      }
    };

    loadClient();
  }, [clientId]);

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      departure_time: "",
      arrival_time: "",
      price: "",
      status: "SCHEDULED",
      busId: "",
      routeId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (trip) => {
    if (trip.status === "IN_PROGRESS" || trip.status === "COMPLETED") {
      showAlert(
        "No se puede editar un viaje en progreso o completado",
        "error"
      );
      return;
    }
    setModalMode("edit");
    setSelectedTrip(trip);
    setFormData({
      departure_time: new Date(trip.departure_time).toISOString().slice(0, 16),
      arrival_time: new Date(trip.arrival_time).toISOString().slice(0, 16),
      price: trip.price,
      status: trip.status,
      busId: trip.bus?.id || "",
      routeId: trip.route?.id || "",
    });
    setIsModalOpen(true);
  };

  const openViewModal = (trip) => {
    setSelectedTrip(trip);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Validar que todos los campos estén completos
      if (!formData.routeId || !formData.busId || !formData.price) {
        showAlert("Por favor complete todos los campos obligatorios", "error");
        return;
      }

      // Validar que la fecha de salida no sea en el pasado
      const departureDate = new Date(formData.departure_time);
      const now = new Date();

      if (departureDate < now) {
        showAlert("La fecha de salida no puede ser en el pasado", "error");
        return;
      }

      // Validar anticipación mínima de 2 horas
      const hoursUntilDeparture =
        (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilDeparture < 2) {
        showAlert(
          "Los viajes deben crearse con al menos 2 horas de anticipación",
          "error"
        );
        return;
      }

      // Validar que la fecha de llegada sea posterior a la salida
      const arrivalDate = new Date(formData.arrival_time);
      if (arrivalDate <= departureDate) {
        showAlert(
          "La fecha de llegada debe ser posterior a la fecha de salida",
          "error"
        );
        return;
      }

      // Validar duración del viaje (30 min - 24 horas)
      const tripDurationHours =
        (arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60);
      if (tripDurationHours < 0.5) {
        showAlert("La duración mínima de un viaje es 30 minutos", "error");
        return;
      }
      if (tripDurationHours > 24) {
        showAlert("La duración máxima de un viaje es 24 horas", "error");
        return;
      }

      // Validar horario comercial (5 AM - 11 PM)
      const departureHour = departureDate.getHours();
      if (departureHour < 5 || departureHour >= 23) {
        showAlert(
          "Los viajes solo pueden programarse entre las 5:00 AM y las 11:00 PM",
          "error"
        );
        return;
      }

      // Validar precio positivo
      if (parseFloat(formData.price) <= 0) {
        showAlert("El precio debe ser mayor a 0", "error");
        return;
      }

      // Preparar datos para envío
      const submitData = {
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        price: parseFloat(formData.price),
        busId: formData.busId,
        routeId: formData.routeId,
        status: formData.status || "SCHEDULED",
      };

      if (modalMode === "create") {
        await tripsAPI.create(submitData);
        showAlert("Viaje creado exitosamente");
      } else {
        await tripsAPI.update(selectedTrip.id, submitData);
        showAlert("Viaje actualizado exitosamente");
      }

      setIsModalOpen(false);
      fetchTrips();
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este viaje?")) return;

    try {
      await tripsAPI.delete(id);
      showAlert("Viaje eliminado exitosamente");
      fetchTrips();
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      if (action === "start") {
        await tripsAPI.start(id);
        showAlert("Viaje iniciado exitosamente");
      } else if (action === "complete") {
        await tripsAPI.complete(id);
        showAlert("Viaje completado exitosamente");
      } else if (action === "cancel") {
        await tripsAPI.cancel(id);
        showAlert("Viaje cancelado exitosamente");
      }

      fetchTrips();
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      trip.route?.origin?.toLowerCase().includes(searchLower) ||
      trip.route?.destination?.toLowerCase().includes(searchLower) ||
      trip.bus?.license_plate?.toLowerCase().includes(searchLower) ||
      trip.status?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          statusConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const [formData, setFormData] = useState({
    departure_time: `${new Date().toISOString().split("T")[0]}T08:00`, // Fecha actual + 8:00 AM
    arrival_time: `${new Date().toISOString().split("T")[0]}T18:00`, // Fecha actual + 6:00 PM
    price: "",
    status: "SCHEDULED",
    busId: "",
    routeId: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const statusOptions = [
    {
      value: "SCHEDULED",
      label: "Programado",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "IN_PROGRESS",
      label: "En Progreso",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "COMPLETED",
      label: "Completado",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "CANCELLED",
      label: "Cancelado",
      color: "bg-red-100 text-red-800",
    },
  ];

  useEffect(() => {
    fetchTrips();
    fetchBuses();
    fetchRoutes();
  }, [pagination.page]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsAPI.getAll(pagination.page, pagination.limit);
      setTrips(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.meta?.total || 0,
      }));
    } catch (error) {
      showAlert("Error al cargar los viajes", "error");
    } finally {
      setLoading(false);
    }
  };
  ////////////////////////////////////////////////////
  useEffect(() => {
    const loadBusesForRoute = async () => {
      if (formData.routeId) {
        try {
          const response = await fetch(
            `${API_URL}/routes/${formData.routeId}/buses`
          );
          const data = await response.json();
          setFilteredBuses(data || []);

          // Limpiar bus seleccionado si ya no está disponible
          if (formData.busId && !data.find((b) => b.id === formData.busId)) {
            setFormData((prev) => ({ ...prev, busId: "" }));
          }
        } catch (error) {
          console.error("Error al cargar buses de la ruta:", error);
          setFilteredBuses([]);
        }
      } else {
        setFilteredBuses([]);
        setFormData((prev) => ({ ...prev, busId: "" }));
      }
    };

    loadBusesForRoute();
  }, [formData.routeId]);
  ////////////////////////////////////////////////////////
  const handleSelectTrip = (trip) => {
    // Validar que el viaje sea válido
    if (!trip.status === "SCHEDULED") {
      showAlert("Este viaje no está disponible para compra", "error");
      return;
    }

    if (!trip.available_seats || trip.available_seats === 0) {
      showAlert("No hay asientos disponibles en este viaje", "error");
      return;
    }

    // ✅ REDIRECCIÓN CORREGIDA: Ir a dashboard/asientos
    router.push(`/dashboard/asientos?tripId=${trip.id}&clientId=${clientId}`);
  };
  /////////////////////////////////////////////////////////
  return (
    <div className="space-y-6">
      {alert.show && (
        <Alert
          className={
            alert.type === "error"
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }
        >
          <AlertDescription
            className={
              alert.type === "error" ? "text-red-800" : "text-green-800"
            }
          >
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Viajes</h1>
          <p className="text-gray-600 mt-1">
            {clientId
              ? "Seleccione un viaje para el cliente"
              : "Administra los viajes programados"}
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Viaje
        </Button>
      </div>

      {clientId && selectedClient && (
        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 text-white rounded-full p-2">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    Cliente Seleccionado:
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                  <p className="text-sm text-blue-600">
                    C.I.: {selectedClient.documentNumber}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/clientes")}
                className="text-blue-700 border-blue-300"
              >
                Cambiar Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Crear Nuevo Viaje" : "Editar Viaje"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="routeId">Ruta *</Label>
                <Select
                  value={formData.routeId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, routeId: value, busId: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        <div className="flex flex-col">
                          <span>{route.name}</span>
                          <span className="text-xs text-gray-500">
                            {route.buses?.length || 0} bus(es) asignado(s)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="busId">Bus *</Label>
                <Select
                  value={formData.busId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, busId: value })
                  }
                  disabled={!formData.routeId} // Deshabilitar si no hay ruta
                >
                  {formData.busId &&
                    filteredBuses.find((b) => b.id === formData.busId) && (
                      <p className="text-green-600 text-xs mt-1">
                        ✅ Bus válido con{" "}
                        {filteredBuses
                          .find((b) => b.id === formData.busId)
                          ?.stacks?.seats?.filter((s) => s.is_active).length ||
                          0}{" "}
                        asientos activos
                      </p>
                    )}
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.routeId
                          ? "Primero seleccione una ruta"
                          : filteredBuses.length === 0
                          ? "No hay buses disponibles"
                          : "Seleccionar bus"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBuses.length === 0 && formData.routeId ? (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        No hay buses asignados a esta ruta con asientos
                        configurados
                      </div>
                    ) : (
                      filteredBuses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.plate} - {bus.model}
                          <span className="text-xs text-gray-500 ml-2">
                            (
                            {bus.stacks?.seats?.filter((s) => s.is_active)
                              .length || 0}{" "}
                            asientos)
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.routeId && filteredBuses.length === 0 && (
                  <p className="text-yellow-600 text-xs mt-1">
                    ⚠️ Esta ruta no tiene buses asignados con asientos
                    configurados
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="departure_time">Fecha de Salida *</Label>
                <Input
                  id="departure_date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]} // No permitir fechas pasadas
                  value={formData.departure_time.split("T")[0] || ""}
                  onChange={(e) => {
                    const currentTime =
                      formData.departure_time.split("T")[1] || "08:00";
                    setFormData({
                      ...formData,
                      departure_time: `${e.target.value}T${currentTime}`,
                    });
                  }}
                  className="mb-2"
                />
                <Label htmlFor="departure_time_hour">Hora de Salida *</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Anticipación 2 horas | Horarios 5AM - 11PM
                </p>
                <Select
                  value={formData.departure_time.split("T")[1] || "08:00"}
                  onValueChange={(value) => {
                    const currentDate =
                      formData.departure_time.split("T")[0] ||
                      new Date().toISOString().split("T")[0];
                    setFormData({
                      ...formData,
                      departure_time: `${currentDate}T${value}`,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {/* Generar horarios cada 30 minutos */}
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2)
                        .toString()
                        .padStart(2, "0");
                      const minute = i % 2 === 0 ? "00" : "30";
                      const time = `${hour}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="arrival_time">Fecha de Llegada *</Label>

                <Input
                  id="arrival_date"
                  type="date"
                  min={
                    formData.departure_time.split("T")[0] ||
                    new Date().toISOString().split("T")[0]
                  }
                  value={formData.arrival_time.split("T")[0] || ""}
                  onChange={(e) => {
                    const currentTime =
                      formData.arrival_time.split("T")[1] || "18:00";
                    setFormData({
                      ...formData,
                      arrival_time: `${e.target.value}T${currentTime}`,
                    });
                  }}
                  className="mb-2"
                />
                <Label htmlFor="arrival_time_hour">Hora de Llegada *</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Duración: Entre 30 minutos y 24 horas
                </p>
                <Select
                  value={formData.arrival_time.split("T")[1] || "18:00"}
                  onValueChange={(value) => {
                    const currentDate =
                      formData.arrival_time.split("T")[0] ||
                      new Date().toISOString().split("T")[0];
                    setFormData({
                      ...formData,
                      arrival_time: `${currentDate}T${value}`,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2)
                        .toString()
                        .padStart(2, "0");
                      const minute = i % 2 === 0 ? "00" : "30";
                      const time = `${hour}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {modalMode === "create" ? "Crear Viaje" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Viaje</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Ruta</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div>
                        <div className="font-semibold">{routes.name}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500">Bus</Label>
                    <div className="mt-1">
                      <div className="font-semibold">
                        {selectedTrip.bus?.license_plate}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedTrip.bus?.model}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500">Estado</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTrip.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Salida</Label>
                    <div className="mt-1">
                      <div className="font-semibold">
                        {new Date(selectedTrip.departure_time).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500">Llegada</Label>
                    <div className="mt-1">
                      <div className="font-semibold">
                        {new Date(selectedTrip.arrival_time).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500">Precio</Label>
                    <div className="mt-1">
                      <div className="font-semibold text-green-600 text-xl">
                        ${parseFloat(selectedTrip.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500">
                      Asientos Disponibles
                    </Label>
                    <div className="mt-1">
                      <div className="font-semibold text-lg">
                        {selectedTrip.available_seats}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTrip.tickets && selectedTrip.tickets.length > 0 && (
                <div>
                  <Label className="text-gray-500 mb-2 block">
                    Tickets Vendidos ({selectedTrip.tickets.length})
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-4">Usuario</th>
                          <th className="text-left py-2 px-4">Asiento</th>
                          <th className="text-left py-2 px-4">Estado</th>
                          <th className="text-right py-2 px-4">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrip.tickets.map((ticket) => (
                          <tr key={ticket.ticket_id} className="border-t">
                            <td className="py-2 px-4">
                              {ticket.user?.email || "N/A"}
                            </td>
                            <td className="py-2 px-4">
                              {ticket.seat?.seat_number || "N/A"}
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  ticket.status === "CONFIRMED"
                                    ? "bg-green-100 text-green-800"
                                    : ticket.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right font-medium">
                              ${parseFloat(ticket.price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Viajes ({filteredTrips.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron viajes
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Ruta</th>
                      <th className="text-left py-3 px-4">Bus</th>
                      <th className="text-left py-3 px-4">Salida</th>
                      <th className="text-left py-3 px-4">Llegada</th>
                      <th className="text-left py-3 px-4">Precio</th>
                      <th className="text-left py-3 px-4">Asientos</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      {clientId && (
                        <th className="text-right py-3 px-4">Seleccionar</th>
                      )}{" "}
                      <th className="text-right py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map((trip) => (
                      <tr key={trip.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {trip.route?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {trip.bus?.license_plate}
                          </div>
                          <div className="text-sm text-gray-500">
                            {trip.bus?.model}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm">
                                {new Date(
                                  trip.departure_time
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  trip.departure_time
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm">
                                {new Date(
                                  trip.arrival_time
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  trip.arrival_time
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-green-600">
                            <DollarSign className="w-4 h-4" />
                            {parseFloat(trip.price).toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {trip.available_seats}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(trip.status)}
                        </td>
                        {clientId && (
                          <td className="py-3 px-4 text-right">
                            {trip.status === "SCHEDULED" &&
                            trip.available_seats > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleSelectTrip(trip)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Seleccionar
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {trip.status !== "SCHEDULED"
                                  ? "No disponible"
                                  : "Sin asientos"}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-end">
                            {trip.status === "SCHEDULED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "start")
                                }
                                title="Iniciar viaje"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {trip.status === "IN_PROGRESS" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "complete")
                                }
                                title="Completar viaje"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {trip.status === "SCHEDULED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "cancel")
                                }
                                title="Cancelar viaje"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewModal(trip)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(trip)}
                              disabled={trip.status === "COMPLETED"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(trip.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredTrips.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  de {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={
                      pagination.page * pagination.limit >= pagination.total
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Dialog>
    </div>
  );
}
