"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BusLayoutDesigner from "./components/bus-layout-designer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function BusSeatDesigner() {
  const router = useRouter();

  const [config, setConfig] = useState({
    columns: 4,
    rows: 10,
    hasSecondFloor: false,
    secondFloorRows: 8,
    busType: "normal",
    stackName: "", // Nuevo: nombre del stack
    stackDescription: "", // Nuevo: descripción del stack
    busId: "",
    isEditMode: false, // Nuevo: para diferenciar crear vs editar
    existingStackId: null, // Nuevo: ID del stack existente si estamos editando
  });

  const [seats, setSeats] = useState({
    floor1: [],
    floor2: [],
  });

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [mode, setMode] = useState("design");
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchBuses();

    // 🆕 Verificar si hay un busId en localStorage
    const savedBusId = localStorage.getItem("configureBusId");
    if (savedBusId) {
      // Pequeño delay para asegurar que los buses se cargaron
      setTimeout(() => {
        loadExistingConfig(savedBusId);
        localStorage.removeItem("configureBusId");
        showAlert(
          "✓ Bus cargado automáticamente. Configura los asientos.",
          "success"
        );
      }, 500);
    }
  }, []);

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "success" }),
      5000
    );
  };

  const fetchBuses = async () => {
    try {
      const res = await fetch(`${API_URL}/buses?limit=100`);
      const data = await res.json();
      setBuses(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error fetching buses:", error);
      showAlert("Error al cargar los buses", "error");
    }
  };

  // Obtener buses disponibles (sin stack asignado) o el bus actual (para edición)
  const getAvailableBuses = () => {
    return buses.filter((bus) => {
      // Si estamos en modo edición, incluir el bus actual
      if (config.isEditMode && bus.id === config.busId) {
        return true;
      }
      // Para crear nuevo, solo buses sin stack
      return !bus.stacks || !bus.stacks.id;
    });
  };

  // Cargar configuración existente cuando se selecciona un bus para editar
  const loadExistingConfig = async (busId) => {
    try {
      const res = await fetch(`${API_URL}/buses/${busId}`);
      const bus = await res.json();

      if (bus.stacks && bus.stacks.id) {
        // Bus tiene stack, cargar para editar
        setConfig((prev) => ({
          ...prev,
          busId,
          isEditMode: true,
          existingStackId: bus.stacks.id,
          stackName: bus.stacks.name || "",
          stackDescription: bus.stacks.description || "",
          busType: bus.service_type || "normal",
        }));

        // Cargar asientos existentes
        if (bus.stacks.seats && bus.stacks.seats.length > 0) {
          // Determinar el número de columnas basado en el patrón de asientos
          const estimatedColumns = 4; // Valor por defecto

          const floor1Seats = bus.stacks.seats
            .filter((s) => s.deck === 1 || !s.deck)
            .sort((a, b) => a.seat_number - b.seat_number) // Ordenar por número
            .map((s, idx) => {
              const effectiveCols = estimatedColumns - 1; // Restar pasillo
              return {
                id: `F1-${s.seat_number}`,
                seat_number: s.seat_number,
                seat_code: s.seat_code,
                row: Math.floor(idx / effectiveCols) + 1,
                col: (idx % effectiveCols) + 1,
                deck: 1,
                type: s.type,
                is_active: s.is_active,
                status: "available", // CORREGIDO: usar 'available' consistentemente
                existingId: s.id, // Guardar ID para actualización
              };
            });

          const floor2Seats = bus.stacks.seats
            .filter((s) => s.deck === 2)
            .sort((a, b) => a.seat_number - b.seat_number)
            .map((s, idx) => {
              const effectiveCols = estimatedColumns - 1;
              return {
                id: `F2-${s.seat_number}`,
                seat_number: s.seat_number,
                seat_code: s.seat_code,
                row: Math.floor(idx / effectiveCols) + 1,
                col: (idx % effectiveCols) + 1,
                deck: 2,
                type: s.type,
                is_active: s.is_active,
                status: "available", // CORREGIDO: usar 'available' consistentemente
                existingId: s.id,
              };
            });

          setSeats({ floor1: floor1Seats, floor2: floor2Seats });

          const effectiveCols = estimatedColumns - 1;
          setConfig((prev) => ({
            ...prev,
            rows: Math.max(Math.ceil(floor1Seats.length / effectiveCols), 1),
            hasSecondFloor: floor2Seats.length > 0,
            secondFloorRows: Math.max(
              Math.ceil(floor2Seats.length / effectiveCols),
              1
            ),
          }));

          showAlert("✓ Configuración cargada. Puedes editarla.", "success");
        }
      } else {
        // Bus sin stack, modo crear
        setConfig((prev) => ({
          ...prev,
          busId,
          isEditMode: false,
          existingStackId: null,
          stackName: "",
          stackDescription: "",
        }));
        setSeats({ floor1: [], floor2: [] });
        showAlert("Bus seleccionado. Configura los asientos.", "success");
      }
    } catch (error) {
      console.error("Error loading bus config:", error);
      showAlert("Error al cargar la configuración del bus", "error");
    }
  };

  const generateSeats = () => {
    const floor1Seats = [];
    const floor2Seats = [];

    // Generar piso 1
    for (let row = 1; row <= config.rows; row++) {
      let seatCount = 0;

      for (let col = 1; col <= config.columns; col++) {
        const middleCol = Math.ceil(config.columns / 2);

        // Pasillo en el medio
        if (config.columns >= 4 && col === middleCol) {
          floor1Seats.push({
            id: `F1-aisle-${row}`,
            row,
            col,
            position_x: col,
            position_y: row,
            deck: 1,
            visual_type: "aisle",
            is_active: true,
          });
          continue;
        }

        seatCount++;
        const seatNumber =
          floor1Seats.filter((s) => s.visual_type === "seat").length + 1;

        floor1Seats.push({
          id: `F1-${row}-${col}`,
          seat_number: seatNumber,
          seat_code: `S${seatNumber.toString().padStart(2, "0")}`,
          row,
          col,
          position_x: col,
          position_y: row,
          deck: 1,
          type: config.busType,
          visual_type: "seat",
          is_active: true,
          status: "available",
          rotation: 0,
          meta: {
            hasWindow: col === 1 || col === config.columns, // ventanas en los extremos
            hasTV: row === 1, // TV en primera fila
          },
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
            seat_code: `S${(seatNumber + floor1Seats.length)
              .toString()
              .padStart(2, "0")}`,
            row,
            col,
            deck: 2, // ASEGURAR que siempre tenga deck
            type: config.busType,
            is_active: true,
            status: "available",
          });
        }
      }
    }

    setSeats({ floor1: floor1Seats, floor2: floor2Seats });
    showAlert(
      `✓ ${floor1Seats.length + floor2Seats.length} asientos generados`,
      "success"
    );
  };

  const saveSeatsToBackend = async () => {
    // Validaciones
    if (!config.busId) {
      showAlert("Debes seleccionar un bus", "error");
      return;
    }

    if (!config.stackName.trim()) {
      showAlert(
        "Debes ingresar un nombre para la configuración de asientos",
        "error"
      );
      return;
    }

    if (seats.floor1.length === 0 && seats.floor2.length === 0) {
      showAlert("Debes generar los asientos primero", "error");
      return;
    }

    setLoading(true);
    try {
      let stackId = config.existingStackId;

      // Paso 1: Crear o actualizar el stack
      if (config.isEditMode && stackId) {
        // Actualizar stack existente
        const updatePayload = {
          name: config.stackName.trim(),
        };

        // Solo agregar description si tiene contenido
        if (config.stackDescription && config.stackDescription.trim()) {
          updatePayload.description = config.stackDescription.trim();
        }

        const stackRes = await fetch(`${API_URL}/seat-stacks/${stackId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!stackRes.ok) {
          const error = await stackRes.json();
          throw new Error(
            error.message || "Error al actualizar el stack de asientos"
          );
        }
      } else {
        // Crear nuevo stack
        const createPayload = {
          name: config.stackName.trim(),
        };

        // Solo agregar description si tiene contenido
        if (config.stackDescription && config.stackDescription.trim()) {
          createPayload.description = config.stackDescription.trim();
        }

        const stackRes = await fetch(`${API_URL}/seat-stacks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });

        if (!stackRes.ok) {
          const error = await stackRes.json();
          throw new Error(
            error.message || "Error al crear el stack de asientos"
          );
        }

        const stackData = await stackRes.json();
        stackId = stackData.id;

        // Asociar el stack al bus
        const busRes = await fetch(`${API_URL}/buses/${config.busId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stackId }),
        });

        if (!busRes.ok) {
          const error = await busRes.json();
          throw new Error(error.message || "Error al asociar el stack al bus");
        }
      }

      // Paso 2: Guardar todos los asientos
      // 🔥 FILTRAR SOLO LOS ASIENTOS REALES
      const allSeats = [...seats.floor1, ...seats.floor2].filter(
        (seat) => seat.visual_type === "seat" || !seat.visual_type
      );
      console.log("🔍 Primeros 3 asientos a guardar:", allSeats.slice(0, 3));
      console.log(
        "📦 Estructura del primer asiento:",
        JSON.stringify(allSeats[0], null, 2)
      );
      let savedCount = 0;
      let errorCount = 0;

      for (const seat of allSeats) {
        try {
          if (config.isEditMode && seat.existingId) {
            // Actualizar asiento existente
            const updateRes = await fetch(
              `${API_URL}/seat/${seat.existingId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  seat_code: seat.seat_code,
                  seat_number: seat.seat_number,
                  deck: seat.deck || 1,
                  type: seat.type,
                  is_active: seat.is_active,
                  // 🆕 Agregar campos de posición
                  position_x: seat.position_x || seat.col,
                  position_y: seat.position_y || seat.row,
                  visual_type: "seat", // Siempre 'seat' para asientos reales
                  rotation: seat.rotation || 0,
                  meta: seat.meta || {},
                }),
              }
            );

            if (!updateRes.ok) {
              const error = await updateRes.json();
              console.error(
                `Error al actualizar asiento ${seat.seat_number}:`,
                error
              );
              errorCount++;
            } else {
              savedCount++;
            }
          } else {
            // Crear nuevo asiento
            const createRes = await fetch(`${API_URL}/seat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                seat_code: seat.seat_code,
                seat_number: seat.seat_number,
                deck: seat.deck || 1,
                type: seat.type,
                stackId: stackId,
                is_active: seat.is_active,
                position_x: seat.position_x || seat.col,
                position_y: seat.position_y || seat.row,
                visual_type: "seat", // Siempre 'seat'
                rotation: seat.rotation || 0,
                meta: seat.meta || {},
              }),
            });

            if (!createRes.ok) {
              const error = await createRes.json();
              console.error(
                `Error al crear asiento ${seat.seat_number}:`,
                error.message
              );
              errorCount++;
            } else {
              savedCount++;
            }
          }
        } catch (seatError) {
          console.error(
            `Error procesando asiento ${seat.seat_number}:`,
            seatError
          );
          errorCount++;
        }
      }

      if (errorCount > 0) {
        showAlert(
          `⚠️ Guardado con advertencias: ${savedCount} asientos guardados, ${errorCount} con errores`,
          "error"
        );
      } else {
        showAlert(
          `✓ Configuración guardada exitosamente: ${savedCount} asientos ${
            config.isEditMode ? "actualizados" : "creados"
          }`,
          "success"
        );
      }

      // Recargar la configuración
      setTimeout(() => {
        loadExistingConfig(config.busId);
      }, 1500);
    } catch (error) {
      console.error("Error saving seats:", error);
      showAlert(error.message || "Error al guardar los asientos", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetConfiguration = () => {
    if (
      window.confirm(
        "¿Estás seguro de reiniciar la configuración? Se perderán los cambios no guardados."
      )
    ) {
      setConfig({
        columns: 4,
        rows: 10,
        hasSecondFloor: false,
        secondFloorRows: 8,
        busType: "normal",
        stackName: "",
        stackDescription: "",
        busId: "",
        isEditMode: false,
        existingStackId: null,
      });
      setSeats({ floor1: [], floor2: [] });
      setSelectedSeat(null);
    }
  };

  // ... (mantener funciones updateSeat, deleteSeat, getSeatColor, renderBusFloor sin cambios)

  const updateSeat = (floorKey, seatId, updates) => {
    setSeats((prev) => ({
      ...prev,
      [floorKey]: prev[floorKey].map((seat) =>
        seat.id === seatId ? { ...seat, ...updates } : seat
      ),
    }));
  };

  const deleteSeat = (floorKey, seatId) => {
    setSeats((prev) => ({
      ...prev,
      [floorKey]: prev[floorKey].filter((seat) => seat.id !== seatId),
    }));
  };

  const getSeatColor = (seat) => {
    if (!seat.is_active) return "bg-gray-300 cursor-not-allowed opacity-50";
    if (seat.status === "occupied") return "bg-red-500 text-white";
    if (seat.status === "reserved") return "bg-yellow-500 text-white";
    return "bg-green-500 text-white hover:bg-green-600";
  };

  const renderBusFloor = (floorSeats, floorNumber) => {
    const maxRow = Math.max(...floorSeats.map((s) => s.row), 0);
    const gridCols =
      config.columns === 5
        ? "grid-cols-5"
        : config.columns === 4
        ? "grid-cols-4"
        : "grid-cols-3";

    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🚌 Piso {floorNumber}
            <span className="text-sm text-gray-500">
              ({floorSeats.filter((s) => s.is_active).length} asientos activos)
            </span>
          </h3>
        </div>

        <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg mb-2 font-bold">
          ⬆️ FRENTE DEL BUS
        </div>

        <div className="bg-white p-4 rounded-lg border-4 border-gray-300 shadow-inner">
          {Array.from({ length: maxRow }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1;
            const rowSeats = floorSeats.filter((s) => s.row === rowNum);

            return (
              <div key={rowNum} className={`grid ${gridCols} gap-2 mb-2`}>
                {Array.from({ length: config.columns }).map((_, colIndex) => {
                  const colNum = colIndex + 1;
                  const middleCol = Math.ceil(config.columns / 2);

                  if (config.columns >= 4 && colNum === middleCol) {
                    return (
                      <div
                        key={`aisle-${rowNum}-${colNum}`}
                        className="flex items-center justify-center text-gray-400 text-xs font-bold"
                      >
                        | PASILLO |
                      </div>
                    );
                  }

                  const seat = rowSeats.find((s) => s.col === colNum);

                  if (!seat) {
                    return (
                      <div
                        key={`empty-${rowNum}-${colNum}`}
                        className="h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs"
                      >
                        vacío
                      </div>
                    );
                  }

                  return (
                    <button
                      key={seat.id}
                      onClick={() => mode === "design" && setSelectedSeat(seat)}
                      className={`h-14 ${getSeatColor(
                        seat
                      )} rounded-lg font-bold text-sm transition-all transform hover:scale-105 flex flex-col items-center justify-center shadow-md ${
                        selectedSeat?.id === seat.id
                          ? "ring-4 ring-orange-500"
                          : ""
                      }`}
                      disabled={mode === "preview"}
                    >
                      <span>{seat.seat_code}</span>
                      <span className="text-xs opacity-80">
                        #{seat.seat_number}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="bg-gray-600 text-white text-center py-2 rounded-b-lg mt-2 font-bold">
          ⬇️ PARTE TRASERA
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Configurador de Asientos</h1>
            <p className="text-gray-600 mt-1">
              {config.isEditMode
                ? "Editando configuración existente"
                : "Crear nueva configuración de asientos"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/buses")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Buses
          </Button>
        </div>

        {alert.show && (
          <Alert
            className={`mb-6 ${
              alert.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 ${
                alert.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            />
            <AlertDescription
              className={
                alert.type === "error" ? "text-red-800" : "text-green-800"
              }
            >
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>⚙️ Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selección de Bus */}
                <div>
                  <Label>Bus *</Label>
                  <Select
                    value={config.busId}
                    onValueChange={loadExistingConfig}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBuses().length === 0 ? (
                        <div className="p-2 text-center text-sm text-gray-500">
                          No hay buses disponibles
                        </div>
                      ) : (
                        getAvailableBuses().map((bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.plate} - {bus.model}
                            {bus.stacks?.id && " (Editar)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.isEditMode
                      ? "✏️ Editarás la configuración existente"
                      : "Buses sin configuración de asientos"}
                  </p>
                </div>

                {/* Nombre del Stack */}
                <div>
                  <Label>Nombre de la Configuración *</Label>
                  <Input
                    type="text"
                    value={config.stackName}
                    onChange={(e) =>
                      setConfig({ ...config, stackName: e.target.value })
                    }
                    placeholder="Ej: Bus Ejecutivo 40 asientos"
                    maxLength={100}
                  />
                </div>

                {/* Descripción */}
                <div>
                  <Label>Descripción (Opcional)</Label>
                  <Input
                    type="text"
                    value={config.stackDescription}
                    onChange={(e) =>
                      setConfig({ ...config, stackDescription: e.target.value })
                    }
                    placeholder="Descripción adicional"
                    maxLength={100}
                  />
                </div>

                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">
                    Diseño de Asientos
                  </Label>
                </div>

                {/* Tipo de Bus */}
                <div>
                  <Label>Tipo de Servicio</Label>
                  <Select
                    value={config.busType}
                    onValueChange={(value) =>
                      setConfig({ ...config, busType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="semi_cama">Semi Cama</SelectItem>
                      <SelectItem value="cama">Cama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Columnas */}
                <div>
                  <Label>Columnas: {config.columns}</Label>
                  <input
                    type="range"
                    min="3"
                    max="5"
                    value={config.columns}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        columns: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {config.columns === 5
                      ? "2-pasillo-3"
                      : config.columns === 4
                      ? "2-pasillo-2"
                      : "1-pasillo-2"}
                  </p>
                </div>

                {/* Filas Piso 1 */}
                <div>
                  <Label>Filas Piso 1: {config.rows}</Label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={config.rows}
                    onChange={(e) =>
                      setConfig({ ...config, rows: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                {/* Segundo Piso */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.hasSecondFloor}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hasSecondFloor: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      Habilitar Segundo Piso
                    </span>
                  </label>
                </div>

                {config.hasSecondFloor && (
                  <div>
                    <Label>Filas Piso 2: {config.secondFloorRows}</Label>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      value={config.secondFloorRows}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          secondFloorRows: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={generateSeats}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!config.busId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {seats.floor1.length > 0
                      ? "Regenerar Asientos"
                      : "Generar Asientos"}
                  </Button>

                  <Button
                    onClick={saveSeatsToBackend}
                    disabled={
                      loading ||
                      seats.floor1.length === 0 ||
                      !config.stackName.trim()
                    }
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading
                      ? "Guardando..."
                      : config.isEditMode
                      ? "Actualizar Configuración"
                      : "Guardar Configuración"}
                  </Button>

                  <Button
                    onClick={resetConfiguration}
                    variant="outline"
                    className="w-full"
                  >
                    Reiniciar
                  </Button>
                </div>

                {/* Resumen */}
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">📊 Resumen</h3>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>
                      Piso 1: {seats.floor1.filter((s) => s.is_active).length}{" "}
                      asientos
                    </p>
                    {config.hasSecondFloor && (
                      <p>
                        Piso 2: {seats.floor2.filter((s) => s.is_active).length}{" "}
                        asientos
                      </p>
                    )}
                    <p className="font-bold text-gray-800 text-base pt-2">
                      Total:{" "}
                      {seats.floor1.filter((s) => s.is_active).length +
                        seats.floor2.filter((s) => s.is_active).length}{" "}
                      asientos
                    </p>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2 text-sm">🎨 Leyenda</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded"></div>
                      <span>Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded opacity-50"></div>
                      <span>Inactivo</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista del Bus */}
          <div className="lg:col-span-2 space-y-6">
            {seats.floor1.length > 0 ? (
              <BusLayoutDesigner
                seats={[...seats.floor1, ...seats.floor2]}
                onSeatClick={mode === "design" ? setSelectedSeat : null}
                mode={mode}
                selectedSeats={selectedSeat ? [selectedSeat] : []}
                gridWidth={config.columns}
                gridHeight={Math.max(config.rows, config.secondFloorRows)}
                showControls={mode === "design"}
              />
            ) : (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🚌</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Configura y genera los asientos
                </h3>
                <p className="text-gray-500">
                  1. Selecciona un bus
                  <br />
                  2. Ingresa un nombre
                  <br />
                  3. Ajusta las opciones
                  <br />
                  4. Presiona "Generar Asientos"
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Panel de Edición de Asiento */}
        {selectedSeat && mode === "design" && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl p-6 w-80 border-2 border-orange-500 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">✏️ Editar Asiento</h3>
              <button
                onClick={() => setSelectedSeat(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Código</Label>
                <Input
                  type="text"
                  value={selectedSeat.seat_code}
                  onChange={(e) => {
                    const floorKey =
                      selectedSeat.deck === 1 ? "floor1" : "floor2";
                    updateSeat(floorKey, selectedSeat.id, {
                      seat_code: e.target.value,
                    });
                    setSelectedSeat({
                      ...selectedSeat,
                      seat_code: e.target.value,
                    });
                  }}
                />
              </div>

              <div>
                <Label>Número</Label>
                <Input
                  type="number"
                  value={selectedSeat.seat_number}
                  onChange={(e) => {
                    const floorKey =
                      selectedSeat.deck === 1 ? "floor1" : "floor2";
                    updateSeat(floorKey, selectedSeat.id, {
                      seat_number: parseInt(e.target.value),
                    });
                    setSelectedSeat({
                      ...selectedSeat,
                      seat_number: parseInt(e.target.value),
                    });
                  }}
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={selectedSeat.type}
                  onValueChange={(value) => {
                    const floorKey =
                      selectedSeat.deck === 1 ? "floor1" : "floor2";
                    updateSeat(floorKey, selectedSeat.id, { type: value });
                    setSelectedSeat({ ...selectedSeat, type: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="semi_cama">Semi Cama</SelectItem>
                    <SelectItem value="cama">Cama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSeat.is_active}
                    onChange={(e) => {
                      const floorKey =
                        selectedSeat.deck === 1 ? "floor1" : "floor2";
                      updateSeat(floorKey, selectedSeat.id, {
                        is_active: e.target.checked,
                      });
                      setSelectedSeat({
                        ...selectedSeat,
                        is_active: e.target.checked,
                      });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Asiento Activo</span>
                </label>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500">
                <p>
                  📍 Posición: Fila {selectedSeat.row}, Columna{" "}
                  {selectedSeat.col}
                </p>
                <p>🏢 Piso: {selectedSeat.deck}</p>
              </div>

              <Button
                onClick={() => {
                  const floorKey =
                    selectedSeat.deck === 1 ? "floor1" : "floor2";
                  deleteSeat(floorKey, selectedSeat.id);
                  setSelectedSeat(null);
                }}
                variant="destructive"
                className="w-full mt-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Asiento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
