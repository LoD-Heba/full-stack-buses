'use client';

import { useState, useEffect } from 'react';
import DataTable from '../../../src/components/DataTable';
import RouteForm from './components/RouteForm';
import RouteDetails from './components/RouteDetails';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { routesAPI } from './api/routes.api';
import { Eye, Trash2, RotateCcw, EyeOff } from 'lucide-react';

export default function DashboardRutasPage() {
  const [routes, setRoutes] = useState([]);
  const [inactiveRoutes, setInactiveRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    loadRoutes();
  }, [pagination.page]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const [activeRes, inactiveRes] = await Promise.all([
        routesAPI.getAll(pagination.page, pagination.limit),
        routesAPI.getAllInactive(),
      ]);

      setRoutes(activeRes.data || []);
      setInactiveRoutes(Array.isArray(inactiveRes) ? inactiveRes : inactiveRes.data || []);
      setPagination(prev => ({
        ...prev,
        total: activeRes.meta?.total || 0,
      }));
    } catch (error) {
      toast.error('Error al cargar rutas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedRoute(null);
    setShowForm(true);
  };

  const handleEdit = async (route) => {
    try {
      const fullRoute = await routesAPI.getById(route.id);
      setSelectedRoute(fullRoute);
      setShowForm(true);
    } catch (error) {
      toast.error('Error al cargar datos de la ruta');
    }
  };

  const handleView = async (route) => {
    try {
      const fullRoute = await routesAPI.getById(route.id);
      setSelectedRoute(fullRoute);
      setShowDetails(true);
    } catch (error) {
      toast.error('Error al cargar detalles de la ruta');
    }
  };

  const handleSoftDelete = async (route) => {
    if (!confirm(`¿Está seguro de desactivar la ruta "${route.name}"?\nSe marcará como inactiva pero podrá recuperarse.`)) {
      return;
    }

    try {
      await routesAPI.softDelete(route.id);
      toast.success('Ruta desactivada exitosamente');
      loadRoutes();
    } catch (error) {
      toast.error(error.message || 'Error al desactivar ruta');
    }
  };

  const handleHardDelete = async (route) => {
    if (!confirm(`⚠️ ¿Está seguro de ELIMINAR PERMANENTEMENTE la ruta "${route.name}"?\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await routesAPI.hardDelete(route.id);
      toast.success('Ruta eliminada permanentemente');
      loadRoutes();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar ruta');
    }
  };

  const handleReactivate = async (route) => {
    if (!confirm(`¿Reactivar la ruta "${route.name}"?`)) {
      return;
    }

    try {
      await routesAPI.reactivate(route.id);
      toast.success('Ruta reactivada exitosamente');
      loadRoutes();
    } catch (error) {
      toast.error(error.message || 'Error al reactivar ruta');
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedRoute) {
        await routesAPI.update(selectedRoute.id, data);
        toast.success('Ruta actualizada exitosamente');
      } else {
        await routesAPI.create(data);
        toast.success('Ruta creada exitosamente');
      }
      setShowForm(false);
      setSelectedRoute(null);
      loadRoutes();
    } catch (error) {
      throw error;
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (value) => value.slice(0, 8) + '...' },
    { key: 'name', label: 'Nombre' },
    {
      key: 'originCity',
      label: 'Origen',
      render: (city) => city ? `${city.city}, ${city.department}` : 'N/A'
    },
    {
      key: 'destinationCity',
      label: 'Destino',
      render: (city) => city ? `${city.city}, ${city.department}` : 'N/A'
    },
    {
      key: 'approx_duration',
      label: 'Duración',
      render: (value) => value || 'N/A'
    },
    {
      key: 'distance_km',
      label: 'Distancia (km)',
      render: (value) => value ? `${value} km` : 'N/A'
    },
    {
      key: 'base_price',
      label: 'Precio (Bs.)',
      render: (value) => value ? `${parseFloat(value).toFixed(2)} Bs.` : 'N/A'
    },
    {
      key: 'buses',
      label: 'Buses',
      render: (buses) => buses?.length || 0
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (value) => (
        <Badge className={value ? 'bg-green-500' : 'bg-red-500'}>
          {value ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
  ];

  // Acciones para rutas activas
  const activeRoutesActions = (route) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleView(route)}
        title="Ver detalles"
      >
        <Eye className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleEdit(route)}
        title="Editar"
      >
        <span className="text-yellow-500">✏️</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleSoftDelete(route)}
        title="Desactivar"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </>
  );

  // Acciones para rutas inactivas
  const inactiveRoutesActions = (route) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleReactivate(route)}
        title="Reactivar"
      >
        <RotateCcw className="h-4 w-4 text-green-500" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleHardDelete(route)}
        title="Eliminar permanentemente"
      >
        <Trash2 className="h-4 w-4 text-red-700" />
      </Button>
    </>
  );

  if (loading && routes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando rutas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Rutas Activas */}
      <div className="mb-8">
        <DataTable
          title={`Rutas Activas (${routes.length})`}
          columns={columns}
          data={routes}
          onAdd={handleAdd}
          customActions={activeRoutesActions}
          loading={loading}
        />
      </div>

      {/* Toggle Inactivas */}
      <div className="mb-6">
        <Button
          onClick={() => setShowInactive(!showInactive)}
          variant={showInactive ? 'default' : 'outline'}
          className={showInactive ? 'bg-gray-600 hover:bg-gray-700' : ''}
        >
          {showInactive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showInactive ? 'Ocultar' : 'Ver'} Rutas Inactivas ({inactiveRoutes.length})
        </Button>
      </div>

      {/* Rutas Inactivas */}
      {showInactive && inactiveRoutes.length > 0 && (
        <DataTable
          title={`Rutas Inactivas (${inactiveRoutes.length})`}
          columns={columns}
          data={inactiveRoutes}
          customActions={inactiveRoutesActions}
          loading={loading}
          rowClassName="opacity-75 bg-gray-50"
        />
      )}

      {showForm && (
        <RouteForm
          initialData={selectedRoute}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedRoute(null);
          }}
        />
      )}

      {showDetails && (
        <RouteDetails
          route={selectedRoute}
          onClose={() => {
            setShowDetails(false);
            setSelectedRoute(null);
          }}
        />
      )}
    </>
  );
}