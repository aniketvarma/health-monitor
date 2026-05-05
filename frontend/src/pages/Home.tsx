import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Trash2, Bell } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function Home() {
  const [medicineList, setMedicineList] = useState<any[]>([]);
  const [newMedicine, setNewMedicine] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const token = localStorage.getItem("token")!;

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
        toast.error("Unauthorized. Please log in again.");
      } else if (response.status === 500) {
        toast.error("Server error. Please try again later.");
      }
    }

    fetchMedicines();

    // fetch upcoming reminders (today and future)
    async function fetchReminders() {
      const response = await fetch(`${API}/api/reminders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // filter to only show today and future reminders
        // use local date parts to avoid UTC timezone shift (IST is +5:30)
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const upcoming = data.reminders.filter((r: any) => {
          const d = new Date(r.date);
          const rDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return rDate >= today;
        });
        setReminders(upcoming.slice(0, 5)); // show max 5
      }
    }

    fetchReminders();
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
      toast.error("Unauthorized. Please log in again.");
    } else if (response.status === 400) {
      toast.error("Invalid medicine input.");
    } else if (response.status === 500) {
      toast.error("Server error. Please try again later.");
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
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          KinLog
        </h1>
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

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <p className="text-muted-foreground">No upcoming reminders.</p>
          ) : (
            <ul className="space-y-3">
              {reminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between border-b pb-2 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">{r.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                      , {r.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
