"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Search, Plus, Power, Eye } from "lucide-react";

export default function DataTable({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onProfile,
  customActions, // Nueva prop para acciones personalizadas
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar datos basado en el término de búsqueda
  const filteredData = data.filter((item) => {
    if (!searchTerm.trim()) return true;

    return columns.some((column) => {
      const value = item[column.key];
      if (value === null || value === undefined) return false;

      return value
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="space-y-4">
      {/* Header con título y botón */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onAdd && (
          <Button
            onClick={onAdd}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center text-gray-500 py-8"
                >
                  {searchTerm
                    ? "No se encontraron resultados"
                    : "No hay datos disponibles"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key] ?? "-"}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Acciones personalizadas */}
                      {customActions && customActions(item)}

                      {/* Botón Ver Perfil */}
                      {onProfile && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onProfile(item)}
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Botón Activar/Desactivar */}
                      {onToggleActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleActive(item)}
                          className={
                            item.isActive || item.is_active
                              ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          }
                          title={
                            item.isActive || item.is_active
                              ? "Desactivar"
                              : "Activar"
                          }
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Botón Editar */}
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="hover:bg-blue-50"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Botón Eliminar */}
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer con contador */}
      <div className="text-sm text-gray-600">
        Mostrando {filteredData.length} de {data.length} registros
        {searchTerm && ` (filtrados)`}
      </div>
    </div>
  );
}