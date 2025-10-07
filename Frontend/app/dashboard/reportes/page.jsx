'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesPage() {
  const reportes = [
    {
      titulo: 'Reporte de Ventas Mensual',
      descripcion: 'Detalle de todas las ventas del mes actual',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      titulo: 'Reporte de Ocupación',
      descripcion: 'Estadísticas de ocupación por ruta',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      titulo: 'Reporte de Empleados',
      descripcion: 'Lista completa de empleados y sus datos',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      titulo: 'Reporte de Ingresos',
      descripcion: 'Análisis de ingresos por período',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
  ];

  const handleDownload = (titulo) => {
    toast.success(`Descargando: ${titulo}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reportes</h1>
        <p className="text-gray-600">Genera y descarga reportes del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map((reporte, index) => {
          const Icon = reporte.icon;

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 mb-2">
                      <div className={`${reporte.bgColor} p-2 rounded-lg`}>
                        <Icon className={`w-6 h-6 ${reporte.color}`} />
                      </div>
                      {reporte.titulo}
                    </CardTitle>
                    <CardDescription>{reporte.descripcion}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleDownload(reporte.titulo)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Reportes Personalizados</CardTitle>
          <CardDescription>
            Configura y genera reportes personalizados según tus necesidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <FileText className="w-4 h-4 mr-2" />
            Crear Reporte Personalizado
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
