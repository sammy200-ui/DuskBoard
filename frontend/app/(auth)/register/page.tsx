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

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await register({ name, email, password });
      toast.success("Account created");
      router.push("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to register";
      toast.error(message);
    }
  };

  return (
    <Card className="w-full max-w-md border border-white/15 bg-[#101927]/85 py-0 text-zinc-100 shadow-2xl shadow-black/20">
      <CardHeader className="border-b border-white/10 px-6 py-6">
        <CardTitle className="text-2xl text-white">Register</CardTitle>
        <CardDescription className="text-zinc-300">Create your account to start managing projects.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-200">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-400"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-orange-300 text-[#161b22] hover:bg-orange-200"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-300 hover:text-teal-200">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}