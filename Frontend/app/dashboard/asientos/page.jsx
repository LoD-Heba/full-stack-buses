"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Save } from 'lucide-react';

export default function BusSeatDesigner() {
  const [config, setConfig] = useState({
    columns: 4,
    rows: 10,
    hasSecondFloor: false,
    secondFloorRows: 8,
    busType: 'normal',
    stackId: '',
    busId: ''
  });

  const [seats, setSeats] = useState({
    floor1: [],
    floor2: []
  });

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [mode, setMode] = useState('design');
  const [stacks, setStacks] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStacks();
    fetchBuses();
  }, []);

  const fetchStacks = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/seat-stacks');
      const data = await res.json();
      setStacks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching stacks:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/buses');
      const data = await res.json();
      setBuses(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  const generateSeats = () => {
    const floor1Seats = [];
    const floor2Seats = [];
    
    for (let row = 1; row <= config.rows; row++) {
      for (let col = 1; col <= config.columns; col++) {
        const middleCol = Math.ceil(config.columns / 2);
        if (config.columns >= 4 && col === middleCol) continue;
        
        const seatNumber = floor1Seats.length + 1;
        floor1Seats.push({
          id: `F1-${row}-${col}`,
          seat_number: seatNumber,
          seat_code: `S${seatNumber.toString().padStart(2, '0')}`,
          row,
          col,
          deck: 1,
          type: config.busType,
          is_active: true,
          status: 'available'
        });
      }
    }

    if (config.hasSecondFloor) {
      for (let row = 1; row <= config.secondFloorRows; row++) {
        for (let col = 1; col <= config.columns; col++) {
          const middleCol = Math.ceil(config.columns / 2);
          if (config.columns >= 4 && col === middleCol) continue;
          
          const seatNumber = floor2Seats.length + 1;
          floor2Seats.push({
            id: `F2-${row}-${col}`,
            seat_number: seatNumber + floor1Seats.length,
            seat_code: `S${(seatNumber + floor1Seats.length).toString().padStart(2, '0')}`,
            row,
            col,
            deck: 2,
            type: config.busType,
            is_active: true,
            status: 'available'
          });
        }
      }
    }

    setSeats({ floor1: floor1Seats, floor2: floor2Seats });
  };

  const saveSeatsToBackend = async () => {
    if (!config.stackId) {
      alert('Selecciona un stack de asientos');
      return;
    }

    setLoading(true);
    try {
      const allSeats = [...seats.floor1, ...seats.floor2];
      
      for (const seat of allSeats) {
        await fetch('http://localhost:3001/api/v1/seat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seat_code: seat.seat_code,
            seat_number: seat.seat_number,
            deck: seat.deck,
            type: seat.type,
            stackId: config.stackId,
            is_active: seat.is_active
          })
        });
      }
      
      alert(`${allSeats.length} asientos guardados exitosamente`);
    } catch (error) {
      console.error('Error saving seats:', error);
      alert('Error al guardar los asientos');
    } finally {
      setLoading(false);
    }
  };

  const updateSeat = (floorKey, seatId, updates) => {
    setSeats(prev => ({
      ...prev,
      [floorKey]: prev[floorKey].map(seat =>
        seat.id === seatId ? { ...seat, ...updates } : seat
      )
    }));
  };

  const deleteSeat = (floorKey, seatId) => {
    setSeats(prev => ({
      ...prev,
      [floorKey]: prev[floorKey].filter(seat => seat.id !== seatId)
    }));
  };

  const getSeatColor = (seat) => {
    if (!seat.is_active) return 'bg-gray-300 cursor-not-allowed';
    if (seat.status === 'occupied') return 'bg-red-500 text-white';
    if (seat.status === 'reserved') return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white hover:bg-green-600';
  };

  const renderBusFloor = (floorSeats, floorNumber) => {
    const maxRow = Math.max(...floorSeats.map(s => s.row), 0);
    const gridCols = config.columns === 5 ? 'grid-cols-5' : config.columns === 4 ? 'grid-cols-4' : 'grid-cols-3';

    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Piso {floorNumber}
            <span className="text-sm text-gray-500">
              ({floorSeats.filter(s => s.is_active).length} asientos)
            </span>
          </h3>
        </div>

        <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg mb-2 font-bold">
          FRENTE DEL BUS
        </div>

        <div className="bg-white p-4 rounded-lg border-4 border-gray-300">
          {Array.from({ length: maxRow }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1;
            const rowSeats = floorSeats.filter(s => s.row === rowNum);

            return (
              <div key={rowNum} className={`grid ${gridCols} gap-2 mb-2`}>
                {Array.from({ length: config.columns }).map((_, colIndex) => {
                  const colNum = colIndex + 1;
                  const middleCol = Math.ceil(config.columns / 2);
                  
                  if (config.columns >= 4 && colNum === middleCol) {
                    return (
                      <div key={`aisle-${rowNum}-${colNum}`} className="flex items-center justify-center text-gray-400 text-xs font-bold">
                        PASILLO
                      </div>
                    );
                  }

                  const seat = rowSeats.find(s => s.col === colNum);

                  if (!seat) {
                    return (
                      <div
                        key={`empty-${rowNum}-${colNum}`}
                        className="h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs"
                      >
                        vacio
                      </div>
                    );
                  }

                  return (
                    <button
                      key={seat.id}
                      onClick={() => setSelectedSeat(seat)}
                      className={`h-14 ${getSeatColor(seat)} rounded-lg font-bold text-sm transition-all transform hover:scale-105 flex flex-col items-center justify-center shadow-md`}
                      disabled={mode === 'preview' && !seat.is_active}
                    >
                      <span>{seat.seat_code}</span>
                      <span className="text-xs opacity-80">#{seat.seat_number}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="bg-gray-600 text-white text-center py-2 rounded-b-lg mt-2 font-bold">
          PARTE TRASERA
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Disenador de Asientos de Bus</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Configuracion</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bus</label>
                  <select
                    value={config.busId}
                    onChange={(e) => setConfig({ ...config, busId: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Selecciona un bus</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plate} - {bus.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stack de Asientos</label>
                  <select
                    value={config.stackId}
                    onChange={(e) => setConfig({ ...config, stackId: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Selecciona un stack</option>
                    {stacks.map(stack => (
                      <option key={stack.id} value={stack.id}>
                        {stack.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Bus</label>
                  <select
                    value={config.busType}
                    onChange={(e) => setConfig({ ...config, busType: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="semi_cama">Semi Cama</option>
                    <option value="cama">Cama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Columnas: {config.columns}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="5"
                    value={config.columns}
                    onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {config.columns === 5 ? '2-pasillo-2 (5 columnas)' : 
                     config.columns === 4 ? '2-pasillo-2 (4 columnas)' : 
                     '1-pasillo-2 (3 columnas)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Filas Piso 1: {config.rows}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={config.rows}
                    onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.hasSecondFloor}
                      onChange={(e) => setConfig({ ...config, hasSecondFloor: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Segundo Piso</span>
                  </label>
                </div>

                {config.hasSecondFloor && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Filas Piso 2: {config.secondFloorRows}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      value={config.secondFloorRows}
                      onChange={(e) => setConfig({ ...config, secondFloorRows: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}

                <button
                  onClick={generateSeats}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Generar Asientos
                </button>

                <button
                  onClick={saveSeatsToBackend}
                  disabled={loading || seats.floor1.length === 0 || !config.stackId}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Guardando...' : 'Guardar Asientos'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('design')}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      mode === 'design'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Disenar
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      mode === 'preview'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    Vista
                  </button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Resumen</h3>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>Total Piso 1: {seats.floor1.filter(s => s.is_active).length}</p>
                    {config.hasSecondFloor && (
                      <p>Total Piso 2: {seats.floor2.filter(s => s.is_active).length}</p>
                    )}
                    <p className="font-bold text-gray-800 text-base">
                      Total: {seats.floor1.filter(s => s.is_active).length + seats.floor2.filter(s => s.is_active).length}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2 text-sm">Leyenda</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded"></div>
                      <span>Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                      <span>Reservado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded"></div>
                      <span>Ocupado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <span>Inactivo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {seats.floor1.length > 0 ? (
              <>
                {renderBusFloor(seats.floor1, 1)}
                {config.hasSecondFloor && seats.floor2.length > 0 && renderBusFloor(seats.floor2, 2)}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">BUS</div>
                <p className="text-gray-500 text-lg">Configura y genera los asientos para comenzar</p>
                <p className="text-gray-400 text-sm mt-2">Ajusta las opciones y presiona Generar Asientos</p>
              </div>
            )}
          </div>
        </div>

        {selectedSeat && mode === 'design' && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl p-6 w-80 border-2 border-orange-500 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Editar Asiento</h3>
              <button
                onClick={() => setSelectedSeat(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                X
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Codigo</label>
                <input
                  type="text"
                  value={selectedSeat.seat_code}
                  onChange={(e) => {
                    const floorKey = selectedSeat.deck === 1 ? 'floor1' : 'floor2';
                    updateSeat(floorKey, selectedSeat.id, { seat_code: e.target.value });
                    setSelectedSeat({ ...selectedSeat, seat_code: e.target.value });
                  }}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Numero</label>
                <input
                  type="number"
                  value={selectedSeat.seat_number}
                  onChange={(e) => {
                    const floorKey = selectedSeat.deck === 1 ? 'floor1' : 'floor2';
                    updateSeat(floorKey, selectedSeat.id, { seat_number: parseInt(e.target.value) });
                    setSelectedSeat({ ...selectedSeat, seat_number: parseInt(e.target.value) });
                  }}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={selectedSeat.type}
                  onChange={(e) => {
                    const floorKey = selectedSeat.deck === 1 ? 'floor1' : 'floor2';
                    updateSeat(floorKey, selectedSeat.id, { type: e.target.value });
                    setSelectedSeat({ ...selectedSeat, type: e.target.value });
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="normal">Normal</option>
                  <option value="semi_cama">Semi Cama</option>
                  <option value="cama">Cama</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={selectedSeat.status}
                  onChange={(e) => {
                    const floorKey = selectedSeat.deck === 1 ? 'floor1' : 'floor2';
                    updateSeat(floorKey, selectedSeat.id, { status: e.target.value });
                    setSelectedSeat({ ...selectedSeat, status: e.target.value });
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Reservado</option>
                  <option value="occupied">Ocupado</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSeat.is_active}
                    onChange={(e) => {
                      const floorKey = selectedSeat.deck === 1 ? 'floor1' : 'floor2';
                      updateSeat(floorKey, selectedSeat.id, { is_active: e.target.checked });
                      setSelectedSeat({ ...selectedSeat, is_active: e.target.checked });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Activo</span>
                </label>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500">
                <p>Posicion: Fila {selectedSeat.row}, Columna {selectedSeat.col}</p>
                <p>Piso: {selectedSeat.deck}</p>
              </div>

              <button
                onClick={() => {
                  const floorKey = selectedSeat.deck === 1 ? 'floor1' : 'floor2';
                  deleteSeat(floorKey, selectedSeat.id);
                  setSelectedSeat(null);
                }}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 mt-4"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Asiento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}