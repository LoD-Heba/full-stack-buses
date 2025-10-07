"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
  createSeatStack,
  updateSeatStack,
  getSeatStack,
} from "../api/api-seat-stacks";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export function SeatStackForm({ stack }) {
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
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (stack) {
      reset({
        name: stack.name || "",
        description: stack.description || "",
      });
    }
  }, [stack, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setBackendError(null);

      if (!data.name) {
        setBackendError("El nombre es obligatorio");
        return;
      }

      const dataToSend = {
        name: data.name,
        description: String(data.description) || null,
      };

      let res;
      if (isEditing) {
        res = await updateSeatStack(params.id, dataToSend);
      } else {
        res = await createSeatStack(dataToSend);
      }

      if (res?.message) {
        setBackendError(res.message);
        return;
      }

      router.push("/dashboard/stack-asientos");
      router.refresh();
    } catch (err) {
      console.error("Error en onSubmit:", err);
      setBackendError(err.message || "Error al procesar el stack");
    }
  });

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isEditing
          ? "Actualizar Stack de Asientos"
          : "Registrar Stack de Asientos"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <Label>Nombre del stack</Label>
          <Input
            {...register("name", {
              required: "El nombre es obligatorio",
              maxLength: { value: 50, message: "Máximo 50 caracteres" },
            })}
            placeholder="Ej: Bus de Pablo"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Descripcion */}
        <div>
          <Label>Descripción (opcional)</Label>
          <Input
            {...register("description", {
              maxLength: { value: 50, message: "Máximo 50 caracteres" },
            })}
            placeholder="..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Error del backend */}
        {backendError && (
          <p className="text-red-600 text-center font-medium">{backendError}</p>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center pt-4">
          <Button type="submit">
            {isEditing ? "Actualizar" : "Registrar"}
          </Button>
          <Link
            href="/dashboard/stack-asientos"
            className="text-blue-600 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
