// app/dashboard/roles/[id]/edit/page.jsx
import { RoleForm } from "../../components/role-form";

async function getRoleById(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/roles/${id}`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch role");
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}

export default async function EditRolePage({ params }) {
  const resolvedParams = await params;
  const role = await getRoleById(resolvedParams.id);

  if (!role) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 text-center">
        <p className="text-red-500">Rol no encontrado</p>
      </div>
    );
  }

  return <RoleForm role={role} />;
}