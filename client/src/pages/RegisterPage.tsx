import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Swords } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Seo } from "../components/Seo";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authApi.register({ username, email, password }),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      void queryClient.invalidateQueries();
      toast.success("Account created — welcome to GoGoTactics!");
      navigate("/", { replace: true });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Registration failed")),
  });

  return (
    <div className="mx-auto max-w-sm">
      <Seo title="Sign up" description="Create a GoGoTactics account" pathname="/register" />
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-none border-[3px] border-foreground bg-primary shadow-comic rotate-2">
          <Swords className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-bold">Join the community</h1>
        <p className="mt-1 text-sm text-muted">Publish lineups, rate builds, follow creators</p>
      </div>

      <form
        className="space-y-4 rounded-xl border border-border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_handle"
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_]+"
            title="Letters, numbers and underscores only"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
