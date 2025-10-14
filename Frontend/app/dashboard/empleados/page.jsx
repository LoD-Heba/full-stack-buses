import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/v1';

export default function ApiTestComponent() {
  const [newsData, setNewsData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testNewsAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/news`);
      const data = await res.json();
      setNewsData(data);
      console.log('News API Response:', data);
    } catch (err) {
      setError('Error al cargar noticias: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testUsersAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsersData(data);
      console.log('Users API Response:', data);
    } catch (err) {
      setError('Error al cargar usuarios: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testAll = () => {
    testNewsAPI();
    testUsersAPI();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Prueba de APIs - Debug
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={testNewsAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Probar /news
          </button>
          <button
            onClick={testUsersAPI}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Probar /users
          </button>
          <button
            onClick={testAll}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Probar Todo
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Noticias (GET /news)
            </h2>
            {newsData ? (
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Total:</strong> {Array.isArray(newsData) ? newsData.length : 'No es array'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Tipo:</strong> {typeof newsData}
                  </p>
                  {Array.isArray(newsData) && newsData.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Primera noticia:</p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(newsData[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    Ver respuesta completa
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-96">
                    {JSON.stringify(newsData, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Haz clic en el botón para probar
              </p>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Usuarios (GET /users)
            </h2>
            {usersData ? (
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Total:</strong>{' '}
                    {Array.isArray(usersData)
                      ? usersData.length
                      : usersData.data
                      ? usersData.data.length
                      : 'No es array'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Tipo:</strong> {typeof usersData}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Tiene .data?</strong> {usersData.data ? 'Sí' : 'No'}
                  </p>
                  {((Array.isArray(usersData) && usersData.length > 0) ||
                    (usersData.data && usersData.data.length > 0)) && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Primer usuario:
                      </p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(
                          Array.isArray(usersData) ? usersData[0] : usersData.data[0],
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    Ver respuesta completa
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-96">
                    {JSON.stringify(usersData, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Haz clic en el botón para probar
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            Instrucciones de Debug:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Haz clic en los botones para probar las APIs</li>
            <li>Verifica que el backend esté corriendo en el puerto 3001</li>
            <li>Revisa la consola del navegador para ver los datos</li>
            <li>
              Verifica que existan usuarios activos y que tengan el campo 'name'
            </li>
            <li>Asegúrate de que CORS esté habilitado en el backend</li>
          </ol>
        </div>
      </div>
    </div>
  );
}