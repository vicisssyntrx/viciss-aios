import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ParticleBackground from "@/components/ParticleBackground";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast.success("A confirmation has been sent to your Registered mail. Please Click Confirm. Check Spam if not recieved in inbox.", {
          duration: 10000,
        });
        setIsSignUp(false);
        setPassword("");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Authentication failed";
      const message =
        rawMessage.toLowerCase().includes("invalid login credentials")
          ? "Invalid email or password."
          : rawMessage;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 py-6 sm:px-4 bg-background">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-2xl p-4 sm:p-6 md:p-8">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Vicissometer</h1>
          <p className="text-muted-foreground text-base mb-8">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground text-sm uppercase tracking-wider">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="bg-secondary border-border"
                />
              </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-sm uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="bg-secondary border-border"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2 h-11 text-base">
              {submitting ? "..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-base text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
