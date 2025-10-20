import React from 'react';
import { FaChair, FaTv, FaToilet, FaDoorOpen } from 'react-icons/fa';
import { MdAirlineSeatReclineExtra } from 'react-icons/md';
import { GiSteeringWheel } from "react-icons/gi";

const TOOL_ITEMS = [
  {
    type: 'seat',
    visualType: 'seat',
    seatType: 'normal',
    label: 'Normal',
    icon: FaChair,
    color: 'bg-gray-500',
  },
  {
    type: 'seat',
    visualType: 'seat',
    seatType: 'conductor',
    label: 'Conductor',
    icon: GiSteeringWheel,
    color: 'bg-gray-900',
  },
  {
    type: 'seat',
    visualType: 'seat',
    seatType: 'semi_cama',
    label: 'Semi Cama',
    icon: FaChair,
    color: 'bg-blue-600',
  },
  {
    type: 'seat',
    visualType: 'seat',
    seatType: 'cama',
    label: 'Cama',
    icon: MdAirlineSeatReclineExtra,
    color: 'bg-green-600',
  },
  {
    type: 'element',
    visualType: 'aisle',
    label: 'Pasillo',
    icon: null,
    color: 'bg-gray-200',
  },
  {
    type: 'element',
    visualType: 'tv',
    label: 'TV',
    icon: FaTv,
    color: 'bg-transparent',
  },
  {
    type: 'element',
    visualType: 'bathroom',
    label: 'Baño',
    icon: FaToilet,
    color: 'bg-transparent',
  },
  {
    type: 'element',
    visualType: 'door',
    label: 'Puerta',
    icon: FaDoorOpen,
    color: 'bg-transparent',
  },
];

interface SeatToolboxProps {
  onSelectTool: (tool: any) => void;
  selectedTool: any;
}

export default function SeatToolbox({ onSelectTool, selectedTool }: SeatToolboxProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <h3 className="font-bold text-lg text-gray-800">Herramientas</h3>
      
      <div className="space-y-2">
        {TOOL_ITEMS.map((tool, index) => {
          const Icon = tool.icon;
          const isSelected = selectedTool?.visualType === tool.visualType && 
                            selectedTool?.seatType === tool.seatType;
          
          return (
            <button
              key={index}
              onClick={() => onSelectTool(tool)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded flex items-center justify-center
                ${tool.color}
              `}>
                {Icon && <Icon className={tool.visualType === 'seat' ? 'text-white' : 'text-gray-700'} />}
              </div>
              <span className="font-medium text-gray-700">{tool.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={() => onSelectTool({ type: 'eraser' })}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
            ${selectedTool?.type === 'eraser'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="w-10 h-10 rounded flex items-center justify-center bg-red-500 text-white font-bold">
            ✕
          </div>
          <span className="font-medium text-gray-700">Borrador</span>
        </button>
      </div>
    </div>
  );
}