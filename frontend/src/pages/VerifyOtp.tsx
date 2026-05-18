import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL;

export default function VerifyOtp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [code, setCode] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("otp-email");
    if (!stored) {
      navigate("/login");
      return;
    }

    setEmail(stored);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const id = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [resendCooldown]);

  async function handleVerify() {
    setIsVerifying(true);
    try {
      const response = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ email: email, otp: code }),

        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        sessionStorage.removeItem("otp-email");
        navigate(data.needsOnboarding ? "/welcome" : "/dashboard");
        return;
      }
      if (response.status === 429) {
        toast.error(data.error);
      } else if (response.status === 400) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Invalid code. try again";
        toast.error(msg);
      } else {
        toast.error("Something went wrong");
      }
    } catch {
      toast.error(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);

    try {
      const response = await fetch(`${API}/api/auth/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      const body = await response.json();

      if (response.ok) {
        toast.success(body.message);
        setResendCooldown(60);
        return;
      }
      if (response.status === 429) {
        toast.error(body.error);
      } else if (response.status === 400) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : "Invalid code. try again";
        toast.error(msg);
      } else {
        toast.error("Something went wrong");
      }
    } catch {
      toast.error(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleUseDifferentEmail() {
    sessionStorage.removeItem("otp-email");
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <Card className="w-full max-w-sm shadow-lg border-0 mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? "Verifying" : "Verify"}
          </Button>

          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : isResending
                ? "Resending..."
                : "Resend code"}
          </button>

          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={handleUseDifferentEmail}
          >
            Use a different email
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
