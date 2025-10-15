const BASE_URL = "http://localhost:3001/api/v1";

/**
 * Configurar layout completo de un bus
 */
export async function configureBusLayout(busId, layoutConfig) {
  try {
    const res = await fetch(`${BASE_URL}/buses/${busId}/configure-layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layoutConfig),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al configurar el layout");
    }

    return data;
  } catch (error) {
    console.error("Error al configurar layout:", error);
    throw error;
  }
}

/**
 * Obtener layout de un bus
 */
export async function getBusLayout(busId) {
  try {
    const res = await fetch(`${BASE_URL}/buses/${busId}/layout`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al obtener el layout");
    }

    return data;
  } catch (error) {
    console.error("Error al obtener layout:", error);
    throw error;
  }
}

/**
 * Crear asientos en bulk
 */
export async function createBulkSeats(stackId, seats) {
  try {
    const res = await fetch(`${BASE_URL}/seat/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stackId, seats }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al crear asientos");
    }

    return data;
  } catch (error) {
    console.error("Error al crear asientos:", error);
    throw error;
  }
}

/**
 * Crear stack de asientos
 */
export async function createSeatStack(busId, floorNumber, stackName, description) {
  try {
    const res = await fetch(`${BASE_URL}/seat-stacks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        busId,
        floor_number: floorNumber,
        name: stackName,
        description,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al crear stack");
    }

    return data;
  } catch (error) {
    console.error("Error al crear stack:", error);
    throw error;
  }
}