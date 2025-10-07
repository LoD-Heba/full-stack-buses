"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { createRole, updateRole } from "../api/api-roles";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export function RoleForm({ role }) {
  const [backendError, setBackendError] = useState(null);

  const router = useRouter();
  const params = useParams();

  const isEditing = params?.id && params.id !== "undefined";

  // console.log("Params:", params);
  // console.log("Role:", role);
  // console.log("Is Editing:", isEditing);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name || "",
        description: role.description || "",
      });
    }
  }, [role, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setBackendError(null);

      // console.log("=== DEBUG SUBMIT ===");
      // console.log("params:", params);
      // console.log("params.id:", params.id);
      // console.log("isEditing:", isEditing);
      // console.log("data:", data);
      // console.log("===================");

      if (!data.name) {
        setBackendError("El nombre es obligatorio");
        return;
      }

      const dataToSend = {
        name: data.name,
        description: data.description || undefined,
      };

      let res;
      if (isEditing) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(params.id)) {
          setBackendError("ID de rol inválido");
          return;
        }

        res = await updateRole(params.id, dataToSend);
      } else {
        res = await createRole(dataToSend);
      }

      if (res?.message) {
        if (Array.isArray(res.message)) {
          setBackendError(res.message[0]);
          return;
        } else if (typeof res.message === "string") {
          setBackendError(res.message);
          return;
        }
      }

      router.push("/dashboard/roles");
      router.refresh();
    } catch (err) {
      console.error("Error en onSubmit:", err);

      if (err.message) {
        setBackendError(err.message);
      } else {
        setBackendError("Error al procesar el rol. Intenta nuevamente.");
      }
    }
  });

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isEditing ? "Actualizar rol" : "Registrar rol"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <Label>Nombre del rol</Label>
          <Input
            {...register("name", {
              required: "El nombre es obligatorio",
              maxLength: { value: 50, message: "Máximo 50 caracteres" },
            })}
            placeholder="Ej: Administrador"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <Label>Descripción (opcional)</Label>
          <Textarea
            {...register("description", {
              maxLength: { value: 200, message: "Máximo 200 caracteres" },
            })}
            placeholder="Ej: Acceso total al sistema"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Mensaje del backend */}
        {backendError && (
          <p className="text-red-600 text-center font-medium">{backendError}</p>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center pt-4">
          <Button type="submit">
            {isEditing ? "Actualizar" : "Registrar"}
          </Button>
          <Link
            href="/dashboard/roles"
            className="text-blue-600 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}