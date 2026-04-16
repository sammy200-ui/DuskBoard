"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthStore from "@/lib/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectToDashboard = () => {
    router.replace("/dashboard");

    // Fallback for occasional dev-router chunk sync issues.
    window.setTimeout(() => {
      if (window.location.pathname !== "/dashboard") {
        window.location.assign("/dashboard");
      }
    }, 150);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login({ email, password });
      toast.success("Welcome back");
      redirectToDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login";
      toast.error(message);
    }
  };

  return (
    <Card className="w-full max-w-md border border-white/15 bg-[#101927]/85 py-0 text-zinc-100 shadow-2xl shadow-black/20">
      <CardHeader className="border-b border-white/10 px-6 py-6">
        <CardTitle className="text-2xl text-white">Login</CardTitle>
        <CardDescription className="text-zinc-300">Sign in to continue to your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-400"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-400"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-teal-400 text-[#0f1725] hover:bg-teal-300"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-300">
          New here?{" "}
          <Link href="/register" className="font-medium text-teal-300 hover:text-teal-200">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}