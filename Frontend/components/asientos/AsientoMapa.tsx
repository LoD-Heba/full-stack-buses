import React, { useState } from "react";
import AsientoItem from "./AsientoItem";
import AsientoLegend from "./AsientoLegend";
import DeckSelector from "./DeckSelector";

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
  maxSelection = 5,
}: AsientoMapaProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<number>(
    busLayout.decks[0]?.deck || 1
  );
  const handleReserve = () => {
    if (selectedSeats.length === 0) {
      alert("Por favor selecciona al menos un asiento");
      return;
    }

    alert(`Reservando asientos: ${selectedSeats.join(", ")}`);
    // Aquí iría la lógica para crear la reserva/ticket
  };
  const currentDeckData = busLayout.decks.find((d) => d.deck === selectedDeck);

  if (!currentDeckData) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-600">
          No hay asientos configurados para este bus.
        </p>
      </div>
    );
  }

  const layout = currentDeckData.layout;

  // Calcular dimensiones del grid
  const maxX = Math.max(...layout.map((s) => s.position_x), 0);
  const maxY = Math.max(...layout.map((s) => s.position_y), 0);

  const toggleSeat = (seatCode: string) => {
    setSelectedSeats((prev) => {
      let newSelection: string[];

      if (prev.includes(seatCode)) {
        // Deseleccionar
        newSelection = prev.filter((s) => s !== seatCode);
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

  const renderDeckLayout = (deckData: DeckLayout) => {
    const layout = deckData.layout;
    const maxX = Math.max(...layout.map((s) => s.position_x), 0);
    const maxY = Math.max(...layout.map((s) => s.position_y), 0);

    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-center font-bold text-gray-700 mb-3 bg-white/90 py-2 rounded-lg">
          {deckData.stack_name}
        </h3>
        <div
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${maxX}, 50px)`,
            gridTemplateRows: `repeat(${maxY}, 50px)`,
            width: "fit-content",
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
      </div>
    );
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
              Tipo:{" "}
              <span className="font-semibold capitalize">
                {busLayout.service_type.replace("_", " ")}
              </span>
            </p>
            {busLayout.amenities && (
              <p className="text-gray-600 mt-2 text-sm">
                <span className="font-semibold">Comodidades:</span>{" "}
                {busLayout.amenities}
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
      {/* Leyenda */}
      <AsientoLegend />
      <div className="flex items-center justify-around ">
        {/* Selección actual */}
        {selectedSeats.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-row items-center justify-between ">
              <div>
                <p className="font-semibold text-blue-900 m-6">
                  Asientos seleccionados ({selectedSeats.length}/{maxSelection}
                  ):
                </p>
                <p className="pl-6 text-blue-700 mt-1">{selectedSeats.join(", ")}</p>
              </div>

              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors m-6"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
        {/* Botón de acción */}
        {selectedSeats.length > 0 && (
          <div className="items-center mt-6 bg-white p-6 rounded-lg shadow-md">
            <div className=" items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Total: {selectedSeats.length} asiento
                  {selectedSeats.length > 1 ? "s" : ""}
                </p>
                <p className="text-gray-600 mt-1">
                  Precio por asiento: Bs. 150.00
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  Total: Bs. {(selectedSeats.length * 150).toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleReserve}
                className="px-8 py-3 m-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Continuar con la reserva
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Mapa de asientos */}
      <div
        className="relative p-8 rounded-lg shadow-lg overflow-hidden"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
          backgroundColor: "rgba(243, 244, 246, 0.95)",
        }}
      >
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm"></div>

        <div className="relative z-10">
          {/* Ruta del viaje */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg mb-6 text-center shadow-md">
            <p className="font-bold text-lg">🚌 Rumbo a Cochabamba</p>
          </div>

          {/* Contenedor de pisos */}
          <div className="flex gap-8 justify-center items-start flex-wrap">
            {busLayout.floors > 1
              ? // Mostrar ambos pisos lado a lado
                busLayout.decks.map((deckData) => (
                  <React.Fragment key={deckData.deck}>
                    {renderDeckLayout(deckData)}
                  </React.Fragment>
                ))
              : // Mostrar un solo piso
                renderDeckLayout(currentDeckData)}
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-2 px-4 rounded-lg mt-6 text-center shadow-md">
            <p className="font-semibold">Parte Trasera del Bus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
