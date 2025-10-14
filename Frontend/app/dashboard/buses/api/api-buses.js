// Frontend/app/dashboard/buses/api/api-buses.js
const BASE_URL = "http://localhost:3001/api/v1/buses";

async function handleApiResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = data.message || 
                        data.error || 
                        `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  return data;
}

export async function createBus(busData) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/buses`, {
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

export async function uploadBusImage(busId, imageFile) {
  try {
    if (!busId || !imageFile) {
      throw new Error("ID de bus y archivo de imagen son requeridos");
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${BASE_URL}/${busId}/upload-image`, {
      method: "POST",
      body: formData,
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error(`Error al subir imagen del bus ${busId}:`, error);
    throw error;
  }
}

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

export async function searchBuses(filters = {}, page = 1, limit = 10) {
  try {
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

export async function getBus(id) {
  try {
    if (!id || id === "undefined") {
      throw new Error("ID de bus inválido");
    }

    const res = await fetch(`http://localhost:3001/api/v1/buses/${id}`, { 
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

export async function getBusesByUser(userId) {
  try {
    if (!userId) {
      throw new Error("ID de usuario requerido");
    }

    const res = await fetch(`${BASE_URL}/users/${userId}`, { 
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

export async function changeBusStatus(id, status) {
  try {
    if (!id) {
      throw new Error("ID de bus requerido");
    }

    if (!status) {
      throw new Error("Estado requerido");
    }

    const validStatuses = ["disponible", "en_uso", "mantenimiento", "fuera_de_servicio"];
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

export async function hardDeleteBus(id) {
  try {
    if (!id) {
      throw new Error("ID de bus requerido");
    }

    const response = await fetch(`${BASE_URL}/${id}/hard-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar permanentemente');
    }

    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar permanentemente el bus ${id}:`, error);
    throw error;
  }
}