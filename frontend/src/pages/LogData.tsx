import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BloodPressureForm from "@/components/forms/BloodPressureForm";

const options = [
  { id: "blood-pressure", label: "Blood Pressure", description: "Systolic & Diastolic" },
  { id: "glucose", label: "Glucose", description: "Blood sugar level" },
  { id: "weight", label: "Weight", description: "Body weight" },
  { id: "blood-test", label: "Blood Test Reports", description: "Upload or enter results" },
];

export default function LogData() {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelected(null)}>
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {options.find((o) => o.id === selected)?.label}
          </h1>
        </div>
        {selected === "blood-pressure" && <BloodPressureForm />}
        {selected === "glucose" && (
          <Card><CardContent className="p-6"><p className="text-muted-foreground">Form coming soon...</p></CardContent></Card>
        )}
        {selected === "weight" && (
          <Card><CardContent className="p-6"><p className="text-muted-foreground">Form coming soon...</p></CardContent></Card>
        )}
        {selected === "blood-test" && (
          <Card><CardContent className="p-6"><p className="text-muted-foreground">Form coming soon...</p></CardContent></Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Log Data</h1>
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <Card
            key={option.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelected(option.id)}
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{option.label}</h2>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
