'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bus, MapPin } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { mes: 'Ene', viajes: 380 },
  { mes: 'Feb', viajes: 420 },
  { mes: 'Mar', viajes: 460 },
  { mes: 'Abr', viajes: 520 },
  { mes: 'May', viajes: 610 },
  { mes: 'Jun', viajes: 580 },
  { mes: 'Jul', viajes: 640 },
  { mes: 'Ago', viajes: 710 },
  { mes: 'Sep', viajes: 690 },
  { mes: 'Oct', viajes: 720 },
  { mes: 'Nov', viajes: 750 },
  { mes: 'Dic', viajes: 800 },
];

export default function DashboardPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <div className="p-6 space-y-6">
        {/* Encabezado */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Panel Principal
          </h1>
          <p className="text-gray-500">
            Resumen general de la empresa de transporte
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Usuarios</CardTitle>
              <Users className="w-6 h-6 opacity-80" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">1,250</p>
              <p className="text-sm opacity-80 mt-1">Registrados en el sistema</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Buses Activos</CardTitle>
              <Bus className="w-6 h-6 opacity-80" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">85</p>
              <p className="text-sm opacity-80 mt-1">En operación actualmente</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg hover:shadow-xl transition">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Viajes Realizados</CardTitle>
              <MapPin className="w-6 h-6 opacity-80" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">4,320</p>
              <p className="text-sm opacity-80 mt-1">En los últimos 30 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de viajes */}
        <Card className="shadow-md border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Viajes Realizados por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="viajes"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ fill: '#16a34a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
