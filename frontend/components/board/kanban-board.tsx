"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import KanbanColumn from "./kanban-column";
import { STATUS_ORDER, statusLabelMap } from "./status-meta";
import TaskCard from "./task-card";
import { BoardTask, TaskStatus, TaskTransitionLookup } from "./types";

type KanbanBoardProps = {
  tasks: BoardTask[];
  transitionLookup: TaskTransitionLookup;
  assigneeNames: Record<string, string>;
  updatingTaskId: string | null;
  onMoveTask: (taskId: string, toStatus: TaskStatus) => Promise<void>;
};

export default function KanbanBoard({
  tasks,
  transitionLookup,
  assigneeNames,
  updatingTaskId,
  onMoveTask,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 130,
        tolerance: 10,
      },
    }),
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const activeTask = useMemo(() => {
    if (!activeTaskId) {
      return null;
    }

    return tasks.find((task) => task.id === activeTaskId) ?? null;
  }, [tasks, activeTaskId]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, BoardTask[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      CODE_REVIEW: [],
      QA: [],
      DONE: [],
      BLOCKED: [],
    };

    for (const task of tasks) {
      grouped[task.status].push(task);
    }

    return grouped;
  }, [tasks]);

  const isAllowedStatusForActiveTask = (status: TaskStatus): boolean => {
    if (!activeTask) {
      return true;
    }

    if (activeTask.status === status) {
      return true;
    }

    const validTransitions = transitionLookup[activeTask.id] ?? [];
    return validTransitions.includes(status);
  };

  const parseTaskId = (rawId: string | number | symbol): string | null => {
    if (typeof rawId !== "string") {
      return null;
    }

    if (!rawId.startsWith("task:")) {
      return null;
    }

    return rawId.slice(5);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = parseTaskId(event.active.id);
    setActiveTaskId(taskId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const taskId = parseTaskId(event.active.id);
    const targetStatus = event.over?.data.current?.status as TaskStatus | undefined;

    setActiveTaskId(null);

    if (!taskId || !targetStatus) {
      return;
    }

    const movingTask = tasks.find((task) => task.id === taskId);
    if (!movingTask || movingTask.status === targetStatus) {
      return;
    }

    const validTransitions = transitionLookup[taskId] ?? [];
    if (!validTransitions.includes(targetStatus)) {
      toast.error(`You cannot move this task to ${statusLabelMap[targetStatus]}`);
      return;
    }

    await onMoveTask(taskId, targetStatus);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-max gap-3"
          style={{
            gridTemplateColumns: `repeat(${STATUS_ORDER.length}, minmax(275px, 1fr))`,
          }}
        >
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              assigneeNames={assigneeNames}
              isDropDisabled={!isAllowedStatusForActiveTask(status)}
              isUpdatingTask={Boolean(updatingTaskId)}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{ width: 275 }}>
            <TaskCard
              task={activeTask}
              assigneeName={activeTask.assigneeId ? assigneeNames[activeTask.assigneeId] : undefined}
              draggable={false}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
