"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getClients } from "./api/api-clients";
import { Pagination } from "../usuarios/components/Pagination";
import { Ticket, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      const clientsData = clientsArray.map((client) => {
        const profile = client.profile;
        const hasCompleteProfile = profile && 
          profile.firstName && 
          profile.lastName && 
          profile.documentNumber;

        return {
          id: client.id,
          nombre: client.name,
          email: client.email || "—",
          phone: client.phone || "—",
          isEmailVerified: client.isEmailVerified,
          isPhoneVerified: client.isPhoneVerified,
          isActive: client.isActive,
          hasProfile: !!profile,
          hasCompleteProfile: hasCompleteProfile,
          profile: profile,
        };
      });
      
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

  const handleAddTicket = (item) => {
    if (!item.hasCompleteProfile) {
      toast.error("El cliente debe completar su perfil antes de comprar tickets", {
        description: "Nombre, apellido y documento son requeridos",
        duration: 4000,
      });
      return;
    }
    
    toast.info(`Agregando ticket para ${item.nombre}`);
    router.push(`/dashboard/tickets/nuevo?clientId=${item.id}`);
  };

  if (loading) return <p className="text-center mt-10">Cargando clientes...</p>;

  return (
    <div>
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Total Clientes</h3>
          <p className="text-2xl font-bold text-blue-600">{clientes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Activos</h3>
          <p className="text-2xl font-bold text-green-600">
            {clientes.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-600">Con Perfil</h3>
          <p className="text-2xl font-bold text-purple-600">
            {clientes.filter((c) => c.hasProfile).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-600">Perfil Completo</h3>
          <p className="text-2xl font-bold text-orange-600">
            {clientes.filter((c) => c.hasCompleteProfile).length}
          </p>
        </div>
      </div>

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
            key: "hasCompleteProfile",
            label: "Perfil",
            render: (value, item) => {
              if (value) {
                return (
                  <Badge className="bg-green-500">
                    ✓ Completo
                  </Badge>
                );
              } else if (item.hasProfile) {
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          ⚠ Incompleto
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Faltan datos: Nombre, apellido o documento</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              } else {
                return (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                    Sin perfil
                  </Badge>
                );
              }
            },
          },
        ]}
        data={clientes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onProfile={handleProfile}
        customActions={(item) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTicket(item)}
                  disabled={!item.hasCompleteProfile}
                  className={`flex items-center gap-2 ${
                    item.hasCompleteProfile
                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  Agregar Ticket
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {item.hasCompleteProfile ? (
                  <p>Crear un nuevo ticket para este cliente</p>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Perfil incompleto</p>
                      <p className="text-xs">
                        Se requiere: nombre, apellido y documento
                      </p>
                    </div>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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