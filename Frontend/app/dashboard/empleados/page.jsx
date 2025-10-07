'use client';

import { useState } from 'react';
import DataTable from '@/src/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function EmpleadosPage() {
  const [empleados] = useState([
    { id: 1, nombre: 'Roberto Flores', cargo: 'Conductor', telefono: '70123456', estado: 'Activo' },
    { id: 2, nombre: 'Laura Quispe', cargo: 'Vendedor', telefono: '70234567', estado: 'Activo' },
    { id: 3, nombre: 'Miguel Torres', cargo: 'Conductor', telefono: '70345678', estado: 'Activo' },
    { id: 4, nombre: 'Sofia Mendoza', cargo: 'Mecánico', telefono: '70456789', estado: 'Inactivo' },
    { id: 5, nombre: 'Diego Vargas', cargo: 'Supervisor', telefono: '70567890', estado: 'Activo' },
  ]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <Badge className={value === 'Activo' ? 'bg-green-500' : 'bg-gray-500'}>
          {value}
        </Badge>
      )
    },
  ];

  const handleAdd = () => toast.info('Función: Agregar empleado');
  const handleEdit = (item) => toast.info(`Función: Editar empleado ${item.nombre}`);
  const handleDelete = (item) => toast.info(`Función: Eliminar empleado ${item.nombre}`);

  return (
    <DataTable
      title="Gestión de Empleados"
      columns={columns}
      data={empleados}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
