'use client';

import { useState, useEffect } from 'react';
import { Calendar, User } from 'lucide-react';

export default function NoticiasSection() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNoticias();
  }, []);

  const fetchNoticias = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/news');
      const data = await res.json();
      setNoticias(data.slice(0, 4));
    } catch (error) {
      console.error('Error al cargar noticias:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Noticias Recientes
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando noticias...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Noticias Recientes
        </h2>
        
        {noticias.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay noticias disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {noticias.map((noticia) => (
              <div
                key={noticia.id}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gradient-to-br from-orange-400 to-orange-600 relative">
                  {noticia.image_url ? (
                    <img
                      src={`http://localhost:3001${noticia.image_url}`}
                      alt={noticia.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[56px]">
                    {noticia.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar size={14} />
                    <span>{formatDate(noticia.created_at)}</span>
                  </div>

                  {noticia.user && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <User size={14} />
                      <span>{noticia.user.name || noticia.user.email || noticia.user.phone}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 line-clamp-3 min-h-[60px]">
                    {truncateText(noticia.content, 120)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}