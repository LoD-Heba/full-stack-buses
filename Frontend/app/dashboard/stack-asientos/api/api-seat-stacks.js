
export async function createSeatStack(stackData) {
  const res = await fetch(`http://localhost:3001/api/v1/seat-stacks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stackData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear el stack de asientos");
  }

  return data;
}

/**
 * 📋 Obtener todos los seat stacks
 */
export async function getSeatStacks() {
  const res = await fetch(`http://localhost:3001/api/v1/seat-stacks`, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al obtener los stacks de asientos");
  }

  return data;
}

/**
 * 🔍 Obtener un seat stack por su ID
 */
export async function getSeatStack(id) {
  const res = await fetch(`http://localhost:3001/api/v1/seat-stacks/${id}`, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al obtener el stack de asientos");
  }

  return data;
}

/**
 * ✏️ Actualizar un seat stack
 */
export async function updateSeatStack(id, stackData) {
  const res = await fetch(`http://localhost:3001/api/v1/seat-stacks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stackData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al actualizar el stack de asientos");
  }

  return data;
}

/**
 * 🗑️ Eliminar un seat stack
 */
export async function deleteSeatStack(id) {
  const res = await fetch(`http://localhost:3001/api/v1/seat-stacks/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al eliminar el stack de asientos");
  }

  return data;
}