"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { createClient, updateClient } from "../api/api-clients";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Mail, Phone, IdCard, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function ClientForm({ client }) {
  const [backendError, setBackendError] = useState(null);
  const [showProfileSection, setShowProfileSection] = useState(false);
  const router = useRouter();
  const params = useParams();
  
  const isEditing = params?.id && params.id !== "undefined";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      // Campos del perfil
      firstName: "",
      lastName: "",
      documentNumber: "",
      profilePhone: "",
      address: "",
    },
  });

  const email = watch("email");
  const phone = watch("phone");

  useEffect(() => {
    if (client) {
      reset({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        password: "",
        firstName: client.profile?.firstName || "",
        lastName: client.profile?.lastName || "",
        documentNumber: client.profile?.documentNumber || "",
        profilePhone: client.profile?.phone || "",
        address: client.profile?.address || "",
      });
      
      // Si hay datos del perfil, mostrar la sección
      if (client.profile) {
        setShowProfileSection(true);
      }
    }
  }, [client, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setBackendError(null);

      if (!data.email && !data.phone) {
        setBackendError("Debe proporcionar al menos un correo o teléfono");
        return;
      }

      const dataToSend = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      };

      // Agregar datos del perfil si se completó la sección
      if (showProfileSection) {
        const profileData = {};
        
        if (data.firstName) profileData.firstName = data.firstName;
        if (data.lastName) profileData.lastName = data.lastName;
        if (data.documentNumber) profileData.documentNumber = data.documentNumber;
        if (data.profilePhone) profileData.phone = data.profilePhone;
        if (data.address) profileData.address = data.address;
        
        // Solo agregar perfil si tiene al menos un campo
        if (Object.keys(profileData).length > 0) {
          dataToSend.profile = profileData;
        }
      }

      if (isEditing) {
        if (data.password && data.password.trim() !== "") {
          dataToSend.password = data.password;
        }
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(params.id)) {
          setBackendError("ID de cliente inválido");
          return;
        }
        
        const res = await updateClient(params.id, dataToSend);
        
        if (res?.message) {
          if (Array.isArray(res.message)) {
            setBackendError(res.message[0]);
            return;
          } else if (typeof res.message === "string") {
            setBackendError(res.message);
            return;
          }
        }
      } else {
        dataToSend.password = data.password;
        const res = await createClient(dataToSend);
        
        if (res?.message) {
          if (Array.isArray(res.message)) {
            setBackendError(res.message[0]);
            return;
          } else if (typeof res.message === "string") {
            setBackendError(res.message);
            return;
          }
        }
      }

      router.push("/dashboard/clientes");
      router.refresh();
    } catch (err) {
      console.error("Error en onSubmit:", err);
      
      if (err.message) {
        setBackendError(err.message);
      } else {
        setBackendError("Error al procesar el cliente. Intenta nuevamente.");
      }
    }
  });

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEditing ? "Actualizar Cliente" : "Registrar Nuevo Cliente"}
          </CardTitle>
          <CardDescription>
            Complete la información del cliente. Los datos del perfil son opcionales pero recomendados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre completo *
                  </Label>
                  <Input
                    {...register("name", {
                      required: "El nombre es obligatorio",
                      maxLength: { value: 100, message: "Máximo 100 caracteres" },
                    })}
                    placeholder="Ej: Juan Pérez"
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Correo electrónico
                  </Label>
                  <Input
                    type="email"
                    {...register("email", {
                      validate: (value) => {
                        if (value || phone) return true;
                        return "Debe ingresar un correo o teléfono";
                      },
                    })}
                    placeholder="cliente@gmail.com"
                    className="mt-1"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </Label>
                  <Input
                    type="tel"
                    {...register("phone", {
                      validate: (value) => {
                        if (value || email) return true;
                        return "Debe ingresar un teléfono o correo";
                      },
                    })}
                    placeholder="+59170000000"
                    className="mt-1"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Contraseña {isEditing ? "(dejar en blanco para mantener)" : "*"}
                  </Label>
                  <Input
                    type="password"
                    {...register("password", {
                      required: isEditing ? false : "La contraseña es obligatoria",
                      minLength: {
                        value: 4,
                        message: "La contraseña debe tener al menos 4 caracteres",
                      },
                    })}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Sección de Perfil Opcional */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Información del Perfil</h3>
                  <span className="text-sm text-gray-500">(Opcional)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={showProfileSection}
                    onCheckedChange={setShowProfileSection}
                    id="show-profile"
                  />
                  <Label htmlFor="show-profile" className="text-sm cursor-pointer">
                    Completar perfil ahora
                  </Label>
                </div>
              </div>

              {showProfileSection && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-700 mb-4">
                      💡 Completar el perfil permitirá al cliente comprar tickets inmediatamente.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          {...register("firstName")}
                          placeholder="Juan"
                          className="mt-1 bg-white"
                        />
                      </div>

                      <div>
                        <Label>Apellido</Label>
                        <Input
                          {...register("lastName")}
                          placeholder="Pérez"
                          className="mt-1 bg-white"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          Número de Documento
                        </Label>
                        <Input
                          {...register("documentNumber")}
                          placeholder="12345678"
                          className="mt-1 bg-white"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Teléfono del Perfil
                        </Label>
                        <Input
                          type="tel"
                          {...register("profilePhone")}
                          placeholder="+59170000000"
                          className="mt-1 bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Dirección
                        </Label>
                        <Input
                          {...register("address")}
                          placeholder="Av. Principal #123"
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {backendError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-center font-medium">{backendError}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Link href="/dashboard/clientes">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {isEditing ? "Actualizar Cliente" : "Registrar Cliente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}