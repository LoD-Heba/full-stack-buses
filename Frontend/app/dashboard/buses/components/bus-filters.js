"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const SERVICE_TYPES = {
  all: "Todos",
  normal: "Normal",
  semi_cama: "Semi Cama",
  cama: "Cama",
};

const STATUS_OPTIONS = {
  all: "Todos los estados",
  disponible: "Disponible",
  en_uso: "En uso",
  mantenimiento: "Mantenimiento",
  fuera_de_servicio: "Fuera de servicio",
};

export function BusFilters({ filters, onFilterChange, onClear, showInactive, onToggleInactive }) {
  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda por texto */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por placa, modelo o amenidades..."
              value={filters.searchTerm || ""}
              onChange={(e) => onFilterChange("searchTerm", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tipo de servicio */}
        <div>
          <Select
            value={filters.service_type || "all"}
            onValueChange={(value) =>
              onFilterChange("service_type", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFilterChange("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_OPTIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controles adicionales */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => onToggleInactive(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">
              Mostrar buses inactivos
            </span>
          </label>
        </div>

        {(filters.searchTerm || filters.service_type || filters.status) && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}