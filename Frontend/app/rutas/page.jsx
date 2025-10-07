'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import rutas from '@/src/data/rutas.json';

export default function RutasPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Nuestras Rutas</h1>
        <p className="text-gray-600">Conectamos los principales departamentos de Bolivia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rutas.map((ruta) => (
          <Card key={ruta.id} className={`${!ruta.activa ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    {ruta.origen}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="text-lg">→</span>
                    <span className="font-semibold">{ruta.destino}</span>
                  </CardDescription>
                </div>
                {ruta.activa ? (
                  <Badge className="bg-green-500">Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Duración</span>
                  </div>
                  <span className="font-semibold">{ruta.duracion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Precio</span>
                  </div>
                  <span className="font-semibold text-orange-600">{ruta.precio} Bs.</span>
                </div>
                {ruta.activa && (
                  <Link href="/comprar" className="block w-full">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Comprar Pasaje
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
