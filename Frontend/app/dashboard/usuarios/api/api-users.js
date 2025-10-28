export async function createUser(datosDeUsuario) {
  const res = await fetch(`http://localhost:3001/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosDeUsuario),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear el usuario");
  }

  return data;
}

// ✅ Agregamos parámetro isActive para filtrar
export async function getUsers(page = 1, limit = 10, isActive = null) {
  let url = `http://localhost:3001/api/v1/users?page=${page}&limit=${limit}`;
  
  // ✅ Si se especifica isActive, agregamos el filtro
  if (isActive !== null) {
    url += `&isActive=${isActive}`;
  }
  
  const data = await fetch(url, {
    cache: "no-store",
  });
  return await data.json();
}


export async function getUser(id) {
  const data = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    cache: "no-store",
  });
  return await data.json();
}

export async function getUserWithStats(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/users/${id}/stats`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Error al obtener estadísticas del usuario");
    }

    return await res.json();
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    throw error;
  }
}

export async function deleteUser(id) {
  console.log("Deleting user with ID:", id);

  const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let errorMessage = "Error al eliminar el usuario";
    
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data;
}

export async function toggleActiveUser(id) {
  console.log("Activating user with ID:", id);

  const res = await fetch(`http://localhost:3001/api/v1/users/${id}/active`, {
    method: "PATCH",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al activar el usuario");
  }

  return data;
}

export async function toggleDeactiveUser(id) {
  console.log("Deactivating user with ID:", id);

  const res = await fetch(`http://localhost:3001/api/v1/users/${id}/deactive`, {
    method: "PATCH",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al desactivar el usuario");
  }

  return data;
}

export async function updateUser(id, newUser) {
  const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newUser),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al actualizar el usuario");
  }

  return data;
}

export async function getUserProfile(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}