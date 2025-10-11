"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function TripsManagement() {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });
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
      const response = await fetch(`${API_URL}/routes?limit=100`);
      const data = await response.json();
      setRoutes(data.data || []);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
    }
  };

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "success" }),
      3000
    );
  };

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
      const url =
        modalMode === "create"
          ? `${API_URL}/trips`
          : `${API_URL}/trips/${selectedTrip.id}`;

      const method = modalMode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al guardar");
      }

      showAlert(
        modalMode === "create"
          ? "Viaje creado exitosamente"
          : "Viaje actualizado exitosamente"
      );

      setIsModalOpen(false);
      fetchTrips();
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este viaje?")) return;

    try {
      const response = await fetch(`${API_URL}/trips/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar");
      }

      showAlert("Viaje eliminado exitosamente");
      fetchTrips();
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      const response = await fetch(`${API_URL}/trips/${id}/${action}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar estado");
      }

      showAlert(
        `Viaje ${
          action === "start"
            ? "iniciado"
            : action === "complete"
            ? "completado"
            : "cancelado"
        } exitosamente`
      );
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
    departure_time: "",
    arrival_time: "",
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
      const response = await fetch(
        `${API_URL}/trips?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      setTrips(data.data || []);
      setPagination((prev) => ({ ...prev, total: data.meta?.total || 0 }));
    } catch (error) {
      showAlert("Error al cargar los viajes", "error");
    } finally {
      setLoading(false);
    }
  };

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
            Administra los viajes programados
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por origen, destino, placa o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                  onValueChange={(value) =>
                    setFormData({ ...formData, routeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.origin} → {route.destination}
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.license_plate} - {bus.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="departure_time">Fecha y Hora de Salida *</Label>
                <Input
                  id="departure_time"
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) =>
                    setFormData({ ...formData, departure_time: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="arrival_time">Fecha y Hora de Llegada *</Label>
                <Input
                  id="arrival_time"
                  type="datetime-local"
                  value={formData.arrival_time}
                  onChange={(e) =>
                    setFormData({ ...formData, arrival_time: e.target.value })
                  }
                />
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
                      <MapPin className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="font-semibold">
                          {selectedTrip.route?.origin}
                        </div>
                        <div className="text-sm text-gray-600">
                          → {selectedTrip.route?.destination}
                        </div>
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
                                {trip.route?.origin}
                              </div>
                              <div className="text-sm text-gray-500">
                                → {trip.route?.destination}
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
        ;
      </Dialog>
    </div>
  );
}
