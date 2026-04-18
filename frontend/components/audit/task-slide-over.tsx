"use client";

import { RefreshCw, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { priorityDotMap, statusLabelMap, statusToneMap } from "@/components/board/status-meta";
import { BoardTask, Priority, TaskType } from "@/components/board/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProjectRole = "ADMIN" | "PM" | "DEVELOPER" | "QA" | "VIEWER";

type TaskMemberOption = {
  userId: string;
  name: string;
  role: ProjectRole;
};

type TaskAuditLog = {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
};

type TaskEditPayload = {
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
};

type TaskSlideOverProps = {
  open: boolean;
  task: BoardTask | null;
  members: TaskMemberOption[];
  auditLogs: TaskAuditLog[];
  isAuditLoading: boolean;
  isSavingDetails: boolean;
  isSavingAssignee: boolean;
  onClose: () => void;
  onSaveDetails: (taskId: string, payload: TaskEditPayload) => Promise<void>;
  onSaveAssignee: (taskId: string, assigneeId: string | null) => Promise<void>;
  onRefreshAudit: (taskId: string) => Promise<void>;
};

const actionLabelMap: Record<string, string> = {
  STATUS_CHANGED: "Status changed",
  ASSIGNED: "Assignee updated",
  SPRINT_MOVED: "Sprint moved",
};

const formatAuditAction = (action: string): string => {
  const known = actionLabelMap[action];
  if (known) {
    return known;
  }

  return action
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function TaskSlideOver({
  open,
  task,
  members,
  auditLogs,
  isAuditLoading,
  isSavingDetails,
  isSavingAssignee,
  onClose,
  onSaveDetails,
  onSaveAssignee,
  onRefreshAudit,
}: TaskSlideOverProps) {
  const [title, setTitle] = useState(() => task?.title ?? "");
  const [description, setDescription] = useState(() => task?.description ?? "");
  const [type, setType] = useState<TaskType>(() => task?.type ?? "TASK");
  const [priority, setPriority] = useState<Priority>(() => task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState(() => task?.assigneeId ?? "");

  const memberNameById = useMemo(() => {
    return members.reduce<Record<string, string>>((acc, member) => {
      acc[member.userId] = member.name;
      return acc;
    }, {});
  }, [members]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  const isDetailsDirty = useMemo(() => {
    if (!task) {
      return false;
    }

    return (
      trimmedTitle !== task.title ||
      trimmedDescription !== (task.description ?? "") ||
      type !== task.type ||
      priority !== task.priority
    );
  }, [task, trimmedTitle, trimmedDescription, type, priority]);

  const nextAssigneeId = assigneeId || null;
  const assigneeLabel = task?.assigneeId ? memberNameById[task.assigneeId] ?? task.assigneeId : "Unassigned";

  const isAssigneeDirty = useMemo(() => {
    if (!task) {
      return false;
    }

    return nextAssigneeId !== task.assigneeId;
  }, [task, nextAssigneeId]);

  const handleSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!task || trimmedTitle.length < 2) {
      return;
    }

    await onSaveDetails(task.id, {
      title: trimmedTitle,
      description: trimmedDescription,
      type,
      priority,
    });
  };

  const handleSaveAssignee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!task) {
      return;
    }

    await onSaveAssignee(task.id, nextAssigneeId);
  };

  if (!open || !task) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close task panel"
        onClick={onClose}
        className="absolute inset-0 bg-[#050a14]/70 backdrop-blur-[1px]"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-2xl border-l border-white/10 bg-[#0f1a2a] text-zinc-100 shadow-2xl shadow-black/35">
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4 md:p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Task details</p>
              <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">{task.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-medium tracking-[0.08em] uppercase",
                    statusToneMap[task.status],
                  )}
                >
                  {statusLabelMap[task.status]}
                </span>
                <span className="rounded-full border border-white/20 px-2.5 py-0.5 tracking-[0.08em] uppercase text-zinc-300">
                  {task.type}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-0.5 tracking-[0.08em] uppercase text-zinc-300">
                  <span className={cn("size-2 rounded-full", priorityDotMap[task.priority])} />
                  {task.priority}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={onClose}
              className="text-zinc-300 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            <section className="rounded-xl border border-white/10 bg-[#101f31]/60 p-4">
              <div className="grid gap-3 text-xs text-zinc-300 sm:grid-cols-2">
                <div>
                  <p className="uppercase tracking-[0.08em] text-zinc-400">Task ID</p>
                  <p className="mt-1 font-mono text-zinc-100">{task.id}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.08em] text-zinc-400">Assignee</p>
                  <p className="mt-1 text-zinc-100">{assigneeLabel}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.08em] text-zinc-400">Created</p>
                  <p className="mt-1 text-zinc-100">{formatDateTime(task.createdAt)}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.08em] text-zinc-400">Last updated</p>
                  <p className="mt-1 text-zinc-100">{formatDateTime(task.updatedAt)}</p>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-white/10 bg-[#101f31]/60 p-4">
              <h3 className="text-sm font-semibold text-white">Edit task</h3>

              <form onSubmit={handleSaveDetails} className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-title" className="text-xs text-zinc-300">
                    Title
                  </Label>
                  <Input
                    id="task-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-9 border-white/15 bg-white/5 text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-description" className="text-xs text-zinc-300">
                    Description
                  </Label>
                  <textarea
                    id="task-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition focus-visible:border-zinc-300"
                    placeholder="Add context for this task"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="task-type" className="text-xs text-zinc-300">
                      Type
                    </Label>
                    <select
                      id="task-type"
                      value={type}
                      onChange={(event) => setType(event.target.value as TaskType)}
                      className="h-9 w-full rounded-lg border border-white/15 bg-[#122237] px-2.5 text-sm text-zinc-100 outline-none"
                    >
                      <option value="STORY">STORY</option>
                      <option value="BUG">BUG</option>
                      <option value="TASK">TASK</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="task-priority" className="text-xs text-zinc-300">
                      Priority
                    </Label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as Priority)}
                      className="h-9 w-full rounded-lg border border-white/15 bg-[#122237] px-2.5 text-sm text-zinc-100 outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingDetails || !isDetailsDirty || trimmedTitle.length < 2}
                  className="h-9 rounded-lg bg-teal-400 px-4 text-sm font-semibold text-[#0f1725] hover:bg-teal-300"
                >
                  {isSavingDetails ? "Saving..." : "Save task details"}
                </Button>
              </form>
            </section>

            <section className="mt-4 rounded-xl border border-white/10 bg-[#101f31]/60 p-4">
              <h3 className="text-sm font-semibold text-white">Assignment</h3>
              <form onSubmit={handleSaveAssignee} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full space-y-1.5 sm:flex-1">
                  <Label htmlFor="task-assignee" className="text-xs text-zinc-300">
                    Assignee
                  </Label>
                  <select
                    id="task-assignee"
                    value={assigneeId}
                    onChange={(event) => setAssigneeId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/15 bg-[#122237] px-2.5 text-sm text-zinc-100 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingAssignee || !isAssigneeDirty}
                  className="h-9 rounded-lg bg-sky-400 px-4 text-sm font-semibold text-[#0f1725] hover:bg-sky-300"
                >
                  {isSavingAssignee ? "Updating..." : "Update assignee"}
                </Button>
              </form>
            </section>

            <section className="mt-4 rounded-xl border border-white/10 bg-[#101f31]/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Audit log</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isAuditLoading}
                  onClick={() => void onRefreshAudit(task.id)}
                  className="h-8 border-white/20 bg-transparent text-zinc-200 hover:bg-white/10"
                >
                  <RefreshCw className={cn("mr-1 size-3.5", isAuditLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {isAuditLoading ? (
                <p className="mt-3 text-sm text-zinc-300">Loading activity...</p>
              ) : auditLogs.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-300">No audit events for this task yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="rounded-lg border border-white/10 bg-white/4 px-3 py-2.5">
                      <p className="text-sm font-medium text-zinc-100">{formatAuditAction(log.action)}</p>
                      <p className="mt-0.5 text-xs text-zinc-300">
                        {log.fromValue ? `From ${log.fromValue} ` : ""}
                        {log.toValue ? `to ${log.toValue}` : ""}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <span>{log.actor.name}</span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}

export type { TaskAuditLog, TaskEditPayload, TaskMemberOption };
