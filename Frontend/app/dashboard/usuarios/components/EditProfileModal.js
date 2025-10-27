// components/EditProfileModal.jsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  updateUserProfile,
  createUserProfile,
} from "@/app/dashboard/usuarios/api/api-profile";

export function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
  const [backendError, setBackendError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasProfile = !!user?.profile;

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
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user?.profile) {
      reset({
        firstName: user.profile.firstName || "",
        lastName: user.profile.lastName || "",
        documentNumber: user.profile.documentNumber || "",
        phone: user.profile.phone || "",
        email: user.profile.email || "",
        address: user.profile.address || "",
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        documentNumber: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setBackendError(null);

      const profileData = {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        documentNumber: data.documentNumber || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined, // AGREGAR
        address: data.address || undefined,
      };

      let result;
      if (hasProfile) {
        result = await updateUserProfile(user.id, profileData);
        toast.success("Perfil actualizado correctamente");
      } else {
        result = await createUserProfile(user.id, profileData);
        toast.success("Perfil creado correctamente");
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      setBackendError(err.message || "Error al guardar el perfil");
      toast.error(err.message || "Error al guardar el perfil");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {hasProfile ? "Editar Perfil" : "Crear Perfil"}
          </DialogTitle>
          <DialogDescription>
            Actualiza la información personal del usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre(s)</Label>
              <Input
                {...register("firstName", {
                  maxLength: { value: 50, message: "Máximo 50 caracteres" },
                })}
                placeholder="Ej: Juan Carlos"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <Label>Apellido(s)</Label>
              <Input
                {...register("lastName", {
                  maxLength: { value: 50, message: "Máximo 50 caracteres" },
                })}
                placeholder="Ej: Pérez García"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Documento y Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número de Documento</Label>
              <Input
                {...register("documentNumber", {
                  maxLength: { value: 20, message: "Máximo 20 caracteres" },
                  pattern: {
                    value: /^\d{7,10}(-[0-9A-Za-z]{1,3})?$/,
                    message: "Formato inválido. Ej: 12345678 o 12345678-1A",
                  },
                })}
                placeholder="Ej: 12345678"
              />
              {errors.documentNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.documentNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label>Teléfono</Label>
              <Input
                type="tel"
                {...register("phone", {
                  maxLength: { value: 20, message: "Máximo 20 caracteres" },
                  pattern: {
                    value: /^(\+\d{1,4})?[\s\-]?\d{6,15}$/,
                    message: "Formato inválido. Ej: +59170123456",
                  },
                })}
                placeholder="Ej: +59162984081"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label>Correo Electrónico (opcional)</Label>
            <Input
              type="email"
              {...register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Formato de email inválido",
                },
              })}
              placeholder="Ej: usuario@ejemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              El email es opcional y puede agregarse más tarde
            </p>
          </div>

          {/* Dirección */}
          <div>
            <Label>Dirección (opcional)</Label>
            <Textarea
              {...register("address", {
                maxLength: { value: 150, message: "Máximo 150 caracteres" },
              })}
              placeholder="Ej: Av. Principal #123, Zona Norte"
              rows={3}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Mensaje de error del backend */}
          {backendError && (
            <p className="text-red-600 text-center font-medium">
              {backendError}
            </p>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : hasProfile
                ? "Actualizar"
                : "Crear Perfil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
