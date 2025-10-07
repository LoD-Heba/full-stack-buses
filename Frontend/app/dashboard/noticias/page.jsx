'use client';

import { useState } from 'react';
import DataTable from '@/src/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DashboardNoticiasPage() {
  const [noticias] = useState([
    { id: 1, titulo: 'Nuevas unidades de última generación', fecha: '2025-10-01', autor: 'Admin', estado: 'Publicado' },
    { id: 2, titulo: 'Descuentos especiales por fiestas patrias', fecha: '2025-09-28', autor: 'Marketing', estado: 'Publicado' },
    { id: 3, titulo: 'Nueva ruta: Cochabamba - Trinidad', fecha: '2025-09-20', autor: 'Admin', estado: 'Publicado' },
    { id: 4, titulo: 'Mantenimiento programado flota', fecha: '2025-09-15', autor: 'Operaciones', estado: 'Borrador' },
  ]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'autor', label: 'Autor' },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <Badge className={value === 'Publicado' ? 'bg-green-500' : 'bg-gray-500'}>
          {value}
        </Badge>
      )
    },
  ];

  const handleAdd = () => toast.info('Función: Crear noticia');
  const handleEdit = (item) => toast.info(`Función: Editar noticia ${item.titulo}`);
  const handleDelete = (item) => toast.info(`Función: Eliminar noticia ${item.titulo}`);

  return (
    <DataTable
      title="Gestión de Noticias"
      columns={columns}
      data={noticias}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
