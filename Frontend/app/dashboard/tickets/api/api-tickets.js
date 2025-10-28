const BASE_URL = "http://localhost:3001/api/v1/tickets";

async function handleApiResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.message ||
      data.error ||
      `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

export async function createTicket(ticketData) {
  try {
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketData),
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error al crear ticket:", error);
    throw error;
  }
}

export async function getTickets(page = 1, limit = 10) {
  try {
    const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    throw error;
  }
}

export async function getTicket(id) {
  try {
    if (!id || id === "undefined") {
      throw new Error("ID de ticket inválido");
    }

    const res = await fetch(`${BASE_URL}/${id}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener ticket ${id}:`, error);
    throw error;
  }
}

export async function getTicketsByUser(userId) {
  try {
    if (!userId) {
      throw new Error("ID de usuario requerido");
    }

    const res = await fetch(`${BASE_URL}/user/${userId}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener tickets del usuario ${userId}:`, error);
    throw error;
  }
}

export async function getUserTicketHistory(userId) {
  try {
    if (!userId) {
      throw new Error("ID de usuario requerido");
    }

    const res = await fetch(`${BASE_URL}/user/${userId}/history`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener historial del usuario ${userId}:`, error);
    throw error;
  }
}

export async function getTicketsByTrip(tripId) {
  try {
    if (!tripId) {
      throw new Error("ID de viaje requerido");
    }

    const res = await fetch(`${BASE_URL}/trip/${tripId}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener tickets del viaje ${tripId}:`, error);
    throw error;
  }
}

export async function updateTicket(id, ticketData) {
  try {
    if (!id) {
      throw new Error("ID de ticket requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketData),
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al actualizar ticket ${id}:`, error);
    throw error;
  }
}

export async function cancelTicket(id) {
  try {
    if (!id) {
      throw new Error("ID de ticket requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al cancelar ticket ${id}:`, error);
    throw error;
  }
}

export async function confirmTicket(id) {
  try {
    if (!id) {
      throw new Error("ID de ticket requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}/confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al confirmar ticket ${id}:`, error);
    throw error;
  }
}

export async function deleteTicket(id) {
  try {
    if (!id) {
      throw new Error("ID de ticket requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al eliminar ticket ${id}:`, error);
    throw error;
  }
}

// ✅ FUNCIÓN CORREGIDA: Obtener asientos disponibles con estructura correcta
export async function getAvailableSeatsForTrip(tripId) {
  try {
    if (!tripId) {
      throw new Error("ID de viaje requerido");
    }

    console.log("🔍 Obteniendo asientos para viaje:", tripId);

    // 1. Obtener información del viaje
    const tripRes = await fetch(
      `http://localhost:3001/api/v1/trips/${tripId}`,
      {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!tripRes.ok) {
      throw new Error("Error al obtener información del viaje");
    }

    const trip = await handleApiResponse(tripRes);
    console.log("✅ Viaje obtenido:", {
      id: trip.id,
      busId: trip.bus?.id,
      route: `${trip.route?.name || "?"}
      }`,
    });

    if (!trip.bus?.id) {
      throw new Error("El viaje no tiene un bus asignado");
    }

    // 2. Obtener layout del bus con asientos
    const layoutRes = await fetch(
      `http://localhost:3001/api/v1/buses/${trip.bus.id}/layout`,
      {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!layoutRes.ok) {
      throw new Error("Error al obtener layout del bus");
    }

    const layout = await handleApiResponse(layoutRes);
    console.log("✅ Layout del bus obtenido:", {
      busId: layout.bus_id,
      decks: layout.decks?.length || 0,
    });

    // 3. Extraer TODOS los asientos del bus
    let allSeats = [];
    if (layout.decks && Array.isArray(layout.decks)) {
      layout.decks.forEach((deck) => {
        if (deck.layout && Array.isArray(deck.layout)) {
          // ✅ Filtrar solo elementos tipo 'seat' con código válido
          const deckSeats = deck.layout.filter((seat) => {
            const isSeat = seat.visual_type === "seat" && seat.id;
            const hasCode = seat.seat_code && seat.seat_code.trim() !== "";
            return isSeat && hasCode;
          });

          console.log(`✅ Asientos en deck ${deck.deck}:`, deckSeats.length);
          allSeats.push(...deckSeats);
        }
      });
    }

    // ✅ Normalizar códigos a MAYÚSCULAS
    allSeats = allSeats.map((seat) => ({
      ...seat,
      seat_code: seat.seat_code?.toUpperCase(),
      // Asegurar que status existe (compatibilidad con versiones sin migración)
      status: seat.status || "disponible",
    }));

    console.log("✅ Total de asientos en el bus:", allSeats.length);
    console.log(
      "📋 Primeros 3 asientos:",
      allSeats.slice(0, 3).map((s) => ({
        id: s.id,
        seat_code: s.seat_code,
        seat_number: s.seat_number,
        status: s.status,
        is_active: s.is_active,
      }))
    );

    if (allSeats.length === 0) {
      throw new Error("El bus no tiene asientos configurados");
    }

    // 4. Obtener tickets del viaje para marcar ocupados
    const ticketsRes = await fetch(`${BASE_URL}/trip/${tripId}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    let occupiedSeatIds = [];
    if (ticketsRes.ok) {
      const tickets = await handleApiResponse(ticketsRes);

      // Filtrar tickets confirmados O pendientes Y activos
      const occupiedTickets = tickets.filter(
        (t) =>
          (t.status === "CONFIRMADO" || t.status === "PENDIENTE") && t.is_active
      );

      occupiedSeatIds = occupiedTickets.map((t) => t.seat?.id).filter(Boolean);

      console.log(`🚫 Tickets ocupados/pendientes: ${occupiedTickets.length}`);
      console.log("🚫 IDs de asientos ocupados:", occupiedSeatIds);
    }

    // 5. Filtrar asientos disponibles
    const availableSeats = allSeats.filter((seat) => {
      // ✅ Priorizar el campo status si existe
      if (seat.status) {
        const statusDisponible = seat.status === "disponible";
        console.log(
          `🔍 ${seat.seat_code}: status=${seat.status}, disponible=${statusDisponible}`
        );
        return statusDisponible;
      }

      // ✅ Fallback: verificar si está ocupado por tickets
      const isNotOccupied = !occupiedSeatIds.includes(seat.id);
      const isActive = seat.is_active !== false;

      console.log(
        `🔍 ${seat.seat_code}: is_active=${
          seat.is_active
        }, ocupado=${!isNotOccupied}`
      );
      return isActive && isNotOccupied;
    });

    console.log("✅ Asientos disponibles:", availableSeats.length);
    console.log(
      "📋 Códigos disponibles:",
      availableSeats
        .map((s) => s.seat_code)
        .slice(0, 10)
        .join(", ")
    );

    return {
      trip,
      availableSeats,
      occupiedCount: occupiedSeatIds.length,
      totalSeats: allSeats.length,
    };
  } catch (error) {
    console.error(`❌ Error al obtener asientos del viaje ${tripId}:`, error);
    throw error;
  }
}
