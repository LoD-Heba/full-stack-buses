"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getSeatStacks,
  deleteSeatStack,
} from "./api/api-seat-stacks";

export default function SeatStacksPage() {
  const router = useRouter();
  const [seatStacks, setSeatStacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSeatStacksList = async () => {
    setLoading(true);
    try {
      const res = await getSeatStacks();

      // Aseguramos que sea un array
      const stacksArray = Array.isArray(res) ? res : res.data || [];
      const stacksData = stacksArray.map((stack) => ({
        id: stack.id,
        nombre: stack.name,
        asientos: stack.seats?.length || 0,
      }));

      setSeatStacks(stacksData);
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener la lista de stacks de asientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatStacksList();
  }, []);

  const handleAdd = () => {
    router.push("/dashboard/stack-asientos/newSeatStack");
  };

  const handleEdit = (item) => {
    toast.info(`Editando stack: ${item.nombre}`);
    router.push(`/dashboard/stack-asientos/${item.id}/edit`);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el stack "${item.nombre}"?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteSeatStack(item.id);

      if (res) {
        toast.success(`Stack "${item.nombre}" eliminado correctamente`);
        fetchSeatStacksList();
      } else {
        toast.error("No se pudo eliminar el stack");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al eliminar el stack");
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando stacks...</p>;

  return (
    <DataTable
      title="Gestión de Pilas de Asientos"
      columns={[
        { key: "nombre", label: "Nombre" },
        {
          key: "asientos",
          label: "Asientos",
          render: (value) => <Badge variant="outline">{value}</Badge>,
        },
      ]}
      data={seatStacks}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      showProfileButton={false} // no queremos botón de perfil
    />
  );
}
