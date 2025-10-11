// Frontend/app/dashboard/clientes/[id]/editar/page.jsx
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "../../components/client-form";
import { getClient } from "../../api/api-clients";

export default async function EditClientPage({ params }) {
  const { id } = await params;
  const client = await getClient(id);

  return (
    <div className="justify-center items-center">
      <Card>
        <CardContent>
          <ClientForm client={client} />
        </CardContent>
      </Card>
    </div>
  );
}