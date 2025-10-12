// Frontend/src/components/routes/RouteDetails.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Clock, TrendingUp, DollarSign, Bus, Calendar } from 'lucide-react';

export default function RouteDetails({ route, onClose }) {
  if (!route) return null;

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return duration;
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `${parseFloat(price).toFixed(2)} Bs.`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Detalles de la Ruta</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Principal */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">{route.name}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Origen</p>
                  <p className="font-medium">
                    {route.originCity?.city}, {route.originCity?.department}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-medium">
                    {route.destinationCity?.city}, {route.destinationCity?.department}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de Viaje */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500">Duración</p>
              </div>
              <p className="font-semibold">{formatDuration(route.approx_duration)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500">Distancia</p>
              </div>
              <p className="font-semibold">
                {route.distance_km ? `${route.distance_km} km` : 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500">Precio Base</p>
              </div>
              <p className="font-semibold">{formatPrice(route.base_price)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bus className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500">Buses</p>
              </div>
              <p className="font-semibold">{route.buses?.length || 0}</p>
            </div>
          </div>

          {/* Descripción */}
          {route.description && (
            <div>
              <h4 className="font-semibold mb-2">Descripción</h4>
              <p className="text-gray-600">{route.description}</p>
            </div>
          )}

          {/* Estado */}
          <div>
            <h4 className="font-semibold mb-2">Estado</h4>
            <Badge className={route.is_active ? 'bg-green-500' : 'bg-red-500'}>
              {route.is_active ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>

          {/* Buses Asignados */}
          {route.buses && route.buses.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Buses Asignados</h4>
              <div className="space-y-2">
                {route.buses.map((bus) => (
                  <div key={bus.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {bus.image_url && (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL}${bus.image_url}`} 
                          alt={bus.plate}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{bus.plate}</p>
                        <p className="text-sm text-gray-500">
                          {bus.model} • {bus.year} • {bus.capacity} asientos
                        </p>
                        <p className="text-xs text-gray-400">
                          {bus.user?.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {bus.service_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viajes */}
          {route.trips && route.trips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Viajes Programados</h4>
              <div className="space-y-2">
                {route.trips.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(trip.departure_time).toLocaleString('es-BO')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {trip.available_seats} asientos disponibles
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        trip.status === 'SCHEDULED' ? 'bg-blue-500' :
                        trip.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                        trip.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-500'
                      }
                    >
                      {trip.status}
                    </Badge>
                  </div>
                ))}
                {route.trips.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Y {route.trips.length - 5} viajes más...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Información Adicional */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Fecha de Creación</p>
              <p className="font-medium">
                {new Date(route.created_at).toLocaleDateString('es-BO')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Última Actualización</p>
              <p className="font-medium">
                {new Date(route.updated_at).toLocaleDateString('es-BO')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}