import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();

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

          <Button className="w-full" variant="outline">
            Continue with Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
