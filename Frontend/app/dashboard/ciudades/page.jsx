"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Upload, Loader2, AlertCircle, Check, Edit2, Trash2, Plus, X, RotateCcw, Eye, EyeOff, Zap } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/v1';

export default function CiudadesPage() {
  const [ciudades, setCiudades] = useState([]);
  const [inactivas, setInactivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    department: '',
    description: '',
    schedule: '',
  });
  const [selectedCityRoutes, setSelectedCityRoutes] = useState(null);

  useEffect(() => {
    fetchCiudades();
  }, []);

  const fetchCiudades = async () => {
    try {
      setLoading(true);
      const [activeRes, inactiveRes] = await Promise.all([
        fetch(`${API_URL}/city`),
        fetch(`${API_URL}/city/list/inactive`),
      ]);

      if (!activeRes.ok) throw new Error('Error al cargar ciudades');
      if (!inactiveRes.ok) throw new Error('Error al cargar ciudades inactivas');

      const activeData = await activeRes.json();
      const inactiveData = await inactiveRes.json();

      setCiudades(activeData);
      setInactivas(inactiveData);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('❌ Error al cargar ciudades');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.city || !formData.department) {
      setSuccessMessage('❌ Completa los campos requeridos');
      return;
    }

    try {
      const scheduleArray = formData.schedule
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const payload = {
        city: formData.city,
        department: formData.department,
        description: formData.description || undefined,
        schedule: scheduleArray.length > 0 ? scheduleArray : undefined,
      };

      const url = editingId ? `${API_URL}/city/${editingId}` : `${API_URL}/city`;
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al guardar');

      setSuccessMessage(editingId ? '✅ Ciudad actualizada' : '✅ Ciudad creada');
      setShowForm(false);
      setEditingId(null);
      setFormData({ city: '', department: '', description: '', schedule: '' });
      fetchCiudades();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('❌ Error al guardar la ciudad');
    }
  };

  const handleEdit = (ciudad) => {
    setEditingId(ciudad.id);
    setFormData({
      city: ciudad.city,
      department: ciudad.department,
      description: ciudad.description || '',
      schedule: ciudad.schedule ? ciudad.schedule.join(', ') : '',
    });
    setShowForm(true);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta ciudad? Se marcará como inactiva pero podrá recuperarse.')) return;

    try {
      const response = await fetch(`${API_URL}/city/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al desactivar');
      }
      setSuccessMessage('✅ Ciudad desactivada');
      fetchCiudades();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage(`❌ ${error.message}`);
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('⚠️ Esto eliminará la ciudad PERMANENTEMENTE. ¿Estás seguro?')) return;

    try {
      const response = await fetch(`${API_URL}/city/${id}/hard`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar');
      }
      setSuccessMessage('✅ Ciudad eliminada permanentemente');
      fetchCiudades();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage(`❌ ${error.message}`);
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm('¿Reactivar esta ciudad?')) return;

    try {
      const response = await fetch(`${API_URL}/city/${id}/reactivate`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Error al reactivar');
      setSuccessMessage('✅ Ciudad reactivada');
      fetchCiudades();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('❌ Error al reactivar');
    }
  };

  const handleCheckRoutes = async (id) => {
    try {
      const response = await fetch(`${API_URL}/city/${id}/routes`);
      if (!response.ok) throw new Error('Error al obtener rutas');
      const data = await response.json();
      setSelectedCityRoutes(data);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('❌ Error al obtener rutas asociadas');
    }
  };

  const handleUploadImage = async (e, cityId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(cityId);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await fetch(`${API_URL}/city/${cityId}/upload-image`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Error al subir imagen');
      const updatedCity = await response.json();
      setCiudades(ciudades.map(c => c.id === cityId ? updatedCity : c));
      setSuccessMessage('✅ Imagen subida exitosamente');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('❌ Error al subir la imagen');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando ciudades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-10 h-10 text-indigo-600" />
              <h1 className="text-5xl font-bold text-gray-900">Ciudades</h1>
            </div>
            <p className="text-lg text-gray-600 ml-13">Gestiona las ciudades de servicio</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              {showInactive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {showInactive ? 'Ocultar Inactivas' : 'Ver Inactivas'}
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ city: '', department: '', description: '', schedule: '' });
                setShowForm(!showForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Ciudad
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-2 ${
            successMessage.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Modal de Rutas Asociadas */}
        {selectedCityRoutes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-96 overflow-auto">
              <CardHeader className="flex items-center justify-between flex-row bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle>Rutas Asociadas a {selectedCityRoutes.city.city}</CardTitle>
                <button onClick={() => setSelectedCityRoutes(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {selectedCityRoutes.totalRoutes === 0 ? (
                  <p className="text-gray-600">No hay rutas asociadas</p>
                ) : (
                  <>
                    {selectedCityRoutes.originRoutes.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-indigo-600">Como Origen:</h3>
                        {selectedCityRoutes.originRoutes.map(route => (
                          <div key={route.id} className="p-2 bg-blue-50 rounded mb-2">
                            {selectedCityRoutes.city.city} → {route.destinationCity.city}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedCityRoutes.destinationRoutes.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-indigo-600">Como Destino:</h3>
                        {selectedCityRoutes.destinationRoutes.map(route => (
                          <div key={route.id} className="p-2 bg-blue-50 rounded mb-2">
                            {route.originCity.city} → {selectedCityRoutes.city.city}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <Card className="mb-8 border-2 border-indigo-300 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {editingId ? 'Editar Ciudad' : 'Nueva Ciudad'}
                </CardTitle>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Ciudad *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: La Paz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: La Paz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Descripción de la ciudad"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios (separados por coma)
                  </label>
                  <input
                    type="text"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: 08:00, 14:00, 20:00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ciudades Activas */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-600" />
            Ciudades Activas ({ciudades.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ciudades.map((ciudad) => (
              <Card key={ciudad.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
                {/* Imagen */}
                <div className="relative bg-gradient-to-br from-indigo-100 to-blue-100 h-48 overflow-hidden group">
                  {ciudad.image_url ? (
                    <img
                      src={`http://localhost:3001${ciudad.image_url}`}
                      alt={ciudad.city}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="w-16 h-16 text-indigo-300" />
                    </div>
                  )}

                  <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 group-hover:bg-black/40 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-white" />
                      <span className="text-white text-sm font-medium">Cambiar imagen</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, ciudad.id)}
                      disabled={uploading === ciudad.id}
                      className="hidden"
                    />
                  </label>

                  {uploading === ciudad.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl text-gray-900">
                    <MapPin className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    {ciudad.city}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Departamento</span>
                    <span className="font-semibold text-gray-900 bg-indigo-50 px-3 py-1 rounded-full">
                      {ciudad.department}
                    </span>
                  </div>

                  {ciudad.description && (
                    <div className="pb-4 border-b border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {ciudad.description}
                      </p>
                    </div>
                  )}

                  {ciudad.schedule && ciudad.schedule.length > 0 && (
                    <div className="pb-4 border-b border-gray-100">
                      <p className="text-gray-600 font-medium text-sm mb-2">Horarios</p>
                      <div className="flex flex-wrap gap-2">
                        {ciudad.schedule.map((time, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleCheckRoutes(ciudad.id)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      🔗 Rutas
                    </button>
                    <button
                      onClick={() => handleEdit(ciudad)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSoftDelete(ciudad.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {ciudades.length === 0 && !showForm && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-6">No hay ciudades registradas</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Primera Ciudad
              </button>
            </div>
          )}
        </div>

        {/* Ciudades Inactivas */}
        {showInactive && inactivas.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <EyeOff className="w-6 h-6 text-gray-600" />
              Ciudades Inactivas ({inactivas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {inactivas.map((ciudad) => (
                <Card key={ciudad.id} className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity bg-gray-50 border-2 border-gray-300">
                  {/* Imagen */}
                  <div className="relative bg-gray-200 h-48 overflow-hidden">
                    {ciudad.image_url ? (
                      <img
                        src={`http://localhost:3001${ciudad.image_url}`}
                        alt={ciudad.city}
                        className="w-full h-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Upload className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-white font-bold text-lg">INACTIVA</span>
                    </div>
                  </div>

                  <CardHeader className="bg-gray-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-2xl text-gray-700">
                      <MapPin className="w-6 h-6 text-gray-500 flex-shrink-0" />
                      {ciudad.city}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Departamento</span>
                      <span className="font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
                        {ciudad.department}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => handleReactivate(ciudad.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reactivar
                      </button>
                      <button
                        onClick={() => handleHardDelete(ciudad.id)}
                        className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}