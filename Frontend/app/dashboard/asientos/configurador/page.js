"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SeatEditor from "@/components/asientos/configurador/SeatEditor";
import {
  configureBusLayout,
  getBusLayout,
} from "@/app/dashboard/buses/api/api-bus-layout";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ConfiguradorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const busId = searchParams.get("busId");

  const [loading, setLoading] = useState(true);
  const [initialLayout, setInitialLayout] = useState(null);
  const [busInfo, setBusInfo] = useState(null);

  useEffect(() => {
    if (!busId) {
      toast.error("No se proporcionó ID de bus");
      router.push("/dashboard/buses");
      return;
    }

    loadBusData();
  }, [busId]);

  const loadBusData = async () => {
    try {
      setLoading(true);

      // Cargar información del bus
      const busResponse = await fetch(
        `http://localhost:3001/api/v1/buses/${busId}`
      );
      const bus = await busResponse.json();
      setBusInfo(bus);

      // Intentar cargar layout existente
      try {
        const layout = await getBusLayout(busId);
        console.log("📦 Layout cargado del backend:", layout);

        if (layout && layout.decks && layout.decks.length > 0) {
          // ✅ Pasar el objeto completo, no solo el primer deck
          setInitialLayout({
            decks: layout.decks.map((deck) => ({
              floor_number: deck.deck,
              stack_name: deck.stack_name,
              layout: deck.layout || [],
            })),
          });
        } else {
          console.warn("⚠️ Layout sin decks válidos");
        }
      } catch (err) {
        console.error("❌ Error al cargar layout:", err);
        console.log("Iniciando desde cero");
      }
    } catch (error) {
      toast.error("Error al cargar información del bus");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (layoutData) => {
    try {
      await configureBusLayout(busId, layoutData);
      toast.success("Configuración guardada exitosamente");
      router.push(`/dashboard/buses/${busId}`);
    } catch (error) {
      toast.error(error.message || "Error al guardar la configuración");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando configurador...</p>
        </div>
      </div>
    );
  }

  if (!busId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">ID de bus inválido</p>
      </div>
    );
  }

  return (
    <SeatEditor
      busId={busId}
      initialLayout={initialLayout}
      onSave={handleSave}
    />
  );
}
