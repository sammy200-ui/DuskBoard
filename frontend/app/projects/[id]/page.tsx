"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import TaskSlideOver, {
  TaskAuditLog,
  TaskEditPayload,
  TaskMemberOption,
} from "@/components/audit/task-slide-over";
import KanbanBoard from "@/components/board/kanban-board";
import { statusLabelMap } from "@/components/board/status-meta";
import { BoardTask, TaskStatus, TaskTransitionLookup } from "@/components/board/types";
import { Button } from "@/components/ui/button";
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

type ProjectMemberView = {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
};

type TaskValidTransitionsResponse = {
  taskId: string;
  currentStatus: TaskStatus;
  validTransitions: TaskStatus[];
};

const roleClassMap: Record<ProjectRole, string> = {
  ADMIN: "bg-teal-300/20 text-teal-200 border border-teal-200/30",
  PM: "bg-sky-300/20 text-sky-200 border border-sky-200/30",
  DEVELOPER: "bg-emerald-300/20 text-emerald-200 border border-emerald-200/30",
  QA: "bg-amber-300/20 text-amber-200 border border-amber-200/30",
  VIEWER: "bg-zinc-300/20 text-zinc-200 border border-zinc-200/30",
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

const toAssigneeLookup = (members: ProjectMemberView[]): Record<string, string> => {
  return members.reduce<Record<string, string>>((acc, member) => {
    acc[member.userId] = member.name;
    return acc;
  }, {});
};

const toTaskMembers = (members: ProjectMemberView[]): TaskMemberOption[] => {
  return members.map((member) => ({
    userId: member.userId,
    name: member.name,
    role: member.role,
  }));
};

export default function ProjectKanbanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);

  const projectId = typeof params.id === "string" ? params.id : "";

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [transitionLookup, setTransitionLookup] = useState<TaskTransitionLookup>({});
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<TaskMemberOption[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [didLoad, setDidLoad] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isSavingTaskDetails, setIsSavingTaskDetails] = useState(false);
  const [isSavingTaskAssignee, setIsSavingTaskAssignee] = useState(false);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) {
      return null;
    }

    return tasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [tasks, selectedTaskId]);

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

  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  const refreshTaskTransitions = useCallback(
    async (taskId: string): Promise<void> => {
      if (!projectId) {
        return;
      }

      try {
        const { data } = await api.get<TaskValidTransitionsResponse>(
          `/projects/${projectId}/tasks/${taskId}/valid-transitions`,
        );

        setTransitionLookup((current) => ({
          ...current,
          [taskId]: data.validTransitions,
        }));
      } catch {
        setTransitionLookup((current) => ({
          ...current,
          [taskId]: [],
        }));
      }
    },
    [projectId],
  );

  const loadTaskAuditLogs = useCallback(
    async (taskId: string): Promise<void> => {
      if (!projectId) {
        return;
      }

      setIsAuditLoading(true);
      try {
        const { data } = await api.get<TaskAuditLog[]>(`/projects/${projectId}/tasks/${taskId}/audit`);
        setAuditLogs(data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        toast.error(toMessage(error, "Unable to load task activity"));
      } finally {
        setIsAuditLoading(false);
      }
    },
    [projectId, handleUnauthorized],
  );

  const handleOpenTaskDrawer = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId);
      void loadTaskAuditLogs(taskId);
    },
    [loadTaskAuditLogs],
  );

  const handleCloseTaskDrawer = useCallback(() => {
    setSelectedTaskId(null);
    setAuditLogs([]);
  }, []);

  const loadBoardData = useCallback(async (): Promise<void> => {
    if (!projectId) {
      return;
    }

    setIsFetching(true);

    try {
      const [projectResponse, tasksResponse, membersResponse] = await Promise.all([
        api.get<ProjectSummary>(`/projects/${projectId}`),
        api.get<BoardTask[]>(`/projects/${projectId}/tasks`),
        api.get<ProjectMemberView[]>(`/projects/${projectId}/members`),
      ]);

      const transitionResults = await Promise.all(
        tasksResponse.data.map(async (task) => {
          try {
            const { data } = await api.get<TaskValidTransitionsResponse>(
              `/projects/${projectId}/tasks/${task.id}/valid-transitions`,
            );

            return {
              taskId: task.id,
              validTransitions: data.validTransitions,
              failed: false,
            };
          } catch {
            return {
              taskId: task.id,
              validTransitions: [] as TaskStatus[],
              failed: true,
            };
          }
        }),
      );

      const transitionMap = transitionResults.reduce<TaskTransitionLookup>((acc, row) => {
        acc[row.taskId] = row.validTransitions;
        return acc;
      }, {});

      const failedTransitionLoads = transitionResults.filter((row) => row.failed).length;

      setProject(projectResponse.data);
      setTasks(tasksResponse.data);
      setAssigneeNames(toAssigneeLookup(membersResponse.data));
      setMembers(toTaskMembers(membersResponse.data));
      setTransitionLookup(transitionMap);
      setDidLoad(true);

      if (failedTransitionLoads > 0) {
        toast.error("Some transition rules did not load. Refresh once and try again.");
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = toMessage(error, "Unable to load board");
      toast.error(message);

      if (error instanceof AxiosError && error.response?.status === 404) {
        router.replace("/dashboard");
      }
    } finally {
      setIsFetching(false);
    }
  }, [projectId, handleUnauthorized, router]);

  useEffect(() => {
    if (!isHydrated || !accessToken || !projectId) {
      return;
    }

    void loadBoardData();
  }, [isHydrated, accessToken, projectId, loadBoardData]);

  useEffect(() => {
    if (!selectedTaskId) {
      return;
    }

    const selectedStillExists = tasks.some((task) => task.id === selectedTaskId);
    if (!selectedStillExists) {
      setSelectedTaskId(null);
      setAuditLogs([]);
    }
  }, [tasks, selectedTaskId]);

  const handleSaveTaskDetails = useCallback(
    async (taskId: string, payload: TaskEditPayload): Promise<void> => {
      if (!projectId) {
        return;
      }

      setIsSavingTaskDetails(true);
      try {
        const { data } = await api.put<BoardTask>(`/projects/${projectId}/tasks/${taskId}`, {
          title: payload.title,
          description: payload.description,
          type: payload.type,
          priority: payload.priority,
        });

        setTasks((current) => current.map((task) => (task.id === taskId ? data : task)));
        toast.success("Task details updated");
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        toast.error(toMessage(error, "Unable to update task details"));
      } finally {
        setIsSavingTaskDetails(false);
      }
    },
    [projectId, handleUnauthorized],
  );

  const handleSaveTaskAssignee = useCallback(
    async (taskId: string, assigneeId: string | null): Promise<void> => {
      if (!projectId) {
        return;
      }

      setIsSavingTaskAssignee(true);
      try {
        const { data } = await api.put<BoardTask>(`/projects/${projectId}/tasks/${taskId}/assign`, {
          assigneeId,
        });

        setTasks((current) => current.map((task) => (task.id === taskId ? data : task)));
        await refreshTaskTransitions(taskId);
        await loadTaskAuditLogs(taskId);
        toast.success(assigneeId ? "Assignee updated" : "Task moved to unassigned");
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        toast.error(toMessage(error, "Unable to update assignee"));
      } finally {
        setIsSavingTaskAssignee(false);
      }
    },
    [projectId, handleUnauthorized, loadTaskAuditLogs, refreshTaskTransitions],
  );

  const handleMoveTask = useCallback(
    async (taskId: string, toStatus: TaskStatus): Promise<void> => {
      const movingTask = tasks.find((task) => task.id === taskId);
      if (!movingTask || movingTask.status === toStatus || !projectId) {
        return;
      }

      const previousStatus = movingTask.status;

      setUpdatingTaskId(taskId);
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, status: toStatus } : task)),
      );

      try {
        const { data } = await api.patch<BoardTask>(`/projects/${projectId}/tasks/${taskId}/status`, {
          status: toStatus,
        });

        setTasks((current) => current.map((task) => (task.id === taskId ? data : task)));
        await refreshTaskTransitions(taskId);
        if (selectedTaskId === taskId) {
          await loadTaskAuditLogs(taskId);
        }
        toast.success(`Moved to ${statusLabelMap[toStatus]}`);
      } catch (error) {
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: previousStatus,
                }
              : task,
          ),
        );

        await refreshTaskTransitions(taskId);

        if (error instanceof AxiosError && error.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        toast.error(toMessage(error, "Unable to move task"));
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [tasks, projectId, refreshTaskTransitions, selectedTaskId, loadTaskAuditLogs, handleUnauthorized],
  );

  const greeting = useMemo(() => {
    if (!user?.name) {
      return "Kanban Board";
    }

    return `${user.name.split(" ")[0]}'s Board`;
  }, [user?.name]);

  if (!isHydrated || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1725] text-zinc-200">
        <p className="text-sm tracking-wide">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1728] px-4 py-5 text-zinc-100 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(38rem_22rem_at_8%_-8%,rgba(36,190,172,0.18),transparent_60%),radial-gradient(40rem_24rem_at_96%_108%,rgba(251,160,75,0.15),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-screen-2xl space-y-4">
        <header className="rounded-2xl border border-white/10 bg-[#111f31]/85 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{greeting}</p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {project?.name ?? "Loading project..."}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-300">
                {project?.description ||
                  "Drag cards between columns. Illegal transitions are blocked by workflow rules."}
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

              <Button
                type="button"
                onClick={() => void loadBoardData()}
                disabled={isFetching}
                className="h-9 rounded-lg bg-teal-400 px-3 text-sm font-semibold text-[#0f1725] hover:bg-teal-300"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {!didLoad && isFetching ? (
          <section className="rounded-2xl border border-white/10 bg-[#111f31]/70 p-6 text-sm text-zinc-300">
            Loading board...
          </section>
        ) : tasks.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/15 bg-[#111f31]/70 p-6 text-sm text-zinc-300">
            No tasks yet for this project.
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-[#101b2c]/80 p-3 md:p-4">
            <KanbanBoard
              tasks={tasks}
              transitionLookup={transitionLookup}
              assigneeNames={assigneeNames}
              updatingTaskId={updatingTaskId}
              selectedTaskId={selectedTaskId}
              onMoveTask={handleMoveTask}
              onOpenTask={handleOpenTaskDrawer}
            />
          </section>
        )}
      </div>

      <TaskSlideOver
        key={selectedTask?.id ?? "closed"}
        open={Boolean(selectedTask)}
        task={selectedTask}
        members={members}
        auditLogs={auditLogs}
        isAuditLoading={isAuditLoading}
        isSavingDetails={isSavingTaskDetails}
        isSavingAssignee={isSavingTaskAssignee}
        onClose={handleCloseTaskDrawer}
        onSaveDetails={handleSaveTaskDetails}
        onSaveAssignee={handleSaveTaskAssignee}
        onRefreshAudit={loadTaskAuditLogs}
      />
    </div>
  );
}
