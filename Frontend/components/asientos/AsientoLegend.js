import React from "react";
import { FaChair, FaTv, FaToilet, FaDoorOpen } from "react-icons/fa";
import { MdAirlineSeatReclineExtra } from "react-icons/md";

export default function AsientoLegend() {
  return (
    <div className="flex gap-6 justify-center p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-green-400 rounded border-2 border-green-600"></div>
        <span className="text-sm">Disponible</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-yellow-400 rounded border-2 border-yellow-600"></div>
        <span className="text-sm">Reservado</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-700"></div>
        <span className="text-sm">Seleccionado</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-red-300 rounded border-2 border-red-500"></div>
        <span className="text-sm">Ocupado</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-400 rounded border-2 border-gray-600"></div>
        <span className="text-sm">Bloqueado</span>
      </div>
    </div>
  );
}
