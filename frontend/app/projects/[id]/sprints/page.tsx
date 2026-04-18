"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { priorityDotMap, statusLabelMap } from "@/components/board/status-meta";
import { TaskStatus } from "@/components/board/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import useAuthStore from "@/lib/stores/auth-store";

type ProjectRole = "ADMIN" | "PM" | "DEVELOPER" | "QA" | "VIEWER";
type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  myRole: ProjectRole;
};

type SprintView = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
};

type SprintCompletionResult = {
  sprint: SprintView;
  movedTasks: number;
  destinationSprintId: string | null;
};

type SprintTaskView = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
};

const sprintStatusLabelMap: Record<SprintStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

const sprintStatusToneMap: Record<SprintStatus, string> = {
  PLANNED: "border-zinc-300/30 bg-zinc-300/10 text-zinc-200",
  ACTIVE: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
  COMPLETED: "border-sky-300/40 bg-sky-300/10 text-sky-200",
};

const roleClassMap: Record<ProjectRole, string> = {
  ADMIN: "bg-teal-300/20 text-teal-200 border border-teal-200/30",
  PM: "bg-sky-300/20 text-sky-200 border border-sky-200/30",
  DEVELOPER: "bg-emerald-300/20 text-emerald-200 border border-emerald-200/30",
  QA: "bg-amber-300/20 text-amber-200 border border-amber-200/30",
  VIEWER: "bg-zinc-300/20 text-zinc-200 border border-zinc-200/30",
};

const sprintStatusRank: Record<SprintStatus, number> = {
  ACTIVE: 0,
  PLANNED: 1,
  COMPLETED: 2,
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

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const sortSprints = (collection: SprintView[]): SprintView[] => {
  return [...collection].sort((left, right) => {
    const statusDelta = sprintStatusRank[left.status] - sprintStatusRank[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const leftDate = left.startDate ? new Date(left.startDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDate = right.startDate ? new Date(right.startDate).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return left.name.localeCompare(right.name);
  });
};

export default function ProjectSprintsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);

  const projectId = typeof params.id === "string" ? params.id : "";

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [sprints, setSprints] = useState<SprintView[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [didLoad, setDidLoad] = useState(false);

  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isActioningSprintId, setIsActioningSprintId] = useState<string | null>(null);

  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null);
  const [sprintTasksById, setSprintTasksById] = useState<Record<string, SprintTaskView[]>>({});
  const [loadingTaskSprintId, setLoadingTaskSprintId] = useState<string | null>(null);

  const sortedSprints = useMemo(() => sortSprints(sprints), [sprints]);

  const activeSprintCount = useMemo(
    () => sprints.filter((sprint) => sprint.status === "ACTIVE").length,
    [sprints],
  );

  const canManageSprints = useMemo(() => {
    if (!project) {
      return false;
    }

    return project.myRole === "ADMIN" || project.myRole === "PM";
  }, [project]);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  const loadSprintTasks = useCallback(
    async (sprintId: string): Promise<void> => {
      if (!projectId) {
        return;
      }

      setLoadingTaskSprintId(sprintId);
      try {
        const { data } = await api.get<SprintTaskView[]>(`/projects/${projectId}/sprints/${sprintId}/tasks`);
        setSprintTasksById((current) => ({
          ...current,
          [sprintId]: data,
        }));
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        toast.error(toMessage(error, "Unable to load sprint tasks"));
      } finally {
        setLoadingTaskSprintId(null);
      }
    },
    [projectId, handleUnauthorized],
  );

  const loadSprintPage = useCallback(async (): Promise<void> => {
    if (!projectId) {
      return;
    }

    setIsFetching(true);

    try {
      const [projectResponse, sprintResponse] = await Promise.all([
        api.get<ProjectSummary>(`/projects/${projectId}`),
        api.get<SprintView[]>(`/projects/${projectId}/sprints`),
      ]);

      setProject(projectResponse.data);
      setSprints(sprintResponse.data);
      setDidLoad(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = toMessage(error, "Unable to load sprint page");
      toast.error(message);

      if (error instanceof AxiosError && error.response?.status === 404) {
        router.replace("/dashboard");
      }
    } finally {
      setIsFetching(false);
    }
  }, [projectId, handleUnauthorized, router]);

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
    if (!isHydrated || !accessToken || !projectId) {
      return;
    }

    void loadSprintPage();
  }, [isHydrated, accessToken, projectId, loadSprintPage]);

  useEffect(() => {
    if (!expandedSprintId) {
      return;
    }

    const stillExists = sprints.some((sprint) => sprint.id === expandedSprintId);
    if (!stillExists) {
      setExpandedSprintId(null);
    }
  }, [sprints, expandedSprintId]);

  const handleCreateSprint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = sprintName.trim();
    if (name.length < 2) {
      toast.error("Sprint name should be at least 2 characters");
      return;
    }

    if (startDate && endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) {
      toast.error("Sprint end date cannot be before start date");
      return;
    }

    setIsCreating(true);
    try {
      const { data } = await api.post<SprintView>(`/projects/${projectId}/sprints`, {
        name,
        goal: sprintGoal.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setSprints((current) => sortSprints([data, ...current]));
      setSprintName("");
      setSprintGoal("");
      setStartDate("");
      setEndDate("");
      toast.success("Sprint created");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to create sprint"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    setIsActioningSprintId(sprintId);

    try {
      const { data } = await api.patch<SprintView>(`/projects/${projectId}/sprints/${sprintId}/start`);

      setSprints((current) => sortSprints(current.map((sprint) => (sprint.id === sprintId ? data : sprint))));
      toast.success("Sprint started");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to start sprint"));
    } finally {
      setIsActioningSprintId(null);
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    setIsActioningSprintId(sprintId);

    try {
      const { data } = await api.patch<SprintCompletionResult>(`/projects/${projectId}/sprints/${sprintId}/complete`);

      setSprints((current) =>
        sortSprints(current.map((sprint) => (sprint.id === sprintId ? data.sprint : sprint))),
      );

      if (expandedSprintId === sprintId) {
        void loadSprintTasks(sprintId);
      }

      if (data.movedTasks > 0) {
        const destinationLabel = data.destinationSprintId ? "another sprint" : "backlog";
        toast.success(`Sprint completed. ${data.movedTasks} tasks moved to ${destinationLabel}.`);
      } else {
        toast.success("Sprint completed");
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to complete sprint"));
    } finally {
      setIsActioningSprintId(null);
    }
  };

  const handleToggleSprintTasks = (sprintId: string) => {
    if (expandedSprintId === sprintId) {
      setExpandedSprintId(null);
      return;
    }

    setExpandedSprintId(sprintId);

    if (!sprintTasksById[sprintId]) {
      void loadSprintTasks(sprintId);
    }
  };

  if (!isHydrated || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1725] text-zinc-200">
        <p className="text-sm tracking-wide">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1728] px-4 py-5 text-zinc-100 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(42rem_24rem_at_4%_-8%,rgba(36,190,172,0.16),transparent_60%),radial-gradient(36rem_22rem_at_96%_106%,rgba(75,164,251,0.14),transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-screen-2xl space-y-4">
        <header className="rounded-2xl border border-white/10 bg-[#111f31]/85 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Sprint Management</p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {project?.name ?? "Loading project..."}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-300">
                Plan your sprint windows, start active iterations, and complete with rollover rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {project ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleClassMap[project.myRole]}`}>
                  {project.myRole}
                </span>
              ) : null}

              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link
                href={`/projects/${projectId}`}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Board
              </Link>
              <Link
                href={`/projects/${projectId}/settings`}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Settings
              </Link>
              <Button
                type="button"
                onClick={() => void loadSprintPage()}
                disabled={isFetching}
                className="h-9 rounded-lg bg-teal-400 px-3 text-sm font-semibold text-[#0f1725] hover:bg-teal-300"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Card className="border border-white/10 bg-[#111f31]/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-lg text-white">Create Sprint</CardTitle>
              <CardDescription className="text-zinc-300">
                PM and Admin can create and schedule sprint windows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSprint} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sprint-name" className="text-zinc-200">
                    Sprint name
                  </Label>
                  <Input
                    id="sprint-name"
                    value={sprintName}
                    onChange={(event) => setSprintName(event.target.value)}
                    placeholder="Sprint 21 - Billing"
                    className="h-9 border-white/15 bg-white/5 text-zinc-100"
                    required
                    disabled={!canManageSprints || isCreating}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sprint-goal" className="text-zinc-200">
                    Goal
                  </Label>
                  <textarea
                    id="sprint-goal"
                    value={sprintGoal}
                    onChange={(event) => setSprintGoal(event.target.value)}
                    rows={3}
                    placeholder="What this sprint should deliver"
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition focus-visible:border-zinc-300"
                    disabled={!canManageSprints || isCreating}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sprint-start" className="text-zinc-200">
                      Start date
                    </Label>
                    <Input
                      id="sprint-start"
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="h-9 border-white/15 bg-white/5 text-zinc-100"
                      disabled={!canManageSprints || isCreating}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sprint-end" className="text-zinc-200">
                      End date
                    </Label>
                    <Input
                      id="sprint-end"
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-9 border-white/15 bg-white/5 text-zinc-100"
                      disabled={!canManageSprints || isCreating}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!canManageSprints || isCreating}
                  className="h-9 rounded-lg bg-sky-400 px-4 text-sm font-semibold text-[#0f1725] hover:bg-sky-300"
                >
                  {isCreating ? "Creating..." : "Create sprint"}
                </Button>

                {!canManageSprints ? (
                  <p className="text-xs text-zinc-400">You have read-only access for sprint management.</p>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#111f31]/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-lg text-white">Sprints</CardTitle>
              <CardDescription className="text-zinc-300">
                {activeSprintCount} active • {sprints.length} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!didLoad && isFetching ? (
                <p className="text-sm text-zinc-300">Loading sprints...</p>
              ) : sortedSprints.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-sm text-zinc-300">
                  No sprints yet. Create one to plan your next iteration.
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSprints.map((sprint) => {
                    const isExpanded = expandedSprintId === sprint.id;
                    const tasks = sprintTasksById[sprint.id] ?? [];
                    const isLoadingTasks = loadingTaskSprintId === sprint.id;
                    const isActioning = isActioningSprintId === sprint.id;

                    return (
                      <article key={sprint.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-white">{sprint.name}</h3>
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase",
                                  sprintStatusToneMap[sprint.status],
                                )}
                              >
                                {sprintStatusLabelMap[sprint.status]}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-zinc-300">{sprint.goal || "No goal set yet"}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                              <span>Start: {formatDate(sprint.startDate)}</span>
                              <span>End: {formatDate(sprint.endDate)}</span>
                              <span className="font-mono">#{sprint.id.slice(0, 8)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {sprint.status === "PLANNED" ? (
                              <Button
                                type="button"
                                disabled={!canManageSprints || isActioning}
                                onClick={() => void handleStartSprint(sprint.id)}
                                className="h-8 rounded-md bg-emerald-400 px-3 text-xs font-semibold text-[#0f1725] hover:bg-emerald-300"
                              >
                                {isActioning ? "Starting..." : "Start"}
                              </Button>
                            ) : null}

                            {sprint.status === "ACTIVE" ? (
                              <Button
                                type="button"
                                disabled={!canManageSprints || isActioning}
                                onClick={() => void handleCompleteSprint(sprint.id)}
                                className="h-8 rounded-md bg-amber-300 px-3 text-xs font-semibold text-[#34210b] hover:bg-amber-200"
                              >
                                {isActioning ? "Completing..." : "Complete"}
                              </Button>
                            ) : null}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleToggleSprintTasks(sprint.id)}
                              className="h-8 rounded-md border-white/20 bg-transparent px-3 text-xs text-zinc-200 hover:bg-white/10"
                            >
                              {isExpanded ? "Hide Tasks" : "View Tasks"}
                            </Button>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="mt-3 rounded-md border border-white/10 bg-[#0f1d2f]/70 p-3">
                            {isLoadingTasks ? (
                              <p className="text-sm text-zinc-300">Loading sprint tasks...</p>
                            ) : tasks.length === 0 ? (
                              <p className="text-sm text-zinc-300">No tasks in this sprint.</p>
                            ) : (
                              <ul className="space-y-2">
                                {tasks.map((task) => (
                                  <li
                                    key={task.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/4 px-3 py-2"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-zinc-100">{task.title}</p>
                                      <p className="text-xs text-zinc-400">{task.assigneeId || "Unassigned"}</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                      <span
                                        className={cn(
                                          "rounded-full border border-white/15 px-2 py-0.5 text-zinc-200",
                                        )}
                                      >
                                        {statusLabelMap[task.status]}
                                      </span>
                                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-zinc-300">
                                        <span className={cn("size-2 rounded-full", priorityDotMap[task.priority])} />
                                        {task.priority}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
