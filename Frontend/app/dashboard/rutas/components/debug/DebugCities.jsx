// Frontend/src/components/debug/DebugCities.jsx
'use client';

import { useState, useEffect } from 'react';
import { citiesAPI } from '@/src/services/api/cities.api';
import { Button } from '@/components/ui/button';

export default function DebugCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('Probando conexión a:', `${API_URL}/city`);
      
      const res = await fetch(`${API_URL}/city`);
      console.log('Status:', res.status);
      console.log('Headers:', res.headers);
      
      const data = await res.json();
      console.log('Respuesta completa:', data);
      
      setResponse(data);
      setCities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error completo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 Debug - Conexión con API de Ciudades</h2>
      
      <div className="space-y-4">
        {/* Configuración */}
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">📋 Configuración</h3>
          <p className="text-sm">
            <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
          </p>
          <p className="text-sm">
            <strong>Endpoint:</strong> /city
          </p>
        </div>

        {/* Estado */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">📊 Estado</h3>
          <p className="text-sm">
            <strong>Loading:</strong> {loading ? '✅ Sí' : '❌ No'}
          </p>
          <p className="text-sm">
            <strong>Error:</strong> {error || '❌ Ninguno'}
          </p>
          <p className="text-sm">
            <strong>Ciudades cargadas:</strong> {cities.length}
          </p>
        </div>

        {/* Respuesta Raw */}
        {response && (
          <div className="bg-yellow-50 p-4 rounded">
            <h3 className="font-semibold mb-2">📦 Respuesta Raw</h3>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* Ciudades */}
        {cities.length > 0 && (
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold mb-2">🏙️ Ciudades Encontradas ({cities.length})</h3>
            <div className="space-y-2 max-h-60 overflow-auto">
              {cities.map((city, idx) => (
                <div key={idx} className="bg-white p-2 rounded text-sm">
                  <p><strong>ID:</strong> {city.id}</p>
                  <p><strong>Ciudad:</strong> {city.city}</p>
                  <p><strong>Departamento:</strong> {city.department}</p>
                  <p><strong>Activa:</strong> {city.is_active ? '✅' : '❌'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 p-4 rounded">
            <h3 className="font-semibold mb-2 text-red-700">❌ Error</h3>
            <p className="text-sm text-red-600">{error}</p>
            <div className="mt-2 text-xs">
              <p className="font-semibold">Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Backend no está corriendo</li>
                <li>URL incorrecta en .env.local</li>
                <li>CORS no configurado</li>
                <li>Endpoint incorrecto</li>
              </ul>
            </div>
          </div>
        )}

        {/* Botón de recarga */}
        <Button 
          onClick={testConnection}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {loading ? 'Probando conexión...' : '🔄 Probar nuevamente'}
        </Button>

        {/* Instrucciones */}
        <div className="bg-purple-50 p-4 rounded text-sm">
          <h3 className="font-semibold mb-2">💡 Checklist</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Verifica que el backend esté corriendo (puerto 3001)</li>
            <li>Verifica el archivo .env.local existe con NEXT_PUBLIC_API_URL</li>
            <li>Reinicia el servidor de Next.js después de cambiar .env</li>
            <li>Verifica CORS en el backend (NestJS)</li>
            <li>Prueba el endpoint directo: http://localhost:3001/city</li>
          </ol>
        </div>
      </div>
    </div>
  );
}