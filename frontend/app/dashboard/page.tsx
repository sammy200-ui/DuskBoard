"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import useAuthStore from "@/lib/stores/auth-store";

type ProjectRole = "ADMIN" | "PM" | "DEVELOPER" | "QA" | "VIEWER";

type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  myRole: ProjectRole;
};

const roleClassMap: Record<ProjectRole, string> = {
  ADMIN: "bg-teal-300/20 text-teal-200 border border-teal-200/30",
  PM: "bg-sky-300/20 text-sky-200 border border-sky-200/30",
  DEVELOPER: "bg-emerald-300/20 text-emerald-200 border border-emerald-200/30",
  QA: "bg-amber-300/20 text-amber-200 border border-amber-200/30",
  VIEWER: "bg-zinc-300/20 text-zinc-200 border border-zinc-200/30",
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const toMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default function DashboardPage() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [didLoad, setDidLoad] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
      window.setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }, 150);
    }
  }, [isHydrated, accessToken, router]);

  useEffect(() => {
    if (!isHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    const loadProjects = async () => {
      setIsFetching(true);
      try {
        const { data } = await api.get<ProjectSummary[]>("/projects");
        if (!cancelled) {
          setProjects(data);
          setDidLoad(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof AxiosError && error.response?.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }

        toast.error(toMessage(error, "Unable to load your projects"));
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, accessToken, clearSession, router]);

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = projectName.trim();
    if (name.length < 2) {
      toast.error("Project name should be at least 2 characters");
      return;
    }

    setIsCreating(true);
    try {
      const { data } = await api.post<ProjectSummary>("/projects", {
        name,
        description: projectDescription.trim() || undefined,
      });

      setProjects((current) => [data, ...current]);
      setProjectName("");
      setProjectDescription("");
      toast.success("Project created");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }

      toast.error(toMessage(error, "Unable to create project"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.replace("/login");
    window.setTimeout(() => {
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }, 150);
  };

  const greeting = useMemo(() => {
    if (!user?.name) {
      return "Welcome";
    }

    const firstName = user.name.split(" ")[0];
    return `Welcome, ${firstName}`;
  }, [user?.name]);

  if (!isHydrated || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1725] text-zinc-200">
        <p className="text-sm tracking-wide">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1725] px-5 py-6 text-zinc-100 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#111b2b] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">DuskBoard Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{greeting}</h1>
            <p className="mt-1 text-sm text-zinc-300">Manage projects and continue your workflow.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm text-zinc-200 transition hover:bg-white/10"
            >
              Landing
            </Link>
            <Button
              type="button"
              onClick={handleLogout}
              className="h-10 rounded-lg bg-red-300 px-4 text-sm font-semibold text-[#2d1114] hover:bg-red-200"
            >
              Logout
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-white/10 bg-[#111b2b] text-zinc-100">
            <CardHeader>
              <CardTitle className="text-xl text-white">Create Project</CardTitle>
              <CardDescription className="text-zinc-300">
                Start a new workspace for your team and assign members from settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-zinc-200">
                    Name
                  </Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g. Payments Revamp"
                    className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description" className="text-zinc-200">
                    Description
                  </Label>
                  <textarea
                    id="project-description"
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                    placeholder="Short context for this project"
                    rows={4}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition focus-visible:border-zinc-400 placeholder:text-zinc-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-10 rounded-lg bg-teal-400 px-4 text-sm font-semibold text-[#102230] hover:bg-teal-300"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#111b2b] text-zinc-100">
            <CardHeader>
              <CardTitle className="text-xl text-white">Your Projects</CardTitle>
              <CardDescription className="text-zinc-300">
                {isFetching ? "Loading projects..." : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFetching && !didLoad ? (
                <p className="text-sm text-zinc-300">Fetching your workspace list...</p>
              ) : projects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-sm text-zinc-300">
                  No projects yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{project.name}</h3>
                          <p className="mt-1 text-sm text-zinc-300">
                            {project.description || "No description yet"}
                          </p>
                        </div>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleClassMap[project.myRole]}`}>
                          {project.myRole}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                        <span>Created {formatDate(project.createdAt)}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono">{project.id.slice(0, 8)}</span>
                          <Link
                            href={`/projects/${project.id}`}
                            className="inline-flex items-center rounded-md border border-white/20 px-2 py-1 text-[11px] font-medium text-zinc-200 transition hover:bg-white/10"
                          >
                            Board
                          </Link>
                          <Link
                            href={`/projects/${project.id}/sprints`}
                            className="inline-flex items-center rounded-md border border-white/20 px-2 py-1 text-[11px] font-medium text-zinc-200 transition hover:bg-white/10"
                          >
                            Sprints
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}