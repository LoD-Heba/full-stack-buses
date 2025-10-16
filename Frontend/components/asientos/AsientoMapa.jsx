import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

const AsientoItem = ({ data, selected, disabled, onSelect }) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect(data.seat_code?.toUpperCase() || data.seat_code);
    }
  };

  const getStatusColor = () => {
    if (disabled) {
      return "bg-red-300 border-red-500 cursor-not-allowed";
    }
    if (selected) {
      return "bg-blue-500 border-blue-700";
    }

    // Usar el campo status si existe
    if (data.status) {
      switch (data.status) {
        case "disponible":
          return "bg-green-400 border-green-600 hover:bg-green-500";
        case "reservado":
          return "bg-yellow-400 border-yellow-600 cursor-not-allowed";
        case "ocupado":
          return "bg-red-300 border-red-500 cursor-not-allowed";
        case "bloqueado":
          return "bg-gray-400 border-gray-600 cursor-not-allowed";
        default:
          return "bg-green-400 border-green-600 hover:bg-green-500";
      }
    }

    // Fallback para compatibilidad
    return "bg-green-400 border-green-600 hover:bg-green-500";
  };

  const baseClasses = "rounded-md border-2 cursor-pointer transition-all";
  const statusClasses = getStatusColor();

  return (
    <button
      onClick={handleClick}
      disabled={
        disabled ||
        data.status === "reservado" ||
        data.status === "ocupado" ||
        data.status === "bloqueado"
      }
      className={`${baseClasses} ${statusClasses} w-full h-full text-xs font-bold text-white`}
      title={`${data.seat_code} - ${data.status || "disponible"}`}
    >
      {data.visual_type === "seat"
        ? data.seat_number || data.seat_code
        : data.visual_type?.[0]}
    </button>
  );
};

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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!busLayout) {
      setError("No se encontraron datos del bus");
      return;
    }

    if (!Array.isArray(busLayout.decks) || busLayout.decks.length === 0) {
      setError("El bus no tiene pisos configurados");
      return;
    }

    setSelectedDeck(busLayout.decks[0]?.deck || 1);
  }, [busLayout]);

  if (!busLayout) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-gray-600">Cargando información del bus...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

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

  // ✅ MODIFICADO: Manejar selección de asientos normalizando a mayúsculas
  const toggleSeat = (seatCode) => {
    const normalizedCode = seatCode.toUpperCase();

    setSelectedSeats((prev) => {
      let newSelection;

      if (prev.includes(normalizedCode)) {
        newSelection = prev.filter((s) => s !== normalizedCode);
      } else {
        if (prev.length >= maxSelection) {
          alert(`Solo puedes seleccionar hasta ${maxSelection} asientos`);
          return prev;
        }
        newSelection = [...prev, normalizedCode];
      }

      // ✅ Notificar cambio al padre
      if (onSeatSelect) {
        console.log("🎯 Asientos seleccionados:", newSelection);
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
          <p className="text-gray-500">
            No hay asientos en {deckData.stack_name}
          </p>
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
          {layout.map((seat, index) => {
            const seatCode = seat.seat_code?.toUpperCase();
            return (
              <div
                key={seat.id || `seat-${index}`}
                style={{
                  gridColumn: seat.position_x || 1,
                  gridRow: seat.position_y || 1,
                }}
              >
                <AsientoItem
                  data={seat}
                  selected={selectedSeats.includes(seatCode)}
                  disabled={occupiedSeats.includes(seatCode)}
                  onSelect={toggleSeat}
                />
              </div>
            );
          })}
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

      {/* Selector de pisos */}
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg mb-6 text-center shadow-md">
            <p className="font-bold text-lg">
              🚌 {busLayout.plate} - {busLayout.model}
            </p>
          </div>

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
