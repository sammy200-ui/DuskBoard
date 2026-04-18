"use client";

import { useDroppable } from "@dnd-kit/core";
import { statusLabelMap, statusToneMap } from "./status-meta";
import { BoardTask, TaskStatus } from "./types";
import TaskCard from "./task-card";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  status: TaskStatus;
  tasks: BoardTask[];
  assigneeNames: Record<string, string>;
  isDropDisabled: boolean;
  isUpdatingTask: boolean;
};

export default function KanbanColumn({
  status,
  tasks,
  assigneeNames,
  isDropDisabled,
  isUpdatingTask,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${status}`,
    disabled: isDropDisabled,
    data: {
      status,
    },
  });

  const canDropHere = !isDropDisabled;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-96 min-w-68 flex-col rounded-2xl border border-white/10 bg-[#0f1a2a]/75 p-3 transition",
        canDropHere && isOver && "border-teal-300/60 bg-teal-300/8",
        isDropDisabled && "opacity-35 saturate-75",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase",
            statusToneMap[status],
          )}
        >
          {statusLabelMap[status]}
        </span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-zinc-300">{tasks.length}</span>
      </header>

      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/3 px-3 py-6 text-center text-xs text-zinc-400">
            {isDropDisabled ? "Move not allowed" : "Drop a task here"}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={task.assigneeId ? assigneeNames[task.assigneeId] : undefined}
              draggable={!isUpdatingTask}
            />
          ))
        )}
      </div>
    </section>
  );
}
