import { SeatStackForm } from "../../components/seat-stack-form";

async function getSeatStackById(id) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/seat-stacks/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Error al obtener la pila de asientos");
    }

    return res.json();
  } catch (error) {
    console.error("Error al obtener la pila de asientos:", error);
    return null;
  }
}

export default async function EditSeatStackPage({ params }) {
  const resolvedParams = await params;
  const seatStack = await getSeatStackById(resolvedParams.id);
console.log(resolvedParams)
console.log(seatStack)
  if (!seatStack) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 text-center">
        <p className="text-red-500">Pila de asientos no encontrada</p>
      </div>
    );
  }

 return <SeatStackForm stack={seatStack} />;

}
