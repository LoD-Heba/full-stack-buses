import React, { useState } from 'react';
import AsientoItem from './AsientoItem';
import AsientoLegend from './AsientoLegend';
import DeckSelector from './DeckSelector';

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

interface DeckLayout {
  deck: number;
  stack_id: string;
  stack_name: string;
  layout: SeatData[];
}

interface BusLayoutData {
  bus_id: string;
  plate: string;
  model: string;
  service_type: string;
  floors: number;
  image_url?: string;
  amenities?: string;
  decks: DeckLayout[];
}

interface AsientoMapaProps {
  busLayout: BusLayoutData;
  occupiedSeats?: string[]; // Códigos de asientos ocupados
  onSeatSelect?: (selectedSeats: string[]) => void;
  maxSelection?: number; // Máximo de asientos a seleccionar
}

export default function AsientoMapa({ 
  busLayout, 
  occupiedSeats = [],
  onSeatSelect,
  maxSelection = 5
}: AsientoMapaProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<number>(
    busLayout.decks[0]?.deck || 1
  );

  const currentDeckData = busLayout.decks.find(d => d.deck === selectedDeck);

  if (!currentDeckData) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-600">No hay asientos configurados para este bus.</p>
      </div>
    );
  }

  const layout = currentDeckData.layout;

  // Calcular dimensiones del grid
  const maxX = Math.max(...layout.map(s => s.position_x), 0);
  const maxY = Math.max(...layout.map(s => s.position_y), 0);

  const toggleSeat = (seatCode: string) => {
    setSelectedSeats(prev => {
      let newSelection: string[];
      
      if (prev.includes(seatCode)) {
        // Deseleccionar
        newSelection = prev.filter(s => s !== seatCode);
      } else {
        // Seleccionar (respetando el máximo)
        if (prev.length >= maxSelection) {
          alert(`Solo puedes seleccionar hasta ${maxSelection} asientos`);
          return prev;
        }
        newSelection = [...prev, seatCode];
      }
      
      // Callback para notificar cambios
      if (onSeatSelect) {
        onSeatSelect(newSelection);
      }
      
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedSeats([]);
    if (onSeatSelect) {
      onSeatSelect([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del bus */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {busLayout.model}
            </h2>
            <p className="text-gray-600 mt-1">
              Placa: <span className="font-semibold">{busLayout.plate}</span>
            </p>
            <p className="text-gray-600">
              Tipo: <span className="font-semibold capitalize">{busLayout.service_type.replace('_', ' ')}</span>
            </p>
            {busLayout.amenities && (
              <p className="text-gray-600 mt-2 text-sm">
                <span className="font-semibold">Comodidades:</span> {busLayout.amenities}
              </p>
            )}
          </div>
          {busLayout.image_url && (
            <img 
              src={busLayout.image_url} 
              alt={busLayout.model}
              className="w-32 h-24 object-cover rounded-lg"
            />
          )}
        </div>
      </div>

      {/* Selector de pisos */}
      {busLayout.floors > 1 && (
        <DeckSelector
          decks={busLayout.decks}
          selectedDeck={selectedDeck}
          onDeckChange={setSelectedDeck}
        />
      )}

      {/* Selección actual */}
      {selectedSeats.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                Asientos seleccionados ({selectedSeats.length}/{maxSelection}):
              </p>
              <p className="text-blue-700 mt-1">
                {selectedSeats.join(', ')}
              </p>
            </div>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {/* Mapa de asientos */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 p-8 rounded-lg shadow-lg">
        <div className="bg-gray-800 text-white py-2 px-4 rounded-t-lg mb-4 text-center">
          <p className="font-semibold">🚌 Frente del Bus - Conductor</p>
        </div>

        <div
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${maxX}, 50px)`,
            gridTemplateRows: `repeat(${maxY}, 50px)`,
            width: 'fit-content'
          }}
        >
          {layout.map((seat, index) => (
            <AsientoItem
              key={seat.id || `seat-${index}`}
              data={seat}
              selected={selectedSeats.includes(seat.seat_code)}
              disabled={occupiedSeats.includes(seat.seat_code)}
              onSelect={toggleSeat}
            />
          ))}
        </div>

        <div className="bg-gray-800 text-white py-2 px-4 rounded-b-lg mt-4 text-center">
          <p className="font-semibold">Parte Trasera del Bus</p>
        </div>
      </div>

      {/* Leyenda */}
      <AsientoLegend />
    </div>
  );
}