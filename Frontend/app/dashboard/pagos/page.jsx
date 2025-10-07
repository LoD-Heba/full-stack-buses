'use client';

import { useState } from 'react';
import DataTable from '@/src/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PagosPage() {
  const [pagos] = useState([
    { id: 1, fecha: '2025-10-01', monto: 50, metodo: 'Tarjeta', cliente: 'Juan Pérez', estado: 'Completado' },
    { id: 2, fecha: '2025-10-02', monto: 60, metodo: 'Efectivo', cliente: 'María García', estado: 'Completado' },
    { id: 3, fecha: '2025-10-03', monto: 70, metodo: 'Transferencia', cliente: 'Carlos López', estado: 'Pendiente' },
    { id: 4, fecha: '2025-10-04', monto: 40, metodo: 'Tarjeta', cliente: 'Ana Martínez', estado: 'Completado' },
    { id: 5, fecha: '2025-10-05', monto: 100, metodo: 'Efectivo', cliente: 'Pedro Sánchez', estado: 'Cancelado' },
  ]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'fecha', label: 'Fecha' },
    {
      key: 'monto',
      label: 'Monto (Bs.)',
      render: (value) => `${value} Bs.`
    },
    { key: 'metodo', label: 'Método' },
    { key: 'cliente', label: 'Cliente' },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <Badge className={
          value === 'Completado' ? 'bg-green-500' :
          value === 'Pendiente' ? 'bg-yellow-500' :
          'bg-red-500'
        }>
          {value}
        </Badge>
      )
    },
  ];

  const handleAdd = () => toast.info('Función: Registrar pago');
  const handleEdit = (item) => toast.info(`Función: Editar pago #${item.id}`);
  const handleDelete = (item) => toast.info(`Función: Eliminar pago #${item.id}`);

  return (
    <DataTable
      title="Gestión de Pagos"
      columns={columns}
      data={pagos}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
