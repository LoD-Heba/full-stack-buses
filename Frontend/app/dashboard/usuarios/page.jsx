"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import  DataTable  from "../../../components/common/DataTable";
import { 
  getUsers, 
  deleteUser, 
  toggleActiveUser, 
  toggleDeactiveUser 
} from "./api/api-users";
import { Pagination } from "./components/Pagination";

export default function UsuariosPage({ user }) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchUsersList = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await getUsers(page, limit);
      
      // El backend devuelve { data: [...], meta: {...} }
      const usersArray = Array.isArray(res.data) ? res.data : [];
      const usersData = usersArray.map((user) => ({
        id: user.id,
        nombre: user.name,
        email: user.email,
        phone: user.phone || "—",
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isActive: user.isActive,
        rol: user.roles?.name || "—",
      }));
      
      setUsuarios(usersData);
      setMeta(res.meta);
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList(meta.page, meta.limit);
  }, []);

  const handlePageChange = (newPage) => {
    fetchUsersList(newPage, meta.limit);
  };

  const handleLimitChange = (newLimit) => {
    fetchUsersList(1, newLimit);
  };

  const handleAdd = () => {
    router.push("/dashboard/usuarios/newUser");
  };

  const handleEdit = (item) => {
    toast.info(`Editando usuario: ${item.nombre}`);
    router.push(`/dashboard/usuarios/${item.id}/edit`);
  };

  const handleProfile = (item) => {
    toast.info(`Perfil de usuario: ${item.nombre}`);
    router.push(`/dashboard/usuarios/${item.id}/profile`);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar al usuario ${item.nombre}?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteUser(item.id);
      
      if (res && res.id) {
        toast.success(`Usuario ${item.nombre} eliminado`);
        fetchUsersList(meta.page, meta.limit);
      } else {
        toast.error("No se pudo eliminar el usuario");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al eliminar el usuario");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      if (item.isActive) {
        await toggleDeactiveUser(item.id);
        toast.success(`Usuario ${item.nombre} desactivado`);
      } else {
        await toggleActiveUser(item.id);
        toast.success(`Usuario ${item.nombre} activado`);
      }
      fetchUsersList(meta.page, meta.limit);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al cambiar el estado del usuario");
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando usuarios...</p>;

  return (
    <div>
      <DataTable
        title="Gestión de Usuarios"
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Teléfono" },
          {
            key: "isActive",
            label: "Activo",
            render: (value) => (
              <Badge className={value ? "bg-green-500" : "bg-gray-500"}>
                {value ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          { key: "rol", label: "Rol" },
        ]}
        data={usuarios}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onProfile={handleProfile}
        onToggleActive={handleToggleActive}
      />
      
      <Pagination
        meta={meta}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}