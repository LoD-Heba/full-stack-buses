"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getRoles,
  deleteRole,
  toggleActiveRole,
  toggleDeactiveRole,
} from "./api/api-roles";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRolesList = async () => {
    setLoading(true);
    try {
      const res = await getRoles();

      const rolesArray = Array.isArray(res) ? res : res.data || {};
      const rolesData = rolesArray.map((role) => ({
        id: role.id,
        nombre: role.name,
        descripcion: role.description || "—",
        isActive: role.isActive,
        usuarios: role.user?.length || 0,
      }));
      setRoles(rolesData);
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener la lista de roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesList();
  }, []);

  const handleAdd = () => {
    router.push("/dashboard/roles/newRole");
  };

  const handleEdit = (item) => {
    toast.info(`Editando rol: ${item.nombre}`);
    router.push(`/dashboard/roles/${item.id}/edit`);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`¿Deseas eliminar el rol ${item.nombre}?`);
    if (!confirmed) return;

    try {
      const res = await deleteRole(item.id);

      if (res && res.id) {
        toast.success(`Rol ${item.nombre} eliminado`);
        fetchRolesList();
      } else {
        toast.error("No se pudo eliminar el rol");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al eliminar el rol");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      if (item.nombre === "admin" || item.nombre === "user") {
        toast.info(`El rol "${item.nombre}" no puede modificarse.`);
        return;
      }
      if (item.isActive) {
        await toggleDeactiveRole(item.id);
        toast.success(`Rol ${item.nombre} desactivado`);
      } else {
        await toggleActiveRole(item.id);
        toast.success(`Rol ${item.nombre} activado`);
      }

      fetchRolesList();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al cambiar el estado del rol");
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando roles...</p>;

  return (
    <DataTable
      title="Gestión de Roles"
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "descripcion", label: "Descripción" },
        {
          key: "isActive",
          label: "Activo",
          render: (value) => (
            <Badge className={value ? "bg-green-500" : "bg-gray-500"}>
              {value ? "Activo" : "Inactivo"}
            </Badge>
          ),
        },
        {
          key: "usuarios",
          label: "Usuarios",
          render: (value) => <Badge variant="outline">{value}</Badge>,
        },
      ]}
      data={roles}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
    />
  );
}
