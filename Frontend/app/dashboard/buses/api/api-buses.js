const BASE_URL = "http://localhost:3001/api/v1/buses";

/**
 * Manejo centralizado de errores de API
 */
async function handleApiResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    // Extraer mensaje de error del backend
    const errorMessage = data.message || 
                        data.error || 
                        `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  return data;
}

/**
 * Crear un nuevo bus
 */
export async function createBus(busData) {
  try {
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(busData),
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error al crear bus:", error);
    throw error;
  }
}

/**
 * Obtener todos los buses con paginación
 */
export async function getBuses(page = 1, limit = 10) {
  try {
    const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error al obtener buses:", error);
    throw error;
  }
}

/**
 * Buscar buses con filtros
 */
export async function searchBuses(filters = {}, page = 1, limit = 10) {
  try {
    // Limpiar filtros vacíos
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryParams = new URLSearchParams({
      ...cleanFilters,
      page: page.toString(),
      limit: limit.toString(),
    });

    const res = await fetch(`${BASE_URL}/search?${queryParams}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error al buscar buses:", error);
    throw error;
  }
}

/**
 * Obtener un bus por ID
 */
export async function getBus(id) {
  try {
    if (!id || id === "undefined") {
      throw new Error("ID de bus inválido");
    }

    const res = await fetch(`${BASE_URL}/${id}`, { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener bus ${id}:`, error);
    throw error;
  }
}

/**
 * Obtener buses por usuario
 */
export async function getBusesByUser(userId) {
  try {
    if (!userId) {
      throw new Error("ID de usuario requerido");
    }

    const res = await fetch(`${BASE_URL}/user/${userId}`, { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener buses del usuario ${userId}:`, error);
    throw error;
  }
}

/**
 * Obtener buses disponibles
 */
export async function getAvailableBuses() {
  try {
    const res = await fetch(`${BASE_URL}/available`, { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error al obtener buses disponibles:", error);
    throw error;
  }
}

/**
 * Obtener estadísticas de un bus
 */
export async function getBusStatistics(id) {
  try {
    if (!id) {
      throw new Error("ID de bus requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}/statistics`, { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al obtener estadísticas del bus ${id}:`, error);
    throw error;
  }
}

/**
 * Actualizar un bus
 */
export async function updateBus(id, busData) {
  try {
    if (!id) {
      throw new Error("ID de bus requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(busData),
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al actualizar bus ${id}:`, error);
    throw error;
  }
}

/**
 * Cambiar estado de un bus
 */
export async function changeBusStatus(id, status) {
  try {
    if (!id) {
      throw new Error("ID de bus requerido");
    }

    if (!status) {
      throw new Error("Estado requerido");
    }

    const validStatuses = ["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_SERVICE"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido. Debe ser: ${validStatuses.join(", ")}`);
    }

    const res = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al cambiar estado del bus ${id}:`, error);
    throw error;
  }
}

/**
 * Eliminar un bus (soft delete)
 */
export async function deleteBus(id) {
  try {
    if (!id) {
      throw new Error("ID de bus requerido");
    }

    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al eliminar bus ${id}:`, error);
    throw error;
  }
}