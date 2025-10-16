import React, { useState, useEffect } from "react";
import { AlertCircle, Loader } from "lucide-react";

// Mock component para AsientoItem
const AsientoItem = ({ data, selected, disabled, onSelect }) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect(data.seat_code);
    }
  };

  const baseClasses = "rounded-md border-2 cursor-pointer transition-all";
  const statusClasses = disabled
    ? "bg-red-300 border-red-500 cursor-not-allowed"
    : selected
      ? "bg-blue-500 border-blue-700"
      : "bg-green-400 border-green-600 hover:bg-green-500";

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${statusClasses} w-full h-full text-xs font-bold text-white`}
      title={data.seat_code}
    >
      {data.visual_type === "seat" ? data.seat_number : data.visual_type[0]}
    </button>
  );
};

// Mock component para AsientoLegend
const AsientoLegend = () => (
  <div className="flex gap-6 justify-center p-4 bg-white rounded-lg shadow-md">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-green-400 rounded border-2 border-green-600"></div>
      <span className="text-sm">Disponible</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-700"></div>
      <span className="text-sm">Seleccionado</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-red-300 rounded border-2 border-red-500"></div>
      <span className="text-sm">Ocupado</span>
    </div>
  </div>
);

export default function AsientoMapa({
  busLayout,
  occupiedSeats = [],
  onSeatSelect,
  maxSelection = 5,
}) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✨ Validar que busLayout es válido
  useEffect(() => {
    if (!busLayout) {
      setError("No se encontraron datos del bus");
      setIsLoading(false);
      return;
    }

    if (!Array.isArray(busLayout.decks) || busLayout.decks.length === 0) {
      setError("El bus no tiene pisos configurados");
      setIsLoading(false);
      return;
    }

    // Establecer el primer piso disponible
    setSelectedDeck(busLayout.decks[0]?.deck || 1);
    setIsLoading(false);
  }, [busLayout]);

  const handleReserve = () => {
    if (selectedSeats.length === 0) {
      alert("Por favor selecciona al menos un asiento");
      return;
    }
    alert(`Reservando asientos: ${selectedSeats.join(", ")}`);
  };

  // ✨ Manejo de estado null
  if (!busLayout) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-gray-600">Cargando información del bus...</p>
      </div>
    );
  }

  // ✨ Manejo de errores
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  // ✨ Validar que decks existe y no está vacío
  if (!Array.isArray(busLayout.decks) || busLayout.decks.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow-md text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
        <p className="text-yellow-800 font-semibold">
          El bus no tiene asientos configurados
        </p>
      </div>
    );
  }

  const currentDeckData = busLayout.decks.find((d) => d.deck === selectedDeck);

  if (!currentDeckData) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-600">No hay asientos en el piso seleccionado</p>
      </div>
    );
  }

  const layout = currentDeckData.layout;

  const toggleSeat = (seatCode) => {
    setSelectedSeats((prev) => {
      let newSelection;

      if (prev.includes(seatCode)) {
        newSelection = prev.filter((s) => s !== seatCode);
      } else {
        if (prev.length >= maxSelection) {
          alert(`Solo puedes seleccionar hasta ${maxSelection} asientos`);
          return prev;
        }
        newSelection = [...prev, seatCode];
      }

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

  const renderDeckLayout = (deckData) => {
    const layout = deckData.layout || [];
    
    if (layout.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay asientos en {deckData.stack_name}</p>
        </div>
      );
    }

    const maxX = Math.max(...layout.map((s) => s.position_x), 0);
    const maxY = Math.max(...layout.map((s) => s.position_y), 0);

    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-center font-bold text-gray-700 mb-3 bg-white/90 py-2 px-4 rounded-lg">
          {deckData.stack_name}
        </h3>
        <div
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${Math.max(maxX, 1)}, 50px)`,
            gridTemplateRows: `repeat(${Math.max(maxY, 1)}, 50px)`,
            width: "fit-content",
          }}
        >
          {layout.map((seat, index) => (
            <div
              key={seat.id || `seat-${index}`}
              style={{
                gridColumn: seat.position_x || 1,
                gridRow: seat.position_y || 1,
              }}
            >
              <AsientoItem
                data={seat}
                selected={selectedSeats.includes(seat.seat_code)}
                disabled={occupiedSeats.includes(seat.seat_code)}
                onSelect={toggleSeat}
              />
            </div>
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
              {busLayout.model || "Bus"}
            </h2>
            <p className="text-gray-600 mt-1">
              Placa:{" "}
              <span className="font-semibold">{busLayout.plate || "N/A"}</span>
            </p>
            <p className="text-gray-600">
              Tipo:{" "}
              <span className="font-semibold capitalize">
                {(busLayout.service_type || "normal").replace(/_/g, " ")}
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
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
        </div>
      </div>

      {/* Leyenda */}
      <AsientoLegend />

      {/* Selector de pisos (si hay múltiples) */}
      {busLayout.floors > 1 && busLayout.decks.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Seleccionar Piso:
          </p>
          <div className="flex gap-3">
            {busLayout.decks.map((deck) => (
              <button
                key={deck.deck}
                onClick={() => {
                  setSelectedDeck(deck.deck);
                  setSelectedSeats([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedDeck === deck.deck
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Piso {deck.deck}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Información y acciones */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {/* Selección actual */}
        {selectedSeats.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 flex-1">
            <p className="font-semibold text-blue-900 mb-3">
              Asientos seleccionados ({selectedSeats.length}/{maxSelection}):
            </p>
            <p className="text-blue-700 mb-4">{selectedSeats.join(", ")}</p>
            <button
              onClick={clearSelection}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Limpiar Selección
            </button>
          </div>
        )}

        {/* Resumen de pago */}
        {selectedSeats.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md flex-1 flex flex-col justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Total: {selectedSeats.length} asiento{selectedSeats.length > 1 ? "s" : ""}
              </p>
              <p className="text-gray-600 mt-2">
                Precio por asiento: Bs. 150.00
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-4">
                Bs. {(selectedSeats.length * 150).toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleReserve}
              className="px-8 py-3 mt-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg w-full"
            >
              Continuar con la reserva
            </button>
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
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm"></div>

        <div className="relative z-10">
          {/* Ruta del viaje */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg mb-6 text-center shadow-md">
            <p className="font-bold text-lg">🚌 Rumbo a Cochabamba</p>
          </div>

          {/* Contenedor de pisos */}
          <div className="flex gap-8 justify-center items-start flex-wrap">
            {busLayout.floors > 1
              ? busLayout.decks.map((deckData) => (
                  <React.Fragment key={deckData.deck}>
                    {renderDeckLayout(deckData)}
                  </React.Fragment>
                ))
              : renderDeckLayout(currentDeckData)}
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-2 px-4 rounded-lg mt-6 text-center shadow-md">
            <p className="font-semibold">Parte Trasera del Bus</p>
          </div>
        </div>
      </div>
    </div>
  );
}