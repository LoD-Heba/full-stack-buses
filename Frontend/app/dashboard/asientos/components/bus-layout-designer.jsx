"use client"

import React from 'react';
import { Armchair, Tv, DoorOpen, Wind, AlertTriangle } from 'lucide-react';

const ELEMENT_TYPES = {
  seat: { icon: Armchair, label: 'Asiento', color: 'bg-green-500' },
  aisle: { icon: null, label: 'Pasillo', color: 'bg-gray-200' },
  bathroom: { icon: DoorOpen, label: 'Baño', color: 'bg-blue-300' },
  tv: { icon: Tv, label: 'TV', color: 'bg-purple-300' },
  door: { icon: DoorOpen, label: 'Puerta', color: 'bg-yellow-300' },
  window: { icon: Wind, label: 'Ventana', color: 'bg-cyan-200' },
  emergency: { icon: AlertTriangle, label: 'Salida Emergencia', color: 'bg-red-300' },
};

export default function BusLayoutDesigner({ 
  seats = [], 
  onSeatClick,
  mode = 'design', // 'design' | 'selection'
  selectedSeats = [],
  occupiedSeats = [],
  gridWidth = 5,
  gridHeight = 12,
  showControls = true
}) {
  
  const renderElement = (element) => {
    if (!element) {
      return (
        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg bg-white" />
      );
    }

    const ElementIcon = ELEMENT_TYPES[element.visual_type]?.icon;
    const isSelected = selectedSeats.some(s => s.id === element.id);
    const isOccupied = occupiedSeats.includes(element.id);
    
    let bgColor = ELEMENT_TYPES[element.visual_type]?.color || 'bg-gray-300';
    
    if (element.visual_type === 'seat') {
      if (mode === 'selection') {
        if (isOccupied) bgColor = 'bg-gray-400 cursor-not-allowed';
        else if (isSelected) bgColor = 'bg-orange-500';
        else if (!element.is_active) bgColor = 'bg-gray-300 opacity-50';
        else bgColor = 'bg-green-500 hover:bg-green-600';
      } else {
        bgColor = element.is_active ? 'bg-green-500' : 'bg-gray-400';
      }
    }

    return (
      <button
        onClick={() => onSeatClick?.(element)}
        disabled={mode === 'selection' && (isOccupied || !element.is_active)}
        className={`
          w-16 h-16 rounded-lg ${bgColor} 
          flex flex-col items-center justify-center
          text-white font-bold text-sm
          transition-all duration-200 transform hover:scale-105
          shadow-md relative
          ${mode === 'selection' && !isOccupied && element.is_active ? 'cursor-pointer' : ''}
          ${isSelected ? 'ring-4 ring-orange-600' : ''}
        `}
        style={{ transform: `rotate(${element.rotation || 0}deg)` }}
      >
        {element.visual_type === 'seat' ? (
          <>
            <span className="text-lg">{element.seat_number}</span>
            <span className="text-xs opacity-80">{element.seat_code}</span>
            {element.meta?.hasWindow && (
              <Wind className="absolute -top-1 -right-1 w-4 h-4 text-blue-400" />
            )}
          </>
        ) : ElementIcon ? (
          <ElementIcon className="w-8 h-8" />
        ) : (
          <span className="text-xs text-gray-500">{ELEMENT_TYPES[element.visual_type]?.label}</span>
        )}
      </button>
    );
  };

  const renderFloor = (floorSeats, floorNumber) => {
    // Crear matriz del layout
    const layout = Array.from({ length: gridHeight }, () => 
      Array(gridWidth).fill(null)
    );

    // Colocar elementos en la matriz
    floorSeats.forEach(seat => {
      const x = (seat.position_x || seat.col) - 1;
      const y = (seat.position_y || seat.row) - 1;
      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        layout[y][x] = seat;
      }
    });

    return (
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="text-3xl">🚌</span>
            Piso {floorNumber}
            <span className="text-sm text-gray-600 font-normal">
              ({floorSeats.filter(s => s.visual_type === 'seat' && s.is_active).length} asientos)
            </span>
          </h3>
        </div>

        {/* Frente del bus */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center py-3 rounded-t-2xl mb-3 font-bold shadow-md">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">⬆️</span>
            <span>FRENTE DEL BUS</span>
          </div>
        </div>

        {/* Grid del bus */}
        <div className="bg-white p-6 rounded-2xl border-4 border-gray-400 shadow-inner">
          <div className="space-y-2">
            {layout.map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-2 justify-center">
                {row.map((element, colIdx) => (
                  <div key={`${rowIdx}-${colIdx}`}>
                    {renderElement(element)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Parte trasera */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-center py-3 rounded-b-2xl mt-3 font-bold shadow-md">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">⬇️</span>
            <span>PARTE TRASERA</span>
          </div>
        </div>
      </div>
    );
  };

  const floor1 = seats.filter(s => s.deck === 1 || !s.deck);
  const floor2 = seats.filter(s => s.deck === 2);

  return (
    <div className="space-y-6">
      {showControls && (
        <div className="flex gap-4 justify-center flex-wrap bg-white p-4 rounded-lg shadow">
          {Object.entries(ELEMENT_TYPES).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-8 h-8 ${color} rounded-lg border-2 border-gray-300`} />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      )}

      {floor1.length > 0 && renderFloor(floor1, 1)}
      {floor2.length > 0 && renderFloor(floor2, 2)}
    </div>
  );
}