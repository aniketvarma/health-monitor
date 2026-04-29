import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [medicineList, setMedicineList] = useState<any[]>([]);
  const [newMedicine, setNewMedicine] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const token = localStorage.getItem("token")!;
  const jwtpayload = token.split(".")[1];
  const decoded = atob(jwtpayload.replace(/-/g, "+").replace(/_/g, "/"));
  const username = JSON.parse(decoded).name;

  useEffect(() => {
    async function fetchMedicines() {
      const response = await fetch(`${API}/api/medicines`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicineList(data.medicines);
      } else if (response.status === 401) {
        alert("Unauthorized. Please log in again.");
      } else if (response.status === 500) {
        alert("Server error. Please try again later.");
      }
    }

    fetchMedicines();
  }, []);

  async function handleAddMedicine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newMedicine) return;

    const response = await fetch(`${API}/api/medicines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ medicine: newMedicine }),
    });

    if (response.ok) {
      setMedicineList([...medicineList, { medicine: newMedicine }]);
      setNewMedicine("");
      setDialogOpen(false);
    } else if (response.status === 401) {
      alert("Unauthorized. Please log in again.");
    } else if (response.status === 400) {
      alert("Invalid medicine input.");
    } else if (response.status === 500) {
      alert("Server error. Please try again later.");
    }
  }

  async function handleDeleteMedicine(id: number) {
    const response = await fetch(`${API}/api/medicines/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setMedicineList(medicineList.filter((medicine) => medicine.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome back, {username}</h1>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/dashboard/log">Log Data</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/insights">View Insights</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Medicines</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medicine</DialogTitle>
              </DialogHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleAddMedicine}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="medicine">
                    Medicine (name, dose, frequency)
                  </Label>
                  <Input
                    id="medicine"
                    placeholder="e.g. Paracetamol 500mg 2x daily"
                    value={newMedicine}
                    onChange={(e) => setNewMedicine(e.target.value)}
                  />
                </div>
                <Button type="submit">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {medicineList.length === 0 ? (
            <p className="text-muted-foreground">No medicines added yet.</p>
          ) : (
            <ul className="space-y-2">
              {medicineList.map((med) => (
                <li key={med.id} className="flex items-center gap-3">
                  <span>{med.medicine}</span>
                  <button onClick={() => handleDeleteMedicine(med.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
