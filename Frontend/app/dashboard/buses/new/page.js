"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BusForm } from "../components/bus-form";

export default function NewBusPage() {
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