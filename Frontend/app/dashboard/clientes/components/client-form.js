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
import { User, Phone, IdCard, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ClientForm({ client }) {
  const [backendError, setBackendError] = useState(null);
  const router = useRouter();
  const params = useParams();
  
  const isEditing = params?.id && params.id !== "undefined";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      documentNumber: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        documentNumber: client.documentNumber || "",
        phone: client.phone || "",
        address: client.address || "",
      });
    }
  }, [client, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setBackendError(null);

      if (isEditing) {
        await updateClient(params.id, data);
      } else {
        await createClient(data);
      }

      router.push("/dashboard/clientes");
      router.refresh();
    } catch (err) {
      console.error("Error en onSubmit:", err);
      setBackendError(err.message || "Error al procesar el cliente");
    }
  });

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEditing ? "Editar Cliente" : "Registrar Nuevo Cliente"}
          </CardTitle>
          <CardDescription>
            Complete la información del cliente. Todos los campos son obligatorios para que el cliente pueda comprar tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
         

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Información del Cliente</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombres 
                  </Label>
                  <Input
                    {...register("firstName", {
                      required: "Los nombres son obligatorios",
                      minLength: { value: 2, message: "Mínimo 2 caracteres" },
                      maxLength: { value: 100, message: "Máximo 100 caracteres" },
                    })}
                    placeholder="Juan Carlos"
                    className="mt-1"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Apellidos 
                  </Label>
                  <Input
                    {...register("lastName", {
                      required: "Los apellidos son obligatorios",
                      minLength: { value: 3, message: "Mínimo 3 caracteres" },
                      maxLength: { value: 100, message: "Máximo 100 caracteres" },
                    })}
                    placeholder="Perez Lopez"
                    className="mt-1"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    Número de Documento 
                  </Label>
                  <Input
                    {...register("documentNumber", {
                      required: "El C.I. es obligatorio",
                      pattern: {
                        value: /^\d{7,10}(-[0-9A-Za-z]{1,3})?$/,
                        message: "Ejemplos: 8502732",
                      },
                    })}
                    placeholder="12345678"
                    className="mt-1"
                  />
                  {errors.documentNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.documentNumber.message}</p>
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
                      required: "El teléfono es obligatorio",
                      pattern: {
                        value: /^(\+\d{1,4})?[\s\-]?\d{6,15}$/,
                        message: "Formato inválido. Ejemplos: +59170123456, 70123456",
                      },
                    })}
                    placeholder="+59170123456"
                    className="mt-1"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </Label>
                  <Input
                    {...register("address", {
                      maxLength: { value: 200, message: "Máximo 200 caracteres" },
                    })}
                  
                    className="mt-1"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {backendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{backendError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
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