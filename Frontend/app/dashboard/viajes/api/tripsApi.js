const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const tripsAPI = {
  // Obtener todos los viajes con paginación
  getAll: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/trips?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Error al obtener viajes');
    return response.json();
  },

  // Obtener un viaje por ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/trips/${id}`);
    if (!response.ok) throw new Error('Error al obtener viaje');
    return response.json();
  },

  // Crear nuevo viaje
  create: async (data) => {
    const response = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear viaje');
    }
    return response.json();
  },

  // Actualizar viaje
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar viaje');
    }
    return response.json();
  },

  // Eliminar viaje
  delete: async (id) => {
    const response = await fetch(`${API_URL}/trips/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar viaje');
    }
    return response.json();
  },

  // Buscar viajes
  search: async (filters, page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${API_URL}/trips/search?${params}`);
    if (!response.ok) throw new Error('Error al buscar viajes');
    return response.json();
  },

  // Viajes disponibles
  getAvailable: async (routeId, date) => {
    const params = new URLSearchParams();
    if (routeId) params.append('routeId', routeId);
    if (date) params.append('date', date);
    
    const response = await fetch(`${API_URL}/trips/available?${params}`);
    if (!response.ok) throw new Error('Error al obtener viajes disponibles');
    return response.json();
  },

  // Estadísticas de un viaje
  getStatistics: async (id) => {
    const response = await fetch(`${API_URL}/trips/${id}/statistics`);
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  // Iniciar viaje
  start: async (id) => {
    const response = await fetch(`${API_URL}/trips/${id}/start`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar viaje');
    }
    return response.json();
  },

  // Completar viaje
  complete: async (id) => {
    const response = await fetch(`${API_URL}/trips/${id}/complete`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al completar viaje');
    }
    return response.json();
  },

  // Cancelar viaje
  cancel: async (id) => {
    const response = await fetch(`${API_URL}/trips/${id}/cancel`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cancelar viaje');
    }
    return response.json();
  },
};

// API para obtener rutas
export const routesAPI = {
  getAll: async (limit = 100) => {
    const response = await fetch(`${API_URL}/routes?limit=${limit}`);
    if (!response.ok) throw new Error('Error al obtener rutas');
    return response.json();
  },

  getBusesForRoute: async (routeId) => {
    const response = await fetch(`${API_URL}/routes/${routeId}/buses`);
    if (!response.ok) throw new Error('Error al obtener buses de la ruta');
    return response.json();
  },
};

// API para obtener buses
export const busesAPI = {
  getAll: async (limit = 100) => {
    const response = await fetch(`${API_URL}/buses?limit=${limit}`);
    if (!response.ok) throw new Error('Error al obtener buses');
    return response.json();
  },
};