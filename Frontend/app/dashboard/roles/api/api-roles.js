// app/dashboard/roles/api/api-roles.js

export async function createRole(roleData) {
  const res = await fetch(`http://localhost:3001/api/v1/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(roleData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear el rol");
  }

  return data;
}

export async function getRoles() {
  const data = await fetch(`http://localhost:3001/api/v1/roles`, {
    cache: "no-store",
  });
  return await data.json();
}

export async function getRole(id) {
  const data = await fetch(`http://localhost:3001/api/v1/roles/${id}`, {
    cache: "no-store",
  });
  return await data.json();
}

export async function deleteRole(id) {
  console.log("Deleting role with ID:", id);
  
  const res = await fetch(`http://localhost:3001/api/v1/roles/${id}`, {
    method: "DELETE",
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error al eliminar el rol");
  }
  
  return data;
}

export async function updateRole(id, roleData) {
  console.log("Updating role with ID:", id);
  console.log("Data to send:", roleData);
  
  const res = await fetch(`http://localhost:3001/api/v1/roles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(roleData),
    cache: "no-store",
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error al actualizar el rol");
  }
  
  return data;
}

export async function toggleActiveRole(id) {
  console.log("Activating role with ID:", id);
  
  const res = await fetch(`http://localhost:3001/api/v1/roles/${id}/restore`, {
    method: "PATCH",
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error al activar el rol");
  }
  
  return data;
}

export async function toggleDeactiveRole(id) {
  console.log("Deactivating role with ID:", id);
  
  const res = await fetch(`http://localhost:3001/api/v1/roles/${id}/deactivate`, {
    method: "PATCH",
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error al desactivar el rol");
  }
  
  return data;
}