// Frontend/app/dashboard/rutas/api/routes.api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const routesAPI = {
  // Obtener todas las rutas activas con paginación
  getAll: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/routes?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Error al obtener rutas');
    return response.json();
  },

  // Obtener rutas inactivas
  getInactive: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/routes?inactive=true&page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Error al obtener rutas inactivas');
    return response.json();
  },

  // Obtener lista de inactivas sin paginación
  getAllInactive: async () => {
    const response = await fetch(`${API_URL}/routes/list/inactive`);
    if (!response.ok) throw new Error('Error al obtener rutas inactivas');
    return response.json();
  },

  // Obtener una ruta por ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/routes/${id}`);
    if (!response.ok) throw new Error('Error al obtener ruta');
    return response.json();
  },

  // Crear nueva ruta
  create: async (data) => {
    const response = await fetch(`${API_URL}/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear ruta');
    }
    return response.json();
  },

  // Actualizar ruta
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/routes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar ruta');
    }
    return response.json();
  },

  // Soft delete (desactivar ruta)
  softDelete: async (id) => {
    const response = await fetch(`${API_URL}/routes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al desactivar ruta');
    }
    return response.json();
  },

  // Hard delete (eliminar permanentemente)
  hardDelete: async (id) => {
    const response = await fetch(`${API_URL}/routes/${id}/hard`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar ruta');
    }
    return response.json();
  },

  // Reactivar ruta inactiva
  reactivate: async (id) => {
    const response = await fetch(`${API_URL}/routes/${id}/reactivate`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al reactivar ruta');
    }
    return response.json();
  },

  // Obtener rutas por ciudad
  getByCity: async (cityId, type = 'both') => {
    const response = await fetch(`${API_URL}/routes/city/${cityId}?type=${type}`);
    if (!response.ok) throw new Error('Error al obtener rutas');
    return response.json();
  },

  // Obtener buses de una ruta
  getBusesForRoute: async (routeId) => {
    const response = await fetch(`${API_URL}/routes/${routeId}/buses`);
    if (!response.ok) throw new Error('Error al obtener buses de la ruta');
    return response.json();
  },

  // Asignar bus a ruta
  assignBus: async (routeId, busId) => {
    const response = await fetch(`${API_URL}/routes/${routeId}/buses/${busId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al asignar bus');
    }
    return response.json();
  },

  // Remover bus de ruta
  removeBus: async (routeId, busId) => {
    const response = await fetch(`${API_URL}/routes/${routeId}/buses/${busId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al remover bus');
    }
    return response.json();
  },
};