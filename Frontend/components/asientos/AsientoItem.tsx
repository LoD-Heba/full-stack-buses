import React from 'react';
import { FaChair, FaTv, FaToilet, FaDoorOpen } from 'react-icons/fa';
import { MdAirlineSeatReclineExtra } from 'react-icons/md';

interface SeatData {
  id?: string;
  seat_code: string;
  seat_number?: number;
  type?: string;
  position_x: number;
  position_y: number;
  visual_type: string;
  rotation: number;
  deck?: number;
  meta?: Record<string, any>;
}

interface AsientoItemProps {
  data: SeatData;
  selected?: boolean;
  onSelect?: (seatCode: string) => void;
  disabled?: boolean;
}

export default function AsientoItem({ 
  data, 
  selected = false, 
  onSelect,
  disabled = false 
}: AsientoItemProps) {
  const { visual_type, seat_code, type, rotation } = data;

  const getIcon = () => {
    switch (visual_type) {
      case 'seat':
        return type === 'cama' ? (
          <MdAirlineSeatReclineExtra className="text-white" />
        ) : (
          <FaChair className="text-white" />
        );
      case 'tv':
        return <FaTv className="text-blue-500" />;
      case 'bathroom':
        return <FaToilet className="text-indigo-400" />;
      case 'door':
        return <FaDoorOpen className="text-amber-500" />;
      case 'aisle':
        return null;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    if (visual_type !== 'seat') return 'bg-transparent';
    
    if (disabled) return 'bg-gray-300 cursor-not-allowed';
    if (selected) return 'bg-yellow-400';
    
    switch (type) {
      case 'cama':
        return 'bg-green-600 hover:bg-green-700';
      case 'semi_cama':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'normal':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleClick = () => {
    if (visual_type === 'seat' && !disabled && onSelect) {
      onSelect(seat_code);
    }
  };

  return (
    <div
      className={`
        flex items-center justify-center rounded-lg 
        w-[50px] h-[50px] transition-all duration-200
        ${getBgColor()}
        ${visual_type === 'seat' && !disabled ? 'cursor-pointer shadow-md' : ''}
        ${selected ? 'ring-2 ring-yellow-600 scale-105' : ''}
      `}
      style={{ 
        transform: `rotate(${rotation}deg)`,
        gridColumn: data.position_x,
        gridRow: data.position_y
      }}
      onClick={handleClick}
      title={visual_type === 'seat' ? `Asiento ${seat_code}` : visual_type}
    >
      {visual_type === 'seat' ? (
        <div className="flex flex-col items-center">
          {getIcon()}
          <span className="text-white text-xs font-semibold mt-1">
            {seat_code}
          </span>
        </div>
      ) : (
        getIcon()
      )}
    </div>
  );
}