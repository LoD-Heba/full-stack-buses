import { Card, CardContent } from "@/components/ui/card";
import { TicketForm } from "../components/ticket-form";

export default function NewTicketPage() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardContent className="pt-6">
          <TicketForm ticket={null} />
        </CardContent>
      </Card>
    </div>
  );
}
