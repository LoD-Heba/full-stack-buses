import React from 'react';
import { FaChair, FaTv, FaToilet, FaDoorOpen } from 'react-icons/fa';
import { MdAirlineSeatReclineExtra } from 'react-icons/md';

export default function AsientoLegend() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Leyenda</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Tipos de asientos */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
            <FaChair className="text-white text-sm" />
          </div>
          <span className="text-sm text-gray-700">Normal</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <FaChair className="text-white text-sm" />
          </div>
          <span className="text-sm text-gray-700">Semi cama</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
            <MdAirlineSeatReclineExtra className="text-white text-sm" />
          </div>
          <span className="text-sm text-gray-700">Cama</span>
        </div>

        {/* Estados */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
            <FaChair className="text-white text-sm" />
          </div>
          <span className="text-sm text-gray-700">Seleccionado</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
            <FaChair className="text-gray-500 text-sm" />
          </div>
          <span className="text-sm text-gray-700">Ocupado</span>
        </div>

        {/* Elementos especiales */}
        <div className="flex items-center gap-2">
          <FaTv className="text-blue-500 text-2xl" />
          <span className="text-sm text-gray-700">TV</span>
        </div>

        <div className="flex items-center gap-2">
          <FaToilet className="text-indigo-400 text-2xl" />
          <span className="text-sm text-gray-700">Baño</span>
        </div>

        <div className="flex items-center gap-2">
          <FaDoorOpen className="text-amber-500 text-2xl" />
          <span className="text-sm text-gray-700">Puerta</span>
        </div>
      </div>
    </div>
  );
}