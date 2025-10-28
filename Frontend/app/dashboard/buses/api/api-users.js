const BASE_URL = "http://localhost:3001/api/v1";

/**
 * Obtener usuarios con perfil completo y conteo de buses
 */
export async function getUsersWithProfile() {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/users?page=1&limit=100`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Error al cargar usuarios");
    }

    const response = await res.json();
    const users = response.data || [];

    // Enriquecer cada usuario con su conteo de buses
    const usersWithBusCount = await Promise.all(
      users
        .filter((user) => user.profile && user.is_active) // Solo usuarios con perfil completo y activos
        .map(async (user) => {
          try {
            // Obtener buses del usuario
            const busRes = await fetch(
              `http://localhost:3001/api/v1/buses?userId=${user.id}`,
              { cache: "no-store" }
            );

            if (busRes.ok) {
              const busData = await busRes.json();
              return {
                ...user,
                busCount: busData.data?.length || 0,
              };
            }

            return {
              ...user,
              busCount: 0,
            };
          } catch (error) {
            console.error(`Error al cargar buses del usuario ${user.id}:`, error);
            return {
              ...user,
              busCount: 0,
            };
          }
        })
    );

    return usersWithBusCount;
  } catch (error) {
    console.error("Error en getUsersWithProfile:", error);
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