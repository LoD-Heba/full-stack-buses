'use client';

import { useState, useEffect } from 'react';
import DataTable from '../../../src/components/DataTable';
import RouteForm from './components/RouteForm';
import RouteDetails from './components/RouteDetails';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { routesAPI } from './api/routes.api';
import { Eye, Trash2 } from 'lucide-react';

export default function DashboardRutasPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
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
      const response = await routesAPI.getAll(pagination.page, pagination.limit);
      setRoutes(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.meta?.total || 0,
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
      // Cargar detalles completos de la ruta
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

  const handleDelete = async (route) => {
    if (!confirm(`¿Está seguro de eliminar la ruta "${route.name}"?`)) {
      return;
    }

    try {
      await routesAPI.delete(route.id);
      toast.success('Ruta eliminada exitosamente');
      loadRoutes();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar ruta');
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
      throw error; // Re-throw para que el formulario lo maneje
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

  // Acciones personalizadas
  const customActions = (route) => (
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
        onClick={() => handleDelete(route)}
        title="Eliminar"
        disabled={route.trips?.some(t => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
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
      <DataTable
        title="Gestión de Rutas"
        columns={columns}
        data={routes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        customActions={customActions}
        loading={loading}
      />

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