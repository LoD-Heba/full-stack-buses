"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getClients, deleteClient, toggleClientActive } from "./api/api-clients";
import { Pagination } from "../usuarios/components/Pagination";
import { Ticket, Search } from "lucide-react";

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchClientsList = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    try {
      const response = await getClients(page, limit, search);
      
      const clientsData = response.data.map((client) => ({
        id: client.id,
        nombre: `${client.firstName} ${client.lastName}`.trim(),
        firstName: client.firstName,
        lastName: client.lastName,
        documentNumber: client.documentNumber || "—",
        phone: client.phone || "—",
        address: client.address || "—",
        isActive: client.isActive,
        createdAt: new Date(client.createdAt).toLocaleDateString("es-ES"),
      }));
      
      setClientes(clientsData);
      setMeta(response.meta);
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener la lista de clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsList(meta.page, meta.limit, searchTerm);
  }, []);

  const handlePageChange = (newPage) => {
    fetchClientsList(newPage, meta.limit, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    fetchClientsList(1, newLimit, searchTerm);
  };

  const handleSearch = () => {
    fetchClientsList(1, meta.limit, searchTerm);
  };

  const handleAdd = () => {
    router.push("/dashboard/clientes/nuevo");
  };

  const handleEdit = (item) => {
    router.push(`/dashboard/clientes/${item.id}/editar`);
  };

  const handleProfile = (item) => {
    router.push(`/dashboard/clientes/${item.id}/perfil`);
  };

  const handleAddTicket = (item) => {
    toast.info(`Agregando ticket para ${item.nombre}`);
    router.push(`/dashboard/tickets/nuevo?clientId=${item.id}`);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente ${item.nombre}?`)) {
      try {
        await deleteClient(item.id);
        toast.success("Cliente eliminado correctamente");
        fetchClientsList(meta.page, meta.limit, searchTerm);
      } catch (error) {
        toast.error("Error al eliminar el cliente");
      }
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await toggleClientActive(item.id);
      toast.success(`Cliente ${item.isActive ? "desactivado" : "activado"} correctamente`);
      fetchClientsList(meta.page, meta.limit, searchTerm);
    } catch (error) {
      toast.error("Error al cambiar el estado del cliente");
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando clientes...</p>;

  return (
    <div>
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Total Clientes</h3>
          <p className="text-2xl font-bold text-blue-600">{meta.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Activos</h3>
          <p className="text-2xl font-bold text-green-600">
            {clientes.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <h3 className="text-sm font-medium text-gray-600">Inactivos</h3>
          <p className="text-2xl font-bold text-gray-600">
            {clientes.filter((c) => !c.isActive).length}
          </p>
        </div>
      </div>

   
      <DataTable
        title="Gestión de Clientes"
        columns={[
          { key: "nombre", label: "Nombre Completo" },
          { key: "documentNumber", label: "C.I." },
          { key: "phone", label: "Teléfono" },
          { key: "createdAt", label: "Fecha Registro" },
          {
            key: "isActive",
            label: "Estado",
            render: (value) => (
              <Badge className={value ? "bg-green-500" : "bg-gray-500"}>
                {value ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
        ]}
        data={clientes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onProfile={handleProfile}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        customActions={(item) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTicket(item)}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Ticket className="h-4 w-4" />
            Nuevo Ticket
          </Button>
        )}
      />
      
      <Pagination
        meta={meta}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}