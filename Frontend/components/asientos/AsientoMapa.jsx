import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { FaChair, FaTv, FaToilet, FaDoorOpen } from "react-icons/fa";
import { MdAirlineSeatReclineExtra } from "react-icons/md";

const AsientoItem = ({ data, selected, disabled, onSelect }) => {
  const handleClick = () => {
    if (data.visual_type === "seat" && !disabled && onSelect) {
      onSelect(data.seat_code?.toUpperCase() || data.seat_code);
    }
  };

  // ✅ Obtener icono según tipo
  const getIcon = () => {
    switch (data.visual_type) {
      case "seat":
        return data.type === "cama" ? (
          <MdAirlineSeatReclineExtra className="text-white" />
        ) : (
          <FaChair className="text-white" />
        );
      case "tv":
        return <FaTv className="text-blue-500 text-2xl" />;
      case "bathroom":
        return <FaToilet className="text-indigo-400 text-2xl" />;
      case "door":
        return <FaDoorOpen className="text-amber-500 text-2xl" />;
      case "aisle":
        return null;
      default:
        return null;
    }
  };

  // ✅ Obtener color según status
  const getStatusColor = () => {
    if (data.visual_type !== "seat") return "bg-transparent";

    if (selected) {
      return "bg-blue-500 border-blue-700 shadow-lg scale-105";
    }

    // ✅ Mapear status del backend a colores
    if (data.status) {
      switch (data.status) {
        case "disponible":
          // Color según tipo de asiento cuando está disponible
          switch (data.type) {
            case "cama":
              return "bg-green-600 border-green-700 hover:bg-green-700 cursor-pointer";
            case "semi_cama":
              return "bg-blue-600 border-blue-700 hover:bg-blue-700 cursor-pointer";
            case "normal":
            default:
              return "bg-gray-500 border-gray-600 hover:bg-gray-600 cursor-pointer";
          }
        case "reservado":
          return "bg-yellow-400 border-yellow-600 cursor-not-allowed opacity-75";
        case "ocupado":
          return "bg-red-400 border-red-600 cursor-not-allowed opacity-75";
        case "bloqueado":
          return "bg-gray-400 border-gray-600 cursor-not-allowed opacity-60";
        default:
          return "bg-gray-500 border-gray-600 hover:bg-gray-600 cursor-pointer";
      }
    }

    // Fallback: color por tipo de asiento (por si no viene status)
    switch (data.type) {
      case "cama":
        return "bg-green-600 border-green-700 hover:bg-green-700 cursor-pointer";
      case "semi_cama":
        return "bg-blue-600 border-blue-700 hover:bg-blue-700 cursor-pointer";
      case "normal":
      default:
        return "bg-gray-500 border-gray-600 hover:bg-gray-600 cursor-pointer";
    }
  };

  const baseClasses = "rounded-lg border-2 transition-all duration-200";
  const statusClasses = getStatusColor();
  const isDisabled =
    data.status === "reservado" ||
    data.status === "ocupado" ||
    data.status === "bloqueado";

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${statusClasses} w-full h-full flex items-center justify-center ${
        data.visual_type === "seat" && !isDisabled ? "cursor-pointer" : ""
      }`}
      title={`Asiento ${data.seat_number || data.seat_code} - ${
        data.status === "disponible"
          ? "Disponible"
          : data.status === "reservado"
          ? "Reservado"
          : data.status === "ocupado"
          ? "Ocupado"
          : data.status === "bloqueado"
          ? "Bloqueado"
          : "Disponible"
      }`}
      style={{
        transform: `rotate(${data.rotation || 0}deg)`,
      }}
    >
      {data.visual_type === "seat" ? (
        <div className="flex flex-col items-center">
          {getIcon()}
          <span className="text-white text-xs font-bold mt-1">
            {data.seat_number || data.seat_code}
          </span>
        </div>
      ) : (
        getIcon()
      )}
    </button>
  );
};

// ✅ Leyenda de estados (simplificada - solo estados)
const StatusLegend = () => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
    <h3 className="font-bold text-gray-800 mb-2">Estado de Asientos</h3>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-500 rounded border-2 border-gray-600 flex items-center justify-center">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Disponible</span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-500 rounded border-2 border-blue-700 flex items-center justify-center shadow-lg">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Seleccionado</span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-yellow-400 rounded border-2 border-yellow-600 flex items-center justify-center">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Reservado</span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-red-400 rounded border-2 border-red-600 flex items-center justify-center">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Ocupado</span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-400 rounded border-2 border-gray-600 flex items-center justify-center">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Bloqueado</span>
    </div>
  </div>
);

// ✅ Leyenda de tipos de asiento
const SeatTypeLegend = () => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
    <h3 className="font-bold text-gray-800 mb-2">Tipos de Asiento</h3>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-500 rounded border-2 border-gray-600 flex items-center justify-center">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Normal</span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-600 rounded border-2 border-blue-700 flex items-center justify-center">
        <FaChair className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Semi Cama</span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-green-600 rounded border-2 border-green-700 flex items-center justify-center">
        <MdAirlineSeatReclineExtra className="text-white text-xs" />
      </div>
      <span className="text-sm text-gray-700">Cama</span>
    </div>

    <div className="pt-3 border-t space-y-2">
      <p className="text-xs text-gray-600 font-semibold">Elementos:</p>
      <div className="flex items-center gap-2">
        <FaTv className="text-blue-500 text-lg" />
        <span className="text-xs text-gray-600">TV</span>
      </div>
      <div className="flex items-center gap-2">
        <FaToilet className="text-indigo-400 text-lg" />
        <span className="text-xs text-gray-600">Baño</span>
      </div>
      <div className="flex items-center gap-2">
        <FaDoorOpen className="text-amber-500 text-lg" />
        <span className="text-xs text-gray-600">Puerta</span>
      </div>
    </div>
  </div>
);

export default function AsientoMapa({
  busLayout,
  tripInfo,
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
    <div className="flex-1">
      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${Math.max(maxX, 1)}, 60px)`,
          gridTemplateRows: `repeat(${Math.max(maxY, 1)}, 60px)`,
          width: "fit-content",
        }}
      >
        {layout.map((seat, index) => {
          const seatCode = seat.seat_code?.toUpperCase();
          
          // ✅ CRÍTICO: Si el asiento está en occupiedSeats, forzar status a 'ocupado'
          const seatWithStatus = {
            ...seat,
            status: occupiedSeats.includes(seatCode) ? 'ocupado' : seat.status
          };

          return (
            <div
              key={seat.id || `seat-${index}`}
              style={{
                gridColumn: seat.position_x || 1,
                gridRow: seat.position_y || 1,
              }}
              className="w-[60px] h-[60px]"
            >
              <AsientoItem
                data={seatWithStatus}
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
    <div className="grid grid-cols-12 gap-6">
      {/* ✅ Leyendas a la izquierda */}
      <div className="col-span-2 space-y-4">
        <StatusLegend />
        <SeatTypeLegend />

        {/* Resumen de selección */}
        {selectedSeats.length > 0 && (
          <div className="bg-blue-50 rounded-lg border-2 border-blue-300 p-4 shadow-md">
            <p className="font-bold text-blue-900 mb-2 text-sm">
              Seleccionados ({selectedSeats.length}/{maxSelection})
            </p>
            <p className="text-blue-700 text-xs mb-3 font-semibold">
              {selectedSeats.join(", ")}
            </p>
            <button
              onClick={clearSelection}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* ✅ Mapa de asientos al centro */}
      <div className="col-span-10 space-y-4">
        {/* Header con ruta */}
        {tripInfo && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg shadow-md">
            <p className="font-bold text-lg text-center">
              {tripInfo.route.name || "?"}
            </p>
            <p className="text-sm text-center text-blue-100 mt-1">
              {busLayout.plate} - {busLayout.model}
            </p>
          </div>
        )}

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

        {/* Layout del bus */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Frente del bus */}
          <div className="bg-gray-800 text-white py-2 px-4 rounded-t-lg mb-6 text-center">
            <p className="font-semibold">🚌 Frente del Bus - Conductor</p>
          </div>

          {/* Grid de asientos */}
          <div className="flex justify-center">
            {busLayout.floors > 1
              ? busLayout.decks.map((deckData) => (
                  <React.Fragment key={deckData.deck}>
                    {renderDeckLayout(deckData)}
                  </React.Fragment>
                ))
              : renderDeckLayout(currentDeckData)}
          </div>

          {/* Parte trasera */}
          <div className="bg-gray-800 text-white py-2 px-4 rounded-b-lg mt-6 text-center">
            <p className="font-semibold">Parte Trasera del Bus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
