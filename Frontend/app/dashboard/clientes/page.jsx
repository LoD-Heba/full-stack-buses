"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getClients } from "./api/api-clients";
import { Pagination } from "../usuarios/components/Pagination";
import { Ticket } from "lucide-react";

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchClientsList = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await getClients(page, limit);
      
      const clientsArray = Array.isArray(res.data) ? res.data : [];
      const clientsData = clientsArray.map((client) => ({
        id: client.id,
        nombre: client.name,
        email: client.email || "—",
        phone: client.phone || "—",
        isEmailVerified: client.isEmailVerified,
        isPhoneVerified: client.isPhoneVerified,
        isActive: client.isActive,
        hasProfile: !!client.profile,
      }));
      
      setClientes(clientsData);
      setMeta(res.meta);
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener la lista de clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsList(meta.page, meta.limit);
  }, []);

  const handlePageChange = (newPage) => {
    fetchClientsList(newPage, meta.limit);
  };

  const handleLimitChange = (newLimit) => {
    fetchClientsList(1, newLimit);
  };

  const handleAdd = () => {
    router.push("/dashboard/clientes/nuevo");
  };

  const handleEdit = (item) => {
    toast.info(`Editando cliente: ${item.nombre}`);
    router.push(`/dashboard/clientes/${item.id}/editar`);
  };

  const handleProfile = (item) => {
    toast.info(`Perfil de cliente: ${item.nombre}`);
    router.push(`/dashboard/clientes/${item.id}/perfil`);
  };

  const handleTickets = (item) => {
    toast.info(`Tickets de ${item.nombre}`);
    router.push(`/dashboard/tickets?clientId=${item.id}`);
  };

  if (loading) return <p className="text-center mt-10">Cargando clientes...</p>;

  return (
    <div>
      <DataTable
        title="Gestión de Clientes"
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Teléfono" },
          {
            key: "isActive",
            label: "Estado",
            render: (value) => (
              <Badge className={value ? "bg-green-500" : "bg-gray-500"}>
                {value ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          {
            key: "hasProfile",
            label: "Perfil",
            render: (value) => (
              <Badge variant={value ? "default" : "secondary"}>
                {value ? "Completo" : "Pendiente"}
              </Badge>
            ),
          },
        ]}
        data={clientes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onProfile={handleProfile}
        customActions={(item) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTickets(item)}
            className="flex items-center gap-1"
          >
            <Ticket className="h-4 w-4" />
            Tickets
          </Button>
        )}
        hideDelete={true}
        hideToggleActive={true}
      />
      
      <Pagination
        meta={meta}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}