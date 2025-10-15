"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBus, updateBus } from "../api/api-buses";
import { Loader2, Upload, X, Bus as BusIcon, Settings } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const SERVICE_TYPES = {
  NORMAL: "normal",
  SEMI_CAMA: "semi_cama",
  CAMA: "cama",
};

const BUS_STATUSES = {
  DISPONIBLE: "disponible",
  EN_USO: "en_uso",
  MANTENIMIENTO: "mantenimiento",
  FUERA_DE_SERVICIO: "fuera_de_servicio",
};

const STATUS_LABELS = {
  disponible: "Disponible",
  en_uso: "En uso",
  mantenimiento: "Mantenimiento",
  fuera_de_servicio: "Fuera de servicio",
};

export function BusForm({ bus }) {
  const [backendError, setBackendError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savedBusId, setSavedBusId] = useState(null);
  const router = useRouter();

  const isEditing = !!bus;
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
    },
  });

  const selectedServiceType = watch("service_type");
  const selectedStatus = watch("status");
  const selectedUserId = watch("userId");

  // 🆕 Cargar usuarios disponibles
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(
        "http://localhost:3001/api/v1/users?limit=100"
      );
      const data = await response.json();

      // Filtrar solo usuarios activos
      const activeUsers = (data.data || []).filter((user) => user.isActive);
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar datos del bus en modo edición
  useEffect(() => {
    if (bus) {
      reset({
        plate: bus.plate || "",
        model: bus.model || "",
        year: bus.year?.toString() || "",
        service_type: bus.service_type || SERVICE_TYPES.NORMAL,
        amenities: bus.amenities || "",
        status: bus.status || BUS_STATUSES.DISPONIBLE,
        userId: bus.user?.id || "",
      });

      setSavedBusId(bus.id);

      // Cargar imagen existente
      if (bus.image_url) {
        const imageUrl = bus.image_url.startsWith("http")
          ? bus.image_url
          : `http://localhost:3001${bus.image_url}`;
        setImagePreview(imageUrl);
      }
    }
  }, [bus, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona una imagen válida");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById("image");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const uploadImage = async (busId) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch(
        `http://localhost:3001/api/v1/buses/${busId}/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al subir la imagen");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

 const handleConfigureSeats = () => {
  if (savedBusId) {
    router.push(`/dashboard/asientos/configurador?busId=${savedBusId}`);
  } else {
    toast.error("Debes guardar el bus primero");
  }
};

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setBackendError(null);

      // Validación de año (frontend)
      if (
        data.year &&
        (Number(data.year) < 1950 || Number(data.year) > currentYear + 2)
      ) {
        setBackendError(`El año debe estar entre 1950 y ${currentYear + 2}`);
        setIsSubmitting(false);
        return;
      }

      // Validación de antigüedad para buses en uso
      if (data.status === BUS_STATUSES.EN_USO && data.year) {
        const busAge = currentYear - Number(data.year);
        if (busAge > 15) {
          setBackendError(
            `El bus tiene ${busAge} años de antigüedad. Solo se permiten buses con menos de 15 años en servicio activo.`
          );
          setIsSubmitting(false);
          return;
        }
      }
      if (
        data.year &&
        (Number(data.year) < 1950 || Number(data.year) > currentYear + 2)
      ) {
        setBackendError(`El año debe estar entre 1950 y ${currentYear + 2}`);
        setIsSubmitting(false);
        return;
      }

      const formattedData = {
        plate: data.plate.toUpperCase().trim(),
        model: data.model.trim(),
        year: data.year ? Number(data.year) : undefined,
        service_type: data.service_type,
        amenities: data.amenities?.trim() || undefined,
        status: data.status,
        userId: data.userId.trim(),
      };

      // Remover undefined
      Object.keys(formattedData).forEach(
        (key) => formattedData[key] === undefined && delete formattedData[key]
      );

      let res;
      if (isEditing) {
        res = await updateBus(bus.id, formattedData);
        setSavedBusId(bus.id);
      } else {
        res = await createBus(formattedData);
        setSavedBusId(res.id);
      }

      // Subir imagen si existe
      if (imageFile && res?.id) {
        try {
          await uploadImage(res.id);
        } catch (imgError) {
          console.error("Error al subir imagen:", imgError);
          toast.warning("Bus guardado pero no se pudo subir la imagen");
        }
      }

      toast.success(
        isEditing
          ? "Bus actualizado exitosamente"
          : "Bus creado exitosamente. Ahora puedes configurar los asientos."
      );

      // Si es creación, no redirigir inmediatamente para permitir configurar asientos
      if (isEditing) {
        router.push("/dashboard/buses");
        router.refresh();
      }
    } catch (err) {
      console.error("Error en onSubmit:", err);

      let errorMessage = "Error al procesar el bus. Intente nuevamente.";

      if (err.message.includes("placa")) {
        errorMessage = "La placa ya está registrada en el sistema";
      } else if (err.message.includes("stack")) {
        errorMessage = "El stack de asientos ya está asignado a otro bus";
      } else if (
        err.message.includes("usuario") ||
        err.message.includes("user")
      ) {
        errorMessage = "El usuario no ha llenado su formulario";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setBackendError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <div className="flex items-center gap-3">
        <BusIcon className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold">
          {isEditing ? "Editar Bus" : "Registrar Nuevo Bus"}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Imagen del Bus */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Imagen del Bus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {imagePreview ? (
                  <>
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Sin imagen</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="image" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span>Seleccionar imagen</span>
                  </div>
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Básica */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plate">
                    Placa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="plate"
                    {...register("plate", {
                      required: "La placa es obligatoria",
                      minLength: { value: 3, message: "Mínimo 3 caracteres" },
                      maxLength: { value: 20, message: "Máximo 20 caracteres" },
                      pattern: {
                        value: /^[A-Z0-9\-]+$/i,
                        message: "Solo letras, números y guiones",
                      },
                    })}
                    placeholder="1234 ABC"
                    className={errors.plate ? "border-red-500" : ""}
                    disabled={isEditing && bus?.status === BUS_STATUSES.EN_USO}
                  />
                  {errors.plate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.plate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="model">
                    Modelo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="model"
                    {...register("model", {
                      required: "El modelo es obligatorio",
                      minLength: { value: 2, message: "Mínimo 2 caracteres" },
                      maxLength: {
                        value: 100,
                        message: "Máximo 100 caracteres",
                      },
                    })}
                    placeholder="Volvo 9700"
                    className={errors.model ? "border-red-500" : ""}
                    disabled={isEditing && bus?.status === BUS_STATUSES.EN_USO}
                  />
                  {errors.model && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Año (opcional)</Label>
                  <Input
                    id="year"
                    type="number"
                    {...register("year", {
                      min: { value: 1950, message: "Año mínimo: 1950" },
                      max: {
                        value: currentYear + 2,
                        message: `Año máximo: ${currentYear + 2}`,
                      },
                    })}
                    placeholder={currentYear.toString()}
                    className={errors.year ? "border-red-500" : ""}
                  />
                  {errors.year && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.year.message}
                    </p>
                  )}
                </div>

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
                      <SelectItem value={SERVICE_TYPES.NORMAL}>
                        Normal
                      </SelectItem>
                      <SelectItem value={SERVICE_TYPES.SEMI_CAMA}>
                        Semi Cama
                      </SelectItem>
                      <SelectItem value={SERVICE_TYPES.CAMA}>Cama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="amenities">Amenidades (opcional)</Label>
                <Textarea
                  id="amenities"
                  {...register("amenities", {
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    maxLength: { value: 500, message: "Máximo 500 caracteres" },
                  })}
                  placeholder="Wi-Fi, TV, Aire acondicionado, Asientos reclinables..."
                  className={errors.amenities ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.amenities && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.amenities.message}
                  </p>
                )}
              </div>

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
            </CardContent>
          </Card>
        </div>

        {/* 🆕 Asignación mejorada */}
        <Card>
          <CardHeader>
            <CardTitle>Asignación y Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userId">
                Usuario Responsable <span className="text-red-500">*</span>
              </Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando usuarios...
                </div>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={(val) => setValue("userId", val)}
                >
                  <SelectTrigger
                    id="userId"
                    className={errors.userId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No hay usuarios disponibles
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email || user.username}
                          {user.profile?.firstName &&
                            ` - ${user.profile.firstName} ${
                              user.profile.lastName || ""
                            }`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.userId && (
                <p className="text-red-500 text-sm mt-1">
                  Debes seleccionar un usuario responsable
                </p>
              )}
              <input
                type="hidden"
                {...register("userId", {
                  required: "El usuario es obligatorio",
                })}
              />
            </div>

            {/* 🆕 Configuración de Asientos */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">
                    Configuración de Asientos
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {bus?.stacks?.id ? (
                      <span className="text-green-600">
                        ✓ Asientos configurados ({bus.capacity || 0} asientos)
                      </span>
                    ) : savedBusId ? (
                      <span className="text-yellow-600">
                        ⚠ Sin configurar. Configura los asientos ahora.
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Guarda el bus primero para configurar asientos
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConfigureSeats}
                  disabled={!savedBusId}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {bus?.stacks?.id ? "Editar Asientos" : "Configurar Asientos"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advertencias */}
        {isEditing && bus?.status === BUS_STATUSES.EN_USO && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800">
                ⚠ El bus está en uso. No se pueden modificar datos básicos
                (placa, modelo, tipo de servicio)
              </p>
            </CardContent>
          </Card>
        )}

        {!isEditing && savedBusId && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                ✓ Bus guardado exitosamente. Ahora puedes configurar los
                asientos usando el botón "Configurar Asientos"
              </p>
            </CardContent>
          </Card>
        )}

        {backendError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm font-medium">{backendError}</p>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center">
          <Link href="/dashboard/buses">
            <Button type="button" variant="outline">
              {savedBusId && !isEditing ? "Volver a Buses" : "Cancelar"}
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : isEditing ? (
              "Actualizar Bus"
            ) : savedBusId ? (
              "Bus Guardado ✓"
            ) : (
              "Guardar Bus"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
