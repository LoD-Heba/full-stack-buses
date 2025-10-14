"use client"

import React, { useState, useEffect } from 'react';
import AsientoMapa from '../../../components/asientos/AsientoMapa';
import AsientoItem from '../../../components/asientos/AsientoItem';
import AsientoLegend from '../../../components/asientos/AsientoLegend';
import DeckSelector from '../../../components/asientos/DeckSelector';

// Simulación de datos (reemplazar con fetch real)
const mockBusLayout = {
  bus_id: "123e4567-e89b-12d3-a456-426614174000",
  plate: "ABC-1234",
  model: "Mercedes Benz O500",
  service_type: "cama",
  floors: 2,
  image_url: "https://via.placeholder.com/200x150",
  amenities: "WiFi, TV, Cargador USB, Aire Acondicionado",
  decks: [
    {
      deck: 1,
      stack_id: "stack-1",
      stack_name: "Piso 1",
      layout: [
        { id: "1", seat_code: "1A", seat_number: 1, type: "cama", position_x: 1, position_y: 1, visual_type: "seat", rotation: 0, deck: 1 },
        { id: "2", seat_code: "1B", seat_number: 2, type: "cama", position_x: 2, position_y: 1, visual_type: "seat", rotation: 0, deck: 1 },
        { seat_code: "Aisle", position_x: 3, position_y: 1, visual_type: "aisle", rotation: 0, deck: 1 },
        { id: "3", seat_code: "1C", seat_number: 3, type: "cama", position_x: 4, position_y: 1, visual_type: "seat", rotation: 0, deck: 1 },
        { id: "4", seat_code: "1D", seat_number: 4, type: "cama", position_x: 5, position_y: 1, visual_type: "seat", rotation: 0, deck: 1 },
        
        { id: "5", seat_code: "2A", seat_number: 5, type: "cama", position_x: 1, position_y: 2, visual_type: "seat", rotation: 0, deck: 1 },
        { id: "6", seat_code: "2B", seat_number: 6, type: "cama", position_x: 2, position_y: 2, visual_type: "seat", rotation: 0, deck: 1 },
        { seat_code: "Aisle", position_x: 3, position_y: 2, visual_type: "aisle", rotation: 0, deck: 1 },
        { id: "7", seat_code: "2C", seat_number: 7, type: "cama", position_x: 4, position_y: 2, visual_type: "seat", rotation: 0, deck: 1 },
        { id: "8", seat_code: "2D", seat_number: 8, type: "cama", position_x: 5, position_y: 2, visual_type: "seat", rotation: 0, deck: 1 },

        { id: "9", seat_code: "3A", seat_number: 9, type: "semi_cama", position_x: 1, position_y: 3, visual_type: "seat", rotation: 0, deck: 1 },
        { id: "10", seat_code: "3B", seat_number: 10, type: "semi_cama", position_x: 2, position_y: 3, visual_type: "seat", rotation: 0, deck: 1 },
        { seat_code: "Aisle", position_x: 3, position_y: 3, visual_type: "aisle", rotation: 0, deck: 1 },
        { seat_code: "TV1", position_x: 4, position_y: 3, visual_type: "tv", rotation: 0, deck: 1 },
        { id: "11", seat_code: "3D", seat_number: 11, type: "semi_cama", position_x: 5, position_y: 3, visual_type: "seat", rotation: 0, deck: 1 },

        { seat_code: "Bathroom", position_x: 1, position_y: 4, visual_type: "bathroom", rotation: 0, deck: 1 },
        { seat_code: "Bathroom", position_x: 2, position_y: 4, visual_type: "bathroom", rotation: 0, deck: 1 },
        { seat_code: "Aisle", position_x: 3, position_y: 4, visual_type: "aisle", rotation: 0, deck: 1 },
        { seat_code: "Door", position_x: 4, position_y: 4, visual_type: "door", rotation: 0, deck: 1 },
        { seat_code: "Door", position_x: 5, position_y: 4, visual_type: "door", rotation: 0, deck: 1 },
      ]
    },
    {
      deck: 2,
      stack_id: "stack-2",
      stack_name: "Piso 2",
      layout: [
        { id: "21", seat_code: "13A", seat_number: 21, type: "normal", position_x: 1, position_y: 10, visual_type: "seat", rotation: 0, deck: 2 },
        { id: "22", seat_code: "4B", seat_number: 22, type: "normal", position_x: 2, position_y: 1, visual_type: "seat", rotation: 0, deck: 2 },
        { seat_code: "Aisle", position_x: 3, position_y: 1, visual_type: "aisle", rotation: 0, deck: 2 },
        { id: "23", seat_code: "4C", seat_number: 23, type: "normal", position_x: 4, position_y: 1, visual_type: "seat", rotation: 0, deck: 2 },
        { id: "24", seat_code: "4D", seat_number: 24, type: "normal", position_x: 5, position_y: 1, visual_type: "seat", rotation: 0, deck: 2 },
        
        { id: "25", seat_code: "5A", seat_number: 25, type: "normal", position_x: 1, position_y: 2, visual_type: "seat", rotation: 0, deck: 2 },
        { id: "26", seat_code: "5B", seat_number: 26, type: "normal", position_x: 2, position_y: 2, visual_type: "seat", rotation: 0, deck: 2 },
        { seat_code: "Aisle", position_x: 3, position_y: 2, visual_type: "aisle", rotation: 0, deck: 2 },
        { id: "27", seat_code: "5C", seat_number: 27, type: "normal", position_x: 4, position_y: 2, visual_type: "seat", rotation: 0, deck: 2 },
        { id: "28", seat_code: "5D", seat_number: 28, type: "normal", position_x: 5, position_y: 2, visual_type: "seat", rotation: 0, deck: 2 },
      ]
    }
  ]
};

export default function BusLayoutPage() {
  const [busLayout, setBusLayout] = useState(mockBusLayout);
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // Asientos ocupados (simulación - obtener del backend)
  const occupiedSeats = ["1A", "2C", "4B"];

  // Función para cargar datos reales (descomentar cuando conectes con el backend)
  /*
  useEffect(() => {
    const fetchBusLayout = async () => {
      setLoading(true);
      try {
        const busId = "tu-bus-id-aqui"; // Obtener del router params
        const response = await fetch(`http://localhost:3001/api/v1/buses/${busId}/layout`);
        const data = await response.json();
        setBusLayout(data);
      } catch (error) {
        console.error('Error al cargar el layout:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusLayout();
  }, []);
  */

  const handleSeatSelection = (seats: string[]) => {
    setSelectedSeats(seats);
    console.log('Asientos seleccionados:', seats);
  };

  const handleReserve = () => {
    if (selectedSeats.length === 0) {
      alert('Por favor selecciona al menos un asiento');
      return;
    }
    
    alert(`Reservando asientos: ${selectedSeats.join(', ')}`);
    // Aquí iría la lógica para crear la reserva/ticket
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Selección de Asientos
          </h1>
          <p className="text-gray-600 mt-2">
            Selecciona tus asientos preferidos para el viaje
          </p>
        </div>

        <AsientoMapa
          busLayout={busLayout}
          occupiedSeats={occupiedSeats}
          onSeatSelect={handleSeatSelection}
          maxSelection={4}
        />

        {/* Botón de acción */}
        {selectedSeats.length > 0 && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Total: {selectedSeats.length} asiento{selectedSeats.length > 1 ? 's' : ''}
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
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Continuar con la reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}