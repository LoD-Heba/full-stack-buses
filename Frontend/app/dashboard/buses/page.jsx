"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Pagination } from "@/app/dashboard/buses/components/Pagination";
import { getBuses, deleteBus, changeBusStatus } from "./api/api-buses";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const STATUS_COLORS = {
  DISPONIBLE: "bg-green-100 text-green-800",
  EN_USO: "bg-blue-100 text-blue-800",
  MANTENIMIENTO: "bg-yellow-100 text-yellow-800",
  FUERA_DE_SERVICIO: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  DISPONIBLE: "Disponible",
  EN_USO: "En uso",
  MANTENIMIENTO: "Mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, bus: null });
  const router = useRouter();

  // Cargar buses
  useEffect(() => {
    loadBuses();
  }, [meta.page, meta.limit]);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const response = await getBuses(meta.page, meta.limit);
      setBuses(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los buses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejadores de eventos
  const handleAdd = () => {
    router.push("/dashboard/buses/new");
  };

  const handleEdit = (bus) => {
    router.push(`/dashboard/buses/${bus.id}/edit`);
  };

  const handleProfile = (bus) => {
    router.push(`/dashboard/buses/${bus.id}`);
  };

  const handleDeleteClick = (bus) => {
    setDeleteDialog({ open: true, bus });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBus(deleteDialog.bus.id);
      toast({
        title: "Éxito",
        description: "Bus eliminado correctamente",
      });
      setDeleteDialog({ open: false, bus: null });
      loadBuses();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el bus",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (bus) => {
    try {
      const newStatus = bus.status === "disponible" ? "fuera_de_servicio" : "disponible";
      await changeBusStatus(bus.id, newStatus);
      toast({
        title: "Éxito",
        description: `Bus ${newStatus === "disponible" ? "activado" : "desactivado"} correctamente`,
      });
      loadBuses();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage) => {
    setMeta((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Definición de columnas
  const columns = [
    {
      key: "plate",
      label: "Placa",
    },
    {
      key: "model",
      label: "Modelo",
    },
    {
      key: "year",
      label: "Año",
    },
    {
      key: "capacity",
      label: "Capacidad",
      render: (value) => `${value || 0} asientos`,
    },
    {
      key: "service_type",
      label: "Tipo de Servicio",
      render: (value) => {
        const labels = {
          normal: "Normal",
          semi_cama: "Semi Cama",
          cama: "Cama",
        };
        return labels[value] || value;
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[value] || ""}`}>
          {STATUS_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: "user",
      label: "Usuario",
      render: (value) => value?.email || value?.username || "-",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DataTable
        title="Gestión de Buses"
        columns={columns}
        data={buses}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleActive={handleToggleActive}
        onProfile={handleProfile}
      />

      {buses.length > 0 && (
        <Pagination
          meta={meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, bus: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el bus <strong>{deleteDialog.bus?.plate}</strong>.
              {deleteDialog.bus?.trips?.length > 0 && (
                <span className="block mt-2 text-yellow-600">
                  Advertencia: Este bus tiene {deleteDialog.bus.trips.length} viajes registrados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}