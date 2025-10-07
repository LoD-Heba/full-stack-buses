import { Card, CardContent } from "@/components/ui/card";
import { UserForm } from "../components/user-form";
import { getUser } from "../api/api-users";

export default async function UserNewPage({ params }) {
  //colocamos params para buscar el id del producto 
  const { id } = await params;
  // console.log(id)
  const user = await getUser(id);
  //// Consulta el lado servidor, obtiene el producto

  return (
    <div className=" justify-center items-center">
      <Card >
        <CardContent>
          {/* El formulario tiene es lado cliente, solo el tiene acceso a los datos de la consulta al servidor */}
          <UserForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
