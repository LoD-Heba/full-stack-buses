const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const busesAPI = {
  // Obtener todos los buses activos
  getAll: async () => {
    const response = await fetch(`${API_URL}/buses`);
    if (!response.ok) throw new Error('Error al obtener buses');
    return response.json();
  },

  // Obtener buses de una ruta específica
  getByRoute: async (routeId) => {
    const response = await fetch(`${API_URL}/routes/${routeId}/buses`);
    if (!response.ok) throw new Error('Error al obtener buses de la ruta');
    return response.json();
  },
};