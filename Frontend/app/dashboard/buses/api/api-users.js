const BASE_URL = "http://localhost:3001/api/v1";

/**
 * Obtener usuarios con perfil completo y conteo de buses
 */
export async function getUsersWithProfile() {
  try {
    const res = await fetch(`${BASE_URL}/users?limit=100`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al cargar usuarios");
    }

    // Filtrar solo usuarios activos con perfil completo
    const usersWithProfile = (data.data || []).filter(
      (user) => user.isActive && user.profile !== null
    );

    // Obtener conteo de buses para cada usuario
    const usersWithBusCount = await Promise.all(
      usersWithProfile.map(async (user) => {
        try {
          const busRes = await fetch(`${BASE_URL}/buses/user/${user.id}`, {
            cache: "no-store",
          });
          const busData = await busRes.json();
          
          return {
            ...user,
            busCount: Array.isArray(busData) ? busData.length : 0,
          };
        } catch (error) {
          console.error(`Error al obtener buses del usuario ${user.id}:`, error);
          return {
            ...user,
            busCount: 0,
          };
        }
      })
    );

    return usersWithBusCount;
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    throw error;
  }
}

/**
 * Obtener conteo de buses de un usuario específico
 */
export async function getUserBusCount(userId) {
  try {
    const res = await fetch(`${BASE_URL}/buses/user/${userId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return 0;
    }

    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error(`Error al obtener conteo de buses del usuario ${userId}:`, error);
    return 0;
  }
}