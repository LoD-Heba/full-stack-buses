import { Card, CardContent } from "@/components/ui/card";
import { BusForm } from "../components/bus-form";
import { getBus } from "../api/api-buses";
import { notFound } from "next/navigation";

export default async function BusEditPage({ params }) {
  const { id } = await params;
  
  // Si el ID es "new", crear un nuevo bus
  if (id === "new") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <BusForm bus={null} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validar que el ID no sea undefined
  if (!id || id === "undefined") {
    notFound();
  }

  // Intentar cargar el bus para edición
  try {
    const bus = await getBus(id);
    
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <BusForm bus={bus} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error al cargar el bus:", error);
    notFound();
  }
}