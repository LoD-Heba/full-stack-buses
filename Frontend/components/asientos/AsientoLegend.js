import React from "react";
import { FaChair } from "react-icons/fa";
import { MdAirlineSeatReclineExtra } from "react-icons/md";

export default function AsientoLegend() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* Estados de asientos */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Estado de Asientos</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-500 rounded border-2 border-gray-600 flex items-center justify-center">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Disponible</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded border-2 border-blue-700 flex items-center justify-center shadow-lg">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Seleccionado</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded border-2 border-yellow-600 flex items-center justify-center opacity-75">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Reservado</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-400 rounded border-2 border-red-600 flex items-center justify-center opacity-75">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Ocupado</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-400 rounded border-2 border-gray-600 flex items-center justify-center opacity-60">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Bloqueado</span>
          </div>
        </div>
      </div>

      {/* Tipos de asientos */}
      <div className="border-t pt-3">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Tipos de Asiento</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-500 rounded border-2 border-gray-600 flex items-center justify-center">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Normal</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded border-2 border-blue-700 flex items-center justify-center">
              <FaChair className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Semi Cama</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded border-2 border-green-700 flex items-center justify-center">
              <MdAirlineSeatReclineExtra className="text-white text-xs" />
            </div>
            <span className="text-sm text-gray-700">Cama</span>
          </div>
        </div>
      </div>
    </div>
  );
}