'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { citiesAPI } from '../api/cities.api';
import { toast } from 'sonner';


export default function RouteForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    approx_duration: '',
    distance_km: '',
    description: '',
    base_price: '',
    originCityId: '',
    destinationCityId: '',
  });

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        approx_duration: initialData.approx_duration || '',
        distance_km: initialData.distance_km || '',
        description: initialData.description || '',
        base_price: initialData.base_price || '',
        originCityId: initialData.originCity?.id || '',
        destinationCityId: initialData.destinationCity?.id || '',
      });
    }
  }, [initialData]);

  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      console.log('Ciudades cargadas:', response); // Debug
      // El backend devuelve un array directo, no un objeto con data
      setCities(Array.isArray(response) ? response : []);
      if (!Array.isArray(response) || response.length === 0) {
        toast.warning('No hay ciudades disponibles');
      }
    } catch (error) {
      toast.error('Error al cargar ciudades');
      console.error('Error cargando ciudades:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.originCityId || !formData.destinationCityId) {
      toast.error('Debe seleccionar origen y destino');
      return;
    }

    if (formData.originCityId === formData.destinationCityId) {
      toast.error('El origen y destino deben ser diferentes');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para envío
      const submitData = {
        originCityId: formData.originCityId,
        destinationCityId: formData.destinationCityId,
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.name) submitData.name = formData.name;
      if (formData.approx_duration) submitData.approx_duration = formData.approx_duration;
      if (formData.distance_km) submitData.distance_km = parseFloat(formData.distance_km);
      if (formData.description) submitData.description = formData.description;
      if (formData.base_price) submitData.base_price = parseFloat(formData.base_price);

      await onSubmit(submitData);
    } catch (error) {
      toast.error(error.message || 'Error al guardar ruta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Editar Ruta' : 'Nueva Ruta'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Ciudad de Origen */}
            <div>
              <Label htmlFor="originCityId">Ciudad de Origen *</Label>
              <select
                id="originCityId"
                name="originCityId"
                value={formData.originCityId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccione origen</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.city} - {city.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Ciudad de Destino */}
            <div>
              <Label htmlFor="destinationCityId">Ciudad de Destino *</Label>
              <select
                id="destinationCityId"
                name="destinationCityId"
                value={formData.destinationCityId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccione destino</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.city} - {city.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="name">Nombre de la Ruta</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Santa Cruz - Cochabamba Express (opcional)"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si no especifica, se generará automáticamente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duración */}
            <div>
              <Label htmlFor="approx_duration">Duración Aproximada</Label>
              <Input
                id="approx_duration"
                name="approx_duration"
                value={formData.approx_duration}
                onChange={handleChange}
                placeholder="HH:MM:SS (ej: 04:30:00)"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
              />
            </div>

            {/* Distancia */}
            <div>
              <Label htmlFor="distance_km">Distancia (km)</Label>
              <Input
                id="distance_km"
                name="distance_km"
                type="number"
                step="0.01"
                min="0"
                value={formData.distance_km}
                onChange={handleChange}
                placeholder="365.50"
              />
            </div>
          </div>

          {/* Precio Base */}
          <div>
            <Label htmlFor="base_price">Precio Base (Bs.)</Label>
            <Input
              id="base_price"
              name="base_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={handleChange}
              placeholder="45.00"
            />
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción de la ruta..."
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}