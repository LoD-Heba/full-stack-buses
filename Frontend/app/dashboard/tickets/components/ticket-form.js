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
  SelectValue,
} from "@/components/ui/select";
import { createTicket, updateTicket } from "../api/api-tickets";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TICKET_STATUS = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADO: "CONFIRMADO",
  CANCELADO: "CANCELADO",
};

const STATUS_LABELS = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
};

export function TicketForm({ ticket }) {
  const [backendError, setBackendError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trips, setTrips] = useState([]);
  const [seats, setSeats] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  const router = useRouter();
  const params = useParams();
  const isEditing = params?.id && params.id !== "undefined";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      price: "",
      status: TICKET_STATUS.PENDIENTE,
      tripId: "",
      seatId: "",
      userId: "",
      paymentId: "",
    },
  });

  const selectedStatus = watch("status");

  // 🧠 Cargar datos iniciales
  useEffect(() => {
    if (ticket) {
      reset({
        price: ticket.price?.toString() || "",
        status: ticket.status || TICKET_STATUS.PENDIENTE,
        tripId: ticket.trip?.id || "",
        seatId: ticket.seat?.id || "",
        userId: ticket.user?.id || "",
        paymentId: ticket.payment?.id || "",
      });
    }
  }, [ticket, reset]);

  // 🚀 Cargar listas de relaciones desde el backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsRes, seatsRes, usersRes, paymentsRes] = await Promise.all([
          fetch("/api/trips").then((r) => r.json()),
          fetch("/api/seats").then((r) => r.json()),
          fetch("/api/users").then((r) => r.json()),
          fetch("/api/payments").then((r) => r.json()),
        ]);
        setTrips(tripsRes);
        setSeats(seatsRes);
        setUsers(usersRes);
        setPayments(paymentsRes);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    fetchData();
  }, []);

  // 🧾 Enviar datos al backend
  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setBackendError(null);

      if (!data.price || parseFloat(data.price) <= 0) {
        setBackendError("El precio debe ser mayor a 0");
        return;
      }

      const formattedData = {
        price: parseFloat(data.price),
        status: data.status,
        tripId: data.tripId,
        seatId: data.seatId,
        userId: data.userId,
        paymentId: data.paymentId || undefined,
      };

      let res;
      if (isEditing) {
        const updateData = {
          status: formattedData.status,
          paymentId: formattedData.paymentId,
        };
        res = await updateTicket(params.id, updateData);
      } else {
        res = await createTicket(formattedData);
      }

      router.push("/dashboard/tickets");
      router.refresh();
    } catch (err) {
      console.error("Error en onSubmit:", err);
      setBackendError(err.message || "Error al procesar el ticket");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-2xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isEditing ? "Editar Ticket" : "Registrar Nuevo Ticket"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Precio */}
        <div>
          <Label htmlFor="price">
            Precio (Bs.) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price", { required: "El precio es obligatorio" })}
            placeholder="Ej: 150.00"
            disabled={isEditing}
          />
        </div>

        {/* Estado */}
        <div>
          <Label>Estado</Label>
          <Select
            value={selectedStatus}
            onValueChange={(val) => setValue("status", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_STATUS).map(([key, value]) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Relaciones - Solo en creación */}
        {!isEditing && (
          <>
            {/* Viaje */}
            <div>
              <Label>Viaje</Label>
              <Select
                onValueChange={(val) => setValue("tripId", val)}
                defaultValue=""
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un viaje" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.route?.originCity?.name} →{" "}
                      {trip.route?.destinationCity?.name} ({trip.departure_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asiento */}
            <div>
              <Label>Asiento</Label>
              <Select
                onValueChange={(val) => setValue("seatId", val)}
                defaultValue=""
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un asiento" />
                </SelectTrigger>
                <SelectContent>
                  {seats.map((seat) => (
                    <SelectItem key={seat.id} value={seat.id}>
                      {seat.seat_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usuario */}
            <div>
              <Label>Usuario</Label>
              <Select
                onValueChange={(val) => setValue("userId", val)}
                defaultValue=""
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.profile
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Pago (opcional) */}
        <div>
          <Label>Pago (opcional)</Label>
          <Select
            onValueChange={(val) => setValue("paymentId", val)}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un pago" />
            </SelectTrigger>
            <SelectContent>
              {payments.map((pay) => (
                <SelectItem key={pay.id} value={pay.id}>
                  Pago #{pay.id} — {pay.amount} Bs.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Errores */}
        {backendError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{backendError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
              </>
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Registrar"
            )}
          </Button>

          <Link
            href="/dashboard/tickets"
            className="text-blue-600 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
