export async function updateUserProfile(userId, profileData) {
  console.log("Updating profile for user:", userId);
  console.log("Profile data:", profileData);
  
  const res = await fetch(`http://localhost:3001/api/v1/users/${userId}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
    cache: "no-store",
  });
  
  if (!res.ok) {
    let errorMessage = "Error al actualizar el perfil";
    
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
      
      // Si el mensaje es un array, tomar el primer elemento
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage[0];
      }
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  return data;
}

export async function createUserProfile(userId, profileData) {
  console.log("Creating profile for user:", userId);
  console.log("Profile data:", profileData);
  
  const res = await fetch(`http://localhost:3001/api/v1/users/${userId}/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  
  if (!res.ok) {
    let errorMessage = "Error al crear el perfil";
    
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
      
      // Si el mensaje es un array, tomar el primer elemento
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage[0];
      }
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  return data;
}