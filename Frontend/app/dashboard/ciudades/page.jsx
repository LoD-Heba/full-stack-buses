'use client';

import { useState } from 'react';
import DataTable from '@/src/components/DataTable';
import { toast } from 'sonner';

export default function DashboardCiudadesPage() {
  const [ciudades] = useState([
    { id: 1, nombre: 'La Paz', departamento: 'La Paz', poblacion: '800000' },
    { id: 2, nombre: 'El Alto', departamento: 'La Paz', poblacion: '850000' },
    { id: 3, nombre: 'Cochabamba', departamento: 'Cochabamba', poblacion: '630000' },
    { id: 4, nombre: 'Santa Cruz', departamento: 'Santa Cruz', poblacion: '1450000' },
    { id: 5, nombre: 'Oruro', departamento: 'Oruro', poblacion: '265000' },
  ]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'departamento', label: 'Departamento' },
    { key: 'poblacion', label: 'Población' },
  ];

  const handleAdd = () => toast.info('Función: Agregar ciudad');
  const handleEdit = (item) => toast.info(`Función: Editar ciudad ${item.nombre}`);
  const handleDelete = (item) => toast.info(`Función: Eliminar ciudad ${item.nombre}`);

  return (
    <DataTable
      title="Gestión de Ciudades"
      columns={columns}
      data={ciudades}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
