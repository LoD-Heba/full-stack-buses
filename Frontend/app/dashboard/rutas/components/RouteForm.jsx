"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { citiesAPI } from "../api/cities.api";
import { toast } from "sonner";
import { busesAPI } from "../api/buses.api";
import { Check } from "lucide-react";

export default function RouteForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    approx_duration: "",
    distance_km: "",
    description: "",
    base_price: "",
    originCityId: "",
    destinationCityId: "",
    busIds: [],
  });

  const [cities, setCities] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCities();
    loadBuses();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        approx_duration: initialData.approx_duration || "",
        distance_km: initialData.distance_km || "",
        description: initialData.description || "",
        base_price: initialData.base_price || "",
        originCityId: initialData.originCity?.id || "",
        destinationCityId: initialData.destinationCity?.id || "",
        busIds: initialData.buses?.map((b) => b.id) || [],
      });
      setSelectedBuses(initialData.buses?.map((b) => b.id) || []);
    }
  }, [initialData]);
  /////////////////////////////////////////
  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      console.log("Ciudades cargadas:", response); // Debug
      // El backend devuelve un array directo, no un objeto con data
      setCities(Array.isArray(response) ? response : []);
      if (!Array.isArray(response) || response.length === 0) {
        toast.warning("No hay ciudades disponibles");
      }
    } catch (error) {
      toast.error("Error al cargar ciudades");
      console.error("Error cargando ciudades:", error);
    }
  };
  //////////////////////////////
  const loadBuses = async () => {
    try {
      const response = await busesAPI.getAll();
      console.log("Buses cargados:", response);
      // Filtrar solo buses activos con asientos configurados
      const activeBuses = Array.isArray(response.data)
        ? response.data.filter(
            (bus) => bus.is_active && bus.stacks?.seats?.length > 0
          )
        : [];
      setBuses(activeBuses);
      if (activeBuses.length === 0) {
        toast.warning("No hay buses disponibles para asignar");
      }
    } catch (error) {
      toast.error("Error al cargar buses");
      console.error("Error cargando buses:", error);
    }
  };
  //////////////////////////////////////
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  /////////////////////////////////////////////
  const validateSpeedCoherence = () => {
    if (formData.distance_km && formData.approx_duration) {
      const [hours, minutes] = formData.approx_duration.split(":").map(Number);
      const totalHours = hours + minutes / 60;
      const avgSpeed = parseFloat(formData.distance_km) / totalHours;

      if (avgSpeed < 20 || avgSpeed > 100) {
        toast.error(
          `La duración no es coherente con la distancia. Velocidad promedio: ${avgSpeed.toFixed(
            1
          )} km/h (debe estar entre 20-100 km/h)`
        );
        return false;
      }
    }
    return true;
  };
  ///////////////////////////////
  const toggleBusSelection = (busId) => {
    setSelectedBuses((prev) => {
      const newSelection = prev.includes(busId)
        ? prev.filter((id) => id !== busId)
        : [...prev, busId];

      // Actualizar formData también
      setFormData((prevForm) => ({
        ...prevForm,
        busIds: newSelection,
      }));

      return newSelection;
    });
  };
  /////////////////////////////////////
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.originCityId || !formData.destinationCityId) {
      toast.error("Debe seleccionar origen y destino");
      return;
    }

    if (formData.originCityId === formData.destinationCityId) {
      toast.error("El origen y destino deben ser diferentes");
      return;
    }
    if (!validateSpeedCoherence()) {
      return;
    }
    setLoading(true);
    try {
      // Preparar datos para envío
      const submitData = {
        originCityId: formData.originCityId,
        destinationCityId: formData.destinationCityId,
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.name) submitData.name = formData.name;
      if (formData.approx_duration)
        submitData.approx_duration = formData.approx_duration;
      if (formData.distance_km) {
        const distance = parseFloat(formData.distance_km);
        if (distance < 5 || distance > 3000) {
          toast.error("La distancia debe estar entre 5 y 3000 km");
          setLoading(false);
          return;
        }
        submitData.distance_km = distance;
      }
      if (formData.description) submitData.description = formData.description;
      if (formData.base_price)
        submitData.base_price = parseFloat(formData.base_price);
      if (selectedBuses.length > 0) submitData.busIds = selectedBuses;

      await onSubmit(submitData);
    } catch (error) {
      toast.error(error.message || "Error al guardar ruta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">
            {initialData ? "Editar Ruta" : "Nueva Ruta"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Ciudad de Origen */}
            <div>
              <Label htmlFor="originCityId">Ciudad de Origen *</Label>
              <select
                id="originCityId"
                name="originCityId"
                value={formData.originCityId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccione origen</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.city} - {city.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Ciudad de Destino */}
            <div>
              <Label htmlFor="destinationCityId">Ciudad de Destino *</Label>
              <select
                id="destinationCityId"
                name="destinationCityId"
                value={formData.destinationCityId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccione destino</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.city} - {city.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="name">Nombre de la Ruta</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Santa Cruz - Cochabamba Express (opcional)"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si no especifica, se generará automáticamente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duración */}
            <div>
              <Label htmlFor="approx_duration">Duración Aproximada</Label>
              <Input
                id="approx_duration"
                name="approx_duration"
                value={formData.approx_duration}
                onChange={handleChange}
                placeholder="HH:MM:SS (ej: 04:30:00)"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                title="Formato: HH:MM:SS (ej: 04:30:00)" // ← AÑADIR
              />
              <p className="text-xs text-gray-500 mt-1">
                {" "}
                {/* ← AÑADIR */}
                Formato: HH:MM:SS (ejemplo: 04:30:00)
              </p>
            </div>

            {/* Distancia */}
            <div>
              <Label htmlFor="distance_km">Distancia (km) *</Label>
              <Input
                id="distance_km"
                name="distance_km"
                type="number"
                step="0.01"
                min="5"
                max="3000"
                value={formData.distance_km}
                onChange={handleChange}
                placeholder="365.50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {" "}
                Debe estar entre 5 y 3000 km
              </p>
            </div>
          </div>

          {/* Precio Base */}
          <div>
            <Label htmlFor="base_price">Precio Base (Bs.)</Label>
            <Input
              id="base_price"
              name="base_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={handleChange}
              placeholder="45.00"
            />
          </div>

          {/* Asignación de Buses */}
          <div>
            <Label>Buses Disponibles (Opcional)</Label>
            <p className="text-xs text-gray-500 mb-2">
              Seleccione los buses que operarán en esta ruta
            </p>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {buses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay buses disponibles
                </p>
              ) : (
                buses.map((bus) => (
                  <div
                    key={bus.id}
                    onClick={() => toggleBusSelection(bus.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer
                      transition-all duration-200 border-2
                      ${
                        selectedBuses.includes(bus.id)
                          ? "bg-orange-50 border-orange-500"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {bus.image_url && (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${bus.image_url}`}
                          alt={bus.plate}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{bus.plate}</p>
                        <p className="text-sm text-gray-500">
                          {bus.model} • {bus.year} •{" "}
                          {bus.capacity || bus.stacks?.seats?.length || 0}{" "}
                          asientos
                        </p>
                        <p className="text-xs text-gray-400">
                          {bus.user?.name}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${
                        selectedBuses.includes(bus.id)
                          ? "bg-orange-500 border-orange-500"
                          : "border-gray-300"
                      }
                    `}
                    >
                      {selectedBuses.includes(bus.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedBuses.length > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                {selectedBuses.length} bus{selectedBuses.length > 1 ? "es" : ""}{" "}
                seleccionado{selectedBuses.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción de la ruta..."
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
