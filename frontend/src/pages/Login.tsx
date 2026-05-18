import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();

  // TODO: Anike — add useState for `email` (string) and `isSending` (boolean)
  const [email, setEmail] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  async function handleGoogle(credentialResponse: any) {
    const res = await fetch(`${API}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credentialResponse.credential }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } else {
      toast.error("Google Login failed");
    }
  }

  async function handleSendCode() {
    setIsSending(true);
    try {
      const response = await fetch(`${API}/api/auth/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      if (response.ok) {
        sessionStorage.setItem("otp-email", email);
        navigate("/verify-otp");
        return;
      }

      const body = await response.json();

      if (response.status === 429) {
        toast.error(body.error);
      } else if (response.status === 400) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : "Please enter a valid email address.";
        toast.error(msg);
      } else {
        toast.error("something went wrong");
      }
    } catch (e) {
      toast.error(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <Card className="w-full max-w-sm shadow-lg border-0 mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            KinLog
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => toast.error("Google login failed")}
          />

          {/* OR separator */}
          <div className="flex items-center gap-2 my-1 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            OR
            <div className="flex-1 h-px bg-border" />
          </div>

          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />

          <Button
            className="w-full"
            onClick={handleSendCode}
            // TODO: Anike — disabled={isSending || !email}
            disabled={isSending || !email}
          >
            {isSending ? "Sending..." : "Send code"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
