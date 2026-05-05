import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API = import.meta.env.VITE_API_URL;

export default function BloodPressureForm() {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload: { systolic: number; diastolic: number; pulse?: number } = {
      systolic: Number(systolic),
      diastolic: Number(diastolic),
    };
    if (pulse) payload.pulse = Number(pulse);

    if (systolic === "" || diastolic === "") {
      toast.warning("Please fill blood pressure values.");
      return;
    }

    const response = await fetch(`${API}/api/bp-readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      toast.success("Blood pressure reading logged successfully!");
      setSystolic("");
      setDiastolic("");
      setPulse("");
    } else if (response.status === 401) {
      toast.error("Unauthorized. Please log in");
    } else if (response.status === 400) {
      toast.error("Invalid input. Please check your values.");
    }
  }

  return (
    <div>
      <Card>
        <CardContent className="p-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="systolic">Systolic (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                placeholder="e.g. 120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="e.g. 80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pulse">Pulse (bpm)</Label>
              <Input
                id="pulse"
                type="number"
                placeholder="e.g. 72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
