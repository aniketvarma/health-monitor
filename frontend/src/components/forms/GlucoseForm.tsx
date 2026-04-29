import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API = import.meta.env.VITE_API_URL;

export default function GlucoseForm() {
  const [reading, setReading] = useState("");
  const [type, setType] = useState<"fasting" | "post_meal">("fasting");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (reading === "") {
      toast.warning("Please enter a glucose reading.");
      return;
    }

    const payload = { reading: Number(reading), type: type };

    const response = await fetch(`${API}/api/glucose-readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      toast.success("Glucose reading saved successfully!");
      setReading("");
    } else if (response.status === 401) {
      toast.error("Unauthorized. Please log in again.");
    } else if (response.status === 400) {
      toast.error("Invalid glucose reading.");
    } else if (response.status === 500) {
      toast.error("Server error. Please try again later.");
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex if flex-col gap-2">
            <Label htmlFor="reading">Glucose Level (mg/dL)</Label>
            <Input
              id="reading"
              type="number"
              placeholder="e.g. 100"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Reading Type</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={type === "fasting" ? "default" : "outline"}
                onClick={() => setType("fasting")}
              >
                Fasting
              </Button>
              <Button
                type="button"
                variant={type === "post_meal" ? "default" : "outline"}
                onClick={() => setType("post_meal")}
              >
                Post Meal
              </Button>
            </div>
          </div>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}
