'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, User, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function NoticiaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [noticia, setNoticia] = useState(null);
  const [todasNoticias, setTodasNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodasNoticias();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchNoticia();
    }
  }, [params.id]);

  const fetchTodasNoticias = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/news');
      const data = await res.json();
      setTodasNoticias(data);
    } catch (error) {
      console.error('Error al cargar lista de noticias:', error);
    }
  };

  const fetchNoticia = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/v1/news/${params.id}`);
      
      if (!res.ok) {
        throw new Error('Noticia no encontrada');
      }
      
      const data = await res.json();
      setNoticia(data);
    } catch (error) {
      console.error('Error al cargar la noticia:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && !noticia) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex gap-8">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </aside>
            
            {/* Content skeleton */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                  <div className="h-64 bg-gray-200 rounded mb-8"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Noticia no encontrada'}
            </h2>
            <p className="text-gray-600 mb-6">
              La noticia que buscas no existe o ha sido eliminada.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <ArrowLeft size={20} />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-fit">
        {/* Botón de regreso */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          Volver al inicio
        </Link>

        <div className="flex gap-8">
          {/* Sidebar con lista de noticias */}
          <aside className="hidden lg:block w-120 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">
                Todas las noticias
              </h2>
              
              <nav className="space-y-2">
                {todasNoticias.map((item) => (
                  <Link
                    key={item.id}
                    href={`/noticias/${item.id}`}
                    className={`block p-3 rounded-lg transition-all duration-200 group ${
                      item.id === params.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <h3 className={`font-semibold text-sm line-clamp-2 mb-1 ${
                      item.id === params.id ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatShortDate(item.created_at)}
                    </p>
                  </Link>
                ))}
              </nav>
              
              {todasNoticias.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay más noticias disponibles
                </p>
              )}
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Imagen destacada */}
              {noticia.image_url && (
                <div className="relative h-96 w-full">
                  <img
                    src={`http://localhost:3001${noticia.image_url}`}
                    alt={noticia.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              )}

              <div className="p-8 md:p-12">
                {/* Título */}
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                  {noticia.title}
                </h1>

                {/* Metadatos */}
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm font-medium">
                      {formatDate(noticia.created_at)}
                    </span>
                  </div>
                  
                  {noticia.user && (
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-gray-400" />
                      <span className="text-sm font-medium">
                        {noticia.user.name || noticia.user.email || noticia.user.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {noticia.content}
                  </p>
                </div>

                {/* Información adicional */}
                {noticia.updated_at && noticia.updated_at !== noticia.created_at && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Última actualización: {formatDate(noticia.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </article>

            {/* Navegación móvil - Lista desplegable */}
            <div className="lg:hidden mt-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-gray-900 mb-3">Otras noticias</h3>
              <div className="space-y-2">
                {todasNoticias.filter(item => item.id !== params.id).slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/noticias/${item.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatShortDate(item.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Botón de regreso inferior */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
              >
                <ArrowLeft size={20} />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}