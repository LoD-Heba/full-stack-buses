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
      route: `${trip.route?.originCity?.name} → ${trip.route?.destinationCity?.name}`
    });

    if (!trip.bus?.id) {
      throw new Error("El viaje no tiene un bus asignado");
    }

    // 2. Obtener layout del bus con todos los asientos
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
      decks: layout.decks?.length || 0
    });

    // 3. Extraer todos los asientos de todos los decks
    const allSeats = [];
    if (layout.decks && Array.isArray(layout.decks)) {
      layout.decks.forEach((deck) => {
        if (deck.layout && Array.isArray(deck.layout)) {
          // Solo agregar asientos reales (visual_type === 'seat')
          const deckSeats = deck.layout.filter(
            seat => seat.visual_type === 'seat' && seat.id
          );
          allSeats.push(...deckSeats);
        }
      });
    }

    console.log("✅ Total de asientos en el bus:", allSeats.length);
    console.log("📋 Primeros 3 asientos:", allSeats.slice(0, 3).map(s => ({
      id: s.id,
      seat_code: s.seat_code,
      seat_number: s.seat_number
    })));

    if (allSeats.length === 0) {
      throw new Error("El bus no tiene asientos configurados");
    }

    // 4. Obtener tickets del viaje para saber qué asientos están ocupados
    const ticketsRes = await fetch(
      `${BASE_URL}/trip/${tripId}`,
      {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }
    );

    let occupiedSeatIds = [];
    if (ticketsRes.ok) {
      const tickets = await handleApiResponse(ticketsRes);
      occupiedSeatIds = tickets
        .filter(t => t.status === 'CONFIRMADO' || t.status === 'PENDIENTE')
        .map(t => t.seat?.id)
        .filter(Boolean);
      
      console.log("🚫 Asientos ocupados:", occupiedSeatIds.length);
    }

    // 5. Filtrar asientos disponibles
    const availableSeats = allSeats.filter(
      seat => seat.is_active && !occupiedSeatIds.includes(seat.id)
    );

    console.log("✅ Asientos disponibles:", availableSeats.length);

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