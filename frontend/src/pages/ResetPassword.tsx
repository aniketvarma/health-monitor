import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { token } = useParams();

  async function handleResetPassword(e: any) {
    e.preventDefault();
    console.log("Submit clicked, passwords:", newPassword, confirmPassword);
    if (newPassword !== confirmPassword) {
      alert("Password do not match");

      return;
    }
    const response = await fetch(`${API}/api/auth/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, token }),
      },
    );
    console.log("Response status:", response.status);

    if (response.ok) {
      alert("Password Reset Successfull");
      navigate("/login");
    } else if (response.status === 400) {
      alert("Failed to reset password. The link may be expired.");
    } else {
      alert("something went wrong");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                placeholder="Enter new password"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Confirm new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit">Reset Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
