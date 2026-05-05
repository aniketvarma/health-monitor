import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API = import.meta.env.VITE_API_URL;

export default function Reminders() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [reminders, setReminders] = useState<any[]>([]);
  const token = localStorage.getItem("token")!;

  // fetch reminders on page load
  useEffect(() => {
    async function fetchReminders() {
      const response = await fetch(`${API}/api/reminders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders);
      } else if (response.status === 401) {
        toast.error("Unauthorized. Please log in again.");
      }
    }

    fetchReminders();
  }, []);

  // save a reminder
  async function handleSaveReminder() {
    if (!time || !message) {
      toast.warning("Please fill in both time and message.");
      return;
    }

    // format date as YYYY-MM-DD for the database
    const dateStr = selectedDate.toISOString().split("T")[0];

    const response = await fetch(`${API}/api/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: dateStr, time, message }),
    });

    if (response.ok) {
      toast.success("Reminder saved!");
      // add to local list so it shows immediately
      setReminders([...reminders, { date: dateStr, time, message }]);
      setTime("");
      setMessage("");
      setIsPopUpOpen(false);
    } else if (response.status === 400) {
      toast.error("Invalid input. Please check your values.");
    } else {
      toast.error("Something went wrong.");
    }
  }

  // delete a reminder
  async function handleDeleteReminder(id: number) {
    const response = await fetch(`${API}/api/reminders/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setReminders(reminders.filter((r) => r.id !== id));
      toast.success("Reminder deleted.");
    } else {
      toast.error("Failed to delete reminder.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 pb-20">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(day) => {
          setSelectedDate(day ?? selectedDate);
          setIsPopUpOpen(true);
        }}
        className="w-full max-w-2xl mt-10"
        classNames={{
          root: "w-full",
          day: "flex-1",
          weekdays: "flex w-full bg-muted rounded-md py-2",
          weekday: "flex-1 font-semibold text-primary",
        }}
      />

      {/* reminder list */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <p className="text-muted-foreground">No reminders set yet.</p>
          ) : (
            <ul className="space-y-3">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{r.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })} at {r.time}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteReminder(r.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* dialog for setting a reminder */}
      <Dialog open={isPopUpOpen} onOpenChange={setIsPopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Date: {selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="time">Select Time</Label>
              <Input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                placeholder="e.g. Take medicine, Check BP"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveReminder}>Save Reminder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
