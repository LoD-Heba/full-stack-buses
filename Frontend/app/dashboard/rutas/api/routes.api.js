// Frontend/src/services/api/routes.api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const routesAPI = {
  // Obtener todas las rutas con paginación
  getAll: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/routes?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Error al obtener rutas');
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

  // Eliminar ruta (soft delete)
  delete: async (id) => {
    const response = await fetch(`${API_URL}/routes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar ruta');
    }
    return response.json();
  },

  // Buscar rutas
  search: async (filters, page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${API_URL}/routes/search?${params}`);
    if (!response.ok) throw new Error('Error al buscar rutas');
    return response.json();
  },

  // Obtener estadísticas de una ruta
  getStatistics: async (id) => {
    const response = await fetch(`${API_URL}/routes/${id}/statistics`);
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },
};