import React from 'react';
import { FaChair, FaTv, FaToilet, FaDoorOpen } from 'react-icons/fa';
import { MdAirlineSeatReclineExtra } from 'react-icons/md';

interface GridCell {
  position_x: number;
  position_y: number;
  seat_code?: string;
  seat_number?: number;
  type?: string;
  visual_type: string;
  rotation?: number;
}

interface SeatGridProps {
  rows: number;
  cols: number;
  cells: GridCell[];
  selectedTool: any;
  onCellClick: (x: number, y: number) => void;
  onCellSelect: (cell: GridCell | null) => void;
  selectedCell: GridCell | null;
}

export default function SeatGrid({
  rows,
  cols,
  cells,
  selectedTool,
  onCellClick,
  onCellSelect,
  selectedCell,
}: SeatGridProps) {
  
  const getCellAtPosition = (x: number, y: number) => {
    return cells.find(c => c.position_x === x && c.position_y === y);
  };

  const getCellIcon = (cell: GridCell) => {
    switch (cell.visual_type) {
      case 'seat':
        return cell.type === 'cama' ? 
          <MdAirlineSeatReclineExtra className="text-white" /> :
          <FaChair className="text-white" />;
      case 'tv':
        return <FaTv className="text-blue-500" />;
      case 'bathroom':
        return <FaToilet className="text-indigo-400" />;
      case 'door':
        return <FaDoorOpen className="text-amber-500" />;
      default:
        return null;
    }
  };

  const getCellColor = (cell: GridCell) => {
    if (cell.visual_type !== 'seat') return 'bg-gray-50';
    
    switch (cell.type) {
      case 'cama':
        return 'bg-green-600';
      case 'semi_cama':
        return 'bg-blue-600';
      case 'normal':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const handleCellClick = (x: number, y: number) => {
    const existingCell = getCellAtPosition(x, y);
    
    if (existingCell) {
      onCellSelect(existingCell);
    } else {
      onCellClick(x, y);
      onCellSelect(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-auto">
      {/* Indicador de frente del bus */}
      <div className="bg-gray-800 text-white py-2 px-4 rounded-t-lg mb-4 text-center">
        <p className="font-semibold">🚌 Frente del Bus - Conductor</p>
      </div>

      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, 60px)`,
          gridTemplateRows: `repeat(${rows}, 60px)`,
          width: 'fit-content',
        }}
      >
        {Array.from({ length: rows * cols }, (_, index) => {
          const y = Math.floor(index / cols) + 1;
          const x = (index % cols) + 1;
          const cell = getCellAtPosition(x, y);
          const isSelected = selectedCell?.position_x === x && selectedCell?.position_y === y;

          return (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              className={`
                w-[60px] h-[60px] rounded-lg border-2 flex items-center justify-center
                cursor-pointer transition-all duration-200
                ${cell 
                  ? `${getCellColor(cell)} hover:scale-105 shadow-md` 
                  : 'bg-white border-dashed border-gray-300 hover:bg-gray-50'
                }
                ${isSelected ? 'ring-4 ring-yellow-400 scale-110' : ''}
              `}
              title={cell?.seat_code || `Celda ${x},${y}`}
            >
              {cell && (
                <div className="flex flex-col items-center">
                  {getCellIcon(cell)}
                  {cell.visual_type === 'seat' && cell.seat_code && (
                    <span className="text-white text-xs font-bold mt-1">
                      {cell.seat_code}
                    </span>
                  )}
                </div>
              )}
              {!cell && (
                <span className="text-gray-400 text-xs">+</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicador de parte trasera */}
      <div className="bg-gray-800 text-white py-2 px-4 rounded-b-lg mt-4 text-center">
        <p className="font-semibold">Parte Trasera del Bus</p>
      </div>

      {/* Instrucciones */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Instrucciones:</strong> Selecciona una herramienta y haz clic en el grid para agregar elementos.
          Haz clic en un elemento existente para editarlo o eliminarlo.
        </p>
      </div>
    </div>
  );
}