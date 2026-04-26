import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [emailForPasswordReset, setemailForPasswordReset] = useState("");
  const [resetDialog, setResetDialog] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = { email, password };

    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const token = await response.json();
      localStorage.setItem("token", token.token);
      navigate("/dashboard");
    }
  }

  async function handleForgetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const response = await fetch(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailForPasswordReset }),
      },
    );

    if (response.ok) {
      setResetDialog(false);
      alert("If this email exists, a reset link has been sent.");
    } else {
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                placeholder="Email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>
            <Button type="submit">Login</Button>
          </form>
          <p className="text-black-500 mt-4">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <Dialog open={resetDialog} onOpenChange={setResetDialog}>
            <DialogTrigger className="text-sm text-blue-500 underline cursor-pointer">
              Forgot password?
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
              </DialogHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleForgetPassword}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-email">
                    Enter email associated with your account
                  </Label>
                  <Input
                    id="reset-email"
                    value={emailForPasswordReset}
                    onChange={(e) => setemailForPasswordReset(e.target.value)}
                  />
                </div>
                <Button type="submit">Submit</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
