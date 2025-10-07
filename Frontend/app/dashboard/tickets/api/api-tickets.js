const BASE_URL = "http://localhost:3001/api/v1/tickets";

/**
 * Manejo centralizado de errores
 */
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

/**
 * Crear un nuevo ticket
 */
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

/**
 * Obtener todos los tickets con paginación
 */
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

/**
 * Obtener un ticket por ID
 */
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

/**
 * Obtener tickets por usuario
 */
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

/**
 * Obtener historial de tickets del usuario
 */
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

/**
 * Obtener tickets por viaje
 */
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

/**
 * Actualizar un ticket
 */
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

/**
 * Cancelar un ticket
 */
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

/**
 * Confirmar un ticket
 */
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

/**
 * Eliminar un ticket (soft delete)
 */
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
