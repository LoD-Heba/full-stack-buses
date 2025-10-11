"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { createClient, updateClient } from "../api/api-clients";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export function ClientForm({ client }) {
  const [backendError, setBackendError] = useState(null);
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
      });
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
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isEditing ? "Actualizar cliente" : "Registrar nuevo cliente"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Nombre completo *</Label>
          <Input
            {...register("name", {
              required: "El nombre es obligatorio",
              maxLength: { value: 100, message: "Máximo 100 caracteres" },
            })}
            placeholder="Ej: Juan Pérez"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label>Correo electrónico</Label>
          <Input
            type="email"
            {...register("email", {
              validate: (value) => {
                if (value || phone) return true;
                return "Debe ingresar un correo o teléfono";
              },
            })}
            placeholder="Ej: cliente@gmail.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label>Teléfono</Label>
          <Input
            type="tel"
            {...register("phone", {
              validate: (value) => {
                if (value || email) return true;
                return "Debe ingresar un teléfono o correo";
              },
            })}
            placeholder="Ej: +59170000000"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label>
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
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {backendError && (
          <p className="text-red-600 text-center font-medium">{backendError}</p>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button type="submit">
            {isEditing ? "Actualizar" : "Registrar"}
          </Button>
          <Link
            href="/dashboard/clientes"
            className="text-blue-600 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}