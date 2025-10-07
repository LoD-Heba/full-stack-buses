'use client';

import { useState } from 'react';
import DataTable from '@/src/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function HorariosPage() {
  const [horarios] = useState([
    { id: 1, ruta: 'Cochabamba - La Paz', hora: '06:00', bus: 'Bus 101', dias: 'Lun-Dom', estado: 'Activo' },
    { id: 2, ruta: 'Cochabamba - Santa Cruz', hora: '08:00', bus: 'Bus 102', dias: 'Lun-Dom', estado: 'Activo' },
    { id: 3, ruta: 'La Paz - Oruro', hora: '07:00', bus: 'Bus 103', dias: 'Lun-Vie', estado: 'Activo' },
    { id: 4, ruta: 'Cochabamba - Sucre', hora: '09:00', bus: 'Bus 104', dias: 'Lun-Dom', estado: 'Activo' },
    { id: 5, ruta: 'Santa Cruz - Tarija', hora: '10:00', bus: 'Bus 105', dias: 'Mar-Sab', estado: 'Suspendido' },
  ]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'ruta', label: 'Ruta' },
    { key: 'hora', label: 'Hora' },
    { key: 'bus', label: 'Bus' },
    { key: 'dias', label: 'Días' },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <Badge className={value === 'Activo' ? 'bg-green-500' : 'bg-red-500'}>
          {value}
        </Badge>
      )
    },
  ];

  const handleAdd = () => toast.info('Función: Agregar horario');
  const handleEdit = (item) => toast.info(`Función: Editar horario #${item.id}`);
  const handleDelete = (item) => toast.info(`Función: Eliminar horario #${item.id}`);

  return (
    <DataTable
      title="Gestión de Horarios"
      columns={columns}
      data={horarios}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
