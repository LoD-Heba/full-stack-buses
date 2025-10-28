import React, { useState, useEffect } from "react";
import SeatToolbox from "./SeatToolbox";
import SeatGrid from "./SeatGrid";
import SeatProperties from "./SeatProperties";
import { FaSave, FaUndo, FaRedo, FaExpand, FaCompress } from "react-icons/fa";

interface SeatEditorProps {
  busId: string;
  initialLayout?: any;
  onSave: (layoutData: any) => void;
}

export default function SeatEditor({
  busId,
  initialLayout,
  onSave,
}: SeatEditorProps) {
  // Estado del grid
  const [gridSize, setGridSize] = useState({ rows: 10, cols: 5 });
  const [cells, setCells] = useState<any[]>([]);

  // Estado de herramientas
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);

  // Estado de configuración
  const [deckNumber, setDeckNumber] = useState(1);
  const [stackName, setStackName] = useState("Piso 1");
  const [decks, setDecks] = useState<any[]>([
    { floor: 1, name: "Piso 1", cells: [] },
  ]);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  // Historial para deshacer/rehacer
  const [history, setHistory] = useState<any[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Contador de asientos
  const [seatCounter, setSeatCounter] = useState(1);

  // Cargar layout inicial si existe
  useEffect(() => {
    if (initialLayout && initialLayout.decks) {
      // Cargar todos los pisos
      const loadedDecks = initialLayout.decks.map((deck: any) => ({
        floor: deck.floor_number,
        name: deck.stack_name,
        cells: deck.layout || [],
      }));
      setDecks(loadedDecks);

      // Cargar primer piso
      if (loadedDecks.length > 0) {
        setCells(loadedDecks[0].cells);
        setDeckNumber(loadedDecks[0].floor);
        setStackName(loadedDecks[0].name);
      }
    }
  }, [initialLayout]);

  // Agregar al historial
  const addToHistory = (newCells: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCells);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Deshacer
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCells(history[historyIndex - 1]);
    }
  };

  // Rehacer
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCells(history[historyIndex + 1]);
    }
  };

  // Manejar clic en celda
  const handleCellClick = (x: number, y: number) => {
    if (!selectedTool) return;

    const existingCell = cells.find(
      (c) => c.position_x === x && c.position_y === y
    );

    if (selectedTool.type === "eraser") {
      // Eliminar celda
      if (existingCell) {
        const newCells = cells.filter(
          (c) => !(c.position_x === x && c.position_y === y)
        );
        setCells(newCells);
        addToHistory(newCells);
      }
    } else {
      // Agregar nueva celda
      if (!existingCell) {
        let newCell: any = {
          position_x: x,
          position_y: y,
          visual_type: selectedTool.visualType,
          rotation: 0,
        };

        if (selectedTool.type === "seat") {
          newCell = {
            ...newCell,
            seat_code: `${seatCounter}A`,
            seat_number: seatCounter,
            type: selectedTool.seatType,
          };
          setSeatCounter((prev) => prev + 1);
        }

        const newCells = [...cells, newCell];
        setCells(newCells);
        addToHistory(newCells);
      }
    }
  };

  // Actualizar celda seleccionada
  const handleUpdateCell = (updates: any) => {
    const newCells = cells.map((cell) =>
      cell.position_x === selectedCell.position_x &&
      cell.position_y === selectedCell.position_y
        ? { ...cell, ...updates }
        : cell
    );
    setCells(newCells);
    addToHistory(newCells);
    setSelectedCell({ ...selectedCell, ...updates });
  };

  // Eliminar celda seleccionada
  const handleDeleteCell = () => {
    if (!selectedCell) return;

    const newCells = cells.filter(
      (c) =>
        !(
          c.position_x === selectedCell.position_x &&
          c.position_y === selectedCell.position_y
        )
    );
    setCells(newCells);
    addToHistory(newCells);
    setSelectedCell(null);
  };

  // Ajustar tamaño del grid
  const adjustGridSize = (dimension: "rows" | "cols", increment: boolean) => {
    setGridSize((prev) => ({
      ...prev,
      [dimension]: Math.max(
        3,
        Math.min(25, prev[dimension] + (increment ? 1 : -1))
      ),
    }));
  };

  // Guardar configuración
  const handleSave = () => {
    // Guardar piso actual antes de enviar
    const updatedDecks = [...decks];
    updatedDecks[currentDeckIndex] = {
      floor: deckNumber,
      name: stackName,
      cells: cells,
    };

    // Validar que al menos un piso tenga asientos
    const hasSeats = updatedDecks.some((deck) =>
      deck.cells.some((c: any) => c.visual_type === "seat")
    );

    if (!hasSeats) {
      alert("Debes agregar al menos un asiento en algún piso");
      return;
    }

    const layoutData = {
      decks: updatedDecks.map((deck) => ({
        floor_number: deck.floor,
        stack_name: deck.name,
        description: `Configuración del ${deck.name}`,
        seats: deck.cells.map((cell: any) => ({
          seat_code:
            cell.seat_code || `ELEM-${cell.position_x}-${cell.position_y}`,
          seat_number:
            cell.visual_type === "seat" ? cell.seat_number : undefined,
          position_x: cell.position_x,
          position_y: cell.position_y,
          visual_type: cell.visual_type,
          rotation: cell.rotation || 0,
          type: cell.type || "normal",
          deck: deck.floor,
          meta: {},
        })),
      })),
    };

    onSave(layoutData);
  };

  // Obtener códigos y números existentes
  const existingCodes = cells
    .filter((c) => c.seat_code)
    .map((c) => c.seat_code);

  const existingNumbers = cells
    .filter((c) => c.seat_number)
    .map((c) => c.seat_number);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Configurador de Asientos
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bus ID: {busId} |{" "}
                {cells.filter((c) => c.visual_type === "seat").length} asientos
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Deshacer"
              >
                <FaUndo />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rehacer"
              >
                <FaRedo />
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FaSave />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>

        {/* Configuración de piso */}
        {/* Gestión de pisos */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              Configuración de Pisos
            </h3>
            <button
              onClick={() => {
                // Guardar piso actual
                const updatedDecks = [...decks];
                updatedDecks[currentDeckIndex] = {
                  floor: deckNumber,
                  name: stackName,
                  cells: cells,
                };

                // Crear nuevo piso
                const newFloor = updatedDecks.length + 1;
                updatedDecks.push({
                  floor: newFloor,
                  name: `Piso ${newFloor}`,
                  cells: [],
                });

                setDecks(updatedDecks);
                setCurrentDeckIndex(updatedDecks.length - 1);
                setDeckNumber(newFloor);
                setStackName(`Piso ${newFloor}`);
                setCells([]);
                setSeatCounter(1);
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              + Agregar Piso
            </button>
          </div>

          {/* Tabs de pisos */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {decks.map((deck, index) => (
              <button
                key={index}
                onClick={() => {
                  // Guardar piso actual antes de cambiar
                  const updatedDecks = [...decks];
                  updatedDecks[currentDeckIndex] = {
                    floor: deckNumber,
                    name: stackName,
                    cells: cells,
                  };
                  setDecks(updatedDecks);

                  // Cargar nuevo piso
                  setCurrentDeckIndex(index);
                  setDeckNumber(deck.floor);
                  setStackName(deck.name);
                  setCells(deck.cells);

                  // Actualizar contador de asientos
                  const maxSeat = Math.max(
                    ...deck.cells
                      .filter((c: any) => c.seat_number)
                      .map((c: any) => c.seat_number),
                    0
                  );
                  setSeatCounter(maxSeat + 1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  currentDeckIndex === index
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {deck.name}
                <span className="ml-2 text-xs opacity-75">
                  (
                  {
                    deck.cells.filter((c: any) => c.visual_type === "seat")
                      .length
                  }{" "}
                  asientos)
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Piso
              </label>
              <input
                type="number"
                value={deckNumber}
                onChange={(e) => setDeckNumber(Number(e.target.value))}
                min={1}
                max={2}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Piso
              </label>
              <input
                type="text"
                value={stackName}
                onChange={(e) => setStackName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: Piso 1"
              />
            </div>
          </div>

          {/* Botón eliminar piso */}
          {decks.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`¿Eliminar ${stackName}?`)) {
                  const updatedDecks = decks.filter(
                    (_, i) => i !== currentDeckIndex
                  );
                  setDecks(updatedDecks);

                  // Ir al primer piso
                  setCurrentDeckIndex(0);
                  setDeckNumber(updatedDecks[0].floor);
                  setStackName(updatedDecks[0].name);
                  setCells(updatedDecks[0].cells);
                }
              }}
              className="mt-3 w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
            >
              Eliminar Piso Actual
            </button>
          )}
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-12 gap-6">
          {/* Toolbox */}
          <div className="col-span-2">
            <SeatToolbox
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
            />
          </div>

          {/* Grid */}
          <div className="col-span-7">
            <SeatGrid
              rows={gridSize.rows}
              cols={gridSize.cols}
              cells={cells}
              selectedTool={selectedTool}
              onCellClick={handleCellClick}
              onCellSelect={setSelectedCell}
              selectedCell={selectedCell}
            />
          </div>

          {/* Properties */}
          <div className="col-span-3">
            <SeatProperties
              selectedCell={selectedCell}
              onUpdate={handleUpdateCell}
              onDelete={handleDeleteCell}
              onClose={() => setSelectedCell(null)}
              existingCodes={existingCodes}
              existingNumbers={existingNumbers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
