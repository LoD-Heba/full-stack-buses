'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bus, DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Usuarios Totales',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
    
    },
    {
      title: 'Buses Activos',
      value: '45',
      change: '+3',
      trend: 'up',
      icon: Bus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Ventas Hoy',
      value: '156',
      change: '-8%',
      trend: 'down',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Ingresos del Mes',
      value: 'Bs. 234,500',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ];

  return (
    <ProtectedRoute requireRole="admin">
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel Principal</h1>
        <p className="text-gray-600">Bienvenido al panel de administración de Trans Sacaba</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className={`flex items-center text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  <span>{stat.change} vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rutas Más Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { ruta: 'Cochabamba - La Paz', ventas: 245, porcentaje: 85 },
                { ruta: 'Cochabamba - Santa Cruz', ventas: 198, porcentaje: 70 },
                { ruta: 'La Paz - Oruro', ventas: 156, porcentaje: 55 },
                { ruta: 'Cochabamba - Sucre', ventas: 123, porcentaje: 45 },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.ruta}</span>
                    <span className="text-gray-600">{item.ventas} ventas</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { accion: 'Nueva venta registrada', tiempo: 'Hace 5 minutos', tipo: 'venta' },
                { accion: 'Bus #45 reportó salida', tiempo: 'Hace 15 minutos', tipo: 'bus' },
                { accion: 'Nuevo usuario registrado', tiempo: 'Hace 32 minutos', tipo: 'usuario' },
                { accion: 'Pago confirmado #1234', tiempo: 'Hace 1 hora', tipo: 'pago' },
                { accion: 'Ruta actualizada', tiempo: 'Hace 2 horas', tipo: 'ruta' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.tipo === 'venta' ? 'bg-green-500' :
                    item.tipo === 'bus' ? 'bg-orange-500' :
                    item.tipo === 'usuario' ? 'bg-blue-500' :
                    item.tipo === 'pago' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.accion}</p>
                    <p className="text-xs text-gray-500">{item.tiempo}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
     </ProtectedRoute>
  );
}
