"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import DataTable from "../../../components/common/DataTable";
import { 
  getUsers, 
  deleteUser, 
  toggleActiveUser, 
  toggleDeactiveUser 
} from "./api/api-users";
import { Pagination } from "./components/Pagination";
import { Users, UserX, Ticket, Calendar, DollarSign } from "lucide-react";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchUsersList = async (page = 1, limit = 10, isActive = true) => {
    setLoading(true);
    try {
      const res = await getUsers(page, limit);
      
      if (!res || !res.data || !res.meta) {
        throw new Error("Respuesta del servidor inválida");
      }
      
      const usersArray = Array.isArray(res.data) ? res.data : [];
      const filteredUsers = usersArray.filter(user => user.isActive === isActive);
      
      // ✅ Extraer tickets activos de todos los usuarios
      const allTickets = [];
      usersArray.forEach(user => {
        if (user.tickets && Array.isArray(user.tickets)) {
          user.tickets.forEach(ticket => {
            allTickets.push({
              ...ticket,
              userName: user.name,
              userId: user.id,
            });
          });
        }
      });

      // ✅ Filtrar solo tickets confirmados y pendientes (activos)
      const activeTicketsList = allTickets.filter(
        ticket => ticket.status === 'CONFIRMADO' || ticket.status === 'PENDIENTE'
      );

      // ✅ Ordenar por fecha más reciente
      activeTicketsList.sort((a, b) => 
        new Date(b.booking_date) - new Date(a.booking_date)
      );

      // ✅ Calcular estadísticas
      const stats = {
        total: activeTicketsList.length,
        confirmed: activeTicketsList.filter(t => t.status === 'CONFIRMADO').length,
        pending: activeTicketsList.filter(t => t.status === 'PENDIENTE').length,
        totalRevenue: activeTicketsList
          .filter(t => t.status === 'CONFIRMADO')
          .reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0),
      };

      setActiveTickets(activeTicketsList.slice(0, 10)); // Mostrar últimos 10
      setTicketStats(stats);
      
      const usersData = filteredUsers.map((user) => ({
        id: user.id,
        nombre: user.name,
        email: user.profile?.email || "—",
        phone: user.profile?.phone || "—",
        isActive: user.isActive,
        rol: user.roles?.name || "—",
        ticketsCount: user.tickets?.length || 0,
      }));
      
      setUsuarios(usersData);
      
      setMeta({
        total: filteredUsers.length,
        page: page,
        lastPage: Math.ceil(filteredUsers.length / limit),
        limit: limit,
        hasNextPage: page < Math.ceil(filteredUsers.length / limit),
        hasPrevPage: page > 1,
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      toast.error("Error al obtener la lista de usuarios");
      
      setUsuarios([]);
      setActiveTickets([]);
      setMeta({
        total: 0,
        page: 1,
        lastPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList(meta.page, meta.limit, !showInactive);
  }, [showInactive]);

  const handlePageChange = (newPage) => {
    fetchUsersList(newPage, meta.limit, !showInactive);
  };

  const handleLimitChange = (newLimit) => {
    fetchUsersList(1, newLimit, !showInactive);
  };

  const handleAdd = () => {
    router.push("/dashboard/usuarios/newUser");
  };

  const handleEdit = (item) => {
    router.push(`/dashboard/usuarios/${item.id}/edit`);
  };

  const handleProfile = (item) => {
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
        fetchUsersList(meta.page, meta.limit, !showInactive);
      } else {
        toast.error("No se pudo eliminar el usuario");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
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
      fetchUsersList(meta.page, meta.limit, !showInactive);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error(error.message || "Error al cambiar el estado del usuario");
    }
  };

  const toggleFilter = () => {
    setShowInactive(!showInactive);
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(amount);
  };

  if (loading && usuarios.length === 0) {
    return <p className="text-center mt-10">Cargando usuarios...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de filtro */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <Badge variant="secondary" className="text-sm">
            {meta.total} {meta.total === 1 ? "usuario" : "usuarios"}
          </Badge>
        </div>
        
        <Button
          variant={showInactive ? "destructive" : "default"}
          onClick={toggleFilter}
          className="flex items-center gap-2"
        >
          {showInactive ? (
            <>
              <UserX className="h-4 w-4" />
              Ver Activos
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Ver Inactivos
            </>
          )}
        </Button>
      </div>

      {/* ✅ Sección de Estadísticas de Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tickets Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-8 w-8 text-blue-600" />
              <p className="text-3xl font-bold">{ticketStats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-8 w-8 text-green-600" />
              <p className="text-3xl font-bold text-green-600">{ticketStats.confirmed}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-8 w-8 text-yellow-600" />
              <p className="text-3xl font-bold text-yellow-600">{ticketStats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(ticketStats.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Tabla de Tickets Activos Recientes */}
      {activeTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Tickets Activos Recientes
            </CardTitle>
            <CardDescription>
              Últimos {activeTickets.length} tickets confirmados o pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/usuarios/${ticket.userId}/profile`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-lg">{ticket.code}</p>
                      <Badge
                        className={
                          ticket.status === "CONFIRMADO"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Usuario: <span className="font-medium">{ticket.userName}</span>
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ticket.booking_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(ticket.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Usuarios */}
      <DataTable
        title={showInactive ? "Usuarios Inactivos" : "Usuarios Activos"}
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Teléfono" },
          {
            key: "ticketsCount",
            label: "Tickets",
            render: (value) => (
              <Badge variant="outline" className="bg-blue-50">
                {value} ticket{value !== 1 ? 's' : ''}
              </Badge>
            ),
          },
          {
            key: "isActive",
            label: "Estado",
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
      
      {meta && meta.total > 0 && (
        <Pagination
          meta={meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}
    </div>
  );
}