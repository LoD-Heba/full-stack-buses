// Frontend/app/dashboard/clientes/api/api-clients.js

export async function createClient(clientData) {
  const res = await fetch(`http://localhost:3001/api/v1/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...clientData,
      // El rol de cliente se asigna automáticamente en el backend
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear el cliente");
  }

  return data;
}

export async function getClients(page = 1, limit = 10) {
  const data = await fetch(
    `http://localhost:3001/api/v1/users?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  const response = await data.json();
  
  // Filtrar solo usuarios con rol "user" o "client"
  const clientsData = response.data.filter(
    user => user.roles?.name === "user" || user.roles?.name === "client"
  );
  
  return {
    data: clientsData,
    meta: {
      ...response.meta,
      total: clientsData.length
    }
  };
}

export async function getClient(id) {
  const data = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    cache: "no-store",
  });
  return await data.json();
}

export async function updateClient(id, clientData) {
  const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al actualizar el cliente");
  }

  return data;
}

export async function getClientProfile(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch client profile");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return null;
  }
}