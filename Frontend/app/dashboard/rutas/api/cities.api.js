
// Frontend/src/services/api/cities.api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const citiesAPI = {
  // Obtener todas las ciudades activas
  getAll: async () => {
    const response = await fetch(`${API_URL}/city`);
    if (!response.ok) throw new Error('Error al obtener ciudades');
    return response.json();
  },

  // Obtener ciudad por ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/city/${id}`);
    if (!response.ok) throw new Error('Error al obtener ciudad');
    return response.json();
  },
};