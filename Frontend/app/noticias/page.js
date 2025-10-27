'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
      <section className="py-16 bg-gray-50" style={{
          backgroundImage: `url('/img/img7.jpg')`,
          backgroundPosition: "center, top right, bottom left",
          backgroundRepeat: "repeat",
        }}>
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
    <section className="py-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <h2 className="text-4xl font-extrabold text-center text-white mb-16 tracking-tight">
          Noticias Recientes
        </h2>
        
        {noticias.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-lg text-gray-500 font-medium">No hay noticias disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {noticias.map((noticia) => (
              <div
                key={noticia.id}
                className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100"
              >
                <div className="relative h-48">
                  {noticia.image_url ? (
                    <img
                      src={`http://localhost:3001${noticia.image_url}`}
                      alt={noticia.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <svg
                        className="w-20 h-20 text-gray-400 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[56px] leading-tight">
                    {noticia.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{formatDate(noticia.created_at)}</span>
                    </div>
                    {noticia.user && (
                      <div className="flex items-center gap-1">
                        <User size={16} className="text-gray-400" />
                        <span>{noticia.user.name || noticia.user.email || noticia.user.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 min-h-[72px] mb-4">
                    {truncateText(noticia.content, 120)}
                  </p>
                  
                  <Link 
                    href={`/noticias/${noticia.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors duration-200 group"
                  >
                    Leer más
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}