// Frontend/app/dashboard/clientes/nuevo/page.jsx
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "../components/client-form";

export default function NewClientPage() {
  return (
    <div className="justify-center items-center">
      <Card>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}