const BASE_URL = "http://localhost:3001/api/v1";

/**
 * Obtener usuarios con perfil completo y conteo de buses
 */
export async function getUsersWithProfile() {
  try {
    // ✅ Obtener todos los usuarios (sin filtro isActive por ahora)
    const res = await fetch(`${BASE_URL}/users?page=1&limit=100`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Error al cargar usuarios");
    }

    const response = await res.json();
    const users = response.data || [];

    console.log("📊 Total usuarios recibidos:", users.length);

    // ✅ Filtrar solo usuarios con perfil completo (profile !== null)
    const usersWithProfile = users.filter((user) => {
      const hasProfile = user.profile && user.profile.id;
      if (!hasProfile) {
        console.log("❌ Usuario sin perfil:", user.name, user.id);
      }
      return hasProfile;
    });

    console.log("✅ Usuarios con perfil:", usersWithProfile.length);

    // ✅ Enriquecer cada usuario con su conteo de buses
    const usersWithBusCount = await Promise.all(
      usersWithProfile.map(async (user) => {
        try {
          // Obtener buses del usuario usando el endpoint correcto
          const busRes = await fetch(
            `${BASE_URL}/buses/user/${user.id}`,
            { cache: "no-store" }
          );

          if (busRes.ok) {
            const busData = await busRes.json();
            const busCount = Array.isArray(busData) ? busData.length : 0;
            
            console.log(`🚌 Usuario ${user.name}: ${busCount} buses`);
            
            return {
              ...user,
              busCount,
            };
          }

          console.warn(`⚠️ No se pudieron cargar buses del usuario ${user.name}`);
          return {
            ...user,
            busCount: 0,
          };
        } catch (error) {
          console.error(`❌ Error al cargar buses del usuario ${user.id}:`, error);
          return {
            ...user,
            busCount: 0,
          };
        }
      })
    );

    console.log("✅ Usuarios procesados:", usersWithBusCount.length);
    return usersWithBusCount;
  } catch (error) {
    console.error("❌ Error en getUsersWithProfile:", error);
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
      console.warn(`⚠️ No se pudo obtener conteo de buses para usuario ${userId}`);
      return 0;
    }

    const data = await res.json();
    const count = Array.isArray(data) ? data.length : 0;
    console.log(`🚌 Usuario ${userId}: ${count} buses`);
    return count;
  } catch (error) {
    console.error(`❌ Error al obtener conteo de buses del usuario ${userId}:`, error);
    return 0;
  }
}