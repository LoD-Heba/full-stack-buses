"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Pagination } from "@/app/dashboard/buses/components/Pagination";
import { BusFilters } from "@/app/dashboard/buses/components/bus-filters";
import {
  getBuses,
  searchBuses,
  deleteBus,
  hardDeleteBus,
  changeBusStatus,
} from "./api/api-buses";
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
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS = {
  disponible: "bg-green-100 text-green-800",
  en_uso: "bg-blue-100 text-blue-800",
  mantenimiento: "bg-yellow-100 text-yellow-800",
  fuera_de_servicio: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  disponible: "Disponible",
  en_uso: "En uso",
  mantenimiento: "Mantenimiento",
  fuera_de_servicio: "Fuera de servicio",
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
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    bus: null,
    isHardDelete: false,
  });
  const [showInactive, setShowInactive] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    service_type: "",
    status: "",
  });
  const router = useRouter();

  // Cargar buses
  useEffect(() => {
    loadBuses();
  }, [meta.page, meta.limit, filters, showInactive]);

  const loadBuses = async () => {
    try {
      setLoading(true);

      // Si hay filtros aplicados, usar search
      const hasFilters =
        filters.searchTerm || filters.service_type || filters.status;

      let response;
      if (hasFilters) {
        response = await searchBuses(filters, meta.page, meta.limit);
      } else {
        response = await getBuses(meta.page, meta.limit);
      }

      // Filtrar buses inactivos si no se muestran
      let busesData = response.data || [];
      if (!showInactive) {
        busesData = busesData.filter((bus) => bus.is_active);
      }

      setBuses(busesData);
      setMeta(response.meta);
    } catch (error) {
      toast.error(error.message || "No se pudieron cargar los buses");
    } finally {
      setLoading(false);
    }
  };

  // Manejadores de filtros
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setMeta((prev) => ({ ...prev, page: 1 })); // Reset a página 1
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      service_type: "",
      status: "",
    });
  };

  const handleToggleInactive = (show) => {
    setShowInactive(show);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  // Manejadores de eventos
  const handleAdd = () => {
    router.push("/dashboard/buses/new");
  };

  const handleEdit = (bus) => {
    if (!bus.is_active) {
      toast.error("No se puede editar un bus inactivo");
      return;
    }
    router.push(`/dashboard/buses/${bus.id}/edit`);
  };

  const handleProfile = (bus) => {
    router.push(`/dashboard/buses/${bus.id}`);
  };

  const handleDeleteClick = (bus) => {
    // Determinar si es soft o hard delete
    const isHardDelete = !bus.is_active;
    setDeleteDialog({ open: true, bus, isHardDelete });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.isHardDelete) {
        await hardDeleteBus(deleteDialog.bus.id);
        toast.success("Bus eliminado permanentemente");
      } else {
        await deleteBus(deleteDialog.bus.id);
        toast.success("Bus desactivado correctamente");
      }

      setDeleteDialog({ open: false, bus: null, isHardDelete: false });
      loadBuses();
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar el bus");
    }
  };

  const handleToggleActive = async (bus) => {
    try {
      if (!bus.is_active) {
        toast.error("No se puede reactivar un bus inactivo desde aquí");
        return;
      }

      const newStatus =
        bus.status === "disponible" ? "fuera_de_servicio" : "disponible";
      await changeBusStatus(bus.id, newStatus);
      toast.success(
        `Bus ${
          newStatus === "disponible" ? "activado" : "desactivado"
        } correctamente`
      );
      loadBuses();
    } catch (error) {
      toast.error(error.message || "No se pudo cambiar el estado");
    }
  };

  const handlePageChange = (newPage) => {
    setMeta((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Acciones personalizadas para buses inactivos
  const customActions = (bus) => {
    if (!bus.is_active) {
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDeleteClick(bus)}
          title="Eliminar permanentemente"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Eliminar permanentemente
        </Button>
      );
    }
    return null;
  };

  // Definición de columnas
  const columns = [
    {
      key: "plate",
      label: "Placa",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className={!row.is_active ? "text-gray-400 line-through" : ""}>
            {value}
          </span>
          {!row.is_active && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
              Inactivo
            </span>
          )}
        </div>
      ),
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
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            STATUS_COLORS[value] || ""
          }`}
        >
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
      {/* Filtros */}
      <BusFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        showInactive={showInactive}
        onToggleInactive={handleToggleInactive}
      />

      {/* Tabla */}
      <DataTable
        title="Gestión de Buses"
        columns={columns}
        data={buses}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleActive={handleToggleActive}
        onProfile={handleProfile}
        customActions={customActions}
      />

      {/* Paginación */}
      {buses.length > 0 && (
        <Pagination
          meta={meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, bus: null, isHardDelete: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteDialog.isHardDelete ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  ¿Eliminar permanentemente?
                </>
              ) : (
                "¿Desactivar este bus?"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {deleteDialog.isHardDelete ? (
                <>
                  <p className="text-red-600 font-medium">
                    ⚠️ Esta acción es IRREVERSIBLE y eliminará permanentemente
                    el bus <strong>{deleteDialog.bus?.plate}</strong>.
                  </p>
                  <p>Solo puedes eliminar permanentemente buses que:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>No tengan historial de viajes</li>
                    <li>No tengan tickets relacionados</li>
                    <li>No estén asignados a rutas</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    Esta acción desactivará el bus{" "}
                    <strong>{deleteDialog.bus?.plate}</strong>.
                  </p>
                  {deleteDialog.bus?.trips?.length > 0 && (
                    <p className="text-yellow-600">
                      ⚠️ Este bus tiene {deleteDialog.bus.trips.length} viajes
                      registrados.
                    </p>
                  )}
                  {deleteDialog.bus?.routes?.length > 0 && (
                    <p className="text-yellow-600">
                      ⚠️ Este bus está asignado a{" "}
                      {deleteDialog.bus.routes.length} ruta(s).
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Puedes eliminarlo permanentemente más tarde desde la vista
                    de buses inactivos.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={
                deleteDialog.isHardDelete ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {deleteDialog.isHardDelete
                ? "Eliminar Permanentemente"
                : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
