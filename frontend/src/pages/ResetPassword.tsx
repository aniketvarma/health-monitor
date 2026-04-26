import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { token } = useParams();

  async function handleResetPassword(e) {
    e.preventDefault();
    console.log("Submit clicked, passwords:", newPassword, confirmPassword);
    if (newPassword !== confirmPassword) {
      alert("Password do not match");

      return;
    }
    const response = await fetch(
      "http://localhost:3000/api/auth/reset-password",
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
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword}>
          <Label htmlFor="new">Enter New Password</Label>
          <Input
            id="new"
            type="password"
            onChange={(e) => setNewPassword(e.target.value)}
          ></Input>
          <Label htmlFor="confirm">Confirm New Password</Label>
          <Input
            id="confirm"
            type="password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          ></Input>
          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
}
