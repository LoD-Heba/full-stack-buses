"use client"

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SeatSelector({ 
  seats = [], 
  occupiedSeats = [],
  selectedSeats = [],
  onSeatSelect,
  columns = 4,
  maxSelection = 1,
  disabled = false,
  showLegend = true
}) {
  
  const getSeatColor = (seat) => {
    const isOccupied = occupiedSeats.includes(seat.id);
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isOccupied) return 'bg-gray-300 border-gray-400 cursor-not-allowed opacity-50';
    if (isSelected) return 'bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-600';
    if (!seat.is_active) return 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-30';
    return 'bg-green-100 hover:bg-green-200 border-2 border-green-400 text-green-900';
  };

  const handleSeatClick = (seat) => {
    if (disabled) return;
    
    const isOccupied = occupiedSeats.includes(seat.id);
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isOccupied || !seat.is_active) return;
    
    if (isSelected) {
      // Deseleccionar
      onSeatSelect(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      // Seleccionar
      if (maxSelection === 1) {
        onSeatSelect([seat]);
      } else if (selectedSeats.length < maxSelection) {
        onSeatSelect([...selectedSeats, seat]);
      }
    }
  };

  const renderFloor = (floorSeats, floorNumber) => {
    const maxRow = Math.max(...floorSeats.map(s => s.row || 0), 0);
    const gridCols = columns === 5 ? 'grid-cols-5' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3';

    return (
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🚌 Piso {floorNumber}
            <span className="text-sm text-gray-500">
              ({floorSeats.filter(s => s.is_active && !occupiedSeats.includes(s.id)).length} disponibles)
            </span>
          </h3>
        </div>

        <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg mb-2 font-bold">
          ⬆️ FRENTE DEL BUS
        </div>

        <div className="bg-white p-4 rounded-lg border-4 border-gray-300 shadow-inner">
          {Array.from({ length: maxRow }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1;
            const rowSeats = floorSeats.filter(s => (s.row || 0) === rowNum);

            return (
              <div key={rowNum} className={`grid ${gridCols} gap-2 mb-2`}>
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const colNum = colIndex + 1;
                  const middleCol = Math.ceil(columns / 2);
                  
                  if (columns >= 4 && colNum === middleCol) {
                    return (
                      <div 
                        key={`aisle-${rowNum}-${colNum}`} 
                        className="flex items-center justify-center text-gray-400 text-xs font-bold"
                      >
                        | PASILLO |
                      </div>
                    );
                  }

                  const seat = rowSeats.find(s => (s.col || 0) === colNum);

                  if (!seat) {
                    return (
                      <div
                        key={`empty-${rowNum}-${colNum}`}
                        className="h-16 border-2 border-dashed border-gray-200 rounded"
                      />
                    );
                  }

                  const isOccupied = occupiedSeats.includes(seat.id);
                  const isSelected = selectedSeats.some(s => s.id === seat.id);

                  return (
                    <Button
                      key={seat.id}
                      type="button"
                      disabled={disabled || isOccupied || !seat.is_active}
                      onClick={() => handleSeatClick(seat)}
                      className={`h-16 flex flex-col items-center justify-center relative ${getSeatColor(seat)} transition-all transform hover:scale-105 shadow-md`}
                    >
                      <span className="text-lg font-bold">{seat.seat_number}</span>
                      <span className="text-xs opacity-80">{seat.seat_code}</span>
                      {isSelected && (
                        <CheckCircle className="absolute -top-1 -right-1 w-5 h-5 text-white bg-orange-600 rounded-full" />
                      )}
                    </Button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="bg-gray-600 text-white text-center py-2 rounded-b-lg mt-2 font-bold">
          ⬇️ PARTE TRASERA
        </div>
      </div>
    );
  };

  // Agrupar asientos por piso
  const floor1Seats = seats.filter(s => s.deck === 1 || !s.deck);
  const floor2Seats = seats.filter(s => s.deck === 2);

  return (
    <div>
      {showLegend && (
        <div className="flex gap-6 mb-6 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 border-2 border-green-400 rounded"></div>
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 border-2 border-orange-600 rounded"></div>
            <span className="text-sm">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-300 border-2 border-gray-400 rounded opacity-50"></div>
            <span className="text-sm">Ocupado</span>
          </div>
        </div>
      )}

      {floor1Seats.length > 0 && renderFloor(floor1Seats, 1)}
      {floor2Seats.length > 0 && renderFloor(floor2Seats, 2)}

      {floor1Seats.length === 0 && floor2Seats.length === 0 && (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No hay asientos disponibles</p>
        </div>
      )}
    </div>
  );
}