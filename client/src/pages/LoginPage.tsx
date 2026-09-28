import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Swords } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Seo } from "../components/Seo";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const mutation = useMutation({
    mutationFn: () => authApi.login({ identifier, password }),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      void queryClient.invalidateQueries();
      toast.success(`Welcome back, @${res.data.data.user.username}!`);
      navigate(from, { replace: true });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Login failed")),
  });

  return (
    <div className="mx-auto max-w-sm">
      <Seo title="Log in" description="Log in to GoGoTactics" pathname="/login" />
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-none border-[3px] border-foreground bg-primary text-bright-ink shadow-comic -rotate-3">
          <Swords className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to share and save lineups</p>
      </div>

      <form
        className="space-y-4 rounded-xl border border-border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Username or email</Label>
          <Input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="tactifox"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-sm text-muted">
          No account yet?{" "}
          <Link to="/register" className="text-accent hover:underline">
            Sign up free
          </Link>
        </p>
      </form>

      <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-center text-xs text-muted">
        Demo accounts: <code className="text-foreground">admin@gogotactics.dev</code> or{" "}
        <code className="text-foreground">fox@gogotactics.dev</code> · password:{" "}
        <code className="text-foreground">password123</code>
      </p>
    </div>
  );
}
