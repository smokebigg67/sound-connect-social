import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - navigate to feed
    navigate("/feed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-audio mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-audio bg-clip-text text-transparent">
            VoiceConnect
          </h1>
          <p className="text-muted-foreground">
            Where conversations come alive through audio
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to continue your audio journey"
                : "Join the audio-first social platform"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="audioexplorer"
                    required
                    className="bg-background border-border"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-background border-border"
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-audio hover:opacity-90 transition-opacity">
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
