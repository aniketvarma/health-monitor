import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL;

export default function Welcome() {
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  async function handleSubmit() {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field: "name", value: name.trim() }),
      });

      if (response.ok) {
        navigate("/dashboard");
        return;
      }

      const body = await response.json();
      if (response.status === 400) {
        const msg =
          typeof body.error === "string" ? body.error : "Couldn't save name";
        toast.error(msg);
      } else {
        toast.error("Something went wrong");
      }
    } catch {
      toast.error(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <Card className="w-full max-w-sm shadow-lg border-0 mx-auto">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">👋</div>
          <CardTitle className="text-2xl font-bold">Welcome to KinLog</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            What should we call you?
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="Your name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : "Continue to dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
