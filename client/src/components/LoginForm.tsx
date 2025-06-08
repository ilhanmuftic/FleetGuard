import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Car } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Add effect to handle successful login
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("[LoginForm] User is now authenticated and loaded, redirecting...");
      toast({
        title: "Success",
        description: "Successfully logged in!",
      });
      setTimeout(() => {
        setLocation("/");
      }, 100);
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if already submitting or loading
    if (isSubmitting || isLoading) {
      console.log("[LoginForm] Already submitting or loading, ignoring submit");
      return;
    }

    // Validate inputs
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    console.log("[LoginForm] Starting login process");
    setIsSubmitting(true);

    try {
      console.log("[LoginForm] Attempting login with email:", email);
      await login(email, password);
      console.log("[LoginForm] Login successful");
      // Note: We don't need to do anything here as the useEffect will handle the redirect
    } catch (error) {
      console.error("[LoginForm] Login error:", error);
      let errorMessage = "Login failed";

      if (error instanceof Error) {
        // Handle specific Supabase error messages
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Only reset submitting state if we're not authenticated
      // This prevents the button from re-enabling during the redirect
      if (!isAuthenticated) {
        setIsSubmitting(false);
      }
    }
  };

  // Update button to show correct loading state
  const buttonText = isSubmitting ? "Signing in..." :
    isLoading ? "Loading..." :
      "Sign in";
  const isButtonDisabled = isSubmitting || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-6">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Smart&Safe</h2>
          <p className="mt-2 text-sm text-gray-600">Vehicle Management System</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
                </div>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-primary hover:text-blue-500"
                    onClick={(e) => e.preventDefault()} // optional: prevent reload
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isButtonDisabled}
              >
                {buttonText}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <p>Demo accounts:</p>
                <p><strong>Admin:</strong> admin@company.com / password</p>
                <p><strong>Employee:</strong> employee@company.com / password</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
