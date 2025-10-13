// ============================================
// 📁 Frontend/app/comprar/asientos/[tripId]/page.jsx
// ============================================
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bus,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId;

  const [trip, setTrip] = useState(null);
  const [seats, setSeats] = useState({ floor1: [], floor2: [] });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingReservation, setProcessingReservation] = useState(false);

  useEffect(() => {
    if (tripId) {
      fetchTripAndSeats();
    }
  }, [tripId]);

  const fetchTripAndSeats = async () => {
    setLoading(true);
    try {
      // Obtener información del viaje
      const tripRes = await fetch(
        `http://localhost:3001/api/v1/trips/${tripId}`
      );
      const tripData = await tripRes.json();
      setTrip(tripData);

      // Obtener asientos del stack del bus
      if (tripData.bus?.stacks?.id) {
        const seatsRes = await fetch(
          `http://localhost:3001/api/v1/seat-stacks/${tripData.bus.stacks.id}`
        );
        const seatsData = await seatsRes.json();

        // Obtener tickets para este viaje y marcar asientos ocupados
        const ticketsRes = await fetch(
          `http://localhost:3001/api/v1/tickets/trip/${tripId}`
        );
        const ticketsData = await ticketsRes.json();

        // Crear un Set de IDs de asientos ocupados/reservados
        const occupiedSeatIds = new Set(
          ticketsData
            .filter(
              (ticket) =>
                ticket.status === "CONFIRMADO" || ticket.status === "PENDIENTE"
            )
            .map((ticket) => ticket.seat?.id)
        );

        // Organizar asientos por piso y marcar estado
        const floor1Seats = [];
        const floor2Seats = [];

        seatsData.seats.forEach((seat) => {
          const seatWithStatus = {
            ...seat,
            status: occupiedSeatIds.has(seat.id) ? "occupied" : "available",
          };

          if (seat.deck === 1) {
            floor1Seats.push(seatWithStatus);
          } else if (seat.deck === 2) {
            floor2Seats.push(seatWithStatus);
          }
        });

        // Calcular filas y columnas dinámicamente
        const calculateLayout = (seatsList) => {
          if (seatsList.length === 0) return { rows: [], columns: 4 };

          const maxRow = Math.max(
            ...seatsList.map((s) => {
              // Extraer número de fila del seat_code (ej: "S01" -> 1)
              const match = s.seat_code.match(/\d+/);
              return match ? Math.ceil(parseInt(match[0]) / 4) : 1;
            })
          );

          const rows = [];
          for (let i = 1; i <= maxRow; i++) {
            const rowSeats = seatsList.filter((s) => {
              const seatNum = parseInt(s.seat_code.match(/\d+/)?.[0] || 0);
              const calculatedRow = Math.ceil(seatNum / 4);
              return calculatedRow === i;
            });
            rows.push(rowSeats);
          }

          return { rows, columns: 4 };
        };

        setSeats({
          floor1: calculateLayout(floor1Seats),
          floor2: calculateLayout(floor2Seats),
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar la información del viaje");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === "occupied" || !seat.is_active) {
      return;
    }

    setSelectedSeats((prev) => {
      const isSelected = prev.find((s) => s.id === seat.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.find((s) => s.id === seat.id);

    if (!seat.is_active) return "bg-gray-200 cursor-not-allowed";
    if (seat.status === "occupied")
      return "bg-red-500 text-white cursor-not-allowed";
    if (isSelected) return "bg-blue-600 text-white hover:bg-blue-700";
    return "bg-green-500 text-white hover:bg-green-600";
  };

  const renderBusFloor = (floorData, floorNumber) => {
    if (!floorData || !floorData.rows || floorData.rows.length === 0) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
          No hay asientos configurados para este piso
        </div>
      );
    }

    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Piso {floorNumber}
          </h3>
        </div>

        <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg mb-2 font-bold">
          🚗 FRENTE DEL BUS
        </div>

        <div className="bg-white p-4 rounded-lg border-4 border-gray-300">
          {floorData.rows.map((rowSeats, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-2 mb-2">
              {[0, 1, 2, 3, 4].map((colIndex) => {
                if (colIndex === 2) {
                  return (
                    <div
                      key={`aisle-${rowIndex}-${colIndex}`}
                      className="flex items-center justify-center text-gray-400 text-xs font-bold"
                    >
                      PASILLO
                    </div>
                  );
                }

                const seatIndex = colIndex > 2 ? colIndex - 1 : colIndex;
                const seat = rowSeats[seatIndex];

                if (!seat) {
                  return (
                    <div
                      key={`empty-${rowIndex}-${colIndex}`}
                      className="h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs"
                    >
                      -
                    </div>
                  );
                }

                const isSelected = selectedSeats.find((s) => s.id === seat.id);

                return (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === "occupied" || !seat.is_active}
                    className={`h-16 ${getSeatColor(
                      seat
                    )} rounded-lg font-bold text-sm transition-all transform hover:scale-105 flex flex-col items-center justify-center shadow-md disabled:transform-none disabled:hover:scale-100`}
                  >
                    <span className="text-xs">{seat.seat_code}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 mt-1" />}
                    {seat.status === "occupied" && (
                      <span className="text-xs mt-1">Ocupado</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bg-gray-600 text-white text-center py-2 rounded-b-lg mt-2 font-bold">
          📦 PARTE TRASERA
        </div>
      </div>
    );
  };

  const handleReservation = async () => {
    if (selectedSeats.length === 0) {
      alert("Selecciona al menos un asiento");
      return;
    }

    // Verificar autenticación
    const token = localStorage.getItem("access_token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || !user.id) {
      alert("Debes iniciar sesión para reservar asientos");
      router.push("/auth/login");
      return;
    }

    setProcessingReservation(true);

    try {
      // Crear tickets para cada asiento seleccionado
      const ticketPromises = selectedSeats.map((seat) =>
        fetch("http://localhost:3001/api/v1/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price: trip.price,
            status: "PENDIENTE",
            tripId: tripId,
            seatId: seat.id,
            userId: user.id,
          }),
        })
      );

      await Promise.all(ticketPromises);

      alert(
        `¡Reserva exitosa! Has reservado ${selectedSeats.length} asiento(s)`
      );
      router.push("/mis-tickets"); // Redirigir a una página de tickets del usuario
    } catch (err) {
      console.error("Error creating reservation:", err);
      alert("Error al procesar la reserva. Intenta nuevamente.");
    } finally {
      setProcessingReservation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando asientos disponibles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/comprar")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a viajes
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = selectedSeats.length * (trip?.price || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/comprar")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a viajes
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Bus className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  Selecciona tus asientos
                </h1>
                <p className="text-gray-600">
                  {trip?.route?.origin} → {trip?.route?.destination}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Bus</p>
                  <p className="font-medium">
                    {trip?.bus?.plate} - {trip?.bus?.model}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-medium">
                    {trip?.departure_time
                      ? new Date(trip.departure_time).toLocaleDateString(
                          "es-ES"
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Hora de salida</p>
                  <p className="font-medium">
                    {trip?.departure_time
                      ? new Date(trip.departure_time).toLocaleTimeString(
                          "es-ES",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Área de asientos */}
          <div className="lg:col-span-3 space-y-6">
            {seats.floor1.rows &&
              seats.floor1.rows.length > 0 &&
              renderBusFloor(seats.floor1, 1)}
            {seats.floor2.rows &&
              seats.floor2.rows.length > 0 &&
              renderBusFloor(seats.floor2, 2)}

            {/* Leyenda */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold mb-4">Leyenda</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                  <span className="text-sm">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded"></div>
                  <span className="text-sm">Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded"></div>
                  <span className="text-sm">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <span className="text-sm">No disponible</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4">Resumen de Reserva</h3>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selecciona tus asientos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Asientos seleccionados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat.id}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {seat.seat_code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Precio por asiento:</span>
                      <span className="font-medium">
                        Bs. {Number(trip?.price)?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Cantidad:</span>
                      <span className="font-medium">
                        {selectedSeats.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span className="text-green-600 flex items-center">
                        <DollarSign className="w-5 h-5" />
                        {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleReservation}
                    disabled={processingReservation}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {processingReservation ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Reservar Ahora
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Al reservar aceptas los términos y condiciones
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
