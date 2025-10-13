"use client"

import { useState, useEffect } from 'react';
import { MapPin, Clock, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function CiudadesPage() {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    department: '',
    description: '',
    schedule: ['']
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const API_URL = 'http://localhost:3001/api/v1/city';

  useEffect(() => {
    fetchCiudades();
  }, []);

  const fetchCiudades = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setCiudades(data);
    } catch (error) {
      console.error('Error al cargar ciudades');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };
      const url = selectedCity ? `${API_URL}/${selectedCity.id}` : API_URL;
      const method = selectedCity ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      const savedCity = await res.json();

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        await fetch(`${API_URL}/${savedCity.id}/upload-image`, {
          method: 'POST',
          body: formData
        });
      }

      alert(selectedCity ? 'Ciudad actualizada' : 'Ciudad creada');
      setShowModal(false);
      resetForm();
      fetchCiudades();
    } catch (error) {
      alert('Error al guardar ciudad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta ciudad?')) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      alert('Ciudad eliminada');
      fetchCiudades();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const openModal = (city = null) => {
    if (city) {
      setSelectedCity(city);
      setFormData({
        city: city.city,
        department: city.department,
        description: city.description || '',
        schedule: city.schedule || ['']
      });
      setImagePreview(city.image_url ? `http://localhost:3001/api/v1/${city.image_url}` : '');
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedCity(null);
    setFormData({ city: '', department: '', description: '', schedule: [''] });
    setImageFile(null);
    setImagePreview('');
  };

  const addScheduleField = () => {
    setFormData(prev => ({ ...prev, schedule: [...prev.schedule, ''] }));
  };

  const updateSchedule = (index, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = value;
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  const removeSchedule = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Ciudades</h1>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            Nueva Ciudad
          </button>
        </div>

        {loading && <p className="text-center">Cargando...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ciudades.map((ciudad) => (
            <div key={ciudad.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
              <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                {ciudad.image_url ? (
                  <img
                    src={`http://localhost:3001${ciudad.image_url}`}
                    alt={ciudad.city}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <MapPin size={64} className="text-white opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => openModal(ciudad)}
                    className="bg-white p-2 rounded-full hover:bg-gray-100"
                  >
                    <Pencil size={16} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(ciudad.id)}
                    className="bg-white p-2 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{ciudad.city}</h3>
                <p className="text-sm text-gray-500 mb-3">{ciudad.department}</p>
                {ciudad.description && (
                  <p className="text-sm text-gray-600 mb-3">{ciudad.description}</p>
                )}
                
                {ciudad.schedule?.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedCity(ciudad);
                      setShowScheduleModal(true);
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Clock size={16} />
                    Ver Horarios
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedCity ? 'Editar Ciudad' : 'Nueva Ciudad'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Departamento</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 h-32 rounded-lg" />
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Horarios</label>
                    <button
                      type="button"
                      onClick={addScheduleField}
                      className="text-blue-600 text-sm hover:text-blue-700"
                    >
                      + Agregar
                    </button>
                  </div>
                  {formData.schedule.map((horario, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Ej: Lunes-Viernes: 6:00-22:00"
                        value={horario}
                        onChange={(e) => updateSchedule(index, e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2"
                      />
                      {formData.schedule.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && selectedCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Horarios - {selectedCity.city}</h2>
              <button onClick={() => setShowScheduleModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              {selectedCity.schedule?.map((horario, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock size={20} className="text-blue-600 mt-0.5" />
                  <span className="text-gray-700">{horario}</span>
                </div>
              ))}
              {(!selectedCity.schedule || selectedCity.schedule.length === 0) && (
                <p className="text-gray-500 text-center py-4">No hay horarios registrados</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}