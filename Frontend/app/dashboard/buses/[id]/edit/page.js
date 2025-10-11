"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BusForm } from "../../components/bus-form";
import { getBus } from "../../api/api-buses";
import { Loader2 } from "lucide-react";

export default function EditBusPage() {
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadBus();
    }
  }, [params.id]);

  const loadBus = async () => {
    try {
      setLoading(true);
      const busData = await getBus(params.id);
      setBus(busData);
    } catch (error) {
      console.error("Error al cargar bus:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardContent className="pt-6">
          <BusForm bus={bus} />
        </CardContent>
      </Card>
    </div>
  );
}