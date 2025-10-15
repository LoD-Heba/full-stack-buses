import React, { useState, useEffect } from 'react';
import { FaTrash, FaSave } from 'react-icons/fa';

interface SeatPropertiesProps {
  selectedCell: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onClose: () => void;
  existingCodes: string[];
  existingNumbers: number[];
}

export default function SeatProperties({
  selectedCell,
  onUpdate,
  onDelete,
  onClose,
  existingCodes,
  existingNumbers,
}: SeatPropertiesProps) {
  const [formData, setFormData] = useState({
    seat_code: '',
    seat_number: '',
    type: 'normal',
    visual_type: 'seat',
    rotation: 0,
    position_x: 0,
    position_y: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedCell) {
      setFormData({
        seat_code: selectedCell.seat_code || '',
        seat_number: selectedCell.seat_number || '',
        type: selectedCell.type || 'normal',
        visual_type: selectedCell.visual_type || 'seat',
        rotation: selectedCell.rotation || 0,
        position_x: selectedCell.position_x,
        position_y: selectedCell.position_y,
      });
      setErrors({});
    }
  }, [selectedCell]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.visual_type === 'seat') {
      // Validar código de asiento
      if (!formData.seat_code || formData.seat_code.trim() === '') {
        newErrors.seat_code = 'El código es obligatorio';
      } else if (formData.seat_code.length > 10) {
        newErrors.seat_code = 'Máximo 10 caracteres';
      } else if (!/^[A-Z0-9]+$/i.test(formData.seat_code)) {
        newErrors.seat_code = 'Solo letras y números';
      } else {
        // Verificar si ya existe (excluyendo el actual)
        const isDuplicate = existingCodes.some(
          code => code.toUpperCase() === formData.seat_code.toUpperCase() &&
          code.toUpperCase() !== selectedCell?.seat_code?.toUpperCase()
        );
        if (isDuplicate) {
          newErrors.seat_code = 'Este código ya existe';
        }
      }

      // Validar número de asiento
      const seatNum = Number(formData.seat_number);
      if (!formData.seat_number || isNaN(seatNum)) {
        newErrors.seat_number = 'El número es obligatorio';
      } else if (seatNum < 1 || seatNum > 100) {
        newErrors.seat_number = 'Entre 1 y 100';
      } else {
        const isDuplicate = existingNumbers.some(
          num => num === seatNum && num !== selectedCell?.seat_number
        );
        if (isDuplicate) {
          newErrors.seat_number = 'Este número ya existe';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const updates = {
      ...formData,
      seat_code: formData.seat_code.toUpperCase().trim(),
      seat_number: formData.visual_type === 'seat' ? Number(formData.seat_number) : undefined,
    };

    onUpdate(updates);
  };

  if (!selectedCell) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        <p className="text-sm">Selecciona un elemento del grid para editar sus propiedades</p>
      </div>
    );
  }

  const isSeat = formData.visual_type === 'seat';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-bold text-lg text-gray-800">
          {isSeat ? 'Propiedades del Asiento' : 'Propiedades del Elemento'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Posición (solo informativa) */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Posición:</strong> Columna {formData.position_x}, Fila {formData.position_y}
          </p>
        </div>

        {/* Tipo visual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <input
            type="text"
            value={formData.visual_type}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
          />
        </div>

        {isSeat && (
          <>
            {/* Código de asiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.seat_code}
                onChange={(e) => handleChange('seat_code', e.target.value)}
                placeholder="Ej: 1A"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.seat_code ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.seat_code && (
                <p className="text-red-500 text-xs mt-1">{errors.seat_code}</p>
              )}
            </div>

            {/* Número de asiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.seat_number}
                onChange={(e) => handleChange('seat_number', e.target.value)}
                min={1}
                max={100}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.seat_number ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.seat_number && (
                <p className="text-red-500 text-xs mt-1">{errors.seat_number}</p>
              )}
            </div>

            {/* Tipo de asiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="semi_cama">Semi Cama</option>
                <option value="cama">Cama</option>
              </select>
            </div>
          </>
        )}

        {/* Rotación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rotación: {formData.rotation}°
          </label>
          <input
            type="range"
            min={0}
            max={360}
            step={45}
            value={formData.rotation}
            onChange={(e) => handleChange('rotation', Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
            <span>270°</span>
            <span>360°</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaSave />
          Guardar
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}