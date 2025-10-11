// Frontend/app/dashboard/tickets/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/src/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getTickets,
  deleteTicket,
  cancelTicket,
  confirmTicket,
} from "./api/api-tickets";
import { Pagination } from "./components/Pagination";
import { TicketPreviewModal } from "./components/ticket-preview-modal";
import { exportTicketsToPDF, exportSingleTicketToPDF } from "./utils/export-pdf";
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
import { CheckCircle, XCircle, FileText, Download, Eye } from "lucide-react";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTicket, setPreviewTicket] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null,
    ticket: null,
  });

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    fetchTicketsList(meta.page, meta.limit);
  }, []);

  const fetchTicketsList = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await getTickets(page, limit);

      const ticketsArray = Array.isArray(res.data) ? res.data : [];
      const ticketsData = ticketsArray.map((ticket) => ({
        id: ticket.ticket_id,
        code: ticket.code,
        price: ticket.price,
        status: ticket.status,
        booking_date: new Date(ticket.booking_date).toLocaleDateString("es-ES"),
        passenger: ticket.user?.profile
          ? `${ticket.user.profile.firstName} ${ticket.user.profile.lastName}`
          : ticket.user?.email || "-",
        user_email: ticket.user?.email || "-",
        document: ticket.user?.profile?.documentNumber || "-",
        trip_route: ticket.trip?.route
          ? `${ticket.trip.route.originCity?.name || "?"} → ${ticket.trip.route.destinationCity?.name || "?"}`
          : "-",
        departure_time: ticket.trip?.departure_time
          ? new Date(ticket.trip.departure_time).toLocaleString("es-ES")
          : "-",
        seat: ticket.seat?.seat_number || "-",
        bus_plate: ticket.trip?.bus?.plate || "-",
        payment_status: ticket.payment?.status || "Sin pago",
        is_active: ticket.is_active,
      }));

      setTickets(ticketsData);
      setMeta(res.meta);
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener la lista de tickets");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchTicketsList(newPage, meta.limit);
  };

  const handleLimitChange = (newLimit) => {
    fetchTicketsList(1, newLimit);
  };

  const handleAdd = () => {
    router.push(`/dashboard/tickets/newTicket`);
  };

  const handleEdit = (item) => {
    router.push(`/dashboard/tickets/${item.id}/edit`);
  };

  const handleProfile = (item) => {
    router.push(`/dashboard/tickets/${item.id}`);
  };

  // 🎫 Vista previa del ticket
  const handlePreview = (ticket) => {
    setPreviewTicket(ticket);
    setShowPreview(true);
  };

  // 📄 Exportar ticket individual a PDF
  const handleExportSingle = (ticket) => {
    try {
      exportSingleTicketToPDF(ticket);
      toast.success(`Ticket ${ticket.code} exportado a PDF`);
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar el ticket");
    }
  };

  // 📊 Exportar todos los tickets a PDF
  const handleExportAll = () => {
    try {
      if (tickets.length === 0) {
        toast.warning("No hay tickets para exportar");
        return;
      }
      exportTicketsToPDF(tickets);
      toast.success("Reporte de tickets exportado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar el reporte");
    }
  };

  const handleDeleteClick = (ticket) => {
    setActionDialog({ open: true, type: "delete", ticket });
  };

  const handleCancelClick = (ticket) => {
    if (ticket.status === "CANCELADO") {
      toast.info("El ticket ya está cancelado");
      return;
    }
    setActionDialog({ open: true, type: "cancel", ticket });
  };

  const handleConfirmClick = (ticket) => {
    if (ticket.status === "CONFIRMADO") {
      toast.info("El ticket ya está confirmado");
      return;
    }
    if (ticket.status === "CANCELADO") {
      toast.error("No se puede confirmar un ticket cancelado");
      return;
    }
    setActionDialog({ open: true, type: "confirm", ticket });
  };

  const handleActionConfirm = async () => {
    const { type, ticket } = actionDialog;

    try {
      switch (type) {
        case "delete":
          await deleteTicket(ticket.id);
          toast.success(`Ticket ${ticket.code} eliminado`);
          break;
        case "cancel":
          await cancelTicket(ticket.id);
          toast.success(`Ticket ${ticket.code} cancelado`);
          break;
        case "confirm":
          await confirmTicket(ticket.id);
          toast.success(`Ticket ${ticket.code} confirmado`);
          break;
      }

      setActionDialog({ open: false, type: null, ticket: null });
      fetchTicketsList(meta.page, meta.limit);
    } catch (error) {
      console.error(error);
      toast.error(
        error.message ||
          `Error al ${type === "delete" ? "eliminar" : type === "cancel" ? "cancelar" : "confirmar"} el ticket`
      );
    }
  };

  const columns = [
    { key: "code", label: "Código" },
    { key: "passenger", label: "Pasajero" },
    { key: "document", label: "Documento" },
    { key: "trip_route", label: "Ruta" },
    { key: "departure_time", label: "Salida" },
    { key: "seat", label: "Asiento" },
    {
      key: "price",
      label: "Precio",
      render: (value) => `Bs. ${parseFloat(value).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Estado",
      render: (value) => (
        <Badge className={STATUS_COLORS[value] || ""}>
          {STATUS_LABELS[value] || value}
        </Badge>
      ),
    },
    { key: "booking_date", label: "Fecha Reserva" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Botón de exportación */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportAll}
          variant="outline"
          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Todos a PDF
        </Button>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-600">Pendientes</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {tickets.filter((t) => t.status === "PENDIENTE").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Confirmados</h3>
          <p className="text-2xl font-bold text-green-600">
            {tickets.filter((t) => t.status === "CONFIRMADO").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-600">Cancelados</h3>
          <p className="text-2xl font-bold text-red-600">
            {tickets.filter((t) => t.status === "CANCELADO").length}
          </p>
        </div>
      </div>

      <DataTable
        title="Gestión de Tickets"
        columns={columns}
        data={tickets}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onProfile={handleProfile}
        customActions={(ticket) => (
          <div className="flex gap-2">
            {/* Vista previa con QR */}
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handlePreview(ticket)}
              title="Vista previa"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* Exportar PDF individual */}
            <Button
              size="sm"
              variant="outline"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => handleExportSingle(ticket)}
              title="Exportar a PDF"
            >
              <FileText className="w-4 h-4" />
            </Button>

            {ticket.status === "PENDIENTE" && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleConfirmClick(ticket)}
                title="Confirmar ticket"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            {ticket.status !== "CANCELADO" && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleCancelClick(ticket)}
                title="Cancelar ticket"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      />

      {tickets.length > 0 && (
        <Pagination
          meta={meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Modal de vista previa */}
      <TicketPreviewModal
        ticket={previewTicket}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* Dialog de confirmación */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog({ open, type: null, ticket: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === "delete" && "¿Eliminar ticket?"}
              {actionDialog.type === "cancel" && "¿Cancelar ticket?"}
              {actionDialog.type === "confirm" && "¿Confirmar ticket?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === "delete" && (
                <>
                  Esta acción eliminará el ticket{" "}
                  <strong>{actionDialog.ticket?.code}</strong>.
                  {actionDialog.ticket?.status === "CONFIRMADO" && (
                    <span className="block mt-2 text-red-600">
                      Advertencia: Este ticket está confirmado.
                    </span>
                  )}
                </>
              )}
              {actionDialog.type === "cancel" && (
                <>
                  Vas a cancelar el ticket{" "}
                  <strong>{actionDialog.ticket?.code}</strong> del pasajero{" "}
                  <strong>{actionDialog.ticket?.passenger}</strong>.
                </>
              )}
              {actionDialog.type === "confirm" && (
                <>
                  Vas a confirmar el ticket{" "}
                  <strong>{actionDialog.ticket?.code}</strong> del pasajero{" "}
                  <strong>{actionDialog.ticket?.passenger}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              className={
                actionDialog.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : actionDialog.type === "cancel"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
              }
            >
              {actionDialog.type === "delete" && "Eliminar"}
              {actionDialog.type === "cancel" && "Cancelar Ticket"}
              {actionDialog.type === "confirm" && "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}