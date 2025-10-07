'use client';

import { useState } from 'react';
import DataTable from '@/src/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DashboardRutasPage() {
  const [rutas] = useState([
    { id: 1, origen: 'Cochabamba', destino: 'La Paz', duracion: '4 horas', precio: 50, estado: 'Activa' },
    { id: 2, origen: 'Cochabamba', destino: 'Santa Cruz', duracion: '5 horas', precio: 60, estado: 'Activa' },
    { id: 3, origen: 'La Paz', destino: 'Oruro', duracion: '3 horas', precio: 40, estado: 'Activa' },
    { id: 4, origen: 'Santa Cruz', destino: 'Tarija', duracion: '8 horas', precio: 100, estado: 'Activa' },
    { id: 5, origen: 'La Paz', destino: 'Potosí', duracion: '7 horas', precio: 80, estado: 'Inactiva' },
  ]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'origen', label: 'Origen' },
    { key: 'destino', label: 'Destino' },
    { key: 'duracion', label: 'Duración' },
    {
      key: 'precio',
      label: 'Precio (Bs.)',
      render: (value) => `${value} Bs.`
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <Badge className={value === 'Activa' ? 'bg-green-500' : 'bg-gray-500'}>
          {value}
        </Badge>
      )
    },
  ];

  const handleAdd = () => toast.info('Función: Agregar ruta');
  const handleEdit = (item) => toast.info(`Función: Editar ruta ${item.origen} - ${item.destino}`);
  const handleDelete = (item) => toast.info(`Función: Eliminar ruta ${item.origen} - ${item.destino}`);

  return (
    <DataTable
      title="Gestión de Rutas"
      columns={columns}
      data={rutas}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
