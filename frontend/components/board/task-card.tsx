"use client";

import { useDraggable } from "@dnd-kit/core";
import { priorityDotMap, toInitials, typeToneMap } from "./status-meta";
import { BoardTask } from "./types";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: BoardTask;
  assigneeName?: string;
  draggable?: boolean;
  isOverlay?: boolean;
};

const buildTransformStyle = (transform: {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
} | null) => {
  if (!transform) {
    return undefined;
  }

  return {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX}, ${transform.scaleY})`,
  };
};

export default function TaskCard({
  task,
  assigneeName,
  draggable = true,
  isOverlay = false,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task:${task.id}`,
    disabled: !draggable,
    data: {
      taskId: task.id,
      status: task.status,
    },
  });

  const assignedName = assigneeName?.trim() || null;
  const assigneeLabel = assignedName ?? "Unassigned";

  return (
    <article
      ref={setNodeRef}
      style={buildTransformStyle(transform)}
      className={cn(
        "rounded-xl border border-white/10 bg-[#111f31]/85 p-3 shadow-lg shadow-black/10 transition",
        draggable && "touch-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        isOverlay && "ring-2 ring-teal-300/60",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">{task.title}</h4>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase",
            typeToneMap[task.type],
          )}
        >
          {task.type}
        </span>
      </div>

      {task.description ? <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{task.description}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-300">
        <div className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", priorityDotMap[task.priority])} />
          <span>{task.priority.toLowerCase()}</span>
        </div>

        {task.sprintId ? (
          <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] tracking-[0.06em] uppercase text-zinc-200">
            Sprint
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.08em] text-zinc-400">Backlog</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[11px] text-zinc-300">
          <span className="inline-flex size-6 items-center justify-center rounded-full border border-white/20 bg-white/5 font-mono text-[10px] text-zinc-100">
            {toInitials(assigneeLabel)}
          </span>
          <span className="max-w-32 truncate">{assigneeLabel}</span>
        </div>

        <span className="font-mono text-[10px] text-zinc-500">#{task.id.slice(0, 6)}</span>
      </div>
    </article>
  );
}
