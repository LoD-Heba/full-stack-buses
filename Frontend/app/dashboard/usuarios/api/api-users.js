//export const BACKEND_URL = process.env.BACKEND_URL

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

export async function getUsers(page = 1, limit = 10) {
  const data = await fetch(
    `http://localhost:3001/api/v1/users?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  return await data.json();
}

export async function getUser(id) {
  const data = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    cache: "no-store",
  });
  return await data.json();
}

export async function deleteUser(id) {
  console.log("Deleting user with ID:", id); // ✅ Debug

  const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();

  // ✅ Manejar errores del backend
  if (!res.ok) {
    throw new Error(data.message || "Error al eliminar el usuario");
  }

  return data;
}
// ... tus funciones existentes ...

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
// ✅ CORREGIDO: Ahora acepta (id, newUser) como parámetros separados
export async function updateUser(id, newUser) {
  // console.log("Updating user with ID:", id); // ✅ Debug
  // console.log("Data to send:", newUser); // ✅ Debug

  const res = await fetch(`http://localhost:3001/api/v1/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newUser),
    cache: "no-store",
  });

  const data = await res.json();

  // ✅ Manejar errores del backend
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
