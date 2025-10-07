'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Bus, MapPin, Armchair } from 'lucide-react';
import Link from 'next/link';
import salidas from '@/src/data/salidas.json';

export default function SalidasPage() {
  const today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Salidas Programadas</h1>
        <p className="text-gray-600 capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {salidas.map((salida) => (
          <Card key={salida.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    {salida.ruta}
                  </CardTitle>
                </div>
                <Badge className="bg-orange-500 w-fit">
                  <Clock className="w-3 h-3 mr-1" />
                  {salida.hora}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Bus</p>
                    <p className="font-semibold">{salida.bus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Asientos</p>
                    <p className="font-semibold">{salida.asientosDisponibles} disponibles</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Precio</p>
                  <p className="font-semibold text-orange-600 text-lg">{salida.precio} Bs.</p>
                </div>
                <div className="flex items-end">
                  <Link href="/comprar" className="w-full">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Reservar
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
