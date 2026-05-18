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

  // TODO: Anike — declare these pieces of state:
  //   email          — string, read from sessionStorage on mount; "" initially
  //   code           — string, the 6-digit value typed into <InputOTP>
  //   isVerifying    — boolean, true while POST /verify-otp is in flight
  //   resendCooldown — number, seconds remaining before "Resend code" is enabled (start at 60)
  //   isResending    — boolean, true while POST /request-otp is in flight

  const [email, setEmail] = useState("");

  const [code, setCode] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // TODO: Anike — useEffect on mount:
  //   1. const stored = sessionStorage.getItem("otp-email")
  //   2. if (!stored) { navigate("/login"); return; }
  //   3. setEmail(stored)

  useEffect(() => {
    const stored = sessionStorage.getItem("otp-email");
    if (!stored) {
      navigate("/login");
      return;
    }

    setEmail(stored);
  }, []);

  // TODO: Anike — useEffect that ticks resendCooldown down by 1 every second
  //   until it reaches 0. Use setInterval + cleanup (clearInterval in return).

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const id = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [resendCooldown]);

  // TODO: Anike — implement handleVerify:
  //   1. setIsVerifying(true)
  //   2. POST `${API}/api/auth/verify-otp` with body { email, otp: code }
  //      (the API field is `otp`; the local state name `code` stays for clarity)
  //   3. if response.ok:
  //        const { token, needsOnboarding } = await res.json()
  //        localStorage.setItem("token", token)
  //        sessionStorage.removeItem("otp-email")
  //        navigate(needsOnboarding ? "/welcome" : "/dashboard")
  //      else:
  //        parse body — same shape-check pattern as Login.tsx (string vs Zod object)
  //        toast.error with the message
  //   4. setIsVerifying(false) in finally
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

  // TODO: Anike — implement handleResend:
  //   1. setIsResending(true)
  //   2. POST `${API}/api/auth/request-otp` with body { email }
  //   3. if response.ok:
  //        toast.success("Code resent")
  //        setResendCooldown(60)
  //      else: toast.error(...)
  //   4. setIsResending(false) in finally
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
          <InputOTP
            maxLength={6}
            // TODO: Anike — value={code} onChange={setCode}
            value={code}
            onChange={setCode}
          >
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
            // TODO: Anike — disabled={isVerifying || code.length !== 6}
            disabled={isVerifying || code.length !== 6}
          >
            {/* TODO: Anike — show "Verifying..." when isVerifying, else "Verify" */}
            {isVerifying ? "Verifying" : "Verify"}
          </Button>

          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            onClick={handleResend}
            // TODO: Anike — disabled={resendCooldown > 0 || isResending}
            disabled={resendCooldown > 0 || isResending}
          >
            {/* TODO: Anike —
                 if resendCooldown > 0: `Resend code in ${resendCooldown}s`
                 else if isResending:   "Resending..."
                 else:                  "Resend code"
            */}
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
