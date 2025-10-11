// Frontend/app/dashboard/clientes/api/api-clients.js

const API_BASE = "http://localhost:3001/api/v1";

/**
 * Crear un nuevo cliente (solo perfil, sin cuenta de usuario)
 */
export async function createClient(clientData) {
  const res = await fetch(`${API_BASE}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clientData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear el cliente");
  }

  return data;
}

/**
 * Obtener lista de clientes con paginación
 */
export async function getClients(page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
 
  const res = await fetch(`${API_BASE}/clients?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener la lista de clientes");
  }

  return await res.json();
}

/**
 * Obtener un cliente por ID
 */
export async function getClient(id) {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Cliente no encontrado");
  }

  return await res.json();
}

/**
 * Obtener un cliente con sus tickets
 */
export async function getClientWithTickets(id) {
  const res = await fetch(`${API_BASE}/clients/${id}/with-tickets`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Cliente no encontrado");
  }

  return await res.json();
}

/**
 * Actualizar un cliente
 */
export async function updateClient(id, clientData) {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al actualizar el cliente");
  }

  return data;
}

/**
 * Eliminar (desactivar) un cliente
 */
export async function deleteClient(id) {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Error al eliminar el cliente");
  }

  return true;
}

/**
 * Alternar estado activo/inactivo de un cliente
 */
export async function toggleClientActive(id) {
  const res = await fetch(`${API_BASE}/clients/${id}/toggle-active`, {
    method: "PATCH",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al cambiar el estado del cliente");
  }

  return data;
}

/**
 * Verificar si un cliente puede comprar tickets
 */
export async function canClientPurchaseTickets(id) {
  const res = await fetch(`${API_BASE}/clients/${id}/can-purchase`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return false;
  }

  return await res.json();
}