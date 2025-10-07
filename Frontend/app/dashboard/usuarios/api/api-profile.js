// app/dashboard/usuarios/api/api-profile.js

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
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error al actualizar el perfil");
  }
  
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
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error al crear el perfil");
  }
  
  return data;
}