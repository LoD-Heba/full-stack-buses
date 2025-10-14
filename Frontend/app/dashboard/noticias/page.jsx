"use client"
import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, ImageIcon } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/v1';

export default function DashboardNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    userIds: '',
    image: null
  });

  useEffect(() => {
    fetchNoticias();
    fetchUsuarios();
  }, []);

  const fetchNoticias = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/news`);
      const data = await res.json();
      setNoticias(data);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
      alert('Error al cargar noticias');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      
      // Verificar si es un array o viene dentro de 'data'
      const usuarios = Array.isArray(data) ? data : (data.data || []);
      setUsuarios(usuarios.filter(u => u.isActive));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('userIds', formData.userIds);
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const url = editingId 
        ? `${API_URL}/news/${editingId}`
        : `${API_URL}/news`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (res.ok) {
        alert(editingId ? 'Noticia actualizada' : 'Noticia creada');
        handleCloseModal();
        fetchNoticias();
      } else {
        const error = await res.json();
        alert('Error: ' + (error.message || 'Error al guardar'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la noticia');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;

    try {
      const res = await fetch(`${API_URL}/news/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Noticia eliminada');
        fetchNoticias();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar');
    }
  };

  const handleEdit = (noticia) => {
    setEditingId(noticia.id);
    setFormData({
      title: noticia.title,
      content: noticia.content,
      userIds: noticia.user?.id || '',
      image: null
    });
    setImagePreview(noticia.image_url ? `http://localhost:3001${noticia.image_url}` : null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImagePreview(null);
    setFormData({
      title: '',
      content: '',
      userIds: '',
      image: null
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Noticias</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Nueva Noticia
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando noticias...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {noticias.map((noticia) => (
                <tr key={noticia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {noticia.image_url ? (
                      <img
                        src={`http://localhost:3001${noticia.image_url}`}
                        alt={noticia.title}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{noticia.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2">{noticia.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{noticia.user?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(noticia.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(noticia)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(noticia.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {noticias.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay noticias registradas</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingId ? 'Editar Noticia' : 'Nueva Noticia'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Título de la noticia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Contenido de la noticia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor *
                </label>
                <select
                  required
                  value={formData.userIds}
                  onChange={(e) => setFormData({ ...formData, userIds: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seleccionar autor</option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded-lg mx-auto"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}