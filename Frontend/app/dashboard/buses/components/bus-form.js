"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createBus, updateBus } from "../api/api-buses";
import { Loader2 } from "lucide-react";

// Enums que coinciden con el backend
const SERVICE_TYPES = {
  NORMAL: 'normal',
  SEMI_CAMA: 'semi_cama',
  CAMA: 'cama'
};

const BUS_STATUSES = {
  DISPONIBLE: 'disponible',
  EN_USO: 'en_uso',
  MANTENIMIENTO: 'mantenimiento',
  FUERA_DE_SERVICIO: 'fuera_de_servicio'
};

const STATUS_LABELS = {
  DISPONIBLE: 'disponible',
  EN_USO: 'en_uso',
  MANTENIMIENTO: 'mantenimiento',
  FUERA_DE_SERVICIO: 'fuera_de_servicio'
};

export function BusForm({ bus }) {
  const [backendError, setBackendError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const isEditing = params?.id && params.id !== "undefined";

  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      plate: "",
      model: "",
      year: "",
      service_type: SERVICE_TYPES.NORMAL,
      amenities: "",
      status: BUS_STATUSES.DISPONIBLE,
      userId: "",
      stackId: "",
    },
  });

  const selectedServiceType = watch("service_type");
  const selectedStatus = watch("status");

  // Cargar datos si está en modo edición
  useEffect(() => {
    if (bus) {
      reset({
        plate: bus.plate || "",
        model: bus.model || "",
        year: bus.year?.toString() || "",
        service_type: bus.service_type || SERVICE_TYPES.NORMAL,
        amenities: bus.amenities || "",
        status: bus.status || BUS_STATUSES.DISPONIBLE,
        userId: bus.user?.id || bus.userId || "",
        stackId: bus.stacks?.id || bus.stackId || "",
      });
    }
  }, [bus, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setBackendError(null);

      // Validaciones del lado del cliente
      if (data.year && (Number(data.year) < 1950 || Number(data.year) > currentYear + 2)) {
        setBackendError(`El año debe estar entre 1950 y ${currentYear + 2}`);
        return;
      }

      if (data.capacity && (Number(data.capacity) < 15 || Number(data.capacity) > 80)) {
        setBackendError("La capacidad debe estar entre 15 y 80 asientos");
        return;
      }

      // Formatear datos según el DTO del backend
      const formattedData = {
        plate: data.plate.toUpperCase().trim(),
        model: data.model.trim(),
        year: data.year ? Number(data.year) : undefined,
        service_type: data.service_type,
        amenities: data.amenities?.trim() || undefined,
        status: data.status,
        userId: data.userId.trim(),
        stackId: data.stackId?.trim() || undefined,
      };

      // Remover propiedades undefined
      Object.keys(formattedData).forEach(key => 
        formattedData[key] === undefined && delete formattedData[key]
      );

      let res;
      if (isEditing) {
        res = await updateBus(params.id, formattedData);
      } else {
        res = await createBus(formattedData);
      }

      // Éxito: redirigir
      router.push("/dashboard/buses");
      router.refresh();
    } catch (err) {
      console.error("Error en onSubmit:", err);
      
      // Manejar diferentes tipos de errores
      if (err.message.includes("placa")) {
        setBackendError("La placa ya está registrada en el sistema");
      } else if (err.message.includes("stack")) {
        setBackendError("El stack de asientos ya está asignado a otro bus");
      } else if (err.message.includes("usuario")) {
        setBackendError("El usuario no existe o no está activo");
      } else {
        setBackendError(err.message || "Error al procesar el bus. Intente nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isEditing ? "Editar Bus" : "Registrar Nuevo Bus"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Placa */}
        <div>
          <Label htmlFor="plate">
            Placa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="plate"
            {...register("plate", { 
              required: "La placa es obligatoria",
              minLength: { value: 3, message: "La placa debe tener al menos 3 caracteres" },
              maxLength: { value: 20, message: "La placa no puede exceder 20 caracteres" },
              pattern: {
                value: /^[A-Z0-9\-]+$/i,
                message: "Solo letras, números y guiones"
              }
            })}
            placeholder="Ej: ABC-1234"
            className={errors.plate ? "border-red-500" : ""}
            disabled={isEditing && bus?.status === BUS_STATUSES.EN_USO}
          />
          {errors.plate && (
            <p className="text-red-500 text-sm mt-1">{errors.plate.message}</p>
          )}
        </div>

        {/* Modelo */}
        <div>
          <Label htmlFor="model">
            Modelo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="model"
            {...register("model", { 
              required: "El modelo es obligatorio",
              minLength: { value: 2, message: "Mínimo 2 caracteres" },
              maxLength: { value: 100, message: "Máximo 100 caracteres" }
            })}
            placeholder="Ej: Volvo 9700"
            className={errors.model ? "border-red-500" : ""}
            disabled={isEditing && bus?.status === BUS_STATUSES.EN_USO}
          />
          {errors.model && (
            <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
          )}
        </div>

        {/* Año y Capacidad */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year">Año</Label>
            <Input 
              id="year"
              type="number" 
              {...register("year", {
                min: { value: 1950, message: "Año mínimo: 1950" },
                max: { value: currentYear + 2, message: `Año máximo: ${currentYear + 2}` }
              })} 
              placeholder={`Ej: ${currentYear}`}
              className={errors.year ? "border-red-500" : ""}
            />
            {errors.year && (
              <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
            )}
          </div>

        </div>

        {/* Tipo de servicio */}
        <div>
          <Label htmlFor="service_type">
            Tipo de servicio <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedServiceType}
            onValueChange={(val) => setValue("service_type", val)}
            disabled={isEditing && bus?.status === BUS_STATUSES.EN_USO}
          >
            <SelectTrigger id="service_type">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SERVICE_TYPES.NORMAL}>Normal</SelectItem>
              <SelectItem value={SERVICE_TYPES.SEMI_CAMA}>Semi Cama</SelectItem>
              <SelectItem value={SERVICE_TYPES.CAMA}>Cama</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amenidades */}
        <div>
          <Label htmlFor="amenities">Amenidades</Label>
          <Input 
            id="amenities"
            {...register("amenities", {
              minLength: { value: 2, message: "Mínimo 2 caracteres" },
              maxLength: { value: 500, message: "Máximo 500 caracteres" }
            })} 
            placeholder="Ej: Wi-Fi, TV, Aire acondicionado"
            className={errors.amenities ? "border-red-500" : ""}
          />
          {errors.amenities && (
            <p className="text-red-500 text-sm mt-1">{errors.amenities.message}</p>
          )}
        </div>

        {/* Estado */}
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select
            value={selectedStatus}
            onValueChange={(val) => setValue("status", val)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BUS_STATUSES).map(([key, value]) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Usuario y Stack */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="userId">
              ID del Usuario <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="userId"
              {...register("userId", { 
                required: "El usuario es obligatorio",
                pattern: {
                  value: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                  message: "UUID inválido"
                }
              })} 
              placeholder="UUID del usuario"
              className={errors.userId ? "border-red-500" : ""}
            />
            {errors.userId && (
              <p className="text-red-500 text-sm mt-1">{errors.userId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="stackId">ID del Stack (opcional)</Label>
            <Input 
              id="stackId"
              {...register("stackId", {
                pattern: {
                  value: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                  message: "UUID inválido"
                }
              })} 
              placeholder="UUID del stack"
              className={errors.stackId ? "border-red-500" : ""}
            />
            {errors.stackId && (
              <p className="text-red-500 text-sm mt-1">{errors.stackId.message}</p>
            )}
          </div>
        </div>

        {/* Mensaje de información */}
        {isEditing && bus?.status === BUS_STATUSES.IN_USE && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ El bus está en uso. No se pueden modificar datos básicos (placa, modelo, tipo de servicio).
            </p>
          </div>
        )}

        {/* Error del backend */}
        {backendError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{backendError}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              isEditing ? "Actualizar" : "Registrar"
            )}
          </Button>
          <Link 
            href="/dashboard/buses" 
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}